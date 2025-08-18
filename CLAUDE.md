# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server on port 3456 with codegen
- `npm run dev:ca` - Start dev server with customer account API (unstable)
- `npm run build` - Build for production with codegen
- `npm run preview` - Preview production build
- `npm run start` - Start production server
- `npm run typecheck` - Run TypeScript type checking
- `npm run codegen` - Generate GraphQL types and schema

### Code Quality
- `npm run biome` - Run linting (error level only)
- `npm run biome:fix` - Auto-fix linting issues
- `npm run format` - Format code with Biome
- `npm run format:check` - Check formatting without changes

### Testing
- `npm run e2e` - Run Playwright end-to-end tests
- `npm run e2e:ui` - Run Playwright tests with UI

### Maintenance
- `npm run clean` - Remove build artifacts and dependencies

## Architecture Overview

This is a **Shopify Hydrogen storefront** built with **React Router v7** (not Remix) and integrated with **Weaverse** for visual page building. Key architectural decisions:

### Framework Stack
- **Hydrogen 2025.5.0** - Shopify's React framework for commerce
- **React Router v7** - File-based routing (NOT Remix - see import rules below)
- **Weaverse** - Visual page builder with component system
- **Vite** - Build tool and dev server
- **Biome** - Linting and formatting (replaces ESLint/Prettier)
- **TailwindCSS v4** - Styling with CSS-in-JS approach

### Key Directory Structure
```
app/
├── components/          # Reusable UI components
├── sections/           # Weaverse page-building sections
├── routes/             # File-based routing (React Router)
├── weaverse/           # Weaverse integration and config
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── graphql/            # GraphQL fragments and queries
└── styles/             # Global styles
```

### Critical Import Rules
**ALWAYS use React Router imports, NEVER Remix:**
```js
// ✅ CORRECT
import { useLoaderData, Link, Form } from 'react-router';

// ❌ WRONG
import { useLoaderData, Link, Form } from '@remix-run/react';
```

### Weaverse Integration
- All page content is managed through Weaverse's visual builder
- Components must be registered in `app/weaverse/components.ts`
- Section components live in `app/sections/` with proper schema exports
- Theme settings defined in `app/weaverse/schema.server.ts`
- Use `withWeaverse` HOC on root App component

### Component Architecture
- **Components**: Small, reusable UI elements (`app/components/`)
- **Sections**: Full-width page-building blocks (`app/sections/`)
- **Weaverse Schema**: Every section must export a `schema` object using `createSchema()`
- **Data Loading**: Use component `loader` functions for server-side data fetching

### Styling Approach
- **TailwindCSS v4** with CSS-in-JS setup via Vite plugin
- **Design tokens** managed through Weaverse theme settings
- **Global styles** in `app/weaverse/style.tsx` driven by theme settings
- **Component-specific** styles using Tailwind classes

### GraphQL & Data Fetching
- **Storefront API** for product/collection data
- **Generated types** in `storefront-api.generated.d.ts` (DO NOT edit directly)
- **Fragments** defined in `app/graphql/fragments.ts`
- **Queries** in `app/graphql/queries.ts`
- **Regenerate types** with `npm run codegen` after schema changes

### Testing Setup
- **Playwright** for end-to-end testing
- Test files in `tests/` directory
- Configuration in `playwright.config.ts`

## Development Workflows

### Adding New Weaverse Sections
1. Create component in `app/sections/[section-name]/index.tsx`
2. Export default component with `forwardRef`
3. Export `schema` object with `createSchema()`
4. Optionally export `loader` function for data fetching
5. Register in `app/weaverse/components.ts`

### Component Schema Requirements
```tsx
export let schema = createSchema({
  type: 'my-section',
  title: 'My Section',
  settings: [  // Use "settings", NOT "inspector"
    {
      group: 'Content',
      inputs: [
        {
          type: 'text',
          name: 'heading',
          label: 'Heading',
          defaultValue: 'Default heading',
        },
      ],
    },
  ],
});
```

### File-based Routing
- Routes in `app/routes/` follow React Router v7 conventions
- Locale-aware routes: `($locale).page-name.tsx`
- Dynamic routes: `($locale).products.$productHandle.tsx`
- API routes: `($locale).api.endpoint.ts`

### Code Quality Standards
- **TypeScript**: Strict mode disabled, but use types where beneficial
- **Linting**: Biome configuration in `biome.json` (extends `@weaverse/biome`)
- **Formatting**: Double quotes, semicolons required
- **Imports**: Use `~/*` alias for app directory imports

### Environment Configuration
Required environment variables:
- `PUBLIC_STORE_DOMAIN` - Shopify store domain
- `PUBLIC_STOREFRONT_API_TOKEN` - Storefront API access token
- `WEAVERSE_PROJECT_ID` - Weaverse project identifier
- `SESSION_SECRET` - Session encryption key

### Performance Considerations
- **Server-side rendering** with hydration
- **Component lazy loading** via Vite warming
- **GraphQL caching** using Hydrogen's cache strategies
- **Image optimization** with Shopify CDN
- **Asset inlining** disabled for CSP compliance

## Common Tasks

### Updating GraphQL Schema
1. Modify queries in `app/graphql/`
2. Run `npm run codegen`
3. Update TypeScript types as needed

### Adding Theme Settings
1. Edit `app/weaverse/schema.server.ts`
2. Add corresponding styles in `app/weaverse/style.tsx`
3. Use `useThemeSettings()` hook in components

### Debugging
- **Dev tools**: http://localhost:3456/graphiql
- **Network requests**: http://localhost:3456/debug-network
- **Hydrogen logs**: Check terminal output during development

### Deployment
- **Shopify Oxygen**: Native Hydrogen deployment platform
- **Build command**: `npm run build`
- **Environment**: Ensure all env vars are configured
