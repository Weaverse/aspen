import type { AppLoadContext } from "react-router";

export function getWeaverseCsp(request: Request, context: AppLoadContext) {
  const url = new URL(request.url);
  // Get weaverse host from query params
  const weaverseHost =
    url.searchParams.get("weaverseHost") || context.env.WEAVERSE_HOST;
  const weaverseHosts = ["*.weaverse.io", "*.shopify.com", "*.myshopify.com"];
  if (weaverseHost) {
    weaverseHosts.push(weaverseHost);
  }
  const updatedCsp: {
    [x: string]: string[] | string | boolean;
  } = {
    defaultSrc: [
      "data:",
      "*.youtube.com",
      "*.youtu.be",
      "*.vimeo.com",
      "*.google.com",
      "*.google-analytics.com",
      "*.googletagmanager.com",
      "cdn.alireviews.io",
      "cdn.jsdelivr.net",
      "*.alicdn.com",
      ...weaverseHosts,
    ],
    connectSrc: ["vimeo.com", "*.google-analytics.com", ...weaverseHosts],
    styleSrc: weaverseHosts,
    // Studio navigation can omit weaverseHost; keep trusted embedding hosts allowed.
    frameAncestors: ["'self'", "https://weaverse.io", ...weaverseHosts],
  };
  return updatedCsp;
}
