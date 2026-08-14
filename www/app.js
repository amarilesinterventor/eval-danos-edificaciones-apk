// Utilidades compartidas del frontend (vanilla JS, sin dependencias / sin
// build step de JS — solo el CSS pasa por Tailwind CLI, ver package.json).
// Mismo patrón que wabim-bridges/public/app.js.
//
// Sin cuentas de usuario (decisión explícita): el inspector abre la
// herramienta y empieza a trabajar directamente, sin login. Solo se recuerda
// localmente (localStorage, no es una cuenta) el último nombre de evaluador
// escrito, para no tener que volver a teclearlo en cada inspección nueva.
const LAST_EVALUATOR_KEY = "edificaciones_last_evaluator_name";
function getLastEvaluatorName() {
  return localStorage.getItem(LAST_EVALUATOR_KEY) || "";
}
function rememberEvaluatorName(name) {
  if (name) localStorage.setItem(LAST_EVALUATOR_KEY, name);
}

// ---------------------------------------------------------------------------
// Llamadas a la API, con cola de sincronización offline (ver offline.js).
// Si el fetch falla por ausencia de red (no por un error HTTP del servidor) en
// una operación que modifica datos (POST/PUT/PATCH/DELETE), se encola en
// IndexedDB y se reintenta automáticamente al recuperar conexión — la llamada
// se resuelve igual (con `queued: true`) para que el wizard no bloquee al
// inspector en campo.
// ---------------------------------------------------------------------------
async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const method = (options.method || "GET").toUpperCase();
  const isMutation = method !== "GET";

  // La llamada a fetch() en sí (antes de recibir CUALQUIER respuesta) va en
  // su propio try/catch, separado de la revisión de `res.ok` de abajo. Así
  // se distingue sin ambigüedad "no hubo red" (falla acá) de "el servidor
  // respondió con un error real" (falla más abajo, con respuesta en mano).
  //
  // Antes se usaba `err instanceof TypeError` para esa distinción -- funciona
  // en un navegador normal (fetch() siempre lanza TypeError si no hay red),
  // pero NO dentro del APK: ahí fetch() pasa por el puente nativo de
  // Capacitor (ver native-shim.js), y una falla de red real ahí (p.ej. DNS
  // que no resuelve) puede rechazar con otro tipo de error, no un TypeError
  // -- bug real detectado en campo: "No se pudo guardar: Unable to resolve
  // host ... No address associated with hostname" se mostraba como si fuera
  // un error del servidor, en vez de encolarse para sincronizar después.
  let res;
  try {
    res = await fetch(`/api${path}`, { ...options, headers });
  } catch (err) {
    if (isMutation && window.offlineQueue) {
      await window.offlineQueue.enqueue({ path, method, body: options.body ? JSON.parse(options.body) : null, headers });
      window.dispatchEvent(new CustomEvent("offline-queued"));
      return { queued: true };
    }
    throw err;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`); // el servidor sí respondió -- error real, no de red
  return data;
}

// ---------------------------------------------------------------------------
// Navegación / layout
// ---------------------------------------------------------------------------
function renderNav(active) {
  const el = document.getElementById("nav");
  if (!el) return;
  el.innerHTML = `
    <div class="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
      <a href="/index.html" class="flex items-center gap-2 font-semibold text-slate-800 min-w-0">
        <span class="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-brand-600 text-white text-sm shrink-0">HE</span>
        <span class="truncate hidden sm:inline">Herramienta de Evaluación Rápida de Daños en Edificaciones</span>
        <span class="truncate sm:hidden">Eval. Rápida de Daños</span>
      </a>
      <div class="flex items-center gap-3 sm:gap-4 text-sm">
        <span id="connStatus" class="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-400"></span>
        <a href="/index.html" class="${active === "home" ? "text-brand-600 font-medium" : "text-slate-600"} hover:text-brand-600">Panel</a>
        <a href="/inspections.html" class="${active === "inspections" ? "text-brand-600 font-medium" : "text-slate-600"} hover:text-brand-600">Inspecciones</a>
      </div>
    </div>
  `;
  renderConnStatus();
  window.addEventListener("online", renderConnStatus);
  window.addEventListener("offline", renderConnStatus);
  window.addEventListener("offline-queue-updated", renderConnStatus);
}

async function renderConnStatus() {
  const el = document.getElementById("connStatus");
  if (!el) return;
  const pending = window.offlineQueue ? await window.offlineQueue.count() : 0;
  if (!navigator.onLine) {
    el.innerHTML = `<span class="w-2 h-2 rounded-full bg-red-400"></span> Sin conexión${pending ? ` · ${pending} por sincronizar` : ""}`;
  } else if (pending > 0) {
    el.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-400"></span> Sincronizando ${pending}…`;
  } else {
    el.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400"></span> En línea`;
  }
}

