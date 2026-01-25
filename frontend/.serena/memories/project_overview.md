# ShipAny Template Two - Project Overview

## Project Purpose
ShipAny Template Two is a modern AI SaaS boilerplate/template built with Next.js 16. It provides a complete framework for building AI-powered applications with support for:
- AI Image Generation (Text-to-Image, Image-to-Image)
- AI Music Generation
- AI Video Generation
- AI Chatbot
- Multi-provider AI support (Replicate, Gemini, KIE)
- User authentication and authorization
- Payment & subscription management
- Admin dashboard
- RBAC (Role-Based Access Control)
- Internationalization (i18n)

## Tech Stack
- **Framework**: Next.js 16.0.0 (App Router)
- **Language**: TypeScript 5
- **UI Components**: Radix UI, Shadcn/ui, Tabler Icons
- **Styling**: Tailwind CSS 4
- **Authentication**: Better Auth 1.3.7
- **Database**: Drizzle ORM 0.44.2 with LibSQL/PostgreSQL
- **AI Providers**: Replicate, Google Gemini, KIE
- **Payment**: Stripe, PayPal, Creem
- **Storage**: R2 (Cloudflare), AWS S3
- **Email**: Resend
- **Forms**: React Hook Form + Zod validation
- **Internationalization**: next-intl 4.3.4
- **Real-time**: Replicate Polling, Task Query System
- **Styling Components**: Framer Motion, Embla Carousel

## Architecture Highlights
1. **Modular Design**: Separated into core, shared, extensions, themes, and config layers
2. **Provider Pattern**: Pluggable AI providers with common interface
3. **Task Queue System**: Asynchronous task processing with status polling
4. **Credit System**: Per-user credit management for AI operations
5. **RBAC**: Fine-grained permission system
6. **Internationalization**: Full i18n support for multiple languages
7. **Component Reusability**: Shared blocks and UI components across the app

## Key Directories
- `src/app`: Next.js app directory with pages and API routes
- `src/shared`: Shared components, hooks, services, and utilities
- `src/extensions`: Pluggable extensions (payment, storage, AI, etc.)
- `src/core`: Core functionality (auth, DB, i18n, RBAC, theme)
- `src/config`: Configuration files and constants
- `src/themes`: Theme-specific layouts and components
- `src/app/api`: API routes for backend operations
