# sanitize-html ESM compatibility package

Source: `sanitize-html@2.18.1`, MIT licensed by Apostrophe Technologies, Inc.

- Tarball: https://registry.npmjs.org/sanitize-html/-/sanitize-html-2.18.1.tgz
- Integrity: `sha512-2X5lC8fYla8YaT8g73Nj+HcLWXan5dLyCWLgVvaOmfw7JI78IRsyNtIDytTHdn7hBQbIkCah7Zbmd5jabzeDig==`
- Upstream: https://github.com/apostrophecms/apostrophe/tree/main/packages/sanitize-html

The upstream CommonJS entry requires the ESM-only htmlparser2 12 package.
That needs Node >=22.12.0 when loaded with `require()`. Aspen supports Node
22.0.0, which can load the same dependencies through standard ESM imports.

`index.js` is the upstream source with exactly seven module-format changes:
the six top-level `require()` statements become ESM imports, and
`module.exports = sanitizeHtml` becomes `export default sanitizeHtml`.
All sanitizer logic, security fixes, and dependency ranges are preserved.
The local manifest declares ESM, the compatible Node floor, and the upstream
dependency ranges. The package is private to prevent accidental publication.

When updating, unpack the exact upstream npm release, verify its published
integrity, compare the sanitizer logic, and reapply only these module-format
changes. Keep the upstream license. Run the native sanitizer tests, footer
tests, and the complete Node 22 CI matrix before adopting the update. Check
upstream releases/advisories explicitly: npm audit cannot assess changes to
this local compatibility package's source code.
