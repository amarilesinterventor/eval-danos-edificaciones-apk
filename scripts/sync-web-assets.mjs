// Copia public/ de la herramienta web (D:\Claude\Inspección Estructural) hacia
// www/ de este proyecto Capacitor, SIN modificar ni un solo archivo del
// repositorio web original — este script solo LEE de ahí y ESCRIBE aquí.
//
// Además del copiado, inyecta el "cascarón nativo" (ver native-shim.js): un
// archivo nuevo, que no existe en el repo web, con un <script> agregado al
// INICIO de cada HTML copiado (antes de offline.js/app.js). Ese shim redirige
// las llamadas relativas /api/... y /uploads/... hacia el backend real
// (https://eval-danos-edificaciones.onrender.com) solo cuando la app corre
// empaquetada dentro de Capacitor — en el navegador normal no hace nada, así
// que el comportamiento de la web desplegada no cambia en absoluto.
//
// Requisito: correr `npm run build:css` al menos una vez en el repo web
// (D:\Claude\Inspección Estructural) antes de este script, para que
// public/styles.css exista en disco (ese archivo no se versiona en el repo
// web -- se genera con Tailwind CLI -- pero si ya se corrió el build local
// para desplegar, ya está ahí).
import { existsSync, mkdirSync, readdirSync, statSync, copyFileSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");
const WEB_PUBLIC = "D:\\Claude\\Inspección Estructural\\public";
const WWW_DIR = join(PROJECT_ROOT, "www");

// Carpetas del repo web que NO deben empaquetarse en el APK: fotos reales de
// pruebas locales (nunca deben viajar dentro de un instalable distribuido).
const EXCLUDE_DIRS = new Set(["uploads"]);

if (!existsSync(WEB_PUBLIC)) {
  console.error(`No se encontró la carpeta de la app web en: ${WEB_PUBLIC}`);
  process.exit(1);
}
if (!existsSync(join(WEB_PUBLIC, "styles.css"))) {
  console.error(
    "Falta public/styles.css en la app web -- corre `npm run build:css` (o `npm run build`) en\n" +
      "D:\\Claude\\Inspección Estructural antes de sincronizar, así este script encuentra el CSS compilado.",
  );
  process.exit(1);
}

function copyDir(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    if (EXCLUDE_DIRS.has(entry)) continue;
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    if (statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

// www/ se regenera completa en cada corrida -- evita que queden copias
// viejas de archivos que ya se borraron en public/.
rmSync(WWW_DIR, { recursive: true, force: true });
copyDir(WEB_PUBLIC, WWW_DIR);
console.log(`Copiado: ${WEB_PUBLIC} -> ${WWW_DIR}`);

// Copia el shim (vive solo en este proyecto, ver native-shim.js) a www/.
copyFileSync(join(PROJECT_ROOT, "native-shim.js"), join(WWW_DIR, "native-shim.js"));

// Inyecta <script src="/native-shim.js"></script> como el PRIMER script de
// cada HTML de entrada -- solo en la copia dentro de www/, nunca en el
// original. Idempotente: si ya está inyectado (por una corrida anterior de
// este mismo script sobre una www/ que no se hubiera borrado), no lo duplica.
const ENTRY_HTML_FILES = ["index.html", "inspections.html", "inspection.html"];
for (const file of ENTRY_HTML_FILES) {
  const path = join(WWW_DIR, file);
  if (!existsSync(path)) {
    console.warn(`Aviso: no se encontró ${file} en www/ -- se omite la inyección del shim ahí.`);
    continue;
  }
  let html = readFileSync(path, "utf-8");
  // OJO: se busca la ETIQUETA <script> exacta, no solo el nombre del archivo
  // como texto suelto -- bug real encontrado: `inspection.html` tiene un
  // comentario que MENCIONA "native-shim.js" en prosa (referenciando este
  // mismo mecanismo), y un `html.includes("native-shim.js")` ingenuo
  // detectaba esa mención como si el shim ya estuviera inyectado ahí,
  // saltándose la inyección real en esa página -- exactamente la página del
  // wizard, donde más falta hacía (reescribir /api/... hacia el backend real
  // y desactivar el Service Worker).
  if (html.includes('<script src="/native-shim.js">')) continue;
  html = html.replace('<script src="/offline.js"></script>', '<script src="/native-shim.js"></script>\n  <script src="/offline.js"></script>');
  writeFileSync(path, html, "utf-8");
  console.log(`Shim inyectado en: ${file}`);
}

console.log("Sincronización completa.");
