@echo off
setlocal

if exist "C:\Program Files\Android\Android Studio\jbr\bin\java.exe" (
  set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
)

if exist "%LOCALAPPDATA%\Android\Sdk" (
  set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
  set "ANDROID_SDK_ROOT=%LOCALAPPDATA%\Android\Sdk"
)

call npm run android:sync
if errorlevel 1 exit /b %errorlevel%

pushd android
call gradlew.bat assembleDebug
set "EXIT_CODE=%ERRORLEVEL%"
popd

if not "%EXIT_CODE%"=="0" exit /b %EXIT_CODE%

echo.
echo APK listo:
echo %CD%\android\app\build\outputs\apk\debug\app-debug.apk

