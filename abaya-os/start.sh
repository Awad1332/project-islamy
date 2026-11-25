#!/usr/bin/env bash
# ABAYA OS — one-command start.
#   ./start.sh            start the platform (first run creates .env with strong random secrets)
#   ./start.sh --demo     also create the labelled demo store (demo@abaya-os.local / Demo-Store-2026)
#   ./start.sh --stop     stop everything (data is kept)
set -euo pipefail
cd "$(dirname "$0")"

green() { printf '\033[32m%s\033[0m\n' "$1"; }
gold() { printf '\033[33m%s\033[0m\n' "$1"; }
fail() { printf '\033[31m%s\033[0m\n' "$1" >&2; exit 1; }

if [ "${1:-}" = "--stop" ]; then
  docker compose stop
  green "تم الإيقاف — ABAYA OS stopped (data kept)."
  exit 0
fi

command -v docker >/dev/null 2>&1 || fail "Docker غير مثبّت — install Docker Desktop: https://docs.docker.com/get-docker/"
docker info >/dev/null 2>&1 || fail "Docker لا يعمل — start Docker Desktop and try again."

rand_hex() { openssl rand -hex "$1" 2>/dev/null || head -c "$1" /dev/urandom | od -An -tx1 | tr -d ' \n'; }

if [ ! -f .env ]; then
  gold "• Creating .env with generated secrets…"
  admin_pass="Abaya-$(rand_hex 6)"
  sed -e "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$(rand_hex 16)|" \
      -e "s|^JWT_ACCESS_SECRET=.*|JWT_ACCESS_SECRET=$(rand_hex 32)|" \
      -e "s|^ENCRYPTION_KEY=.*|ENCRYPTION_KEY=$(rand_hex 32)|" \
      -e "s|^S3_SECRET_ACCESS_KEY=.*|S3_SECRET_ACCESS_KEY=$(rand_hex 16)|" \
      -e "s|^PLATFORM_ADMIN_EMAIL=.*|PLATFORM_ADMIN_EMAIL=admin@abaya-os.local|" \
      -e "s|^PLATFORM_ADMIN_PASSWORD=.*|PLATFORM_ADMIN_PASSWORD=${admin_pass}|" \
      .env.example > .env
  chmod 600 .env
fi

gold "• Building and starting services (first run takes a few minutes)…"
docker compose up -d --build

gold "• Waiting for the API to become healthy…"
for _ in $(seq 1 90); do
  if docker compose exec -T api wget -qO- http://localhost:4000/api/health >/dev/null 2>&1; then break; fi
  sleep 2
done
docker compose exec -T api wget -qO- http://localhost:4000/api/health >/dev/null 2>&1 || fail "API did not start — run: docker compose logs api"

seed_demo=false
[ "${1:-}" = "--demo" ] && seed_demo=true
gold "• Preparing plans and admin account…"
docker compose exec -T -e SEED_DEMO="$seed_demo" api npx ts-node --transpile-only prisma/seed.ts

admin_email=$(grep '^PLATFORM_ADMIN_EMAIL=' .env | cut -d= -f2-)
admin_pass=$(grep '^PLATFORM_ADMIN_PASSWORD=' .env | cut -d= -f2-)
echo
green "✔ ABAYA OS جاهزة — is ready"
echo  "  افتحي المتصفح / open:   http://localhost:3000"
echo  "  إنشاء متجر جديد / new store:  http://localhost:3000/register"
echo  "  حساب إدارة المنصة / platform admin:  ${admin_email}  /  ${admin_pass}"
if [ "$seed_demo" = true ]; then
  echo "  المتجر التجريبي / demo store:  demo@abaya-os.local  /  Demo-Store-2026"
fi
echo  "  للإيقاف / to stop:  ./start.sh --stop"
