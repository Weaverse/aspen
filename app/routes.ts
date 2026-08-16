import {
  index,
  prefix,
  type RouteConfig,
  route,
} from "@react-router/dev/routes";
import { hydrogenRoutes } from "@shopify/hydrogen";

export default hydrogenRoutes([
  route("robots.txt", "routes/[robots.txt].tsx"),
  ...prefix(":locale?", [
    index("routes/($locale)._index.tsx"),
    route("search", "routes/($locale).search.tsx"),
    route(
      ":shopid/orders/:token/authenticate",
      "routes/($locale).$shopid.orders.$token.authenticate.tsx",
    ),
    route("sitemap.xml", "routes/($locale).[sitemap.xml].tsx"),
    route(
      "sitemap/:type/:page.xml",
      "routes/($locale).sitemap.$type.$page[.xml].tsx",
    ),
    route("pages/:pageHandle", "routes/($locale).pages.$pageHandle.tsx"),
    route("contact", "routes/($locale).contact.tsx"),
    route("discount/:code", "routes/($locale).discount.$code.tsx"),
    ...prefix("api", [
      route(
        ":version/graphql.json",
        "routes/($locale).api.$version.[graphql.json].tsx",
      ),
      route("countries", "routes/($locale).api.countries.ts"),
      route("customer", "routes/($locale).api.customer.ts"),
      route("featured-items", "routes/($locale).api.featured-items.ts"),
      route("klaviyo", "routes/($locale).api.klaviyo.ts"),
      route("predictive-search", "routes/($locale).api.predictive-search.ts"),
      route("product", "routes/($locale).api.product.ts"),
      route("products", "routes/($locale).api.products.ts"),
      route("wishlist", "routes/($locale).api.wishlist.ts"),
      route(
        "review/:productHandle",
        "routes/($locale).api.review.$productHandle.ts",
      ),
    ]),
    ...prefix("blogs", [
      index("routes/($locale).blogs._index.tsx"),
      route(":blogHandle", "routes/($locale).blogs.$blogHandle._index.tsx"),
      route(
        ":blogHandle/:articleHandle",
        "routes/($locale).blogs.$blogHandle.$articleHandle.tsx",
      ),
    ]),
    ...prefix("policies", [
      index("routes/($locale).policies._index.tsx"),
      route(":policyHandle", "routes/($locale).policies.$policyHandle.tsx"),
    ]),
    ...prefix("cart", [
      index("routes/($locale).cart.tsx"),
      route("add/:variantId", "routes/($locale).cart.add.$variantId.ts"),
      route(":lines", "routes/($locale).cart.$lines.tsx"),
    ]),
    ...prefix("collections", [
      index("routes/($locale).collections._index.tsx"),
      route(
        ":collectionHandle",
        "routes/($locale).collections.$collectionHandle.tsx",
      ),
    ]),
    ...prefix("products", [
      index("routes/($locale).products._index.tsx"),
      route(":productHandle", "routes/($locale).products.$productHandle.tsx"),
    ]),
    route("account/authorize", "routes/($locale).account_.authorize.ts"),
    route("account/login", "routes/($locale).account_.login.tsx"),
    route("account/logout", "routes/($locale).account_.logout.ts"),
    route("account", "routes/($locale).account.tsx", [
      route("profile", "routes/($locale).account.profile.tsx"),
      route("edit", "routes/($locale).account.edit.tsx"),
      route("addresses", "routes/($locale).account.addresses.tsx"),
      route("address/:id", "routes/($locale).account.address.$id.tsx"),
      ...prefix("orders", [
        index("routes/($locale).account.orders._index.tsx"),
        route(":id", "routes/($locale).account.orders.$id.tsx"),
      ]),
      route("*", "routes/($locale).account.$.tsx"),
    ]),
    route("*", "routes/($locale).$.tsx"),
  ]),
]) satisfies RouteConfig;
