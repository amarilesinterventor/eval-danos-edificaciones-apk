// Cola de sincronización offline (IndexedDB) — ver requerimiento §16/§24 del
// encargo: la app no debe perder información si se pierde la conexión en
// campo. `api()` (app.js) encola aquí toda operación de escritura (POST/PUT/
// PATCH/DELETE) que falle por ausencia de red; esta cola se reintenta sola al
// reconectar. Las creaciones (inspección, daño individual, foto) usan un id
// generado en el cliente (ver `newClientId()`) para que el wizard pueda
// seguir navegando y encolando operaciones dependientes sin esperar una
// respuesta del servidor — ver docs/ANALISIS-Y-ARQUITECTURA.md §6.
(function () {
  const DB_NAME = "edificaciones-offline";
  const DB_VERSION = 1;
  const STORE = "pendingRequests";

  function openDb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  /** Envuelve una operación IndexedDB de request único (add/delete/...) en una promesa que resuelve con `request.result`. */
  async function runRequest(mode, fn) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const store = tx.objectStore(STORE);
      const req = fn(store);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function enqueue({ path, method, body, headers }) {
    const id = await runRequest("readwrite", (store) =>
      store.add({ path, method, body, headers, createdAt: new Date().toISOString(), attempts: 0 }),
    );
    window.dispatchEvent(new CustomEvent("offline-queue-updated"));
    return id;
  }

  async function getAll() {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function remove(id) {
    await runRequest("readwrite", (store) => store.delete(id));
  }

  async function count() {
    const items = await getAll();
    return items.length;
  }

  let flushing = false;
  /** Reintenta todas las solicitudes encoladas, en orden, deteniéndose si vuelve a fallar por red (para no perder el orden ni las siguientes). */
  async function flush() {
    if (flushing || !navigator.onLine) return;
    flushing = true;
    try {
      const items = (await getAll()).sort((a, b) => a.id - b.id);
      for (const item of items) {
        try {
          const res = await fetch(`/api${item.path}`, {
            method: item.method,
            headers: item.headers,
            body: item.body ? JSON.stringify(item.body) : undefined,
          });
          if (!res.ok && res.status >= 500) {
            // Error del servidor (no de red): se reintentará más tarde, pero no bloquea la cola indefinidamente.
            break;
          }
          await remove(item.id);
          window.dispatchEvent(new CustomEvent("offline-queue-updated"));
        } catch {
          // Sigue sin haber red (u otro error de fetch) — se detiene y se reintenta en el próximo flush().
          break;
        }
      }
    } finally {
      flushing = false;
    }
  }

  window.offlineQueue = { enqueue, getAll, remove, count, flush };

  window.addEventListener("online", flush);
  window.addEventListener("load", flush);
  // Respaldo por si el evento 'online' no dispara de forma confiable en algunos navegadores móviles.
  setInterval(flush, 20000);

  /** UUID v4 para ids generados en el cliente (inspecciones/daños/fotos creados offline). */
  window.newClientId = function newClientId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };
})();
