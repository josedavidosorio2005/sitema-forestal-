#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export DB_CLIENT="${DB_CLIENT:-sqlite}"
export REACT_APP_API_URL="${REACT_APP_API_URL:-http://localhost:5000/api}"

echo "Forest Analysis - entorno local"
echo "Backend:  http://localhost:5000"
echo "Frontend: http://localhost:3000"
echo "DB_CLIENT=${DB_CLIENT}"

cd "${ROOT_DIR}/backend"
npm run migrate
npm run seed
npm start &
BACKEND_PID=$!

cd "${ROOT_DIR}/frontend"
npm start &
FRONTEND_PID=$!

trap 'kill ${BACKEND_PID} ${FRONTEND_PID} 2>/dev/null || true' INT TERM EXIT
wait