// Nota de marca: los logos institucionales del encabezado del formulario
// oficial (Sistema Nacional de Gestión del Riesgo de Desastres, USAID,
// Miyamoto International) se muestran aquí como cita de la metodología base
// — misma justificación y misma nota que en src/server/reportPdf.ts. El
// logo de UTP identifica la autoría de esta implementación digital, no el
// origen del formulario.
function renderFooter() {
  const el = document.getElementById("footer");
  if (!el) return;
  el.innerHTML = `
    <div class="max-w-6xl mx-auto px-4 py-8 mt-12 border-t border-slate-200 text-xs text-slate-500">
      <div class="flex flex-wrap items-center gap-4 mb-4">
        <img src="/assets/logos/sngrd.png" alt="Sistema Nacional de Gestión del Riesgo de Desastres" class="h-8 w-auto object-contain" />
        <img src="/assets/logos/usaid_miyamoto.png" alt="USAID / Miyamoto International" class="h-8 w-auto object-contain" />
      </div>
      <p class="mb-4">Basado en el <em>Formulario Regional para Evaluación Rápida de Daños en Edificaciones</em> (V.1.0 - 03/2023), metodología de evaluación visual rápida del Sistema Nacional de Gestión del Riesgo de Desastres, con apoyo de USAID y Miyamoto International.</p>
      <div class="flex flex-wrap items-center gap-4 mb-2 pt-3 border-t border-slate-100">
        <img src="/assets/logos/utp.png" alt="Universidad Tecnológica de Pereira" class="h-9 w-9 object-contain" />
      </div>
      <p class="font-medium text-slate-600">Herramienta desarrollada por: Ing. Cristhian Camilo Amariles López</p>
      <p>Universidad Tecnológica de Pereira</p>
      <p class="mt-3">Implementación digital independiente — no sustituye el criterio profesional del inspector ni constituye una evaluación estructural detallada.</p>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Formato y semáforo
// ---------------------------------------------------------------------------
function fmtDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

const HABITABILITY_META = {
  VERDE: { label: "Habitable", cls: "bg-emerald-100 text-emerald-800 border-emerald-300", dot: "bg-emerald-500" },
  AMARILLO: { label: "Uso restringido", cls: "bg-amber-100 text-amber-800 border-amber-300", dot: "bg-amber-500" },
  ROJO: { label: "No habitable", cls: "bg-red-100 text-red-800 border-red-300", dot: "bg-red-500" },
};
const DAMAGE_LEVEL_META = {
  NINGUNO_MENOR: { label: "Ninguno/Menor" },
  MODERADO: { label: "Moderado" },
  SEVERO: { label: "Severo" },
};
const STATUS_META = {
  BORRADOR: { label: "Borrador", cls: "bg-slate-100 text-slate-700 border-slate-300" },
  EN_PROCESO: { label: "En proceso", cls: "bg-blue-100 text-blue-700 border-blue-300" },
  FINALIZADA: { label: "Finalizada", cls: "bg-violet-100 text-violet-700 border-violet-300" },
  INFORME_GENERADO: { label: "Informe generado", cls: "bg-emerald-100 text-emerald-700 border-emerald-300" },
};
const SEVERITY_META = {
  NL: { label: "Ninguno/Leve", hex: "#22c55e", cls: "bg-emerald-500 text-white" },
  M_CRIT: { label: "Moderado", hex: "#ef4444", cls: "bg-red-500 text-white" },
  S_CRIT: { label: "Severo", hex: "#ef4444", cls: "bg-red-500 text-white" },
  M_SEC: { label: "Moderado", hex: "#eab308", cls: "bg-amber-500 text-white" },
  S_SEC: { label: "Severo", hex: "#eab308", cls: "bg-amber-500 text-white" },
};
function severityMeta(tier, severity) {
  if (severity === "NL" || !severity) return SEVERITY_META.NL;
  return SEVERITY_META[`${severity}_${tier === "CRITICO" ? "CRIT" : "SEC"}`];
}

function habitabilityBadge(color, extra) {
  const m = HABITABILITY_META[color];
  if (!m) return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-slate-50 text-slate-500 border-slate-200">Sin clasificar</span>`;
  return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${m.cls}"><span class="w-2 h-2 rounded-full ${m.dot}"></span>${m.label}${extra ? ` · ${escapeHtml(extra)}` : ""}</span>`;
}
function statusBadge(status) {
  const m = STATUS_META[status] || { label: status, cls: "bg-slate-100 text-slate-600 border-slate-300" };
  return `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${m.cls}">${m.label}</span>`;
}

