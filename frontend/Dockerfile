FROM node:20-alpine AS builder

# Install dependencies and enable corepack for pnpm
RUN apk add --no-cache libc6-compat && \
    corepack enable && \
    corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy all files first (ensures src is available for any install scripts)
COPY . .

# Debug: Verify critical files exist
RUN echo "=== Verifying source files ===" && \
    ls -la src/shared/lib/ && \
    cat src/shared/lib/utils.ts

# Install dependencies (shamefully-hoist is in .npmrc)
RUN pnpm i --frozen-lockfile

# Build the application
RUN pnpm build

# Production image
FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir .next && \
    chown nextjs:nodejs .next

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
