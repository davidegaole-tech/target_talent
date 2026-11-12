#!/usr/bin/env bash
# Avvio di Talent Radar su macOS/Linux.
set -euo pipefail
cd "$(dirname "$0")/.."

[ -f .env ] && set -a && . ./.env && set +a
OLLAMA_URL="${OLLAMA_URL:-http://localhost:11434}"
QUADERNO_MODEL="${QUADERNO_MODEL:-qwen3:8b}"
QUADERNO_PORT="${QUADERNO_PORT:-8765}"

# 1. Python >= 3.11
PY=""
for c in python3.13 python3.12 python3.11 python3 python; do
  if command -v "$c" >/dev/null 2>&1 && "$c" -c 'import sys; sys.exit(0 if sys.version_info >= (3, 11) else 1)' 2>/dev/null; then PY="$c"; break; fi
done
if [ -z "$PY" ]; then
  echo "Serve Python 3.11 o più recente. Scaricalo da https://www.python.org/downloads/"; exit 1
fi

# 2. Ambiente virtuale e dipendenze
if [ ! -x .venv/bin/python ]; then
  echo "Creo l'ambiente virtuale (.venv)…"
  "$PY" -m venv .venv
fi
if [ ! -f .venv/.installato ] || [ requirements.txt -nt .venv/.installato ]; then
  echo "Installo le dipendenze…"
  .venv/bin/python -m pip install -q --upgrade pip
  .venv/bin/python -m pip install -q -r requirements.txt
  touch .venv/.installato
fi

# 3. Ollama (facoltativo: senza modello l'app usa l'analisi algoritmica locale)
OLLAMA_OK=1
if ! curl -sf "$OLLAMA_URL/api/version" >/dev/null 2>&1; then
  OLLAMA_OK=0
  echo
  echo "Ollama non risponde su $OLLAMA_URL: Sergio userà l'analisi automatica locale."
  echo "Per il tutor AI: installalo da https://ollama.com/download e avvialo (ollama serve)."
fi

# 4. Modello
if [ "$OLLAMA_OK" = "1" ] && ! curl -sf "$OLLAMA_URL/api/tags" | grep -q "\"name\":\"$QUADERNO_MODEL\""; then
  echo "Il modello $QUADERNO_MODEL non è installato in Ollama."
  read -r -p "Vuoi scaricarlo adesso? Può pesare diversi GB [s/N] " ans
  case "$ans" in
    [sSyY]*) ollama pull "$QUADERNO_MODEL" ;;
    *) echo "Va bene: potrai scegliere un altro modello installato dal menu di Sergio (clicca la mascotte in basso a destra)." ;;
  esac
fi

# 5. Avvio e browser
QUADERNO_HOST="${QUADERNO_HOST:-127.0.0.1}"
URL="http://localhost:$QUADERNO_PORT"
echo "Avvio Talent Radar su $URL  (Ctrl+C per fermarlo)"
if [ "$QUADERNO_HOST" != "127.0.0.1" ]; then
  IP=$(hostname -I 2>/dev/null | awk '{print $1}')
  [ -n "$IP" ] && echo "In rete locale: http://$IP:$QUADERNO_PORT"
fi
( sleep 2
  if command -v xdg-open >/dev/null 2>&1; then xdg-open "$URL" >/dev/null 2>&1
  elif command -v open >/dev/null 2>&1; then open "$URL"; fi ) &
exec .venv/bin/python -m uvicorn app.main:get_app --factory --host "$QUADERNO_HOST" --port "$QUADERNO_PORT"
