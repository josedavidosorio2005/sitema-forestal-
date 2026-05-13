# Sistema Forestal Android

Version Android lista para abrir en Android Studio. Esta app usa el mismo frontend del sistema forestal: mapa, dibujo de zonas, subzonas, especies, reportes y CRUD.

Por defecto funciona en modo `local-first`: guarda zonas, subzonas, especies y reportes directamente en el almacenamiento del dispositivo, sin depender de que el backend este encendido. Esto permite pasar el APK al cliente y probarlo como app movil.

## Estructura

- `src/`: app React adaptada para WebView Android.
- `android/`: proyecto nativo generado por Capacitor para Android Studio.
- `.env`: apunta al backend local desde el emulador con `http://10.0.2.2:5000/api`.
- `REACT_APP_STORAGE_MODE=local-first`: activa guardado local persistente en el dispositivo.
- `build-debug-apk.bat`: compila el APK debug.
- `open-android-studio.bat`: sincroniza assets y abre Android Studio.
- `start-backend-emulator.bat`: inicia la API local con CORS compatible con Capacitor.

## Probar en Android Studio

1. Abre una terminal en esta carpeta.
2. Abre el proyecto Android:

```bat
open-android-studio.bat
```

3. En Android Studio abre el emulador y ejecuta la app.

La app guardara datos en el dispositivo aunque la API no este corriendo.

## Probar con backend local opcional

El modo local no necesita backend. Si quieres probar conectado a la API Express, cambia `.env`:

```text
REACT_APP_STORAGE_MODE=api-first
```

Luego inicia la API para el emulador:

```bat
start-backend-emulator.bat
```

En otra terminal sincroniza Android:

```bat
npm run android:sync
```

## Compilar APK debug

```bat
build-debug-apk.bat
```

APK generado:

```text
android\app\build\outputs\apk\debug\app-debug.apk
```

## Probar en celular fisico

El emulador usa `10.0.2.2` para entrar al backend de tu PC. En un celular real cambia `.env`:

```text
REACT_APP_API_URL=http://IP_DEL_PC:5000/api
```

Luego ejecuta:

```bat
npm run android:sync
```

El PC y el celular deben estar en la misma red Wi-Fi.
