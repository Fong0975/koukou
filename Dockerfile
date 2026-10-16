# Multi-stage build for the Next.js app
FROM node:24-alpine AS base

# openssl lets Prisma detect the platform and run its schema engine on musl;
# tzdata lets TZ set the time zone used in log timestamps.
RUN apk add --no-cache openssl tzdata

WORKDIR /app

# Build stage
FROM base AS builder

# The Prisma client is created when db.ts is imported, which `next build` and `prisma generate` both do.
# The driver adapter only connects on the first query, so a placeholder URL is enough here.
ENV DATABASE_URL="mysql://build:build@localhost:3306/build" \
    LOG_FILE_ENABLED=false \
    NEXT_TELEMETRY_DISABLED=1

# Install dependencies first for better caching; postinstall generates the Prisma client
# and downloads the schema engine, so the schema and config must already be present.
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci

# Copy source code and build the application
COPY . .
RUN npm run build

# Keep only runtime dependencies (including the Prisma CLI used for start-up migrations)
# and drop the build cache, which `next start` does not use
RUN npm prune --omit=dev && rm -rf .next/cache

# Final stage
FROM base AS runner

# The container may run as a UID with no home directory, so keep the Prisma CLI from trying to
# write its update-check cache there.
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    CHECKPOINT_DISABLE=1

# Only what `next start` and `prisma migrate deploy` need at runtime
COPY --from=builder /app/package.json /app/next.config.ts /app/prisma.config.ts ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# The app files stay root-owned and read-only. Only the log directory (a mount point) and the
# next/image cache must be writable, by whichever UID Compose runs the container as, so they are
# world-writable with the sticky bit, like /tmp.
RUN mkdir -p /app/logs /app/.next/cache && chmod 1777 /app/logs /app/.next/cache

# Define build argument for port
ARG APP_PORT=3000
ENV PORT=${APP_PORT}
EXPOSE ${APP_PORT}

# Never run as root; Compose can override the UID/GID with APP_UID/APP_GID
USER node

# Run Next.js directly (not through npm) so it receives SIGTERM on `docker stop`
CMD ["node_modules/.bin/next", "start"]
