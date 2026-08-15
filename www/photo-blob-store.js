// Almacén local de bytes de foto (IndexedDB) — separado del caché liviano de
// la inspección en localStorage (ver cacheInspectionLocally en
// inspection.html).
//
// Por qué hace falta: localStorage tiene una cuota TOTAL por origen bastante
// chica (históricamente ~5-10MB, compartida con todo lo que la app guarda
// ahí). Embeber el dataURL completo de cada foto directamente en el mismo
// JSON cacheado de la inspección agotaba esa cuota después de solo un puñado
// de fotos -- y como ese guardado fallaba en silencio (el try/catch de
// cacheInspectionLocally está pensado para un respaldo de baja criticidad,
// no para ser el ÚNICO lugar donde vive el dato), TODO guardado posterior
// -- no solo fotos nuevas, cualquier cambio de cualquier paso -- dejaba de
// persistir sin ningún aviso visible. Bug real reportado en campo: "ya no
// deja cargar ninguna foto", sin ningún mensaje de error.
//
// IndexedDB no tiene ese límite tan ajustado (normalmente decenas o cientos
// de MB, según el dispositivo/navegador), así que los bytes de cada foto
// viven acá, y lo que se cachea en localStorage solo guarda una referencia
// liviana (ver LOCAL_PHOTO_PLACEHOLDER en inspection.html).
(function () {
  const DB_NAME = "edificaciones-photo-blobs";
  const DB_VERSION = 1;
  const STORE = "blobs";

  function openDb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  async function put(id, dataUrl) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put({ id, dataUrl });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
  async function get(id) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => resolve(req.result ? req.result.dataUrl : null);
      req.onerror = () => reject(req.error);
    });
  }
  async function remove(id) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
  window.photoBlobStore = { put, get, remove };
})();