// ---------------------------------------------------------------------------
// Geolocalización (sección 3 del formulario)
// ---------------------------------------------------------------------------
function getGpsLocation(options = {}) {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) return reject(new Error("Este dispositivo/navegador no soporta geolocalización."));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      (err) => reject(new Error(err.message || "No se pudo obtener la ubicación GPS.")),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000, ...options },
    );
  });
}

// ---------------------------------------------------------------------------
// Fotografías: redimensionado en cliente antes de subir (máx. 1600px, JPEG
// q=0.8) — mismo enfoque que wabim-bridges/public/app.js.
// ---------------------------------------------------------------------------
function resizeImageToDataUrl(file, maxDim = 1600, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("No se pudo leer la imagen."));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function uploadPhoto(inspectionId, file, { kind = "PANORAMICA", damageRecordId = null, caption = null, geo = null } = {}) {
  const dataUrl = await resizeImageToDataUrl(file);
  return api(`/inspections/${inspectionId}/photos`, {
    method: "POST",
    body: JSON.stringify({ dataUrl, kind, damageRecordId, caption, latitude: geo?.latitude ?? null, longitude: geo?.longitude ?? null, takenAt: new Date().toISOString() }),
  });
}

function photoGallery(photos, { small = true } = {}) {
  if (!photos || !photos.length) return "";
  const size = small ? "h-16 w-16" : "h-28 w-28";
  return `<div class="flex flex-wrap gap-2 mt-2">
    ${photos
      .map(
        (p) => `
      <div class="relative group">
        <a href="${p.url}" target="_blank" rel="noopener"><img src="${p.url}" class="${size} object-cover rounded-xl border border-slate-200" alt="${escapeHtml(p.caption || "Foto de inspección")}" /></a>
        <button class="delete-photo-btn absolute -top-1.5 -right-1.5 bg-white border border-slate-300 rounded-full w-5 h-5 text-xs leading-none text-red-500 shadow" data-id="${p.id}" title="Eliminar foto">✕</button>
      </div>
    `,
      )
      .join("")}
  </div>`;
}

/** Dos botones separados -- "Tomar foto" (fuerza la cámara con `capture="environment"`) y "Elegir de
 * galería" (sin `capture`) -- con su input file oculto correspondiente, en vez de un único botón que
 * dependía de que el selector nativo del celular mostrara ambas opciones (varía entre navegadores/
 * WebViews). Mismo patrón que el modal de detalle de daño en inspection.html. */
