# Code Style and Conventions - ShipAny Template Two

## TypeScript
- Strict mode enabled
- No `any` type usage (use `unknown` with type guards)
- Explicit type annotations required
- Interfaces for contracts, types for unions/primitives

## File Organization
- Component files use `.tsx` extension
- Service/utility files use `.ts` extension
- Named exports preferred over default exports for reusability
- Index files for barrel exports (src/extensions/ai/index.ts)

## React Components
- Functional components with hooks
- `use client` directive for client components
- Props interface named `[ComponentName]Props`
- Custom hooks follow `useXxx` naming convention
- Event handlers use `handle[Event]` naming

## Naming Conventions
- Constants: UPPER_SNAKE_CASE
- Variables/functions: camelCase
- Types/Interfaces: PascalCase
- CSS classes: kebab-case with Tailwind

## Import Organization
- Separate imports by: React → Libraries → Project imports
- Use path aliases (@/) defined in tsconfig.json
- Group imports by category with comments

## Form & Validation
- React Hook Form for form management
- Zod for schema validation
- Form state in component-level state or context

## Error Handling
- Try-catch blocks with specific error messages
- User-facing toast notifications via sonner
- Console logging for development (can be removed for production)
- Custom error classes inherit from Error

## Comments
- JSDoc style for functions and exported items
- Explain "why" not "what"
- Keep comments updated with code changes

## Testing
- No existing test files in template
- Consider Jest + React Testing Library for new tests
- Test behavior, not implementation details

## Tailwind CSS
- Use Tailwind utility classes exclusively
- Custom CSS in global.css or component.module.css
- Responsive design with md:, lg:, xl: prefixes
- Use tailwind-merge for conditional class merging (cn function)

## Database
- Drizzle ORM with migrations
- Schema-first approach
- Models in src/shared/models/
- SQL in migrations

## API Routes
- Handlers named [method]() exports (POST, GET, etc.)
- Request validation at route level
- Response via respData/respErr utilities
- Authentication check via getUserInfo()
