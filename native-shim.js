// Cascarón de compatibilidad nativa — SOLO existe dentro de este proyecto
// APK, nunca en el repositorio de la app web (D:\Claude\Inspección
// Estructural). El script de sincronización (scripts/sync-web-assets.mjs) lo
// copia a www/ e inyecta un <script> que lo carga ANTES que app.js/offline.js
// en cada página, así que puede interceptar fetch/imágenes/descargas desde
// el primer instante.
//
// Por qué hace falta: dentro del APK, el HTML/CSS/JS vive empaquetado
// localmente (para que la app funcione sin ninguna conexión, ni siquiera en
// el primer arranque) — pero la API y las fotos siguen viviendo en el
// backend real desplegado. La app web original usa rutas relativas
// ("/api/...", "/uploads/...") porque ahí SÍ comparte origen con la API. Aquí
// no: la página vive en el origen local de Capacitor y la API en
// eval-danos-edificaciones.onrender.com, así que hay que completar esas
// rutas relativas con el origen real del backend.
//
// Fuera de Capacitor (navegador normal) este archivo no hace nada: toda la
// lógica de abajo está condicionada a `Capacitor.isNativePlatform()`.
(function () {
  const API_ORIGIN = "https://eval-danos-edificaciones.onrender.com";

  function isNative() {
    return !!(window.Capacitor && typeof window.Capacitor.isNativePlatform === "function" && window.Capacitor.isNativePlatform());
  }

  // Espera a que Capacitor esté disponible (se inyecta muy temprano, pero por
  // seguridad se reintenta un par de veces antes de decidir que no aplica).
  function whenReady(fn) {
    if (window.Capacitor) return fn();
    let tries = 0;
    const t = setInterval(() => {
      tries++;
      if (window.Capacitor || tries > 20) {
        clearInterval(t);
        fn();
      }
    }, 25);
  }

  whenReady(() => {
    if (!isNative()) return; // navegador normal (o `cap serve` de escritorio): sin cambios

    // --- -1) Desactivar el Service Worker dentro del APK ---
    //
    // `app.js` registra `/sw.js` en toda carga de página — correcto y
    // necesario en la PWA web (cachea el app shell y sirve `/api/*` con
    // estrategia network-first-con-caché para seguir consultando una
    // inspección ya abierta sin señal). Dentro del APK es (a) innecesario:
    // el propio instalable ya trae todos los recursos empaquetados
    // localmente, sin depender de ningún Service Worker para funcionar sin
    // conexión, y (b) activamente dañino: en cuanto ese Service Worker toma
    // control de la página (`self.skipWaiting()` + `clients.claim()`, casi
    // instantáneo, y que además persiste entre instalaciones tipo
    // "Actualizar" porque Android conserva el almacenamiento del WebView),
    // intercepta TODAS las peticiones GET de la página — incluidas las que
    // este shim reescribe hacia el origen real del backend — y las repite
    // con el `fetch()` propio del Service Worker. Ese `fetch()` corre en un
    // contexto de JavaScript aparte que Capacitor NO parcha (solo parcha el
    // `fetch()` de la página), así que queda sujeto otra vez al bloqueo CORS
    // del WebView — justo lo que el puente CapacitorHttp existe para evitar.
    // Encontrado con evidencia de `adb logcat`: los PUT/POST/PATCH (que el
    // Service Worker no toca) tenían éxito con datos correctos, mientras que
    // en toda una sesión de prueba solo UNA petición GET (la primerísima, al
    // abrir la app) llegó a pasar por el puente nativo — ninguna recarga
    // posterior del catálogo ni de la inspección, ni una sola vez. Encaja
    // exactamente con el síntoma reportado en campo: se guarda, pero la
    // pantalla no refleja el cambio (severidad, fotos, opciones de daño).
    //
    // Se desregistra cualquier Service Worker ya activo (de una instalación
    // anterior) y se anula el método de registro ANTES de que app.js llegue
    // a llamarlo (este script se inyecta primero en cada página). También se
    // limpia el Cache Storage por si quedó una respuesta de catálogo/
    // inspección obsoleta de una prueba anterior.
    if (navigator.serviceWorker) {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((reg) => reg.unregister()))
        .catch(() => {});
      navigator.serviceWorker.register = () => Promise.reject(new Error("Service Worker deshabilitado dentro del APK (ver native-shim.js)"));
    }
    if (window.caches && caches.keys) {
      caches
        .keys()
        .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
        .catch(() => {});
    }

    // --- 0) Captura de errores globales ---
    //
    // `console.error/warn/log` sí llegan a Logcat vía el puente de Capacitor
    // (tag "Capacitor/Console"), pero una excepción no capturada o un
    // rechazo de promesa sin `.catch()` no pasa necesariamente por ahí. Se
    // reenvían ambos casos a `console.error` explícitamente para que
    // cualquier falla futura sea visible en Logcat sin tener que instrumentar
    // el código de nuevo desde cero.
    window.addEventListener("error", (e) => {
      console.error(`[native-shim] window.onerror: ${e.message} @ ${e.filename}:${e.lineno}:${e.colno}`);
    });
    window.addEventListener("unhandledrejection", (e) => {
      const reason = e.reason;
      const msg = reason && reason.stack ? reason.stack : reason && reason.message ? reason.message : String(reason);
      console.error(`[native-shim] unhandledrejection: ${msg}`);
    });

    // --- 1) fetch(): completa el origen para /api/... ---
    //
    // Nota (bug real encontrado y corregido en dos partes): esta función
    // originalmente guardaba cada respuesta GET exitosa en localStorage y la
    // servía de vuelta si un GET posterior fallaba por red, imitando al
    // service worker de la web. Se quitó esa caché por peligrosa (podía
    // servir una versión vieja de la inspección en silencio, que luego se
    // volvía a guardar encima de la real). `cache: "no-store"` evita además
    // que la caché HTTP nativa del WebView sirva una respuesta vieja para la
    // misma URL. La causa real del síntoma en campo (guardaba en el
    // servidor pero la pantalla no se actualizaba) resultó ser otra: un
    // error sin capturar dentro de `loadAll()` en inspection.html — ya
    // corregido ahí directamente. Ver docs/ANALISIS-Y-ARQUITECTURA.md.
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const isApiPath = typeof input === "string" && input.startsWith("/api/");
      if (!isApiPath) return originalFetch(input, init);

      const fullUrl = API_ORIGIN + input;
      const method = (init && init.method ? init.method : "GET").toUpperCase();
      const fullInit = Object.assign({}, init, { cache: "no-store" });
      try {
        const res = await originalFetch(fullUrl, fullInit);
        if (!res.ok) console.warn(`[native-shim] ${method} ${input} -> HTTP ${res.status}`);
        return res;
      } catch (err) {
        console.warn(`[native-shim] ${method} ${input} -> sin red (${err && err.message})`);
        throw err; // sin red: igual que en la web, api() en app.js lo encola si es una escritura
      }
    };

    // --- 2) window.open(): los botones de "Generar informe PDF" / "formato
    // oficial" / "Exportar CSV" abren rutas relativas /api/... con
    // window.open() — se completan con el origen real del backend. ---
    const originalOpen = window.open.bind(window);
    window.open = (url, ...rest) => {
      if (typeof url === "string" && url.startsWith("/api/")) {
        return originalOpen(API_ORIGIN + url, ...rest);
      }
      return originalOpen(url, ...rest);
    };

    // --- 3) <img src="/uploads/..."> (fotos ya subidas): se observan altas y
    // cambios en el DOM en vez de parchar cada función que arma el HTML de
    // cada foto (evita tocar inspection.html/app.js). ---
    function fixImg(img) {
      const src = img.getAttribute("src");
      if (src && (src.startsWith("/uploads/") || src.startsWith("/api/"))) {
        img.setAttribute("src", API_ORIGIN + src);
      }
    }
    function scanImages(root) {
      root.querySelectorAll?.("img[src^='/uploads/'], img[src^='/api/']").forEach(fixImg);
    }
    scanImages(document);
    new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          if (node.tagName === "IMG") fixImg(node);
          else scanImages(node);
        });
        if (m.type === "attributes" && m.target.tagName === "IMG") fixImg(m.target);
      }
    }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["src"] });
  });
})();
