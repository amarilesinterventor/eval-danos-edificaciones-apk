// Índice local de inspecciones (localStorage) — versión "ligera" (solo los
// campos que el listado/panel necesitan) de cada inspección conocida en este
// dispositivo. Se actualiza cada vez que se guarda o borra una inspección
// localmente (ver cacheInspectionLocally en inspection.html), sin importar
// si la operación real contra el servidor tuvo éxito — así el listado
// (inspections.html) y el panel (index.html) siempre pueden reconstruirse
// desde este dispositivo sin depender de una respuesta de red exitosa.
//
// Por qué hace falta: antes, el respaldo offline del listado solo se
// poblaba tras un GET exitoso al servidor (`cacheInspectionsList()` en
// inspections.html). Si esa llamada nunca llega a tener éxito -- exactamente
// el caso de la variante local-first del APK, que nunca contacta el
// servidor -- el listado se quedaba vacío para siempre aunque sí hubiera
// inspecciones guardadas en el dispositivo (bug real reportado en campo).
(function () {
  const KEY = "edificaciones_local_inspections_index";

  function readAll() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (err) {
      return {};
    }
  }
  function writeAll(map) {
    try {
      localStorage.setItem(KEY, JSON.stringify(map));
    } catch (err) {
      // localStorage lleno o no disponible: no es crítico para esta función
      // auxiliar -- la propia inspección ya se cachea aparte (ver
      // cacheInspectionLocally), esto solo alimenta el listado.
    }
  }
  function summarize(insp) {
    return {
      id: insp.id,
      building_name: insp.building_name ?? null,
      form_number: insp.form_number ?? null,
      address: insp.address ?? null,
      municipality: insp.municipality ?? null,
      department: insp.department ?? null,
      updated_at: insp.updated_at ?? new Date().toISOString(),
      habitability: insp.habitability ?? null,
      status: insp.status ?? "BORRADOR",
    };
  }
  function upsert(insp) {
    if (!insp || !insp.id) return;
    const map = readAll();
    map[insp.id] = summarize(insp);
    writeAll(map);
  }
  function remove(id) {
    if (!id) return;
    const map = readAll();
    delete map[id];
    writeAll(map);
  }
  function list({ status } = {}) {
    const map = readAll();
    let items = Object.values(map);
    if (status) items = items.filter((i) => i.status === status);
    items.sort((a, b) => String(b.updated_at || "").localeCompare(String(a.updated_at || "")));
    return items;
  }
  window.localInspectionsIndex = { upsert, remove, list };
})();
