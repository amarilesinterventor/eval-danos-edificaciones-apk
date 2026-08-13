// Compila el APK debug desde la línea de comandos, sin pasar por la interfaz
// de Android Studio. Fija JAVA_HOME al JDK 21 (Microsoft Build of OpenJDK) --
// es el que de verdad necesita este proyecto (Gradle 8.14.3 + Capacitor
// android exige un JDK que compile a "release 21"; el JBR que trae Android
// Studio por defecto en esta máquina es la v25, demasiado nueva para Gradle
// 8.14.3 -- ver README.md, sección "Solución de problemas").
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ANDROID_DIR = join(__dirname, "..", "android");
const JDK21 = "C:\\Program Files\\Microsoft\\jdk-21.0.12.8-hotspot";

if (!existsSync(JDK21)) {
  console.error(
    `No se encontró el JDK 21 en ${JDK21}.\n` +
      "Instálalo con: winget install --id Microsoft.OpenJDK.21\n" +
      "(o ajusta la constante JDK21 en este script si lo instalaste en otra ruta).",
  );
  process.exit(1);
}

const env = { ...process.env, JAVA_HOME: JDK21 };

// Un demonio de Gradle que haya quedado vivo de una corrida anterior con un
// JDK/red distintos puede quedar con una resolución de DNS en caché (se vio
// exactamente este síntoma al compilar por primera vez: "Unknown host
// repo.maven.apache.org" incluso con la red funcionando bien) -- se detiene
// primero para garantizar un demonio nuevo y limpio en cada build.
// Se pasa el comando ya armado como una sola cadena (no args[] + shell:true)
// para evitar la advertencia de Node sobre concatenación sin escapar -- acá
// no hace falta escapar nada porque no hay entrada externa/variable, pero es
// la forma correcta de invocar un .bat en Windows de todos modos.
console.log("Deteniendo demonios de Gradle previos...");
spawnSync(`"${join(ANDROID_DIR, "gradlew.bat")}" --stop`, { cwd: ANDROID_DIR, env, stdio: "inherit", shell: true });

console.log("Compilando APK debug...");
const result = spawnSync(`"${join(ANDROID_DIR, "gradlew.bat")}" assembleDebug`, { cwd: ANDROID_DIR, env, stdio: "inherit", shell: true });

if (result.status !== 0) {
  console.error("\nLa compilación falló -- revisa el log de arriba.");
  process.exit(result.status ?? 1);
}

const apkPath = join(ANDROID_DIR, "app", "build", "outputs", "apk", "debug", "app-debug.apk");
console.log(`\nListo: ${apkPath}`);
