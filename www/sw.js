// Service Worker — cachea el "app shell" (HTML/CSS/JS/íconos) para que la
// app cargue sin conexión en campo, y aplica network-first-con-caché a las
// lecturas de la API (catálogo, detalle de inspección) para que una
// inspección ya abierta siga siendo consultable/editable sin red, sin
// arriesgar mostrar datos desactualizados cuando sí hay conexión. Las
// escrituras (POST/PUT/PATCH/DELETE) NO pasan por aquí — las maneja la cola
// de sincronización en IndexedDB (ver public/offline.js).
const CACHE_VERSION = "v21"; // v21: bytes de foto local en IndexedDB (no en localStorage) -- evita agotar la cuota y que los guardados fallen en silencio
const SHELL_CACHE = `shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;

const SHELL_ASSETS = [
  "/",
  "/index.html",
  "/inspections.html",
  "/inspection.html",
  "/app.js",
  "/offline.js",
  "/local-index.js",
  "/classification-client.js",
  "/photo-blob-store.js",
  "/colombia.js",
  "/pathology-guide.js",
  "/styles.css",
  "/manifest.json",
  "/assets/icon.svg",
  "/assets/icon-192.png",
  "/assets/icon-512.png",
  "/assets/apple-touch-icon.png",
  "/assets/logos/sngrd.png",
  "/assets/logos/usaid_miyamoto.png",
  "/assets/logos/utp.png",
  "/assets/qr-app.png",
];

// `cache.addAll()` resuelve sus fetch() respetando la caché HTTP normal del
// navegador — si un archivo (p.ej. app.js) ya estaba en esa caché desde antes
// de un despliegue nuevo, el service worker podía terminar guardando esa
// copia vieja en su propia caché aunque el servidor ya sirviera la versión
// actualizada (se detectó exactamente este caso al probar un cambio de
// app.js). `{ cache: "reload" }` fuerza a cada fetch a ir a la red y omitir
// la caché HTTP, garantizando que el app shell siempre se instale desde la
// versión real y actual del servidor.
async function addAllFresh(cache, urls) {
  await Promise.all(
    urls.map(async (url) => {
      const res = await fetch(url, { cache: "reload" });
      if (res.ok) await cache.put(url, res);
    }),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => addAllFresh(cache, SHELL_ASSETS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL_CACHE && k !== RUNTIME_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function isReadOnlyApiGet(request) {
  if (request.method !== "GET") return false;
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/")) return false;
  // Los informes PDF no deben servirse desde caché (contenido generado
  // dinámicamente) y pueden pesar varios MB.
  if (url.pathname.endsWith("/report.pdf") || url.pathname.endsWith("/report-oficial.pdf")) return false;
  return true;
}

// Network-first (con respaldo en caché) — NO stale-while-revalidate. Se
// detectó en pruebas que SWR podía servir una respuesta cacheada vieja justo
// después de que el propio cliente acabara de guardar un cambio en ese mismo
// recurso (p.ej. el chequeo de completitud del paso 8 mostrando un campo como
// "pendiente" recién guardado), porque SWR siempre prioriza la caché sin
// esperar la red. Aquí se intenta la red primero — con el inspector en
// campo normalmente conectado, el costo extra es mínimo — y solo se cae a la
// caché si el fetch falla de verdad (sin conexión), que es el caso que esta
// estrategia necesita cubrir.
async function networkFirstWithCacheFallback(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const res = await fetch(request);
    if (res.ok) cache.put(request, res.clone());
    return res;
  } catch {
    const cached = await cache.match(request);
    return cached || new Response(JSON.stringify({ error: "Sin conexión y sin datos en caché." }), { status: 503, headers: { "Content-Type": "application/json" } });
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    if (res.ok) {
      const cache = await caches.open(SHELL_CACHE);
      cache.put(request, res.clone());
    }
    return res;
  } catch (err) {
    // Navegación offline sin nada en caché todavía: cae al shell del index
    // como mejor esfuerzo, en vez de dejar al navegador mostrar su propio
    // error de "sin conexión" fuera del diseño de la app.
    if (request.mode === "navigate") {
      const fallback = await caches.match("/index.html");
      if (fallback) return fallback;
    }
    throw err;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return; // las mutaciones las gestiona offline.js, no el SW

  if (isReadOnlyApiGet(request)) {
    event.respondWith(networkFirstWithCacheFallback(request));
    return;
  }

  const url = new URL(request.url);
  if (url.origin === self.location.origin && !url.pathname.startsWith("/api/") && !url.pathname.startsWith("/uploads/")) {
    event.respondWith(cacheFirst(request));
  }
  // Fotos subidas (/uploads/*) y todo lo demás: comportamiento normal de red
  // del navegador (no interceptado) — pueden pesar varios MB y no conviene
  // cachearlas indefinidamente sin una política de expiración/límite de tamaño.
});
