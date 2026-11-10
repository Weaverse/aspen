# Upstream candidate validation — November 6, 2026

Candidate: PR #123 commit `e6adae2b`. The macOS results below describe
the same lockfile and runtime policy.
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
  [comparison](node-upstream-security.md). The tests remain available as manual
  diagnostics, with unchanged assertions, outside CI by maintainer decision.
- [Native CI for `e6adae2b`](https://github.com/Weaverse/aspen/actions/runs/42330647480)
  passed strict install, the selected graph, codegen, types,
  localization/sanitizer/footer tests, production build and
  dev/SSR/optimizer across all 12 jobs. All 12 jobs
  failed the MiniOxygen security step.
- [Earlier run for `3f2d5b5b`](https://github.com/Weaverse/aspen/actions/runs/42329514244)
  reproduced a Windows Node 24.22.2 dev timeout on retry. The later run
  passed the same probe with the same timeout. The cause of the earlier
  timeout remains unknown.
- Home/product/collection HTTP checks returned 200 on Node 22.18.0 with
  approved QA configuration. This does not establish Studio acceptance.
- Disposable Studio QA remains blocked on the replacement candidate. On the
  November 7 recheck, the same design-mode URL on localhost:3460 rendered
  the saved QA heading when opened as a top-level Chrome tab. The Studio
  bridge script loaded and reported that the standalone tab had no
  `getDraftPage` endpoint. In Studio, the iframe pointed to the same URL,
  but the heading was absent and Studio reported it could not reach the
  local preview. Earlier Chrome DevTools evidence showed a blocked Local
  Network Access request even after the approved site permission reset.
  This isolates the observed failure to the embedded preview path, but
  does not establish the cause of every reconnect timeout. Fresh edit,
  revalidation and persistence checks remain blocked.
- Published CLI onboarding remains blocked by [Weaverse/weaverse#565](https://github.com/Weaverse/weaverse/issues/565).
  The installer in the published CLI 5.9.0 package still removes
  `package-lock.json`. Fresh onboarding with the committed lockfile remains
  unverified.

## Local evidence

The install/graph/build/type/security/localization/runtime logs are kept outside
the repository under `/tmp/aspen-new-policy-*`, `/tmp/aspen-policy-24.11-*`,
`/tmp/aspen-policy-v22.23.4-validation.log` and
`/tmp/aspen-policy-v24.22.2-validation.log`.
