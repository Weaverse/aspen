# Aspen setup and usage guide

This guide is the operational reference for developers, interns, and merchants
working on Aspen. It covers a fresh local setup, Shopify and Weaverse
connections, customization, and deployment to Shopify Oxygen.

## 1. What Aspen is

Aspen is a Shopify Hydrogen theme for furniture, interior, and editorial-led
commerce stores. The application has two customization layers:

1. **Code:** developers maintain React Router routes, Hydrogen commerce logic,
   reusable components, and Weaverse section schemas in this repository.
2. **Weaverse Studio:** merchants compose pages, reorder sections, select
   Shopify resources, edit content, and change global theme settings without
   editing code.

Shopify remains the source of truth for products, collections, markets,
customers, menus, checkout, and orders. Weaverse is the source of truth for
page composition and theme-setting values.

## 2. Prerequisites

Install or obtain:

- Node.js **22.12.0 or newer** (`node --version`)
- npm, which is included with Node (`npm --version`)
- Git (`git --version`)
- access to a Shopify store with the Hydrogen or Headless sales channel
- access to the corresponding Weaverse project
- Shopify CLI authentication when linking, pulling env values, or deploying

Aspen tracks `package-lock.json`; use npm and `npm ci` for reproducible installs.
Do not add a second lockfile.

Oxygen is available through Shopify's Hydrogen sales channel. A development
store can be used for development, although its Oxygen deployment URLs are
private and require a store login.

## 3. Install locally

```bash
git clone <repository-url> aspen
cd aspen
npm ci
cp .env.example .env
```

Generate a unique session secret for your machine:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Put the generated output in `SESSION_SECRET` in `.env`. Do not reuse the
production session secret locally.

Next, populate the four minimum values described below and start the app:

```bash
npm run dev
```

Open <http://localhost:3456>. The command runs React Router type generation,
Shopify GraphQL codegen, and Hydrogen's local MiniOxygen runtime.

### Minimum values needed to render

```env
SESSION_SECRET="<random-64-character-hex-string>"
PUBLIC_STORE_DOMAIN="<store>.myshopify.com"
PUBLIC_STOREFRONT_API_TOKEN="<public-storefront-token>"
WEAVERSE_PROJECT_ID="<weaverse-project-id>"
```

Product/collection pages and Weaverse content should render with these values.
Checkout, customer accounts, analytics, and optional integrations require
additional variables from the table below.

## 4. Environment variables

### Security model

- `.env` is for local development only and is ignored by Git.
- `.env.example` contains names and placeholders only. It must never contain a
  usable token.
- Oxygen variables are configured separately for **Preview**, **Production**,
  and any custom environments. A local `.env` is not uploaded by a Git push.
- A `PUBLIC_*` name means the value is allowed to participate in storefront
  configuration. It does **not** mean that the variable should be shared
  indiscriminately.
- Private tokens must remain server-only. Never add `PUBLIC_` to a private or
  admin token to make it available in browser code.
- `WEAVERSE_PROJECT_ID`, storefront IDs, shop IDs, and public API client IDs are
  identifiers, not passwords. `WEAVERSE_API_KEY` is a private credential.
- If a private token is exposed, rotate it at the provider and update every
  affected Oxygen environment.

### Core Shopify and Weaverse variables

| Variable | Required | Exposure | Placeholder | Purpose/source |
| --- | --- | --- | --- | --- |
| `SESSION_SECRET` | Yes | Private | `<random-64-character-hex-string>` | Signs Hydrogen session cookies. Generate independently for local, Preview, and Production. |
| `PUBLIC_STORE_DOMAIN` | Yes | Public identifier | `<store>.myshopify.com` | Shopify store domain from Hydrogen/Headless sales channel. Do not use a custom storefront domain here. |
| `PUBLIC_STOREFRONT_API_TOKEN` | Yes | Public token | `<public-storefront-token>` | Public Storefront API token created by Shopify. |
| `PRIVATE_STOREFRONT_API_TOKEN` | Recommended in production | **Private** | `<private-storefront-token>` | Server-side Storefront API token. Oxygen normally provisions it. Never expose it in browser code. |
| `WEAVERSE_PROJECT_ID` | Yes | Public identifier | `<weaverse-project-id>` | Weaverse Studio → Project settings, or the project URL/setup prompt. |
| `WEAVERSE_API_KEY` | No for normal rendering | **Private** | `<weaverse-api-key>` | Content API/MCP or authenticated Weaverse operations. Do not commit or expose it. |
| `WEAVERSE_HOST` | No | Configuration | `https://studio.weaverse.io` | Only set for an approved custom/staging Weaverse host. Production Studio uses the default when omitted. |
| `WEAVERSE_PUBLIC_API_BASE` | No | Configuration | `https://api.weaverse.io` | Optional custom public Weaverse API base; omit for normal Studio. |

