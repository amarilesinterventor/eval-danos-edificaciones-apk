# App nativa (Android + iOS) — Herramienta de Evaluación Rápida de Daños en Edificaciones

Empaque nativo (vía [Capacitor](https://capacitorjs.com)) de la app web que vive en
`D:\Claude\Inspección Estructural`. **Este proyecto en sí no modifica esa carpeta** — solo lee sus
archivos y produce, aquí, instalables Android (`android/`) e iOS (`ios/`) independientes, a partir del
mismo `www/` sincronizado y el mismo `native-shim.js`. La única excepción: al probar el APK en un
dispositivo real se encontró un bug genuino en `inspection.html` (compartido con la web, no introducido
por este empaque — ver "Solución de problemas" más abajo), que sí se corrigió directamente ahí con
autorización explícita del usuario, porque es un arreglo real de la app, no una adaptación al empaque.

## Por qué existe este proyecto

La app web ya es una PWA con soporte offline (service worker + cola de sincronización en IndexedDB — ver
`docs/ANALISIS-Y-ARQUITECTURA.md` del repo web). Eso funciona bien *después* de instalarla una vez con
señal. Este proyecto va un paso más allá para el caso de campo real (sismo, sin señal estable): produce un
**APK que trae la app empaquetada por dentro** — funciona sin ninguna conexión ni siquiera en el primer
arranque (no hace falta descargar nada de internet para instalarlo ni para abrirlo la primera vez). Solo
necesita señal para **sincronizar** los datos capturados con el servidor — exactamente la misma cola de
sincronización que ya usa la web, reutilizada tal cual.

## Cómo funciona (resumen técnico)

- `scripts/sync-web-assets.mjs` copia `public/` de la app web hacia `www/` de este proyecto (excluyendo
  `uploads/`, que son fotos reales de pruebas locales — nunca deben viajar dentro de un instalable).
- `native-shim.js` (archivo nuevo, solo existe aquí) se inyecta como el primer `<script>` de cada página
  copiada. Completa las rutas relativas `/api/...` y `/uploads/...` con el origen real del backend
  (`https://eval-danos-edificaciones.onrender.com`), porque dentro del APK la página vive en un origen
  local y la API en otro.
- `capacitor.config.json` tiene `plugins.CapacitorHttp.enabled = true`: esto hace que Android enrute
  `fetch()`/`XMLHttpRequest` hacia esas URLs remotas a través de networking **nativo** en vez del `fetch`
  del WebView — evitando por completo el bloqueo de CORS del navegador, **sin tocar el servidor** de la
  app web (confirmado leyendo el código fuente de Capacitor: `Bridge.java`/`native-bridge.js` — las
  peticiones al propio origen local de la app siguen sirviéndose como antes; solo las peticiones a otro
  origen se enrutan de forma nativa).
- Todo lo demás (formulario, fotos, GPS, guía de patologías, generación de PDF) es exactamente el mismo
  código de la app web, sin cambios — Capacitor solo lo envuelve en un WebView nativo con su propio ícono,
  splash screen y proceso de instalación.

## Prerrequisitos para compilar el APK

- **[Android Studio](https://developer.android.com/studio)** (gratis) — ya instalado en esta máquina
  (`C:\Program Files\Android\Android Studio`), trae el SDK de Android.
- **JDK 21** (Microsoft Build of OpenJDK) — instalado en `C:\Program Files\Microsoft\jdk-21.0.12.8-hotspot`.
  Es el que Gradle realmente necesita aquí (ver "Solución de problemas" abajo); si hace falta reinstalarlo:
  `winget install --id Microsoft.OpenJDK.21`.
- Node.js (ya lo tienes, es lo que se usó para generar este proyecto).

## Cómo compilar el APK

**Opción rápida (línea de comandos, recomendada)** — un solo comando, no necesita abrir Android Studio:

```bash
cd "D:\Claude\eval-danos-edificaciones-apk"
npm run build-apk
```

Sincroniza la web más reciente, detiene cualquier demonio de Gradle viejo y compila. Al terminar, el APK
queda en `android/app/build/outputs/apk/debug/app-debug.apk` — listo para copiar a cualquier celular
Android (USB, WhatsApp, Drive, etc.) e instalar directamente (activando "Instalar apps de orígenes
desconocidos" la primera vez, ya que no viene de Play Store).

**Opción con interfaz gráfica (para depurar visualmente o correr en un emulador)**:

```bash
npm run prepare-android   # vuelve a copiar la web + sincroniza el proyecto Android
npm run open-android      # abre el proyecto en Android Studio
```

La **primera vez** que abras el proyecto en Android Studio hace falta apuntar Gradle al JDK 21 (ver
"Solución de problemas" → "Incompatible Gradle JVM version" más abajo) — después de eso, Build → Build
Bundle(s)/APK(s) → Build APK(s) funciona normal, o el botón ▶ Run para probar en un dispositivo/emulador
conectado.

Para publicarlo en Play Store más adelante hace falta generar un APK/AAB **firmado** (Build → Generate
Signed Bundle / APK) y una cuenta de desarrollador de Google (pago único de USD 25) — no es necesario para
repartir el APK directamente a los inspectores.

## iOS — por qué es distinto a Android

Apple **exige una Mac con Xcode** para compilar y firmar cualquier app iOS — no hay forma de hacerlo desde
Windows, con Capacitor ni con ninguna otra herramienta. Como esta máquina no tiene Mac, la plataforma iOS
de este proyecto (`ios/`) está lista (código, íconos, splash, permisos), pero la compilación real ocurre
en un servicio de compilación en la nube: **[Codemagic](https://codemagic.io)**, usando el archivo
[`codemagic.yaml`](codemagic.yaml) ya incluido acá.

Dos cosas que **tienes que hacer tú** (no las puedo hacer yo por ti):

1. **Crear una cuenta gratuita en Codemagic** (codemagic.io) y conectar el repositorio de GitHub de este
   proyecto (`eval-danos-edificaciones-apk`, o el nombre que le des al crearlo en GitHub).
2. Para instalar la app en un iPhone real (no solo compilarla) hace falta una **cuenta de Apple Developer
   Program de pago (USD 99/año)** — a diferencia de Android, donde el APK se instala gratis sin cuenta.
   Sin esa cuenta, igual puedes usar el workflow `ios-simulator-smoke-build` (gratis, sin cuenta de Apple)
   para confirmar que el proyecto compila correctamente, aunque el resultado solo corre en el simulador de
   iOS, no en un iPhone físico.

`codemagic.yaml` ya trae dos workflows:

- **`ios-simulator-smoke-build`** — gratis, sin firma de código, sin cuenta de Apple Developer. Compila
  para el simulador de iOS. Úsalo primero para validar que todo compila antes de gastar en la cuenta de
  Apple.
- **`ios-device-build`** — genera un `.ipa` instalable en iPhones reales / TestFlight. Requiere haber
  conectado tu cuenta de Apple Developer Program en Codemagic (Team settings → Integrations → App Store
  Connect) — la primera vez, es más confiable configurar la firma de código desde el asistente de Codemagic
  (Workflow editor → Code signing → iOS) que Codemagic ajusta automáticamente, en vez de confiar
  ciegamente en el YAML de acá.

**Importante — `www/` sí se versiona en este proyecto** (a diferencia de la mayoría de proyectos
Capacitor, donde es una carpeta generada e ignorada por git): es la única forma de que Codemagic tenga la
app web disponible, porque la máquina en la nube no puede leer
`D:\Claude\Inspección Estructural\public` de este equipo. Cada vez que la app web cambie, hay que correr
`npm run sync-web` acá, comitear los cambios de `www/`, y recién ahí hacer push — ver "Cuando la app web
cambie" más abajo.

## Solución de problemas (lo que se resolvió al compilar por primera vez aquí)

- **"Incompatible Gradle JVM version... Gradle version 8.14.3 is incompatible with the Gradle JVM version
  25"**: el JBR que trae Android Studio en esta máquina es la versión 25, demasiado nueva para Gradle
  8.14.3. Y **"Failed to download JDK"** al intentar el auto-fix: el host de descarga de JetBrains
  (`d2xrhe97vsfxuc.cloudfront.net`) no resuelve en esta red, aunque el resto de internet sí funciona. La
  solución que funcionó fue instalar un JDK 21 aparte (`winget install --id Microsoft.OpenJDK.21`, mismo
  canal que sí funcionó para instalar Android Studio) y, en Android Studio, **File → Settings → Build,
  Execution, Deployment → Build Tools → Gradle → Gradle JDK → Add JDK...** apuntando a
  `C:\Program Files\Microsoft\jdk-21.0.12.8-hotspot`. Nota: se probó primero con JDK 17, pero
  `capacitor-android` exige compilar contra "release 21" (`error: invalid source release: 21`) — hace
  falta 21, no alcanza con 17.
- **"Unknown host 'repo.maven.apache.org'"** aunque la red funciona bien (confirmado con `curl`/`nslookup`)
  y no hay ningún proxy configurado (ni en Android Studio ni en `gradle.properties`): un demonio de Gradle
  que quedó vivo de un intento anterior (con otro JDK/config) puede quedar con una resolución DNS en caché.
  Se resuelve deteniéndolo: `./gradlew.bat --stop` desde `android/`, y volviendo a sincronizar/compilar
  (esto es exactamente lo que hace `npm run build-apk` antes de cada compilación, para no volver a
  tropezar con esto).
- **Guardas un paso del wizard y el siguiente paso no refleja el cambio** (severidad no se marca, botón
  "+ Detalle con foto" no aparece, fotos no se ven aunque sí quedan subidas): tuvo **dos causas distintas**,
  encontradas en dos rondas de depuración con `adb logcat`:
  1. Un bug real en `inspection.html` (`loadAll()` sin manejo de error alrededor de la carga del catálogo),
     que interrumpía en silencio la cadena guardar→recargar→redibujar. Se corrigió directamente en el repo
     web (con autorización del usuario) — ver
     `D:\Claude\Inspección Estructural\docs\ANALISIS-Y-ARQUITECTURA.md` §12.
  2. **El Service Worker interfiriendo dentro del APK.** `app.js` registra `/sw.js` en cada carga de
     página — correcto en la PWA web, pero dentro del APK ese Service Worker también se activa y, en
     cuanto toma control de la página (casi instantáneo, y persiste entre instalaciones tipo
     "Actualizar" porque Android conserva el almacenamiento del WebView), intercepta TODAS las peticiones
     GET — incluidas las que `native-shim.js` reescribe hacia el backend real. El `fetch()` que corre
     dentro de un Service Worker es un contexto de JS aparte que Capacitor no parcha, así que esas
     peticiones quedan otra vez sujetas al bloqueo CORS que CapacitorHttp existe para evitar, y fallan o
     devuelven datos obsoletos en silencio. Evidencia en `adb logcat`: todos los PUT/POST/PATCH (que el
     Service Worker no toca) tenían éxito con datos correctos, pero en una sesión completa de prueba solo
     UNA petición GET (la primerísima, al abrir la app) llegó a pasar por el puente nativo — ninguna
     recarga posterior, ni una vez. Corregido en `native-shim.js`: desregistra cualquier Service Worker
     activo y anula `navigator.serviceWorker.register` en cuanto detecta que corre dentro del APK, además
     de limpiar el Cache Storage. Por la persistencia de almacenamiento entre instalaciones "Actualizar",
     tras este cambio conviene **desinstalar la app del celular antes de reinstalar** el APK nuevo, para
     no depender de que el Service Worker viejo suelte el control a mitad de sesión.

  Si vuelve a aparecer algo parecido, `adb logcat -v time "Capacitor:V" "Capacitor/Console:V" "*:S"`
  conectado al celular por USB es la forma más rápida de ver exactamente qué está pasando (incluye las
  respuestas JSON reales de la API y cualquier error de JS) — presta atención a si las peticiones GET
  (`Handling CapacitorHttp request: .../_capacitor_http_interceptor_?u=...`) realmente ocurren cada vez
  que deberían, no solo las escrituras.
- **Sin conexión de verdad (no solo un error puntual) la app se veía "bloqueada" y no guardaba nada**:
  reportado en campo. Las dos correcciones anteriores resolvían fallas puntuales de red, pero nunca se
  había probado una desconexión TOTAL de principio a fin. Con eso, aparecieron dos problemas reales
  distintos, ambos corregidos directamente en el repo web (`inspection.html`) porque son bugs genuinos, no
  parches de este empaque:
  1. **El catálogo no tenía ningún respaldo local.** `loadAll()` ya no lanzaba sin capturar (corrección
     anterior), pero sin red el catálogo caía a un stub vacío -- el wizard se quedaba sin ninguna opción
     para elegir en ningún paso. Corregido con `catalog-offline.json`: un archivo estático generado por
     [`scripts/gen-catalog-offline.mjs`](scripts/gen-catalog-offline.mjs) a partir de la MISMA
     `getFullCatalog()` del servidor (nunca puede quedar desincronizado a mano), servido como asset local
     (no pasa por `/api/`, así que `native-shim.js` no lo toca) e integrado al paso `sync-web`. `loadAll()`
     lo intenta antes de rendirse al catálogo vacío.
  2. **Las escrituras se encolaban bien, pero la pantalla no lo reflejaba.** `offline.js` sí guardaba en
     IndexedDB cada PUT/POST/PATCH que fallaba por red -- eso nunca falló. El problema era que, después de
     encolar, el código siempre llamaba a `loadAll()` para refrescar la pantalla, y esa recarga (un GET)
     volvía a fallar por la misma falta de red, sin ninguna forma de "ver" la escritura recién encolada.
     Resultado: tocar una severidad o guardar un daño parecía no hacer nada, aunque el dato sí iba a
     sincronizar en cuanto volviera la señal. Corregido con actualización optimista
     (`applyElementDamageLocally`, `applyDamageRecordLocally`, `applyQueuedPhotoLocally`): el cambio se
     aplica de inmediato sobre el estado en memoria (y se recachea) antes de que `loadAll()` vuelva a
     fallar, así el respaldo que usa `loadAll()` en su recuperación ya incluye el cambio recién hecho.

  Verificado de punta a punta simulando `fetch()` fallando de verdad (`TypeError`, no un 404/501 -- un
  servidor HTTP estático simple SÍ responde a las peticiones, solo que con el código equivocado; eso NO es
  lo mismo que una desconexión real) contra los assets ya empaquetados del APK, sin ningún backend
  disponible: catálogo con datos reales, severidad marcándose, daño guardándose con descripción, todo
  visible en pantalla con el indicador "Sincronizando N…".

  **Límite real que sigue existiendo, no es un bug**: generar el informe PDF final sí necesita conexión,
  porque el PDF se arma en el servidor (`pdfkit`/`pdf-lib`), no en el celular. Los datos ya quedan
  guardados y seguros localmente mientras tanto -- solo hay que generar el informe una vez vuelva la
  señal.

## Cuando la app web cambie

Cada vez que se modifique algo en `D:\Claude\Inspección Estructural\public\` (o se corra `npm run build`
ahí), hay que volver a traer esos cambios a este proyecto:

```bash
npm run prepare-android   # Android: sincroniza www/ + actualiza el proyecto nativo
npm run prepare-ios       # iOS: lo mismo, para el proyecto ios/
```

y volver a compilar (`npm run build-apk` para Android; para iOS, comitear `www/` y hacer push dispara el
build en Codemagic — ver sección "iOS" arriba). Este proyecto nunca desincroniza al repo web *hacia atrás*
— la dirección siempre es web → app nativa, nunca al revés.

## Permisos declarados

**Android** (`android/app/src/main/AndroidManifest.xml`):

- `INTERNET` / `ACCESS_NETWORK_STATE` — sincronizar cuando haya señal.
- `ACCESS_FINE_LOCATION` / `ACCESS_COARSE_LOCATION` — botón "Obtener ubicación GPS actual" (paso 2).
- `CAMERA` — captura de fotos de daños/esquema/panorámica.

**iOS** (`ios/App/App/Info.plist`):

- `NSCameraUsageDescription` — captura de fotos de daños/esquema/panorámica.
- `NSPhotoLibraryUsageDescription` / `NSPhotoLibraryAddUsageDescription` — adjuntar/guardar fotos desde la
  galería.
- `NSLocationWhenInUseUsageDescription` — botón "Obtener ubicación GPS actual" (paso 2).

En ambas plataformas la app usa las APIs estándar del navegador (`<input type="file" capture>` y
`navigator.geolocation`, no plugins nativos de Cámara/Geolocalización de Capacitor), así que estos permisos
son los que exige el propio WebView/WKWebView para dejarlas funcionar.

## Qué NO cambia en la app web

Nada. Todo lo que hace posible este proyecto (el shim, la config de Capacitor, los permisos) vive
exclusivamente en esta carpeta. El repositorio web sigue funcionando exactamente igual, como sitio y como
PWA instalable desde el navegador.
