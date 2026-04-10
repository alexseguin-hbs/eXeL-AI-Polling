#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────
# eXeL-AI Polling — Dev Environment Setup
# Checks/starts databases, creates .env if missing, creates tables.
# Usage: bash backend/scripts/setup_dev.sh
# ──────────────────────────────────────────────────────────────────
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ok()   { echo -e "  ${GREEN}✓${NC} $1"; }
warn() { echo -e "  ${YELLOW}!${NC} $1"; }
fail() { echo -e "  ${RED}✗${NC} $1"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "═══════════════════════════════════════════════════"
echo "  eXeL-AI Polling — Dev Setup"
echo "═══════════════════════════════════════════════════"
echo ""

# ── 1. Check database services ─────────────────────────────────
echo "1. Checking database services..."

# PostgreSQL
if pg_isready -h localhost -p 5432 -q 2>/dev/null; then
    ok "PostgreSQL is running"
else
    warn "PostgreSQL not running — attempting to start..."
    sudo service postgresql start 2>/dev/null || fail "Could not start PostgreSQL. Install with: sudo apt install postgresql"
    sleep 1
    if pg_isready -h localhost -p 5432 -q 2>/dev/null; then
        ok "PostgreSQL started"
    else
        fail "PostgreSQL failed to start"
    fi
fi

# (Redis removed — using Supabase + in-memory)

# MongoDB
if mongosh --quiet --eval "db.runCommand({ping:1})" 2>/dev/null | grep -q '"ok" : 1\|"ok":1'; then
    ok "MongoDB is running"
else
    warn "MongoDB not running — attempting to start..."
    sudo service mongod start 2>/dev/null || fail "Could not start MongoDB. Install from: https://www.mongodb.com/docs/manual/installation/"
    sleep 2
    if mongosh --quiet --eval "db.runCommand({ping:1})" 2>/dev/null | grep -q '"ok" : 1\|"ok":1'; then
        ok "MongoDB started"
    else
        fail "MongoDB may not be running (check: sudo service mongod status)"
    fi
fi

echo ""

# ── 2. Check .env ──────────────────────────────────────────────
echo "2. Checking .env file..."
if [ -f "$BACKEND_DIR/.env" ]; then
    ok ".env exists at $BACKEND_DIR/.env"
else
    warn ".env not found — creating with defaults..."
    cat > "$BACKEND_DIR/.env" << 'ENVEOF'
DATABASE_URL=postgresql+asyncpg://polling:polling@localhost:5432/polling_db
MONGODB_URI=mongodb://polling:polling@localhost:27017/polling_raw?authSource=admin
OPENAI_API_KEY=
DEFAULT_AI_PROVIDER=openai
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
ENVIRONMENT=development
LOG_LEVEL=DEBUG
AUTH0_DOMAIN=
AUTH0_API_AUDIENCE=
ENVEOF
    ok ".env created with defaults"
fi

echo ""

# ── 3. Create database tables ─────────────────────────────────
echo "3. Creating database tables via SQLAlchemy..."
cd "$BACKEND_DIR"

if [ -d ".venv" ]; then
    source .venv/bin/activate
elif [ -d "venv" ]; then
    source venv/bin/activate
fi

python -c "
import asyncio
from app.db.base import Base
from app.db.postgres import engine
import app.models  # noqa: F401 — registers all models with Base.metadata

async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await engine.dispose()

asyncio.run(create_tables())
print('  ✓ All tables created (or already exist)')
" 2>&1 || fail "Table creation failed — check DATABASE_URL in .env"

echo ""

# ── 4. Verify connections ─────────────────────────────────────
echo "4. Verifying database connections..."

# PostgreSQL
if PGPASSWORD=polling psql -h localhost -U polling -d polling_db -c "SELECT 1;" >/dev/null 2>&1; then
    ok "PostgreSQL connection verified"
else
    fail "PostgreSQL connection failed (user=polling, db=polling_db)"
fi

# (Redis removed — presence via in-memory, broadcast via Supabase)

# MongoDB
if mongosh "mongodb://polling:polling@localhost:27017/polling_raw?authSource=admin" --quiet --eval "db.stats()" >/dev/null 2>&1; then
    ok "MongoDB connection verified"
else
    warn "MongoDB auth connection failed (trying without auth)..."
    if mongosh --quiet --eval "use polling_raw; db.stats()" >/dev/null 2>&1; then
        ok "MongoDB connection verified (no auth)"
    else
        fail "MongoDB connection failed"
    fi
fi

echo ""
echo "═══════════════════════════════════════════════════"
echo "  Setup complete!"
echo ""
echo "  Start backend:  cd backend && source .venv/bin/activate && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
echo "  Start frontend: cd frontend && npm run dev"
echo "  Health check:   curl http://localhost:8000/api/v1/health"
echo "═══════════════════════════════════════════════════"
