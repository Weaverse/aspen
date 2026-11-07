# Upstream candidate validation — November 6, 2026

Candidate: local replacement for PR #123 base `39da61a2`, not yet committed.
Lockfile SHA-256: `9d71e7e5a6c5a68b40ee204fd6d53450b6bd751dc323cc5875f6673af942c175`.
Host: native macOS arm64; npm 10.9.8.

| Runtime | Strict npm ci / selected dependency graph | Codegen / types / build | Sanitizer / footer / localization | Dev / worker SSR / client transform / optimizer |
| --- | --- | --- | --- | --- |
| 22.18.0 | Passed | Passed | Passed | Passed |
| 22.23.4 | Passed | Passed | Passed | Passed |
| 24.11.0 | Passed | Passed | Passed | Passed |
| 24.22.2 | Passed | Passed | Passed | Passed |

The runtime probe uses the real server module graph and Oxygen worker with
an intentionally empty environment. It does not claim rendered Shopify catalog
or Studio acceptance. The production build emits existing toolchain/chunk-size
deprecation warnings; those warnings are not treated as test failures.

## Full dependency graph audit

`npm ls --all` exits nonzero. The selected Node toolchain and Motion graph
checks above do not establish a clean full graph. Comparing the committed and
candidate locks shows existing Hydrogen/React Router peer-range mismatch,
use-resize-observer React 18 peer declarations, fdir/picomatch peer mismatch,
and missing video-library peers (`three` and `@svta/cml-*`). The relevant
packages, peer declarations and missing peer entries are unchanged from HEAD.
These are recorded rather than changing storefront/video dependencies or
downgrading React Router as part of the Node runtime migration. Full-graph
acceptance remains outstanding; `legacy-peer-deps` is still required by the
existing graph. Evidence: `/tmp/aspen-upstream-full-graph.log`.

## Outstanding acceptance

- MiniOxygen security suite fails against published 4.2.3: credentialed
  preflight, external-symlink disclosure and HTTP-stack disclosure. See
  [comparison](node-upstream-security.md). These failures are retained, not
  skipped, marked expected, or weakened to make CI green.
- Native Linux and Windows runs for this replacement candidate have not run.
  CI now defines 12 jobs: four Node selections across three native hosts.
- Home/product/collection HTTP checks returned 200 on Node 22.18.0 with
  approved QA configuration. This does not establish Studio acceptance.
- Disposable Studio still reports Preview Connection Lost / Timeout on the
  replacement candidate. With explicit user approval, Apps on device was reset
  and re-enabled only for studio.weaverse.io, then the QA page was reloaded;
  the timeout remains. No LIVE/TEST/STARTER project content was edited.
  Old edit/publish evidence remains historical; edits, revalidation and
  persistence still need fresh confirmation after reconnect is resolved.
- Published-CLI onboarding remains blocked by Weaverse/weaverse#565; CLI
  5.8.0 still removes the committed lockfile. A source workaround is not a
  substitute for a released CLI fix.

## Local evidence

The install/graph/build/type/security/localization/runtime logs are kept outside
the repository under `/tmp/aspen-new-policy-*`, `/tmp/aspen-policy-24.11-*`,
`/tmp/aspen-policy-v22.23.4-validation.log` and
`/tmp/aspen-policy-v24.22.2-validation.log`.
