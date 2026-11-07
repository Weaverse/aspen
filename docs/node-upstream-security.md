# Published upstream security comparison

Candidate: `@shopify/mini-oxygen@4.2.3`, `sanitize-html@2.18.1`.
Compared with the Aspen forks at `39da61a2` on November 6, 2026.

| Removed local patch | Published upstream 4.2.3 | Acceptance status |
| --- | --- | --- |
| Asset realpath containment, including symlinks | Checks URL path strings; does not resolve symlinks before serving | Unresolved: external symlink can expose a file outside the assets root |
| Credential-free public asset preflight | Reflects request Origin and enables credentials in OPTIONS | Unresolved: local CORS hardening is not present |
| Generic HTTP error response with server-side diagnostics | Node server returns error details | Unresolved: local stack-disclosure hardening is not present |
| Generic worker-entry failure response | Returns stack/message in the development error response | Unresolved: local stack-disclosure hardening is not present |
| Correct bundled stack formatter suffix test | Still compares indexOf with a possibly negative suffix position | Unresolved: formatter regression remains |

These are development/preview server behaviors, not changes to the deployed
storefront's commerce handlers. They must not be silently treated as fixed
because the dependency is now upstream. The retained MiniOxygen regression
suite loads the installed published package, never deleted vendored files,
and intentionally fails for missing asset/CORS/HTTP protections (confirmed
locally on Node 22.18.0: the credentialed preflight, external symlink and
HTTP-stack checks fail against the registry package). The former
formatter and worker-handler tests extracted functions from bundled source text;
those fork-specific implementation tests are removed rather than asserting
upstream bundle formatting. Their unresolved behavior is documented above. Completing security acceptance
requires an upstream resolution or an explicit maintainer decision about these
differences. No monkey-patch, postinstall patch, or replacement fork is added.

The sanitizer fork changed module format only. Published sanitize-html 2.18.1
supports the new Node policy and retains the upstream security implementation.
Its native runtime and sanitizer/footer regression tests remain required.
Root dependency security overrides for body-parser/qs, both Undici graphs,
lodash, nanoid, ws and youch are retained and must be checked against npm ls.
