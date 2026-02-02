# Deployment Rules

Paths: **/*

## Target Platform

**VPS + Docker + Dokploy** - This is the ONLY deployment target.

## Critical Requirements

1. **DO NOT optimize for Vercel** - No Vercel-specific code, no `@vercel/*` packages unless absolutely necessary
2. **DO NOT optimize for Cloudflare Workers** - This project uses SSE, sharp, and long-running tasks that are incompatible
3. **Docker-first** - All deployment considerations should assume Docker container environment

## Tech Stack Constraints

| Component | Requirement |
|-----------|-------------|
| Next.js | 16.x (Turbopack enabled) |
| Runtime | Node.js (NOT Edge Runtime) |
| Database | PostgreSQL via `postgres` driver |
| Image Processing | `sharp` (requires native modules) |
| Real-time | SSE (Server-Sent Events) |
| Scheduled Tasks | `setInterval` (process-based) |

## Forbidden Patterns

- `export const runtime = 'edge'` - Never use Edge Runtime
- Vercel-specific environment variables (`VERCEL_*`)
- Serverless-only patterns (stateless assumptions)
- 30-second timeout assumptions

## Allowed Patterns

- Long-running processes
- In-memory caching (process-level)
- Native Node.js modules
- Persistent database connections
- SSE/WebSocket long connections

## Dockerfile Requirements

The project uses `output: 'standalone'` in `next.config.mjs` for optimized Docker builds.

## Related Docs

- ShipAny Two documentation: https://shipany.ai/zh/docs
- Dokploy deployment guide: https://shipany.ai/zh/docs/deploy/dokploy
