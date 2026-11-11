#!/usr/bin/env bash
set -e

export PATH="/home/deploy/.nvm/versions/node/v20.20.2/bin:$PATH"

# Always start from the root directory
cd /opt/app

echo "==> Pulling latest code"
git fetch origin develop
git reset --hard origin/develop

echo "==> Installing dependencies (workspace-wide)"
pnpm install --frozen-lockfile

echo "==> Processing Main Database"
cd /opt/app/packages/db
npx prisma@6.19.3 generate --schema=prisma/schema.prisma
npx prisma@6.19.3 migrate deploy --schema=prisma/schema.prisma

echo "==> Processing Audit Database"
cd /opt/app/packages/audit-db
npx prisma@6.19.3 generate --schema=prisma/schema.prisma
npx prisma@6.19.3 migrate deploy --schema=prisma/schema.prisma

echo "==> Building all apps via turbo"
cd /opt/app
pnpm turbo build

echo "==> Restarting apps"
pm2 restart /opt/app/ecosystem.config.js --update-env

echo "==> Done"
