#!/bin/sh
set -e

NODE_ENV_VALUE="${NODE_ENV:-production}"
RUN_MIGRATIONS_VALUE="${RUN_MIGRATIONS:-true}"
DATABASE_SYNC_STRATEGY_VALUE="${DATABASE_SYNC_STRATEGY:-migrate}"
SEED_DATABASE_VALUE="${SEED_DATABASE:-false}"
AUTO_RESET_FAILED_MIGRATIONS_VALUE="${AUTO_RESET_FAILED_MIGRATIONS:-false}"

run_migrate_deploy() {
  echo "Running Prisma migrate deploy..."
  ./node_modules/.bin/prisma migrate deploy
}

run_migrate_dev() {
  echo "Running Prisma migrate dev for local development..."
  ./node_modules/.bin/prisma migrate dev --name local_sync --skip-seed
}

run_db_push() {
  echo "Synchronizing local database from Prisma schema with db push..."
  ./node_modules/.bin/prisma db push
}

run_db_push_force_reset() {
  echo "Force-resetting local database from Prisma schema. This is allowed only outside production."
  ./node_modules/.bin/prisma db push --force-reset --accept-data-loss
}

if [ "$NODE_ENV_VALUE" = "production" ]; then
  case "$DATABASE_SYNC_STRATEGY_VALUE" in
    migrate|none)
      ;;
    *)
      echo "Refusing DATABASE_SYNC_STRATEGY=$DATABASE_SYNC_STRATEGY_VALUE in production. Use migrate or none."
      exit 1
      ;;
  esac

  if [ "$AUTO_RESET_FAILED_MIGRATIONS_VALUE" = "true" ]; then
    echo "Refusing AUTO_RESET_FAILED_MIGRATIONS=true in production."
    exit 1
  fi

  if [ "$SEED_DATABASE_VALUE" = "true" ]; then
    echo "Refusing SEED_DATABASE=true in production. Use POST /api/v1/admin/bootstrap to create the first admin account."
    exit 1
  fi
fi

if [ "$RUN_MIGRATIONS_VALUE" = "true" ]; then
  if [ "$DATABASE_SYNC_STRATEGY_VALUE" = "auto" ]; then
    if [ "$NODE_ENV_VALUE" = "production" ]; then
      DATABASE_SYNC_STRATEGY_VALUE="migrate"
    else
      DATABASE_SYNC_STRATEGY_VALUE="migrate-dev"
    fi
  fi

  case "$DATABASE_SYNC_STRATEGY_VALUE" in
    migrate)
      if ! run_migrate_deploy; then
        echo "Prisma migrate deploy failed."
        if [ "$AUTO_RESET_FAILED_MIGRATIONS_VALUE" = "true" ] && [ "$NODE_ENV_VALUE" != "production" ]; then
          run_db_push_force_reset
        else
          exit 1
        fi
      fi
      ;;
    migrate-dev|migrate_dev)
      if [ "$NODE_ENV_VALUE" = "production" ]; then
        echo "Refusing migrate dev in production."
        exit 1
      fi
      run_migrate_dev
      ;;
    db_push)
      if [ "$NODE_ENV_VALUE" = "production" ]; then
        echo "Refusing db push in production."
        exit 1
      fi
      if ! run_db_push; then
        if [ "$AUTO_RESET_FAILED_MIGRATIONS_VALUE" = "true" ]; then
          run_db_push_force_reset
        else
          echo "Prisma db push failed and auto reset is disabled."
          exit 1
        fi
      fi
      ;;
    db_push_force_reset)
      if [ "$NODE_ENV_VALUE" = "production" ]; then
        echo "Refusing DATABASE_SYNC_STRATEGY=db_push_force_reset in production."
        exit 1
      fi
      run_db_push_force_reset
      ;;
    none)
      echo "Skipping database sync because DATABASE_SYNC_STRATEGY=none."
      ;;
    *)
      echo "Invalid DATABASE_SYNC_STRATEGY=$DATABASE_SYNC_STRATEGY_VALUE. Allowed: auto, migrate, migrate-dev, db_push, db_push_force_reset, none."
      exit 1
      ;;
  esac
fi

if [ "$SEED_DATABASE_VALUE" = "true" ]; then
  echo "Running database seed..."
  node prisma/seed.js
fi

exec "$@"
