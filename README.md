<h1 align="center">Aspen - Shopify Hydrogen Theme</h1>

<div align="center">

📚 [Read the docs](https://weaverse.io/docs) | 🗣 [Join our community on Slack](https://join.slack.com/t/weaversecommunity/shared_invite/zt-235bv7d80-velzJU8CpZIHWdrzFwAdXg) | 🐞 [Report a bug](https://github.com/weaverse/aspen/issues)

</div>

_Aspen is a sophisticated Shopify theme crafted specifically for home furniture and interior design stores. Powered by Hydrogen, React Router, and Weaverse, this theme delivers lightning-fast storefronts with exceptional performance and elegant design aesthetics perfect for showcasing furniture collections, home decor, and interior design services._

## Demo

- Live store: https://aspen-shopify-hydrogen.weaverse.dev/
- Customizing Aspen on Weaverse Studio: https://studio.weaverse.io/demo?theme=aspen
  
![aspen.weaverse.dev](https://cdn.shopify.com/s/files/1/0838/0052/3057/files/aspen-preview-desktop.png?v=1755162368)

## What's included

![Weaverse + Hydrogen + Shopify](https://cdn.shopify.com/s/files/1/0838/0052/3057/files/weaverse-x-hydrogen-x-shopify.png?v=1755245801)

- React Router v7
- Hydrogen 2026.10
- Oxygen
- Shopify CLI
- Biome (ESLint, Prettier alternative)
- Typed GraphQL documents with gql.tada
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

- Node.js `^22.18.0 || ^24.11.0`; prefer a current patched release (see [Node compatibility](docs/setup.md#node-compatibility))
- npm package manager

**Follow these steps to get started with Aspen and begin crafting your furniture store:**

1. Install [Weaverse Hydrogen Customizer](https://apps.shopify.com/weaverse) from Shopify App Store.
2. Create new Hydrogen storefront inside Weaverse and select the Aspen theme.
3. Initialize the project and start a local dev server with `@weaverse/cli` tool as instructed in the Weaverse Studio.
   ![Create new Weaverse Shopify Hydrogen project](https://cdn.shopify.com/s/files/1/0838/0052/3057/files/new_hydrogen_project.png?v=1735008500)
4. Open **Weaverse Studio** to start customizing your furniture store with specialized sections for product showcases, room inspirations, and interior design content.

## Quick Start Commands

```bash
# Install dependencies
npm install

# Start development server on port 3456
npm run dev

# Run code quality checks before committing
npm run biome:fix
npm run typecheck

# Build for production
npm run build

# Run E2E tests
npm run e2e
```

## Features overview

### Fetching page data with parallel loading

Aspen uses parallel data loading for optimal performance. Every route loads Weaverse data alongside GraphQL queries using `Promise.all()`:

```ts:routes/($locale)._index.tsx
import { data } from 'react-router';
import { CACHE_DEFAULT } from '~/utils/cache';
import { unwrapStorefront } from '~/utils/storefront';
import { type LoaderFunctionArgs } from 'react-router';

export async function loader({ context }: LoaderFunctionArgs) {
  const { storefront, weaverse } = context;

  // Parallel data loading for best performance
  const [collections, weaverseData] = await Promise.all([
    storefront.graphql(COLLECTIONS_QUERY, {cache: CACHE_DEFAULT}).then(unwrapStorefront),
    weaverse.loadPage({ type: 'INDEX' }),
  ]);

  return data({
    collections,
    weaverseData,
  });
}
```

`weaverse` is a `WeaverseClient` instance that has been injected into the app context by Weaverse. It provides a set of methods to interact with the Weaverse API.

The request-scoped clients are created in `app/.server/context.ts`. `server.ts`
composes Shopify handlers with React Router and applies the session and response
headers. See [migration notes](docs/hydrogen-2026-10-migration.md) for the new
request lifecycle.

### Rendering page content

Weaverse pages is rendered using `<WeaverseContent />` component.

```tsx:app/weaverse/index.tsx
import { WeaverseHydrogenRoot } from '@weaverse/hydrogen/react-router';
import { GenericError } from '~/components/generic-error';
import { components } from './components';

export function WeaverseContent() {
  return (
    <WeaverseHydrogenRoot
      components={components}
      errorComponent={GenericError}
    />
  );
}

```

And in your route:

```tsx:routes/($locale)/_index.tsx
export default function Homepage() {
  return <WeaverseContent />;
}
```

Dead simple, right?

### Global theme settings

Weaverse global theme settings is loaded in the `root`'s loader with `context.weaverse.loadThemeSettings` function.

```tsx:root.tsx
export async function loader({request, context}: RouteLoaderArgs) {
  return defer({
    // App data...
    weaverseTheme: await context.weaverse.loadThemeSettings(),
  });
}
```

And then you can use it in your components with `useThemeSettings` hook.

```tsx:app/weaverse/components/logo.tsx
import { useThemeSettings } from '@weaverse/hydrogen/react-router';

function Logo() {
  let {logo} = useThemeSettings();

  return (
    <div className="flex items-center">
      <img src={logo} alt="Logo" />
    </div>
  );
}
```

The `App` component is wrapped with `withWeaverse` HoC in order to SSR the theme settings.

```tsx:root.tsx
import { withWeaverse } from '@weaverse/hydrogen/react-router';

function App() {
  return (
    <html lang={locale.language}>
      // App markup
    </html>
  );
}

export default withWeaverse(App);
```

### Create a Weaverse section

To create a section, you need to create a new file in [`app/sections`](app/sections) directory and register it in [`app/weaverse/components.ts`](app/weaverse/components.ts) file.

**Important:** All Weaverse sections must use `forwardRef` and extend `WeaverseComponentProps`.

```tsx:app/sections/video/index.tsx
import {
  type WeaverseComponentProps,
  createSchema,
} from '@weaverse/hydrogen/react-router';
import { forwardRef } from 'react';

interface VideoProps extends WeaverseComponentProps {
  heading: string;
  description: string;
  videoUrl: string;
}

const Video = forwardRef<HTMLElement, VideoProps>((props, ref) => {
  const { heading, description, videoUrl, ...rest } = props;
  return (
    <section ref={ref} {...rest}>
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-12 lg:py-16 sm:text-center">
        <h2 className="mb-4 text-4xl font-extrabold tracking-tight text-gray-900">
          {heading}
        </h2>
        <p className="font-light text-gray-500 sm:text-lg md:px-20 lg:px-38 xl:px-48">
          {description}
        </p>
        <iframe
          className="mx-auto mt-8 h-64 w-full max-w-2xl rounded-lg lg:mt-12 sm:h-96"
          src={videoUrl}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </section>
  );
});

export default Video;
```

Export a `schema` object from the file to define the component's schema with default data and settings to be used in the **Weaverse Studio**.

```tsx:app/sections/video/index.tsx (continued)
export const schema = createSchema({
  type: 'video',
  title: 'Video',
  settings: [
    {
      group: 'Video',
      inputs: [
        {
          type: 'text',
          name: 'heading',
          label: 'Heading',
          defaultValue: 'Learn More About Our Products',
          placeholder: 'Learn More About Our Products',
        },
        {
          type: 'textarea',
          name: 'description',
          label: 'Description',
          defaultValue: `Watch these short videos to see our products in action. Learn how to use them and what makes them special. See demos of our products being used in real-life situations. The videos provide extra details and showcase the full capabilities of what we offer. If you're interested in learning more before you buy, be sure to check out these informative product videos.`,
          placeholder: 'Video description',
        },
        {
          type: 'text',
          name: 'videoUrl',
          label: 'Video URL',
          defaultValue: 'https://www.youtube.com/embed/-akQyQN8rYM',
          placeholder: 'https://www.youtube.com/embed/-akQyQN8rYM',
        },
      ],
    },
  ],
});
```

What if your component needs to fetch data from Shopify API or any third-party API?

**Weaverse** provide a powerful `loader` function to fetch data from _any_ API, and it's run on the **server-side** 🤯😎.

Just export a `loader` function from your component:

```tsx:app/sections/video/index.tsx (loader example)
import type { WeaverseComponentLoaderArgs } from '@weaverse/hydrogen/react-router';
import { CACHE_DEFAULT } from '~/utils/cache';
import { unwrapStorefront } from '~/utils/storefront';

export const loader = async ({ weaverse, data }: WeaverseComponentLoaderArgs) => {
  // HOMEPAGE_SEO_QUERY is a gql() document from @shopify/hydrogen.
  return weaverse.storefront.graphql(HOMEPAGE_SEO_QUERY, {
    variables: {handle: data.collection.handle},
    cache: CACHE_DEFAULT,
  }).then(unwrapStorefront);
};
```

And then you can use the data in your component with `Component.props.loaderData` 🤗

Don't forget to register your new section in `app/weaverse/components.ts`:

```typescript
import * as Video from "~/sections/video";

export const components: WeaverseComponent[] = [
  // ... existing components
  Video,
];
```

### Manage content and style your pages within Weaverse Studio

Weaverse provides a convenient way to customize your theme inside the **Weaverse Studio**. You can add new sections, customize existing ones, and change the theme settings.

### Project Structure

```
app/
├── components/      # Reusable UI components
│   ├── layout/     # Header, footer, navigation
│   ├── product/    # Product-specific components
│   └── cart/       # Cart components
├── sections/       # Weaverse page builder sections
├── routes/         # React Router routes (with locale prefix)
├── graphql/        # GraphQL queries and fragments
├── utils/          # Helper functions
└── weaverse/       # Weaverse configuration

Key configuration files:
- biome.json        # Code formatting and linting
- app/graphql/     # Typed gql() documents
- react-router.config.ts # React Router configuration
- vite.config.ts   # Vite bundler configuration
```

### Development Tools

- **Development server**: http://localhost:3456
- **GraphiQL API browser**: http://localhost:3456/graphiql
- **Network inspector**: http://localhost:3456/debug-network
- **Weaverse Studio**: Access through your Shopify admin

### Code Quality

Before committing, always run:
```bash
npm run biome:fix    # Fix linting/formatting
npm run typecheck    # Check TypeScript types
npm run typecheck    # Validate TypeScript and GraphQL documents
```

## References

- [Weaverse docs](https://weaverse.io/docs)
- [Hydrogen docs](https://shopify.dev/custom-storefronts/hydrogen)
- [React Router](https://reactrouter.com/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Biome](https://biomejs.dev/)

## License

This project is provided under the [MIT License](LICENSE).

---

Let **Weaverse** & **Aspen** empower your furniture store with top-notch performance, elegant design, and unmatched customization possibilities perfectly tailored for the home furniture and interior design industry! 🪑🏠
