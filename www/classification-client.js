// Port a JavaScript de navegador de src/domain/classification.ts
// (suggestClassification) -- usado como respaldo LOCAL cuando
// `POST /api/inspections/:id/classify` no está disponible (sin conexión), en
// vez de dejar el botón "Calcular sugerencia" sin funcionar. Misma lógica,
// puerto directo -- ver ese archivo para la explicación completa del criterio
// de clasificación (secciones 2/12 del formulario). Se mantiene sincronizado
// a mano con el original; cualquier cambio en la fórmula debe replicarse acá
// también.
//
// Recibe el objeto `inspection` tal como vive en el wizard (columnas en
// snake_case, ver INSPECTION_FIELD_MAP en inspection.html) y el `catalog` ya
// cargado (para resolver el "tier" de cada elemento dañado), en vez del tipo
// `ClassificationInput` propio del servidor -- evita duplicar otra vez el
// mapeo de columnas.
(function () {
  const SEVERITY_RANK = { NL: 0, M: 1, S: 2 };
  const SEVERITY_LABEL = { NL: "Ninguno/Leve", M: "Moderado", S: "Severo" };
  const HABITABILITY_ORDER = ["VERDE", "AMARILLO", "ROJO"];
  const HABITABILITY_RANK = { VERDE: 0, AMARILLO: 1, ROJO: 2 };

  function findElementDef(catalog, code) {
    const all = [...(catalog?.structuralElements || []), ...(catalog?.nonStructuralElements || [])];
    return all.find((e) => e.code === code) || null;
  }

  function suggestClassificationLocal(inspection, catalog) {
    const reasons = [];
    let habitabilityRank = 0;
    const escalate = (level, reason) => {
      habitabilityRank = Math.max(habitabilityRank, HABITABILITY_RANK[level]);
      reasons.push(reason);
    };

    if (inspection.total_collapse === "SI") escalate("ROJO", "Colapso total = Sí (sección 7)");
    if (inspection.evident_tilt === "SI") escalate("ROJO", "Inclinación evidente = Sí (sección 7)");
    if (inspection.soil_liquefaction === "SI") escalate("ROJO", "Licuación/asentamiento/subsidencia del terreno = Sí (sección 8)");
    if (inspection.nearby_landslides === "SI") escalate("ROJO", "Movimientos en masa cercanos = Sí (sección 8)");

    if (inspection.partial_collapse === "SI") escalate("AMARILLO", "Colapso parcial = Sí (sección 7)");
    else if (inspection.partial_collapse === "NO_ES_CLARO") escalate("AMARILLO", "Colapso parcial = No es claro (sección 7) — requiere evaluación adicional");

    if (inspection.adjacent_building_risk === "SI") escalate("AMARILLO", "Riesgo por edificaciones adyacentes = Sí (sección 7)");
    else if (inspection.adjacent_building_risk === "NO_ES_CLARO") escalate("AMARILLO", "Riesgo por edificaciones adyacentes = No es claro (sección 7)");

    let maxSeverity = "NL";
    for (const dmg of inspection.elementDamages || []) {
      if (SEVERITY_RANK[dmg.severity] > SEVERITY_RANK[maxSeverity]) maxSeverity = dmg.severity;
      const def = findElementDef(catalog, dmg.element_code);
      const tier = def?.tier ?? "SECUNDARIO";
      const name = def?.name ?? dmg.element_code;
      if (dmg.severity === "S") {
        if (tier === "CRITICO") escalate("ROJO", `${name}: severidad Severo en elemento crítico (sección 9)`);
        else escalate("AMARILLO", `${name}: severidad Severo (secciones 9/10)`);
      } else if (dmg.severity === "M" && tier === "CRITICO") {
        escalate("AMARILLO", `${name}: severidad Moderado en elemento crítico (sección 9)`);
      }
    }

    if (reasons.length === 0) reasons.push("Sin indicadores de peligro marcados — se sugiere Habitable (Verde).");

    const habitability = HABITABILITY_ORDER[habitabilityRank];

    let damageLevel = maxSeverity === "S" ? "SEVERO" : maxSeverity === "M" ? "MODERADO" : "NINGUNO_MENOR";
    if (habitabilityRank === HABITABILITY_RANK.ROJO && damageLevel !== "SEVERO") damageLevel = "SEVERO";
    if (habitabilityRank === HABITABILITY_RANK.AMARILLO && damageLevel === "NINGUNO_MENOR") damageLevel = "MODERADO";

    if (maxSeverity !== "NL") reasons.push(`Severidad máxima registrada en elementos: ${SEVERITY_LABEL[maxSeverity]}.`);

    return { habitability, damageLevel, reasons };
  }

  window.suggestClassificationLocal = suggestClassificationLocal;
})();
