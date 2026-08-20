import { StorefrontError } from "~/components/root/storefront-error";

export function GenericError({
  error: _error,
  statusCode = 500,
}: {
  error?: unknown;
  statusCode?: number;
}) {
  return <StorefrontError statusCode={statusCode} />;
}
