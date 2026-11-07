# Historical Node compatibility evidence

The following snapshot applies only to PR #123 commit `39da61a2`, before the November 6 policy revision in #114. It is not evidence for the upstream replacement candidate, and its old Node support requirements are superseded.

### Node compatibility

The Shopify CLI, Vite, and GraphQL Code Generator versions are pinned for the
Node 22.0.0 lower boundary. The Vite override also keeps `vite-node` on the
same compatible Vite version. The CI matrix pins npm 10.9.8 to match the
local compatibility checks. Do not upgrade these packages independently
without repeating clean installation, dependency-graph checks, codegen,
typecheck, build, and `node scripts/check-dev-runtime.mjs` on the minimum
Node version and the representative released-major matrix below.
The locale and translation tests use `vite-node` because Node 22.0.0 cannot
execute TypeScript test files directly.
`@graphql-codegen/cli` stays on 6.3.1 because 7.2.0 resolves
`@whatwg-node/promise-helpers` 2.0.1 (engines `>=22.15.0`) into five codegen
packages, which fails `npm ci --engine-strict` on Node 22.0.0; 6.3.1 keeps
promise-helpers 1.3.2 (engines `>=16.0.0`). This was verified by an actual
install attempt on 2026-11-03, not inferred from registry metadata alone.

The dev runtime check verifies CLI startup, client compilation, dependency
optimization, and a request through an Oxygen test worker. That worker imports
the real `server.ts` graph, renders React on the server, and runs the actual
footer sanitizer. It calls the real fetch handler and requires the exact
missing-session configuration guard, rejecting a generic HTTP 500. The probe
uses an empty env file and needs no merchant data.
Catalog rendering and a Studio connection still need separately approved
Shopify/Weaverse test configuration. CI preserves sanitized dev diagnostics
as an artifact when this check fails.

Aspen uses the local ESM compatibility package in `vendor/sanitize-html`,
based on upstream 2.18.1 with its security fixes. It changes only the module
format so htmlparser2 12 can be imported directly on Node 22.0.0. See its
`UPSTREAM.md` for provenance and update instructions. Native sanitizer tests
and the existing footer tests cover direct Node execution as well as SSR.
The CLI's esbuild dependency is pinned to the patched 0.28.1 release.

`vendor/mini-oxygen` adapts upstream 4.2.2 to Aspen's Node >=22 contract,
with scoped security fixes for asset containment, credential-free asset CORS,
HTTP error diagnostics and a bundled stack-frame suffix check.
This is Aspen-maintained compatibility coverage, not a Shopify support claim.
Its upstream license, dependency ranges, provenance and update procedure are
recorded in `vendor/mini-oxygen/UPSTREAM.md`.

Keep `install-links=true` in `.npmrc`. It makes npm install the local packages
as packed dependencies, so the root security overrides apply normally.
Clean installation must also pass `npm ls` for MiniOxygen, body-parser,
undici, Vite, esbuild and the Motion packages; install exit status alone does
not prove the intended graph. Keep both `.npmrc` and `package-lock.json`
when scaffolding a storefront.

### Published Shopify CLI boundary

All Aspen scripts (`npm run dev`, `build`, `preview`, and the CI runtime
check) execute the locally pinned `@shopify/cli` 3.94.3 from
`node_modules`; CI asserts that resolution on every matrix entry. The
published `@shopify/cli` 4.x line declares `engines: >=22.12.0` and crashes
before startup on Node 22.0.0–22.11.0 with
`SyntaxError: … 'enableCompileCache'` (verified against the exact registry
artifacts for 4.6.0 on 22.0.0 and 22.7.0; 22.8.0 starts but remains outside
this theme's toolchain). Do not install a global or `npx`-fetched CLI 4.x
for this theme on those versions. Making the published CLI itself work on
Node 22.0.0 is a Shopify-side change and stays an explicitly open item; this
document reflects demonstrated behavior rather than a support claim.

Recorded local verification on macOS arm64 with npm 10.9.8 (results checked
against the current dependency graph on 2026-11-02; the full 22.0.0 floor
suite — strict clean install, dependency-graph check, pinned-CLI assertion,
codegen, typecheck, sanitizer/footer/locale/translation tests, build and the
dev-runtime check — was re-executed end to end on 2026-11-03 and passed):

| Node | Clean install | Codegen, typecheck, build | Dev and optimizer | Home/product/collection |
| --- | --- | --- | --- | --- |
| 22.0.0 | Passed | Passed | Passed | HTTP 200 with approved test configuration |
| 22.7.0 | Passed | Passed | Passed | Not tested |
| 22.8.0 | Passed | Passed | Passed | Not tested |
| 22.11.0 | Passed | Passed | Passed | Not tested |
| 22.12.0 | Passed | Passed | Passed | Not tested |
| 22.23.4 | Passed | Passed | Passed | HTTP 200 with approved test configuration |
| 23.11.1 | Passed | Passed | Passed | HTTP 200 with approved test configuration |
| 24.22.2 | Passed | Passed | Passed | HTTP 200 with approved test configuration |
| 25.9.0 | Passed | Passed | Passed | HTTP 200 with approved test configuration |
| 26.13.0 | Passed | Passed | Passed | HTTP 200 with approved test configuration |

The sanitizer, footer, locale, and translation tests passed on every listed
version. The ESM sanitizer also passed all 286 tests from the upstream
2.18.1 suite on Node 22.0.0, adapting only the suite's initial module load to ESM. Fault
injection confirmed the dev check fails for both a broken server module and
a broken fetch handler, and that its saved diagnostics redact secret values.

Other Node 22 patches have not been individually tested. The CI workflow
defines floor/latest checks on native Linux, macOS, and Windows, plus macOS
checks for 22.7.0/22.8.0 (the compile-cache API boundary) and 22.11.0/22.12.0
(the former toolchain engine boundary). Native Linux and Windows validation
is **BLOCKED** locally because those hosts are unavailable; these CI jobs
have not yet been executed for this change. All ten versions in the table
passed strict clean installation, dependency-graph verification, sanitizer,
footer, codegen, typecheck, locale, translation, build and dev-runtime checks.
The recorded matrix and catalog checks use the same package manifest,
lockfile, npm configuration and Vite configuration as this branch.

These local results do not complete [issue #114](https://github.com/Weaverse/aspen/issues/114).
Native Linux/Windows execution, onboarding through a published CLI release
containing the installer fix, and the connected Studio check remain open.
The HTTP checks above are catalog route checks, not Studio acceptance.

The published Weaverse CLI 5.7.1 was independently exercised on Node 22.0.0.
Its current Aspen scaffold still reproduces the missing compile-cache API
and Motion drift. The related [CLI issue #565](https://github.com/Weaverse/weaverse/issues/565)
owns lockfile retention. A local installer fix preserves the lockfile and
uses `npm ci`; that source-level verification is not a published CLI release
or completion of the three-theme acceptance in #565.