### Shopify checkout, accounts, and analytics

| Variable | Required | Exposure | Placeholder | Purpose/source |
| --- | --- | --- | --- | --- |
| `PUBLIC_CHECKOUT_DOMAIN` | For checkout | Public identifier | `<store>.myshopify.com` | Domain used for Shopify checkout and CSP configuration. Usually provisioned by Hydrogen. |
| `PUBLIC_STOREFRONT_ID` | For complete analytics | Public identifier | `<hydrogen-storefront-id>` | Numeric Hydrogen storefront ID used by Shopify analytics. |
| `PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID` | For `/account` | Public client ID | `<customer-account-client-id>` | Customer Account API settings in Hydrogen/Headless channel. |
| `PUBLIC_CUSTOMER_ACCOUNT_API_URL` | For custom account configuration | Public URL | `https://shopify.com/<shop-id>/account/customer/api` | Normally provisioned by Shopify; keep the pulled value. |
| `SHOP_ID` | For customer accounts | Public identifier | `<shop-id>` | Shopify shop identifier used by Hydrogen's Customer Account client. |
| `PUBLIC_GOOGLE_GTM_ID` | No | Public identifier | `GTM-XXXXXXX` | Optional Google Tag Manager container ID. |
| `PUBLIC_SHOPIFY_INBOX_SHOP_ID` | No | Public identifier | `<shopify-inbox-shop-id>` | Enables the optional Shopify Inbox integration. |

### Optional Aspen integrations

| Variable | Exposure | Placeholder | Feature |
| --- | --- | --- | --- |
| `KLAVIYO_PRIVATE_API_TOKEN` | **Private** | `<klaviyo-private-api-token>` | Newsletter, contact-form event, and back-in-stock APIs. |
| `JUDGEME_PRIVATE_API_TOKEN` | **Private** | `<judgeme-private-api-token>` | Judge.me product ratings and reviews. |
| `LOYALTYLION_SITE_ID` | Server configuration | `<loyaltylion-site-id>` | LoyaltyLion Headless site identifier. |
| `LOYALTYLION_API_KEY` | **Private** | `<loyaltylion-api-key>` | LoyaltyLion Headless API key. |
| `METAOBJECT_COLORS_TYPE` | Configuration | `<shopify-metaobject-type>` | Shopify metaobject type used for color/image swatches. |
| `CUSTOM_COLLECTION_BANNER_METAFIELD` | Configuration | `<namespace.key>` | Collection metafield used for custom banner media/content. |

For provider-specific scopes and behavior, see
[Third-party integrations](./integrations.md).

## 5. Connect Aspen to Shopify

### Recommended: Hydrogen sales channel and Shopify CLI

Use this path for stores that will deploy to Oxygen.