function photoUploadControl(dataAttrs, label = "Agregar foto") {
  const attrs = Object.entries(dataAttrs)
    .map(([k, v]) => `data-${k}="${v}"`)
    .join(" ");
  return `
    <div class="flex gap-2 flex-wrap">
      <button type="button" class="add-photo-camera-btn chip-btn border-2 border-slate-400 bg-white text-slate-800 hover:bg-slate-50" title="${escapeHtml(label)}" ${attrs}>
        📷 Tomar foto
      </button>
      <button type="button" class="add-photo-gallery-btn chip-btn border-2 border-slate-400 bg-white text-slate-800 hover:bg-slate-50" title="${escapeHtml(label)}" ${attrs}>
        🖼️ Elegir de galería
      </button>
    </div>
    <input type="file" accept="image/*" capture="environment" class="hidden photo-input-camera" ${attrs} />
    <input type="file" accept="image/*" class="hidden photo-input-gallery" ${attrs} />
  `;
}

// ---------------------------------------------------------------------------
// Catálogos cerrados con "Otro" — reutilizable en cualquier <select>
// ---------------------------------------------------------------------------
const OTHER_VALUE = "__OTHER__";

function selectWithOther(name, options, { otherName, placeholder = "Especifica cuál...", required = false, selected = "", selectedOther = "" } = {}) {
  const otherFieldName = otherName ?? `${name}Other`;
  const isOtherSelected = selected === "OTRO" || selected === OTHER_VALUE;
  return `
    <select name="${name}" class="select-with-other field-input" data-other-name="${otherFieldName}" ${required ? "required" : ""}>
      <option value="">Selecciona...</option>
      ${options.map((o) => `<option value="${escapeHtml(o.code)}" ${o.code === selected ? "selected" : ""}>${escapeHtml(o.label)}</option>`).join("")}
    </select>
    <input type="text" name="${otherFieldName}" class="other-input ${isOtherSelected ? "" : "hidden"} field-input mt-2" placeholder="${escapeHtml(placeholder)}" value="${escapeHtml(selectedOther)}" />
  `;
}
function bindSelectsWithOther(root = document) {
  root.querySelectorAll(".select-with-other").forEach((select) => {
    const otherInput = select.parentElement.querySelector(`input[name="${select.dataset.otherName}"]`);
    const sync = () => {
      const isOther = select.value === OTHER_VALUE || select.value === "OTRO";
      if (otherInput) {
        otherInput.classList.toggle("hidden", !isOther);
        if (!isOther) otherInput.value = "";
      }
    };
    select.addEventListener("change", sync);
    sync();
  });
}

// ---------------------------------------------------------------------------
// Grupo de casillas (checkboxes) para catálogos con agrupador visual (p.ej.
// "Concreto reforzado" / "Mampostería") + "Otro" con texto libre — usado en
// las secciones 1, 4, 5.1-5.4 y 14 del formulario.
// ---------------------------------------------------------------------------
// Clases de contraste compartidas por todos los controles de "opción
// seleccionable" (checkboxGroup, chipRadio, severityChips): relleno sólido
// cuando está seleccionada (inconfundible) y borde marcado + texto oscuro
// cuando no lo está (visible incluso con luz solar directa en campo) — el
// esquema anterior (borde claro + fondo pastel) resultaba "muy claro, casi
// no se ve" según feedback directo del usuario.
const OPTION_IDLE_CLS = ["border-2", "border-slate-400", "bg-white", "text-slate-800"];
const OPTION_ACTIVE_CLS = ["border-2", "border-brand-600", "bg-brand-600", "text-white", "shadow-sm"];

