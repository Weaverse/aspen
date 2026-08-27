# Aspen — Shopify Hydrogen theme

Aspen is a premium home-furniture storefront built with Shopify Hydrogen,
React Router, TypeScript, Tailwind CSS, and Weaverse. Developers build reusable
sections and commerce behavior in this repository; merchants compose pages and
adjust theme settings in Weaverse Studio.

## Stack

- Node.js 22.12 or newer and npm
- React 19 and React Router 7
- Shopify Hydrogen 2026.4 and the Storefront API
- Weaverse Hydrogen 5
- Tailwind CSS 4, Biome, TypeScript, and Playwright
- Shopify Oxygen for the recommended production runtime

_Aspen is a sophisticated Shopify theme crafted specifically for home furniture and interior design stores. Powered by Hydrogen, React Router, and Weaverse, this theme delivers lightning-fast storefronts with exceptional performance and elegant design aesthetics perfect for showcasing furniture collections, home decor, and interior design services._

## Demo

- Live store: https://weaverse-aspen-furniture.fly.dev/
- Customizing Aspen on Weaverse Studio: https://studio.weaverse.io/demo?theme=aspen
  
![aspen.weaverse.dev](https://cdn.shopify.com/s/files/1/0838/0052/3057/files/aspen-preview-desktop.png?v=1755162368)

## What's included

![Weaverse + Hydrogen + Shopify](https://cdn.shopify.com/s/files/1/0838/0052/3057/files/weaverse-x-hydrogen-x-shopify.png?v=1755245801)

- React Router v7
- Hydrogen 2026.4
- Oxygen
- Shopify CLI
- Biome (ESLint, Prettier alternative)
- GraphQL generator
- TypeScript and JavaScript flavors
- Tailwind CSS v4 (via Vite)
- Radix UI components
- New Shopify customer account API
- Full-featured setup of components and routes
- Furniture-specific sections and layouts
- Fully customizable inside [Weaverse Studio](https://weaverse.io)

## Deployment

- [Deploy to Shopify Oxygen](https://weaverse.io/docs/deployment/oxygen)
- [Deploy to Vercel](https://wvse.cc/deploy-pilot-to-vercel)

## Getting started

For complete local setup, Shopify and Weaverse connection, environment
variables, theme customization, Oxygen deployment, and troubleshooting, see
the [Aspen setup and usage guide](docs/setup.md).

**Requirements:**

- Node.js version 22.12.0 or higher
- npm package manager

**Follow these steps to get started with Aspen and begin crafting your furniture store:**

1. Install [Weaverse Hydrogen Customizer](https://apps.shopify.com/weaverse) from Shopify App Store.
2. Create new Hydrogen storefront inside Weaverse and select the Aspen theme.
3. Initialize the project and start a local dev server with `@weaverse/cli` tool as instructed in the Weaverse Studio.
   ![Create new Weaverse Shopify Hydrogen project](https://cdn.shopify.com/s/files/1/0838/0052/3057/files/new_hydrogen_project.png?v=1735008500)
4. Open **Weaverse Studio** to start customizing your furniture store with specialized sections for product showcases, room inspirations, and interior design content.

## Quick Start Commands

```bash
git clone <repository-url> aspen
cd aspen
npm ci
cp .env.example .env
```

Fill the required placeholders in `.env`, then run:

```bash
npm run dev
```

The storefront runs at <http://localhost:3456>.

The minimum local configuration is:

```env
SESSION_SECRET="<random-64-character-hex-string>"
PUBLIC_STORE_DOMAIN="<store>.myshopify.com"
PUBLIC_STOREFRONT_API_TOKEN="<public-storefront-token>"
WEAVERSE_PROJECT_ID="<weaverse-project-id>"
```

Generate a local session secret without copying one from another environment:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Do not commit `.env`. Never put private Storefront, Weaverse, Judge.me,
Klaviyo, LoyaltyLion, admin, or deployment tokens in `PUBLIC_*` variables.

## Setup and usage

Read [docs/setup.md](docs/setup.md) for:

- prerequisites and local development
- Shopify Hydrogen and Storefront API connection
- Weaverse Studio connection and preview URLs
- the complete environment-variable table
- theme and section customization
- Oxygen production deployment
- troubleshooting

Additional project documentation:

- [Section usage guide](docs/sections.md)
- [Third-party integrations](docs/integrations.md)
- [Customer wishlist setup](docs/customer-wishlist-setup.md)
- [Product detail QA](docs/pdp-qa.md)
- [Cart QA](docs/cart-qa.md)

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Generate route/API types and start MiniOxygen on port 3456 |
| `npm run dev:ca` | Start development and push Customer Account callback configuration |
| `npm run codegen` | Regenerate Storefront and Customer Account GraphQL types |
| `npm run typecheck` | Generate React Router types and run TypeScript |
| `npm run biome` | Check formatting and lint rules without changing files |
| `npm run biome:fix` | Apply Biome-safe fixes |
| `npm run routes-check` | Validate standard Hydrogen routes |
| `npm run build` | Run GraphQL codegen and create the Oxygen production build |
| `npm run preview` | Build and serve the production bundle locally |
| `npm run e2e` | Run Playwright end-to-end tests |

Before opening a pull request, run:

```bash
npm run biome
npm run typecheck
npm run routes-check
npm run build
```

## Project map

```text
app/
├── components/       Shared storefront UI
├── graphql/          Shared GraphQL fragments and queries
├── routes/           React Router loaders, actions, and pages
├── sections/         Weaverse sections and child blocks
├── styles/           Global styles and fonts
└── weaverse/
    ├── components.ts Section/component registry
    ├── schema.server.ts Global theme settings schema
    ├── style.tsx     Theme settings → CSS variables
    └── csp.ts        Studio-aware Content Security Policy
server.ts             Hydrogen context, sessions, localization, Weaverse client
```

## Demo and support

- [Aspen demo store](https://weaverse-aspen-furniture.fly.dev/)
- [Aspen Studio demo](https://studio.weaverse.io/demo?theme=aspen)
- [Weaverse documentation](https://docs.weaverse.io/)
- [Shopify Hydrogen documentation](https://shopify.dev/docs/storefronts/headless/hydrogen)
- [Issue tracker](https://github.com/Weaverse/aspen/issues)
