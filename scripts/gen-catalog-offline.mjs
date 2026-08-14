// Genera www/catalog-offline.json a partir de `getFullCatalog()`, la MISMA
// función que usa el servidor de la app web para servir GET /api/catalog
// (D:\Claude\Inspección Estructural\src\domain\catalog.ts) -- así este
// archivo nunca puede quedar desincronizado a mano de lo que la app web
// realmente devuelve.
//
// Por qué hace falta: el catálogo (tipos de amenaza, usos de edificación,
// elementos estructurales, etc.) es una lista ESTÁTICA que no depende de
// ninguna inspección en particular. Dentro del APK, si no hay ninguna
// conexión, `GET /api/catalog` falla -- y sin este respaldo, `loadAll()`
// (inspection.html) caía a un catálogo vacío, dejando el wizard sin ninguna
// opción para elegir (bug real detectado en campo: sin señal, la app
// "se bloqueaba" -- ver docs/ANALISIS-Y-ARQUITECTURA.md). Este archivo se
// sirve como un asset local más (NO pasa por /api/, así que
// native-shim.js no lo reescribe hacia el backend remoto), y `loadAll()`
// lo intenta como segundo respaldo antes de rendirse al catálogo vacío.
//
// Se corre con `tsx` (devDependency de este proyecto) porque importa
// directamente el archivo .ts fuente del repo web -- sin eso hacen falta
// pasos de compilación que este proyecto no tiene motivo para duplicar.
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");
const WWW_DIR = join(PROJECT_ROOT, "www");
const CATALOG_TS_PATH = "D:\\Claude\\Inspección Estructural\\src\\domain\\catalog.ts";

const { getFullCatalog } = await import(pathToFileURL(CATALOG_TS_PATH).href);

mkdirSync(WWW_DIR, { recursive: true });
const catalog = getFullCatalog();
const json = JSON.stringify(catalog);
writeFileSync(join(WWW_DIR, "catalog-offline.json"), json, "utf-8");
console.log(`catalog-offline.json generado: ${Object.keys(catalog).length} secciones, ${json.length} bytes.`);