1. Install the
   [Hydrogen sales channel](https://apps.shopify.com/hydrogen) in Shopify.
2. Create a Hydrogen storefront or connect this repository to an existing one.
3. Authenticate and link the local repository:

   ```bash
   npx shopify hydrogen link
   ```

4. Pull Shopify-managed variables:

   ```bash
   npx shopify hydrogen env pull
   ```

5. Re-add or verify `SESSION_SECRET`, `WEAVERSE_PROJECT_ID`, and optional
   third-party variables after the pull. The CLI can replace `.env`; keep a
   secure backup of locally generated values outside Git.
6. Run `npm run codegen`, restart `npm run dev`, and verify products,
   collections, cart, and checkout.

Shopify's current CLI command reference is available at
<https://shopify.dev/docs/api/shopify-cli/hydrogen>.

### Development store or external hosting: Headless sales channel

If the Hydrogen channel is not the chosen connection, install the
[Headless sales channel](https://apps.shopify.com/headless), create Storefront
API credentials, and enter the values manually in `.env`.

At minimum copy:

- `PUBLIC_STORE_DOMAIN`
- `PUBLIC_STOREFRONT_API_TOKEN`
- `PRIVATE_STOREFRONT_API_TOKEN` when server-side private access is available
- Customer Account API values when `/account` must work

Do not use Shopify Admin API tokens in Aspen's Storefront API variables. Aspen
does not require an Admin API token to render the storefront.

### Customer Account API during local development

Customer Account OAuth requires approved callback/origin/logout URLs and does
not authenticate against bare `localhost`. Use the project's helper command:

```bash
npm run dev:ca
```

Follow the Shopify CLI prompts for the development URL. If your store setup
requires it, expose port 3456 through a stable HTTPS tunnel and add these URLs
in Shopify's Customer Account API application setup:

```text
Callback:   https://<development-domain>/account/authorize
Origin:     https://<development-domain>
Logout:     https://<development-domain>
```

Never add a temporary developer URL to the production account configuration
without coordinating with the team.

## 6. Connect and use Weaverse Studio

1. Install the [Weaverse app](https://apps.shopify.com/weaverse) and open the
   Aspen project in Weaverse Studio.
2. Copy the project ID from Project settings (or the project URL) into
   `WEAVERSE_PROJECT_ID` in `.env`.
3. Start Aspen with `npm run dev`.
4. In Studio, open **Project settings → Manage URLs / Preview URLs** and add:

   ```text
   http://localhost:3456
   ```

   Include the protocol, use `localhost` rather than `127.0.0.1`, and avoid a
   trailing slash.
5. Select the local URL in Studio and confirm that the preview reports a
   connection and renders the current page.

If Studio cannot reach localhost in your environment, use the same HTTPS
tunnel as customer-account development and register that URL instead.

`WEAVERSE_API_KEY` is not required to edit pages in Studio or render published
content. It is only needed for authenticated Content API, MCP, or automation
workflows and must remain server-side.

### How page content reaches the storefront

- Routes call `context.weaverse.loadPage(...)` for the matching page type and
  handle.
- `app/weaverse/index.tsx` renders the returned Weaverse component tree.
- Available sections and blocks are registered in
  `app/weaverse/components.ts`.
- A component that is not registered cannot be added in Studio.

See [Section usage](./sections.md) for section purposes, content guidance,
responsive behavior, and recommended page compositions.

## 7. Customize Aspen

### Merchant workflow in Studio

Use Studio for changes that should not require a deployment:

1. Select the page/template.
2. Add, remove, or reorder sections.
3. Select Shopify products, collections, blogs, or media.
4. Edit section content and layout settings.
5. Open **Theme settings** for global typography, colors, buttons, cards,
   badges, forms, page width, spacing, header, and footer settings.
6. Check desktop and mobile previews.
7. Publish the page/theme changes when they are ready.

Publishing content is different from deploying code: Studio publishes content
for the current Weaverse project, while Oxygen deploys the React application.

### Developer workflow

| Change | Primary location |
| --- | --- |
| Global setting definitions and defaults | `app/weaverse/schema.server.ts` |
| Theme setting values mapped to CSS variables | `app/weaverse/style.tsx` |
| Base fonts and global CSS | `app/styles/app.css` |
| Reusable storefront UI | `app/components/` |
| Weaverse sections, child blocks, loaders, presets | `app/sections/` |
| Component registration | `app/weaverse/components.ts` |
| Route data and actions | `app/routes/` |

When adding a Weaverse section:

1. Create the component and `createSchema()` definition in `app/sections/`.
2. Spread Weaverse's root props (`...rest`) onto the rendered root element.
3. Add clear groups, labels, defaults, presets, and mobile behavior.
4. Register the namespace export in `app/weaverse/components.ts`.
5. Verify insertion and editing in Studio, not only direct rendering.
6. Update [docs/sections.md](./sections.md).

## 8. Validate changes

Run focused checks while developing, then the complete pre-PR set:

```bash
npm run biome
npm run typecheck
npm run routes-check
npm run build
```

For changes that affect GraphQL documents:

```bash
npm run codegen
```

For visual or interactive changes:

```bash
npm run e2e
```

`npm run preview` builds and serves the production bundle locally. Use it to
catch differences between the dev server and the Oxygen build.

## 9. Deploy to Shopify Oxygen

### GitHub continuous deployment (recommended)

1. Push Aspen to a GitHub repository.
2. In Shopify Admin → Hydrogen, create a storefront and connect the existing
   repository.
3. Shopify opens a pull request that adds the Oxygen GitHub workflow. Review
   and merge it; do not remove its storefront-ID marker.
4. In **Storefront settings → Environments and variables**, configure Preview
   and Production separately.
5. Keep Shopify's read-only variables. Add `WEAVERSE_PROJECT_ID`, a unique
   `SESSION_SECRET`, and any Aspen integration variables needed in that
   environment.
6. Run the pre-PR checks locally and push the branch. Non-production branches
   deploy to Preview; the configured production branch deploys to Production.
7. Verify the Oxygen URL, Shopify checkout, account login, content, analytics,
   and integrations.
8. Publish the Hydrogen storefront, attach the custom domain, and set the
   production Oxygen/custom-domain URL as a Weaverse Preview URL.

Oxygen deployments and their variable values are immutable. After adding,
changing, or rotating an environment variable, create a new deployment; an
existing deployment will not pick up the new value.

References:

- <https://shopify.dev/docs/storefronts/headless/hydrogen/deployments/github>
- <https://shopify.dev/docs/storefronts/headless/hydrogen/environments>
- <https://docs.weaverse.io/oxygen-deployment>

### Manual or custom CI deployment

For an already linked storefront, the CLI can deploy directly:

```bash
npx shopify hydrogen deploy
```

To deploy explicitly to Preview:

```bash
npx shopify hydrogen deploy --preview
```

Custom CI must store the Oxygen deployment token as the protected secret
`SHOPIFY_HYDROGEN_DEPLOYMENT_TOKEN`. This token belongs in the CI secret store,
not `.env.example`, browser code, or repository files.

## 10. Troubleshooting

### `SESSION_SECRET environment variable is not set`

Generate a random value, add it to local `.env`, and restart `npm run dev`.
Oxygen needs a separate value in each environment.

### Products, collections, or menus are empty / Storefront API returns 401

- Confirm `PUBLIC_STORE_DOMAIN` uses `<store>.myshopify.com`.
- Pull fresh values with `npx shopify hydrogen env pull`.
- Confirm Storefront API permissions include the resources being queried.
- Restart the dev server after changing `.env`.

### GraphQL or generated TypeScript errors

Run `npm run codegen`, then `npm run typecheck`. If codegen fails, fix the
Shopify connection and API credentials before editing generated `.d.ts` files.

### Port 3456 is already in use

Stop the previous Hydrogen process before starting Aspen again. The Studio
preview is configured for port 3456, so allowing the CLI to silently switch
ports can leave Studio pointing at the wrong server.

### `EMFILE: too many open files, watch`

Close duplicate dev servers and other large file-watching processes, then
restart the terminal and `npm run dev`. Exclude generated/build directories
from editor watchers when the problem repeats.

### Weaverse preview is blank, disconnected, or reports `INVALID_URL`

- Confirm `WEAVERSE_PROJECT_ID` belongs to the intended Studio project.
- Use `http://localhost:3456` with a protocol and no trailing slash.
- Use `localhost`, not `127.0.0.1`.
- Confirm `npm run dev` is still running on port 3456.
- If using a custom Weaverse host, set only a trusted `WEAVERSE_HOST`.
- Disable browser privacy/shield features for Studio and the preview domain if
  they block iframe or websocket connections.

### A section does not appear in Studio

Confirm it exports a schema and is registered in
`app/weaverse/components.ts`. Also check the schema's page-type `enabled`
condition and whether the section has reached its per-page limit.

### Studio changes do not appear on Oxygen

- Confirm Oxygen uses the same `WEAVERSE_PROJECT_ID` as Studio.
- Confirm the page/theme change was published, not only previewed.
- Add the Oxygen/custom-domain URL to Weaverse Preview URLs.
- Redeploy after changing Oxygen variables.

### Customer login redirects fail locally

Bare localhost is not a valid Customer Account OAuth origin. Run
`npm run dev:ca`, use an HTTPS development domain, and verify callback, origin,
and logout URLs in Shopify Customer Account API settings.

### Checkout does not open from localhost

Confirm the cart has a valid Shopify checkout URL and that
`PUBLIC_CHECKOUT_DOMAIN` came from the same connected storefront. Checkout is
hosted by Shopify; it does not remain on localhost.

### Newsletter, contact, back-in-stock, reviews, or loyalty UI is unavailable

These features fail closed when their server-only integration variables are
missing. Configure the relevant provider token, restart locally or redeploy on
Oxygen, and check server logs. Never return provider error payloads or tokens
to browser code.

### `env pull` removed Weaverse or integration values

Shopify only knows Shopify-managed values. Restore `WEAVERSE_PROJECT_ID`, the
local `SESSION_SECRET`, and integration variables from your secure password or
secret manager—never from Git history.

### Oxygen deploy succeeds but uses old configuration

Environment-variable changes do not mutate existing Oxygen deployments.
Trigger a new deployment by pushing a commit or running
`npx shopify hydrogen deploy` after saving the variables.

