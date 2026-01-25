# Important Commands for ShipAny Template Two

## Development
- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build for production
- `pnpm build:fast` - Build with increased Node memory (4GB)
- `pnpm start` - Run production build

## Code Quality
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Prettier
- `pnpm format:check` - Check code formatting without changes

## Database
- `pnpm db:generate` - Generate Drizzle migrations
- `pnpm db:migrate` - Run Drizzle migrations
- `pnpm db:push` - Push schema changes to database
- `pnpm db:studio` - Open Drizzle Studio UI

## Authentication
- `pnpm auth:generate` - Generate Better Auth configuration

## RBAC
- `pnpm rbac:init` - Initialize RBAC system
- `pnpm rbac:assign` - Assign roles to users

## Cloudflare
- `pnpm cf:preview` - Preview Cloudflare deployment
- `pnpm cf:deploy` - Deploy to Cloudflare
- `pnpm cf:upload` - Upload to Cloudflare
- `pnpm cf:typegen` - Generate Cloudflare types

## TypeScript Configuration
- Check `tsconfig.json` for path aliases and strict mode settings

## Environment Variables
- Required: `.env.development` for development
- Configuration keys like `replicate_api_token`, `gemini_api_key`, `kie_api_key`
- Database connection strings
- Payment provider credentials
