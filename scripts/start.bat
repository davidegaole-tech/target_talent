@echo off
rem Avvio di Talent Radar su Windows.
setlocal EnableDelayedExpansion
chcp 65001 >nul
cd /d "%~dp0\.."

if exist .env (
  for /f "usebackq eol=# tokens=1,* delims==" %%a in (".env") do set "%%a=%%b"
)
if not defined OLLAMA_URL set "OLLAMA_URL=http://localhost:11434"
if not defined QUADERNO_MODEL set "QUADERNO_MODEL=qwen3:8b"
if not defined QUADERNO_PORT set "QUADERNO_PORT=8765"

rem 1. Python >= 3.11
set "PY="
where py >nul 2>&1 && py -3 -c "import sys; sys.exit(0 if sys.version_info >= (3, 11) else 1)" >nul 2>&1 && set "PY=py -3"
if not defined PY (
  where python >nul 2>&1 && python -c "import sys; sys.exit(0 if sys.version_info >= (3, 11) else 1)" >nul 2>&1 && set "PY=python"
)
if not defined PY (
  echo Serve Python 3.11 o piu' recente. Scaricalo da https://www.python.org/downloads/
  pause & exit /b 1
)

rem 2. Ambiente virtuale e dipendenze
if not exist .venv\Scripts\python.exe (
  echo Creo l'ambiente virtuale ^(.venv^)...
  %PY% -m venv .venv || (pause & exit /b 1)
)
if not exist .venv\.installato (
  echo Installo le dipendenze...
  .venv\Scripts\python.exe -m pip install -q --upgrade pip
  .venv\Scripts\python.exe -m pip install -q -r requirements.txt || (pause & exit /b 1)
  type nul > .venv\.installato
)

rem 3. Ollama (facoltativo: senza modello l'app usa l'analisi algoritmica locale)
set "OLLAMA_OK=1"
curl -sf "%OLLAMA_URL%/api/version" >nul 2>&1
if errorlevel 1 (
  set "OLLAMA_OK=0"
  echo.
  echo Ollama non risponde su %OLLAMA_URL%: Sergio usera' l'analisi automatica locale.
  echo Per il tutor AI installalo da https://ollama.com/download e avvialo.
)

rem 4. Modello
if "%OLLAMA_OK%"=="1" (
  curl -sf "%OLLAMA_URL%/api/tags" | findstr /c:"\"name\":\"%QUADERNO_MODEL%\"" >nul
  if errorlevel 1 (
    echo Il modello %QUADERNO_MODEL% non e' installato in Ollama.
    set /p "ANS=Vuoi scaricarlo adesso? Puo' pesare diversi GB [s/N] "
    if /i "!ANS!"=="s" ollama pull %QUADERNO_MODEL%
  )
)

rem 5. Avvio e browser
if not defined QUADERNO_HOST set "QUADERNO_HOST=127.0.0.1"
set "URL=http://localhost:%QUADERNO_PORT%"
echo Avvio Talent Radar su %URL%  ^(chiudi questa finestra per fermarlo^)
if not "%QUADERNO_HOST%"=="127.0.0.1" echo In rete locale: http://%COMPUTERNAME%:%QUADERNO_PORT%
start "" cmd /c "timeout /t 2 >nul & start %URL%"
.venv\Scripts\python.exe -m uvicorn app.main:get_app --factory --host %QUADERNO_HOST% --port %QUADERNO_PORT%
