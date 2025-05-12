# Hydrogen upgrade guide: 2025.1.2 to 2025.1.3

----

## Features

### Add support for `v3_routeConfig` future flag. [#2722](https://github.com/Shopify/hydrogen/pull/2722)

#### Step: 1. Update your `vite.config.ts`. [#2722](https://github.com/Shopify/hydrogen/pull/2722)

[docs](https://remix.run/docs/en/main/start/future-flags#v3_routeconfig)
[#2722](https://github.com/Shopify/hydrogen/pull/2722)
export default defineConfig({
 plugins: [
   hydrogen(),
   oxygen(),
   remix({
     presets: [hydrogen.v3preset()],  // Update this to hydrogen.v3preset()
     future: {
       v3_fetcherPersist: true,
       v3_relativeSplatPath: true,
       v3_throwAbortReason: true,
       v3_lazyRouteDiscovery: true,
       v3_singleFetch: true,
       v3_routeConfig: true, // add this flag
     },
   }),
   tsconfigPaths(),
 ],

#### Step: 2. Update your `package.json` and install the new packages. Make sure to match the Remix version along with other Remix npm packages and ensure the versions are 2.16.1 or above. [#2722](https://github.com/Shopify/hydrogen/pull/2722)

[docs](https://remix.run/docs/en/main/start/future-flags#v3_routeconfig)
[#2722](https://github.com/Shopify/hydrogen/pull/2722)
"devDependencies": {
  ...
  "@remix-run/fs-routes": "^2.16.1",
  "@remix-run/route-config": "^2.16.1",

#### Step: 3. Add a `routes.ts` file. This is your new Remix route configuration file. [#2722](https://github.com/Shopify/hydrogen/pull/2722)

[docs](https://remix.run/docs/en/main/start/future-flags#v3_routeconfig)
[#2722](https://github.com/Shopify/hydrogen/pull/2722)
import {flatRoutes} from '@remix-run/fs-routes';
import {type RouteConfig} from '@remix-run/route-config';
import {hydrogenRoutes} from '@shopify/hydrogen';

export default hydrogenRoutes([
  ...(await flatRoutes()),
  // Manual route definitions can be added to this array, in addition to or instead of using the `flatRoutes` file-based routing convention.
  // See https://remix.run/docs/en/main/guides/routing for more details
]) satisfies RouteConfig;

----