function checkboxGroup(name, options, selectedCodes = [], otherTextByCode = {}) {
  const groups = new Map();
  for (const o of options) {
    const g = o.group || "";
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(o);
  }
  let html = "";
  for (const [group, items] of groups) {
    if (group) html += `<div class="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-3 mb-1.5 first:mt-0">${escapeHtml(group)}</div>`;
    html += `<div class="grid grid-cols-2 sm:grid-cols-3 gap-2">`;
    for (const o of items) {
      const checked = selectedCodes.includes(o.code);
      html += `
        <label class="chip-btn ${(checked ? OPTION_ACTIVE_CLS : OPTION_IDLE_CLS).join(" ")}">
          <input type="checkbox" name="${name}" value="${escapeHtml(o.code)}" class="chk-group-item sr-only" data-allow-other="${o.allowOther ? "1" : "0"}" ${checked ? "checked" : ""} />
          <span>${escapeHtml(o.label)}</span>
        </label>`;
      if (o.allowOther) {
        html += `<input type="text" name="${name}Other__${o.code}" class="other-input ${checked ? "" : "hidden"} field-input col-span-2 sm:col-span-3" placeholder="¿Cuál?" value="${escapeHtml(otherTextByCode[o.code] || "")}" />`;
      }
    }
    html += `</div>`;
  }
  return html;
}
function bindCheckboxGroup(root) {
  root.querySelectorAll(".chk-group-item").forEach((chk) => {
    const sync = () => {
      const label = chk.closest("label");
      label.classList.remove(...OPTION_IDLE_CLS, ...OPTION_ACTIVE_CLS);
      label.classList.add(...(chk.checked ? OPTION_ACTIVE_CLS : OPTION_IDLE_CLS));
      if (chk.dataset.allowOther === "1") {
        const otherInput = root.querySelector(`input[name="${chk.name}Other__${chk.value}"]`);
        if (otherInput) otherInput.classList.toggle("hidden", !chk.checked);
      }
    };
    chk.addEventListener("change", sync);
  });
}
/** Lee un grupo de checkboxes ya insertado en el DOM y devuelve [{code, otherText}]. */
function readCheckboxGroup(root, name) {
  return Array.from(root.querySelectorAll(`.chk-group-item[name="${name}"]:checked`)).map((chk) => {
    const otherInput = root.querySelector(`input[name="${chk.name}Other__${chk.value}"]`);
    return { code: chk.value, otherText: otherInput ? otherInput.value : undefined };
  });
}

// ---------------------------------------------------------------------------
// Grupo de opciones de selección única presentadas como "chips" (botones
// grandes tipo pastilla) — usado para Sí/No/No es claro, Urbano/Rural,
// Pública/Privada, CC/Pasaporte, Ocupada/Desocupada, etc. Más fácil de tocar
// en campo que un <select> nativo pequeño.
// ---------------------------------------------------------------------------
function chipRadio(name, options, selected, { cols } = {}) {
  const gridCols = cols || options.length;
  return `<div class="grid gap-2" style="grid-template-columns:repeat(${gridCols},minmax(0,1fr))">
    ${options
      .map((o) => {
        const active = selected === o.value;
        const activeCls = o.activeCls || OPTION_ACTIVE_CLS.join(" ");
        return `<label class="chip-btn ${active ? activeCls : OPTION_IDLE_CLS.join(" ")}" data-active-cls="${escapeHtml(activeCls)}">
          <input type="radio" name="${name}" value="${escapeHtml(o.value)}" class="radio-chip-item sr-only" ${active ? "checked" : ""} />
          <span>${escapeHtml(o.label)}</span>
        </label>`;
      })
      .join("")}
  </div>`;
}
function bindChipRadio(root) {
  root.querySelectorAll(".radio-chip-item").forEach((input) => {
    input.addEventListener("change", () => {
      root.querySelectorAll(`.radio-chip-item[name="${input.name}"]`).forEach((g) => {
        const label = g.closest("label");
        const active = g.checked;
        const activeCls = (label.dataset.activeCls || OPTION_ACTIVE_CLS.join(" ")).split(" ");
        label.classList.remove(...activeCls, ...OPTION_IDLE_CLS);
        label.classList.add(...(active ? activeCls : OPTION_IDLE_CLS));
      });
    });
  });
}
function chipRadioValue(root, name) {
  return root.querySelector(`.radio-chip-item[name="${name}"]:checked`)?.value ?? null;
}

