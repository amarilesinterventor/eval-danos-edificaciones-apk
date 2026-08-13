// Guía visual de patologías/fisuras por elemento — ayuda al inspector a
// reconocer patrones de daño típicos al marcar la severidad en el paso 5.
//
// Los diagramas son ilustraciones ORIGINALES (dibujos de línea simples,
// creados para esta herramienta), no reproducciones de las figuras de
// ninguna publicación. Los mecanismos de falla que ilustran están tomados
// del conocimiento técnico general de patología estructural sismorresistente
// — la referencia consultada para organizarlos por elemento fue la:
//
//   "Guía de Patologías Constructivas, Estructurales y No Estructurales"
//   Fondo de Prevención y Atención de Emergencias de Bogotá (FOPAE) /
//   Asociación Colombiana de Ingeniería Sísmica (AIS), 3ª edición, 2011.
//
// Esta guía se cita como fuente conceptual en cada panel; no se reproduce
// ningún texto ni figura de ese documento.
const PATHOLOGY_GUIDE = {
  COLUMNAS: [
    {
      title: "Fisuras diagonales por cortante",
      desc: "Grietas en \"X\" cruzando el elemento, típicas de esfuerzo cortante ante carga sísmica.",
      svg: `<svg viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg"><rect x="35" y="10" width="30" height="120" rx="2" fill="none" stroke="#94a3b8" stroke-width="3"/><line x1="39" y1="45" x2="61" y2="95" stroke="#dc2626" stroke-width="3" stroke-linecap="round"/><line x1="61" y1="45" x2="39" y2="95" stroke="#dc2626" stroke-width="3" stroke-linecap="round"/></svg>`,
    },
    {
      title: "Fisuras horizontales por flexión",
      desc: "Grietas horizontales cerca de la base o la cabeza, perpendiculares al eje del elemento.",
      svg: `<svg viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg"><rect x="35" y="10" width="30" height="120" rx="2" fill="none" stroke="#94a3b8" stroke-width="3"/><line x1="35" y1="104" x2="65" y2="104" stroke="#dc2626" stroke-width="3" stroke-linecap="round"/><line x1="35" y1="116" x2="65" y2="116" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round"/></svg>`,
    },
    {
      title: "Aplastamiento y pandeo de refuerzo",
      desc: "Desprendimiento del recubrimiento de concreto con exposición o pandeo del acero de refuerzo en la base — indicio de daño severo.",
      svg: `<svg viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg"><rect x="35" y="10" width="30" height="100" rx="2" fill="none" stroke="#94a3b8" stroke-width="3"/><path d="M32 108 Q28 126 40 132 L60 132 Q72 126 68 108" fill="#fecaca" stroke="#dc2626" stroke-width="2"/><path d="M46 110 q-4 14 -1 20" stroke="#7f1d1d" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M54 110 q4 14 1 20" stroke="#7f1d1d" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`,
    },
    {
      title: "Falla por columna corta",
      desc: "Cuando un muro parcial deja un tramo libre corto, el cortante se concentra ahí — fisuras en X cortas y muy inclinadas.",
      svg: `<svg viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg"><rect x="35" y="10" width="30" height="120" rx="2" fill="none" stroke="#94a3b8" stroke-width="3"/><rect x="8" y="72" width="27" height="58" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2"/><line x1="38" y1="46" x2="62" y2="70" stroke="#dc2626" stroke-width="3" stroke-linecap="round"/><line x1="62" y1="46" x2="38" y2="70" stroke="#dc2626" stroke-width="3" stroke-linecap="round"/></svg>`,
    },
  ],
  MUROS_PORTANTES: [
    {
      title: "Fisuras diagonales en X (cortante)",
      desc: "Grietas cruzadas de esquina a esquina — el patrón más característico de falla por cortante en muros.",
      svg: `<svg viewBox="0 0 140 100" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="120" height="80" rx="2" fill="none" stroke="#94a3b8" stroke-width="3"/><line x1="22" y1="22" x2="118" y2="78" stroke="#dc2626" stroke-width="3" stroke-linecap="round"/><line x1="118" y1="22" x2="22" y2="78" stroke="#dc2626" stroke-width="3" stroke-linecap="round"/></svg>`,
    },
    {
      title: "Fisuras escalonadas en juntas",
      desc: "En mampostería, la grieta sigue el mortero de las juntas en forma de escalera en vez de cruzar los ladrillos/bloques.",
      svg: `<svg viewBox="0 0 140 100" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="120" height="80" rx="2" fill="none" stroke="#94a3b8" stroke-width="3"/><line x1="10" y1="30" x2="130" y2="30" stroke="#cbd5e1" stroke-width="1"/><line x1="10" y1="50" x2="130" y2="50" stroke="#cbd5e1" stroke-width="1"/><line x1="10" y1="70" x2="130" y2="70" stroke="#cbd5e1" stroke-width="1"/><path d="M25 88 L45 70 L65 70 L85 50 L105 50 L120 30" fill="none" stroke="#dc2626" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    },
    {
      title: "Fisura horizontal en la base",
      desc: "Grieta continua en la base del muro — puede indicar volcamiento incipiente o falla por flexión.",
      svg: `<svg viewBox="0 0 140 100" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="120" height="80" rx="2" fill="none" stroke="#94a3b8" stroke-width="3"/><line x1="10" y1="82" x2="130" y2="82" stroke="#dc2626" stroke-width="3" stroke-linecap="round"/></svg>`,
    },
    {
      title: "Trituración de esquina",
      desc: "Aplastamiento y desprendimiento de material en una esquina del muro, por concentración de esfuerzos.",
      svg: `<svg viewBox="0 0 140 100" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="120" height="80" rx="2" fill="none" stroke="#94a3b8" stroke-width="3"/><path d="M10 55 Q4 85 32 90 L10 90 Z" fill="#fecaca" stroke="#dc2626" stroke-width="2"/></svg>`,
    },
  ],
  VIGAS: [
    {
      title: "Fisuras de flexión (centro de luz)",
      desc: "Grietas verticales cortas en la cara inferior, hacia el centro de la luz.",
      svg: `<svg viewBox="0 0 160 60" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="15" width="140" height="30" rx="2" fill="none" stroke="#94a3b8" stroke-width="3"/><line x1="70" y1="45" x2="70" y2="28" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round"/><line x1="80" y1="45" x2="80" y2="24" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round"/><line x1="90" y1="45" x2="90" y2="28" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round"/></svg>`,
    },
    {
      title: "Fisuras diagonales cerca de apoyos",
      desc: "Grietas inclinadas próximas a las columnas — típicas de falla por cortante.",
      svg: `<svg viewBox="0 0 160 60" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="15" width="140" height="30" rx="2" fill="none" stroke="#94a3b8" stroke-width="3"/><line x1="25" y1="45" x2="42" y2="15" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round"/><line x1="118" y1="45" x2="135" y2="15" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round"/></svg>`,
    },
    {
      title: "Rótula plástica en los extremos",
      desc: "Daño concentrado (fisuración intensa, aplastamiento) cerca de las conexiones — indica gran demanda de ductilidad.",
      svg: `<svg viewBox="0 0 160 60" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="15" width="140" height="30" rx="2" fill="none" stroke="#94a3b8" stroke-width="3"/><circle cx="22" cy="30" r="11" fill="#fecaca" stroke="#dc2626" stroke-width="2.5"/><circle cx="138" cy="30" r="11" fill="#fecaca" stroke="#dc2626" stroke-width="2.5"/></svg>`,
    },
  ],
  NODOS_CONEXION: [
    {
      title: "Fisuras diagonales en el nudo",
      desc: "Grietas en X en el punto de encuentro viga-columna — el nudo concentra fuerzas de varios elementos.",
      svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><rect x="45" y="10" width="30" height="100" fill="none" stroke="#94a3b8" stroke-width="3"/><rect x="10" y="45" width="100" height="30" fill="none" stroke="#94a3b8" stroke-width="3"/><line x1="50" y1="50" x2="70" y2="70" stroke="#dc2626" stroke-width="3" stroke-linecap="round"/><line x1="70" y1="50" x2="50" y2="70" stroke="#dc2626" stroke-width="3" stroke-linecap="round"/></svg>`,
    },
    {
      title: "Exposición de refuerzo en la conexión",
      desc: "Pérdida de recubrimiento en el nudo, con barras de refuerzo visibles — daño severo que compromete la conexión.",
      svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><rect x="45" y="10" width="30" height="100" fill="none" stroke="#94a3b8" stroke-width="3"/><rect x="10" y="45" width="100" height="30" fill="none" stroke="#94a3b8" stroke-width="3"/><path d="M48 46 Q60 36 72 46" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round"/><circle cx="60" cy="60" r="3.5" fill="#dc2626"/></svg>`,
    },
  ],
  RIOSTRAS: [
    {
      title: "Pandeo de la riostra",
      desc: "Deformación curva fuera del plano por compresión — típica en riostras de acero esbeltas.",
      svg: `<svg viewBox="0 0 140 100" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="84" width="120" height="8" fill="none" stroke="#94a3b8" stroke-width="2"/><rect x="10" y="10" width="8" height="82" fill="none" stroke="#94a3b8" stroke-width="2"/><rect x="122" y="10" width="8" height="82" fill="none" stroke="#94a3b8" stroke-width="2"/><path d="M18 84 Q75 45 58 18 Q80 48 122 14" fill="none" stroke="#dc2626" stroke-width="3" stroke-linecap="round"/></svg>`,
    },
    {
      title: "Fractura en la conexión",
      desc: "Rotura en el punto de anclaje de la riostra — pérdida total de su capacidad de arriostramiento.",
      svg: `<svg viewBox="0 0 140 100" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="84" width="120" height="8" fill="none" stroke="#94a3b8" stroke-width="2"/><line x1="18" y1="87" x2="112" y2="17" stroke="#94a3b8" stroke-width="4" stroke-linecap="round"/><circle cx="118" cy="14" r="7" fill="#fecaca" stroke="#dc2626" stroke-width="2.5"/></svg>`,
    },
  ],
  ENTREPISO: [
    {
      title: "Fisuras de flexión en la losa",
      desc: "Grietas cortas y paralelas en la cara inferior de la losa, entre apoyos.",
      svg: `<svg viewBox="0 0 160 60" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="20" width="140" height="16" rx="2" fill="none" stroke="#94a3b8" stroke-width="3"/><line x1="50" y1="36" x2="50" y2="20" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round"/><line x1="80" y1="36" x2="80" y2="17" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round"/><line x1="110" y1="36" x2="110" y2="20" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round"/></svg>`,
    },
    {
      title: "Separación losa-viga",
      desc: "Grieta continua donde la losa se une a la viga de apoyo — puede indicar pérdida de continuidad estructural.",
      svg: `<svg viewBox="0 0 160 70" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="18" width="140" height="16" rx="2" fill="none" stroke="#94a3b8" stroke-width="3"/><rect x="58" y="34" width="44" height="28" fill="none" stroke="#94a3b8" stroke-width="3"/><line x1="58" y1="34" x2="58" y2="18" stroke="#dc2626" stroke-width="2.5" stroke-dasharray="4,3" stroke-linecap="round"/><line x1="102" y1="34" x2="102" y2="18" stroke="#dc2626" stroke-width="2.5" stroke-dasharray="4,3" stroke-linecap="round"/></svg>`,
    },
  ],

  // --- Elementos no estructurales (sección 10) ------------------------------
  // Agregado en la cuarta ronda de feedback: antes solo tenían una descripción
  // de texto plano (ver `NON_STRUCTURAL_FAILURE_MODES`, ahora retirado por
  // quedar redundante). Los 4 modos de falla generales de elementos no
  // estructurales según la guía de referencia — CAÍDA, VOLCAMIENTO,
  // DESLIZAMIENTO, VAIVÉN o BALANCEO — se concretan aquí en 2-3 patrones
  // visuales específicos por elemento, con el mismo estilo de dibujo de línea
  // que las secciones estructurales de arriba.
  MUROS_FACHADA_ANTEPECHOS: [
    {
      title: "Volcamiento del antepecho hacia el exterior",
      desc: "Giro fuera del plano de un antepecho o remate de fachada no arriostrado — riesgo de caída a la vía pública.",
      svg: `<svg viewBox="0 0 140 100" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="80" width="120" height="10" fill="none" stroke="#94a3b8" stroke-width="2"/><rect x="30" y="10" width="14" height="70" fill="none" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="3,3"/><g transform="rotate(18 30 80)"><rect x="30" y="10" width="14" height="70" fill="#fecaca" stroke="#dc2626" stroke-width="2.5"/></g></svg>`,
    },
    {
      title: "Fisuras diagonales en el antepecho",
      desc: "Grietas en X por interacción con la estructura principal durante el sacudimiento.",
      svg: `<svg viewBox="0 0 140 70" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="120" height="50" rx="2" fill="none" stroke="#94a3b8" stroke-width="3"/><line x1="22" y1="18" x2="118" y2="52" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round"/><line x1="118" y1="18" x2="22" y2="52" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round"/></svg>`,
    },
    {
      title: "Caída parcial de mampostería no confinada",
      desc: "Desprendimiento de una sección de fachada sin confinamiento adecuado.",
      svg: `<svg viewBox="0 0 140 100" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="120" height="80" fill="none" stroke="#94a3b8" stroke-width="3"/><path d="M85 10 L130 10 L130 40 Q100 45 85 10 Z" fill="#fecaca" stroke="#dc2626" stroke-width="2"/><line x1="95" y1="55" x2="100" y2="65" stroke="#dc2626" stroke-width="2" stroke-linecap="round"/><line x1="108" y1="58" x2="112" y2="70" stroke="#dc2626" stroke-width="2" stroke-linecap="round"/></svg>`,
    },
  ],
  MUROS_DIVISORIOS: [
    {
      title: "Fisuras en X por interacción con el pórtico",
      desc: "Grietas cruzadas por el efecto de pórtico rígido: el muro divisorio restringe la deformación de la estructura principal.",
      svg: `<svg viewBox="0 0 140 100" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="120" height="80" rx="2" fill="none" stroke="#94a3b8" stroke-width="3"/><line x1="22" y1="22" x2="118" y2="78" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round"/><line x1="118" y1="22" x2="22" y2="78" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round"/></svg>`,
    },
    {
      title: "Separación en el remate superior",
      desc: "Grieta horizontal continua donde el muro divisorio se une a la estructura, por falta de junta de aislamiento.",
      svg: `<svg viewBox="0 0 140 100" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="120" height="16" fill="none" stroke="#94a3b8" stroke-width="3"/><rect x="20" y="30" width="100" height="60" fill="none" stroke="#94a3b8" stroke-width="3"/><line x1="20" y1="28" x2="120" y2="28" stroke="#dc2626" stroke-width="3" stroke-dasharray="5,3" stroke-linecap="round"/></svg>`,
    },
    {
      title: "Fisura vertical en el encuentro con la columna",
      desc: "Grieta vertical en el borde donde el muro divisorio se apoya contra un elemento estructural.",
      svg: `<svg viewBox="0 0 140 100" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="18" height="80" fill="none" stroke="#94a3b8" stroke-width="3"/><rect x="28" y="10" width="102" height="80" fill="none" stroke="#94a3b8" stroke-width="2"/><line x1="28" y1="14" x2="28" y2="86" stroke="#dc2626" stroke-width="3" stroke-dasharray="2,3" stroke-linecap="round"/></svg>`,
    },
  ],
  VENTANALES_VIDRIOS_FACHADA: [
    {
      title: "Fractura por deformación del marco (efecto diamante)",
      desc: "El marco se deforma en paralelogramo por la deriva de piso y fractura el vidrio.",
      svg: `<svg viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="100" height="80" fill="none" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="3,3"/><polygon points="25,10 120,10 105,90 10,90" fill="#eff6ff" stroke="#dc2626" stroke-width="2.5"/><line x1="35" y1="20" x2="95" y2="80" stroke="#dc2626" stroke-width="1.5"/><line x1="90" y1="18" x2="30" y2="82" stroke="#dc2626" stroke-width="1.5"/></svg>`,
    },
    {
      title: "Desprendimiento del marco",
      desc: "El marco de la ventana se suelta de su anclaje — riesgo de caída del conjunto.",
      svg: `<svg viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="100" height="80" fill="none" stroke="#94a3b8" stroke-width="2"/><rect x="18" y="18" width="84" height="64" fill="#eff6ff" stroke="#64748b" stroke-width="1.5"/><path d="M85 18 L102 18 L102 35" fill="none" stroke="#dc2626" stroke-width="3" stroke-linecap="round" stroke-dasharray="4,3"/><path d="M100 40 l6 6 m0 -6 l-6 6" stroke="#dc2626" stroke-width="2" stroke-linecap="round"/></svg>`,
    },
    {
      title: "Vidrio fracturado (fragmentos sueltos)",
      desc: "Rotura del panel de vidrio por impacto de escombros o deformación excesiva.",
      svg: `<svg viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="100" height="80" fill="#eff6ff" stroke="#94a3b8" stroke-width="2"/><path d="M60 50 L20 20 M60 50 L100 15 M60 50 L15 70 M60 50 L105 75 M60 50 L60 95 M60 50 L30 90" stroke="#dc2626" stroke-width="1.3" stroke-linecap="round"/></svg>`,
    },
  ],
  CIELO_RASO_LUMINARIAS: [
    {
      title: "Caída parcial del cielo raso",
      desc: "Un tramo del cielo raso se desprende de su estructura de soporte.",
      svg: `<svg viewBox="0 0 140 90" xmlns="http://www.w3.org/2000/svg"><line x1="10" y1="14" x2="130" y2="14" stroke="#94a3b8" stroke-width="3"/><rect x="15" y="16" width="45" height="6" fill="none" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="3,3"/><path d="M65 14 L110 14 L100 60 L75 60 Z" fill="#fecaca" stroke="#dc2626" stroke-width="2.5"/></svg>`,
    },
    {
      title: "Caída de luminaria por anclaje deficiente",
      desc: "Luminaria colgante suelta o caída por sujeción insuficiente ante el sacudimiento.",
      svg: `<svg viewBox="0 0 140 90" xmlns="http://www.w3.org/2000/svg"><line x1="10" y1="14" x2="130" y2="14" stroke="#94a3b8" stroke-width="3"/><line x1="70" y1="14" x2="70" y2="26" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="2,3"/><path d="M68 26 l4 6 m-4 0 l4 -6" stroke="#dc2626" stroke-width="2" stroke-linecap="round"/><rect x="55" y="60" width="30" height="10" rx="2" fill="#fecaca" stroke="#dc2626" stroke-width="2"/></svg>`,
    },
  ],
  CUBIERTAS: [
    {
      title: "Desplazamiento o caída de tejas",
      desc: "Piezas de cubierta desplazadas o faltantes tras el evento.",
      svg: `<svg viewBox="0 0 150 90" xmlns="http://www.w3.org/2000/svg"><path d="M10 80 L75 15 L140 80 Z" fill="none" stroke="#94a3b8" stroke-width="2.5"/><path d="M25 80 q6 -8 12 0 M45 80 q6 -8 12 0 M95 80 q6 -8 12 0 M115 80 q6 -8 12 0" stroke="#94a3b8" stroke-width="1.5" fill="none"/><rect x="60" y="55" width="16" height="14" fill="#fecaca" stroke="#dc2626" stroke-width="2"/></svg>`,
    },
    {
      title: "Deformación de la cercha de soporte",
      desc: "Pandeo o hundimiento visible en la estructura de soporte de la cubierta.",
      svg: `<svg viewBox="0 0 150 90" xmlns="http://www.w3.org/2000/svg"><path d="M10 75 L75 20 L140 75 Z" fill="none" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="3,3"/><path d="M10 75 L70 32 L140 75" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round"/><line x1="10" y1="75" x2="140" y2="75" stroke="#94a3b8" stroke-width="2"/></svg>`,
    },
  ],
  ESCALERAS: [
    {
      title: "Fisura en el apoyo con la losa",
      desc: "Grieta en el punto donde la escalera se apoya sobre la losa de piso.",
      svg: `<svg viewBox="0 0 140 100" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="30" height="14" fill="none" stroke="#94a3b8" stroke-width="2.5"/><path d="M40 24 L60 24 L60 40 L80 40 L80 56 L100 56 L100 72 L120 72 L120 88" fill="none" stroke="#94a3b8" stroke-width="3" stroke-linecap="round"/><line x1="40" y1="20" x2="40" y2="30" stroke="#dc2626" stroke-width="3" stroke-dasharray="2,2" stroke-linecap="round"/></svg>`,
    },
    {
      title: "Separación entre tramos (efecto de golpeteo)",
      desc: "Impacto entre tramos de escalera por deformaciones distintas entre pisos consecutivos.",
      svg: `<svg viewBox="0 0 140 100" xmlns="http://www.w3.org/2000/svg"><path d="M10 88 L40 88 L40 70 L60 70 L60 52 L65 52" fill="none" stroke="#94a3b8" stroke-width="3" stroke-linecap="round"/><path d="M78 52 L82 52 L82 34 L102 34 L102 16 L130 16" fill="none" stroke="#94a3b8" stroke-width="3" stroke-linecap="round"/><path d="M65 52 l6 8 m0 -8 l-6 8" stroke="#dc2626" stroke-width="2" stroke-linecap="round"/><path d="M78 44 l6 8 m0 -8 l-6 8" stroke="#dc2626" stroke-width="2" stroke-linecap="round"/></svg>`,
    },
  ],
  ASCENSORES: [
    {
      title: "Desalineación de rieles de guía",
      desc: "Deformación u obstrucción del riel del ascensor por el movimiento de la caja de escaleras.",
      svg: `<svg viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg"><rect x="15" y="10" width="70" height="110" fill="none" stroke="#94a3b8" stroke-width="2.5"/><line x1="30" y1="10" x2="30" y2="120" stroke="#94a3b8" stroke-width="2" stroke-dasharray="3,3"/><path d="M70 10 L70 55 L82 65 L70 75 L70 120" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round"/></svg>`,
    },
    {
      title: "Daño en el cuarto de máquinas",
      desc: "Fisuras o daño visible en la estructura del cuarto de máquinas del ascensor.",
      svg: `<svg viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg"><rect x="15" y="40" width="70" height="80" fill="none" stroke="#94a3b8" stroke-width="2"/><rect x="20" y="10" width="60" height="28" fill="#fecaca" stroke="#dc2626" stroke-width="2.5"/><line x1="30" y1="14" x2="48" y2="34" stroke="#7f1d1d" stroke-width="1.5"/></svg>`,
    },
  ],
  BALCONES: [
    {
      title: "Fisuras en el empotramiento del voladizo",
      desc: "Grietas en el punto donde el balcón se empotra al muro o pórtico — indicio de pérdida de anclaje.",
      svg: `<svg viewBox="0 0 140 90" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="16" height="80" fill="none" stroke="#94a3b8" stroke-width="3"/><rect x="26" y="45" width="95" height="12" fill="none" stroke="#94a3b8" stroke-width="2.5"/><line x1="26" y1="43" x2="26" y2="59" stroke="#dc2626" stroke-width="3" stroke-linecap="round"/><line x1="33" y1="43" x2="33" y2="59" stroke="#dc2626" stroke-width="2" stroke-linecap="round"/></svg>`,
    },
    {
      title: "Inclinación / riesgo de colapso del voladizo",
      desc: "El balcón se inclina de forma visible respecto a su posición original — riesgo de colapso.",
      svg: `<svg viewBox="0 0 140 90" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="16" height="80" fill="none" stroke="#94a3b8" stroke-width="3"/><rect x="20" y="45" width="90" height="10" fill="none" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="3,3"/><g transform="rotate(14 26 51)"><rect x="26" y="46" width="90" height="10" fill="#fecaca" stroke="#dc2626" stroke-width="2.5"/></g></svg>`,
    },
  ],
  TANQUES_ELEVADOS: [
    {
      title: "Volcamiento por efecto de péndulo invertido",
      desc: "El tanque elevado oscila y se inclina sobre su estructura de soporte — típico de masas concentradas en altura.",
      svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><line x1="20" y1="100" x2="35" y2="40" stroke="#94a3b8" stroke-width="3" stroke-linecap="round"/><line x1="100" y1="100" x2="85" y2="40" stroke="#94a3b8" stroke-width="3" stroke-linecap="round"/><line x1="10" y1="105" x2="110" y2="105" stroke="#94a3b8" stroke-width="2"/><g transform="rotate(-16 60 40)"><rect x="30" y="10" width="60" height="34" rx="4" fill="#fecaca" stroke="#dc2626" stroke-width="2.5"/></g></svg>`,
    },
    {
      title: "Falla de las columnas de soporte",
      desc: "Pandeo o rotura de una o varias de las columnas que sostienen el tanque.",
      svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><rect x="25" y="10" width="70" height="34" rx="4" fill="none" stroke="#94a3b8" stroke-width="2.5"/><line x1="10" y1="105" x2="110" y2="105" stroke="#94a3b8" stroke-width="2"/><path d="M32 44 L28 75 L38 80 L26 105" stroke="#dc2626" stroke-width="2.5" fill="none" stroke-linecap="round"/><line x1="90" y1="44" x2="94" y2="105" stroke="#94a3b8" stroke-width="3" stroke-linecap="round"/></svg>`,
    },
  ],
  INSTALACIONES_GAS: [
    {
      title: "Ruptura en una junta o codo",
      desc: "Fuga por rotura de tubería rígida en un cambio de dirección — riesgo de incendio o explosión.",
      svg: `<svg viewBox="0 0 140 90" xmlns="http://www.w3.org/2000/svg"><path d="M10 30 L60 30 L60 70 L90 70" fill="none" stroke="#94a3b8" stroke-width="5" stroke-linecap="round"/><path d="M90 70 L130 70" fill="none" stroke="#dc2626" stroke-width="5" stroke-linecap="round" stroke-dasharray="1,9"/><circle cx="95" cy="72" r="3" fill="#dc2626"/><circle cx="105" cy="66" r="2" fill="#dc2626"/><circle cx="112" cy="76" r="2.2" fill="#dc2626"/></svg>`,
    },
    {
      title: "Desalineación por asentamiento del terreno",
      desc: "La tubería pierde continuidad por un asentamiento diferencial cercano.",
      svg: `<svg viewBox="0 0 140 90" xmlns="http://www.w3.org/2000/svg"><path d="M10 30 L65 30" stroke="#94a3b8" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M65 55 L130 55" stroke="#94a3b8" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M65 30 L65 55" stroke="#dc2626" stroke-width="3" stroke-dasharray="2,3" stroke-linecap="round"/></svg>`,
    },
  ],
  INSTALACIONES_ELECTRICAS: [
    {
      title: "Cables expuestos o colgantes",
      desc: "Canalización dañada con cables sueltos a la vista — riesgo de electrocución o incendio.",
      svg: `<svg viewBox="0 0 130 90" xmlns="http://www.w3.org/2000/svg"><rect x="15" y="10" width="45" height="30" rx="2" fill="none" stroke="#94a3b8" stroke-width="2.5"/><path d="M35 40 q-4 20 2 30 M45 40 q6 18 -2 32" stroke="#dc2626" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="37" cy="72" r="2.5" fill="#dc2626"/><circle cx="43" cy="74" r="2.5" fill="#dc2626"/></svg>`,
    },
    {
      title: "Cortocircuito / daño en el tablero",
      desc: "Daño visible en el tablero o punto de conexión eléctrica.",
      svg: `<svg viewBox="0 0 130 90" xmlns="http://www.w3.org/2000/svg"><rect x="30" y="14" width="70" height="55" rx="2" fill="none" stroke="#94a3b8" stroke-width="2.5"/><path d="M70 22 L55 48 L68 48 L58 66 L85 38 L70 38 Z" fill="#fde68a" stroke="#dc2626" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
    },
  ],
  ACUEDUCTO_ALCANTARILLADO: [
    {
      title: "Ruptura por asentamiento diferencial",
      desc: "La tubería de acueducto o alcantarillado se rompe por un asentamiento diferencial del terreno.",
      svg: `<svg viewBox="0 0 140 90" xmlns="http://www.w3.org/2000/svg"><line x1="10" y1="32" x2="130" y2="32" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="3,3"/><path d="M15 55 L65 55" stroke="#94a3b8" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M65 68 L125 68" stroke="#94a3b8" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M65 55 L65 68" stroke="#dc2626" stroke-width="3" stroke-dasharray="2,3" stroke-linecap="round"/></svg>`,
    },
    {
      title: "Filtración visible / encharcamiento",
      desc: "Fuga de agua con encharcamiento en superficie — indicio de rotura bajo el nivel del piso.",
      svg: `<svg viewBox="0 0 140 90" xmlns="http://www.w3.org/2000/svg"><path d="M15 30 L125 30" stroke="#94a3b8" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M65 33 q-3 10 0 16" stroke="#2563eb" stroke-width="2" fill="none" stroke-linecap="round"/><ellipse cx="66" cy="66" rx="30" ry="8" fill="#bfdbfe" stroke="#2563eb" stroke-width="1.5"/></svg>`,
    },
  ],
};

window.PATHOLOGY_GUIDE = PATHOLOGY_GUIDE;
