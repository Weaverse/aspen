import { StorefrontError } from "~/components/root/storefront-error";

export function NotFound({ type: _type = "page" }: { type?: string }) {
  return <StorefrontError statusCode={404} title="Page not found" />;
}