// ---------------------------------------------------------------------------
// Severidad por elemento (secciones 9/10): 3 chips N/L · M · S coloreados
// según la criticidad del elemento (ver src/domain/catalog.ts severityBoxColor).
// ---------------------------------------------------------------------------
function severityChips(elementCode, tier, currentSeverity) {
  const opts = [
    { value: "NL", label: "N/L", cls: "border-2 border-emerald-600 bg-emerald-600 text-white shadow-sm" },
    { value: "M", label: "M", cls: tier === "CRITICO" ? "border-2 border-red-600 bg-red-600 text-white shadow-sm" : "border-2 border-amber-600 bg-amber-600 text-white shadow-sm" },
    { value: "S", label: "S", cls: tier === "CRITICO" ? "border-2 border-red-600 bg-red-600 text-white shadow-sm" : "border-2 border-amber-600 bg-amber-600 text-white shadow-sm" },
  ];
  return `<div class="grid grid-cols-3 gap-1.5 w-full sm:w-56">
    ${opts
      .map(
        (o) => `<button type="button" class="severity-chip-btn chip-btn !min-h-[38px] text-xs ${currentSeverity === o.value ? o.cls : "border-2 border-slate-400 bg-white text-slate-700"}" data-element-code="${elementCode}" data-severity="${o.value}">${o.label}</button>`,
      )
      .join("")}
  </div>`;
}

// ---------------------------------------------------------------------------
// Departamento / Municipio (Colombia) — <select> en cascada (ver /colombia.js)
// ---------------------------------------------------------------------------
function departmentCityFields(dept = "", city = "") {
  return `
    <div>
      <label class="field-label">Departamento</label>
      <select name="department" class="department-select field-input">
        <option value="">Selecciona...</option>
        ${COLOMBIA_DEPARTMENTS.map((d) => `<option value="${escapeHtml(d.name)}" ${d.name === dept ? "selected" : ""}>${escapeHtml(d.name)}</option>`).join("")}
      </select>
    </div>
    <div>
      <label class="field-label">Municipio</label>
      <select name="municipality" class="municipality-select field-input" ${dept ? "" : "disabled"}>
        <option value="">${dept ? "Selecciona..." : "Selecciona un departamento primero..."}</option>
      </select>
      <input type="text" name="municipalityOther" class="municipality-other-input other-input hidden field-input mt-2" placeholder="Especifica el municipio..." />
    </div>
  `;
}
function bindDepartmentCityFields(root, selectedCity = "") {
  const deptSelect = root.querySelector(".department-select");
  const citySelect = root.querySelector(".municipality-select");
  const otherInput = root.querySelector(".municipality-other-input");
  if (!deptSelect || !citySelect) return;
  function populateCities(preselect) {
    const dept = COLOMBIA_DEPARTMENTS.find((d) => d.name === deptSelect.value);
    otherInput.classList.add("hidden");
    if (!dept) {
      citySelect.innerHTML = `<option value="">Selecciona un departamento primero...</option>`;
      citySelect.disabled = true;
      return;
    }
    citySelect.disabled = false;
    citySelect.innerHTML =
      `<option value="">Selecciona...</option>` +
      dept.cities.map((c) => `<option value="${escapeHtml(c)}" ${c === preselect ? "selected" : ""}>${escapeHtml(c)}</option>`).join("") +
      `<option value="${OTHER_VALUE}" ${preselect && !dept.cities.includes(preselect) ? "selected" : ""}>Otro (especificar)</option>`;
    if (preselect && !dept.cities.includes(preselect)) {
      otherInput.classList.remove("hidden");
      otherInput.value = preselect;
    }
  }
  deptSelect.addEventListener("change", () => populateCities());
  citySelect.addEventListener("change", () => {
    const isOther = citySelect.value === OTHER_VALUE;
    otherInput.classList.toggle("hidden", !isOther);
    if (!isOther) otherInput.value = "";
  });
  if (deptSelect.value) populateCities(selectedCity);
}

// ---------------------------------------------------------------------------
// Varios
// ---------------------------------------------------------------------------
function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function openModal(el) {
  el.classList.remove("hidden");
  el.classList.add("flex");
}
function closeModal(el) {
  el.classList.add("hidden");
  el.classList.remove("flex");
}
function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

// ---------------------------------------------------------------------------
// PWA: registro del Service Worker (ver public/sw.js) — permite instalar la
// app en pantalla de inicio y que cargue sin conexión en campo.
// ---------------------------------------------------------------------------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => console.warn("No se pudo registrar el service worker:", err));
  });
}
