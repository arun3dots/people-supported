#!/usr/bin/env bash

set -Eeuo pipefail

APP_DIR="/home/ubuntu/apps/people-supported"
BRANCH="main"

echo "=========================================="
echo " PEOPLE SUPPORTED - PRODUCTION DEPLOYMENT"
echo "=========================================="

cd "$APP_DIR"

# Load the installed Node.js version through NVM.
export NVM_DIR="$HOME/.nvm"

if [ ! -s "$NVM_DIR/nvm.sh" ]; then
    echo "ERROR: NVM was not found."
    exit 1
fi

source "$NVM_DIR/nvm.sh"
nvm use 22.23.4

echo
echo "===== CHECK NODE AND PNPM ====="

node --version
pnpm --version

if [ "$(node -v)" != "v22.23.4" ]; then
    echo "ERROR: Expected Node.js v22.23.4."
    exit 1
fi

if [ "$(pnpm --version)" != "9.0.0" ]; then
    echo "ERROR: Expected pnpm 9.0.0."
    exit 1
fi

# Never discard uncommitted tracked server changes.
echo
echo "===== CHECK GIT WORKING TREE ====="

if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "ERROR: There are uncommitted tracked changes."
    echo "Commit or safely resolve them before deploying."
    git status --short
    exit 1
fi

# Fetch the latest main branch.
echo
echo "===== FETCH MAIN ====="

git fetch origin "$BRANCH"

REMOTE_COMMIT="$(git rev-parse "origin/$BRANCH")"
TARGET_COMMIT="${DEPLOY_COMMIT:-$REMOTE_COMMIT}"

# Deploy only the commit that passed CI.
if [ "$REMOTE_COMMIT" != "$TARGET_COMMIT" ]; then
    echo "ERROR: The validated commit is no longer the latest main commit."
    echo "Validated: $TARGET_COMMIT"
    echo "Latest:    $REMOTE_COMMIT"
    echo "Waiting for the latest CI run before deployment."
    exit 1
fi

git checkout "$BRANCH"
git reset --hard "$TARGET_COMMIT"

echo "Deploying commit: $(git rev-parse --short HEAD)"

# Install workspace dependencies.
echo
echo "===== INSTALL DEPENDENCIES ====="

pnpm install --frozen-lockfile

# Load migration database credentials.
echo
echo "===== LOAD MIGRATION ENVIRONMENT ====="

if [ ! -f "$APP_DIR/.env.migrate" ]; then
    echo "ERROR: .env.migrate not found."
    exit 1
fi

set -a
source "$APP_DIR/.env.migrate"
set +a

if [ -z "${DATABASE_URL:-}" ]; then
    echo "ERROR: DATABASE_URL is missing from .env.migrate."
    exit 1
fi

if [ -z "${AUDIT_DATABASE_URL:-}" ]; then
    echo "ERROR: AUDIT_DATABASE_URL is missing from .env.migrate."
    exit 1
fi

# Generate both Prisma clients.
echo
echo "===== GENERATE MAIN PRISMA CLIENT ====="

pnpm --filter @repo/db exec prisma generate --schema=prisma/schema.prisma

echo
echo "===== GENERATE AUDIT PRISMA CLIENT ====="

pnpm --filter @repo/audit-db exec prisma generate --schema=prisma/schema.prisma

# Build before applying migrations.
echo
echo "===== BUILD APPLICATIONS ====="

pnpm build

# Apply existing migrations only. No db push or seeding.
# echo
# echo "===== APPLY MAIN DATABASE MIGRATIONS ====="

# pnpm --filter @repo/db exec prisma migrate deploy --schema=prisma/schema.prisma

# echo
# echo "===== APPLY AUDIT DATABASE MIGRATIONS ====="

# pnpm --filter @repo/audit-db exec prisma migrate deploy --schema=prisma/schema.prisma

# Restart the running production applications.
echo
echo "===== RESTART PM2 APPLICATIONS ====="

pm2 restart all --update-env
pm2 save

# Verify the applications respond locally.
echo
echo "===== HEALTH CHECKS ====="

check_endpoint() {
    local name="$1"
    local url="$2"
    local attempt=1
    local status=""

    while [ "$attempt" -le 30 ]; do
        status="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$url" || true)"

        case "$status" in
            200|301|302|307|308)
                echo "OK: $name returned HTTP $status"
                return 0
                ;;
        esac

        echo "Waiting for $name (attempt $attempt/30)..."
        sleep 5
        attempt=$((attempt + 1))
    done

    echo "ERROR: $name health check failed. HTTP status: $status"
    return 1
}

check_endpoint "Web" "http://127.0.0.1:3000/"
check_endpoint "SuperAdmin" "http://127.0.0.1:3001/"
check_endpoint "Backend API" "http://127.0.0.1:4400/api"

echo
echo "=========================================="
echo " DEPLOYMENT COMPLETED SUCCESSFULLY"
echo " Commit: $(git rev-parse --short HEAD)"
echo "=========================================="
