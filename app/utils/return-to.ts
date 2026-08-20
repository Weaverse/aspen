/**
 * Only allow in-app relative paths. Reject protocol-relative and absolute URLs
 * so login redirects cannot be used as an open redirect.
 */
export function safeReturnTo(request: Request, fallback = "/") {
  const returnTo = new URL(request.url).searchParams.get("return_to");
  if (
    !returnTo ||
    !returnTo.startsWith("/") ||
    returnTo.startsWith("//") ||
    returnTo.includes("\\")
  ) {
    return fallback;
  }

  return returnTo;
}
