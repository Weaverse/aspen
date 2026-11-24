import { createElement } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { isThemivoScriptPreview } from "~/utils/themivo-script-preview";

export function loader({ request }: LoaderFunctionArgs) {
  if (!isThemivoScriptPreview(new URL(request.url))) {
    throw new Response(null, { status: 404 });
  }
  return null;
}

export default function WishlistPreview() {
  return createElement("wl-page");
}
