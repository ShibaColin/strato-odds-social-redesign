#!/bin/zsh
cd "${0:A:h}"
if curl -fsS http://127.0.0.1:4173/api/health >/dev/null 2>&1; then
  open http://127.0.0.1:4173
else
  (sleep 1; open http://127.0.0.1:4173) &
  python3 server.py --port 4173
fi
