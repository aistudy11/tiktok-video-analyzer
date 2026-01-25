FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat && yarn global add pnpm

WORKDIR /app

# Install dependencies based on the preferred package manager
# Note: --ignore-scripts to skip postinstall (fumadocs-mdx needs source files which aren't copied yet)
# Copy tsconfig.json for path alias resolution
COPY package.json pnpm-lock.yaml* source.config.ts next.config.mjs tsconfig.json ./
RUN pnpm i --frozen-lockfile --ignore-scripts --shamefully-hoist

# Rebuild the source code only when needed
FROM deps AS builder

WORKDIR /app

# Copy all source files
COPY . .

# Regenerate .source directory (fumadocs-mdx needs content files which weren't available during postinstall)
RUN pnpm exec fumadocs-mdx

# Build the application
RUN pnpm build

# Production image, copy all the files and run next
FROM base AS runner
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

# set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# server.js is created by next build from the standalone output
CMD ["node", "server.js"]