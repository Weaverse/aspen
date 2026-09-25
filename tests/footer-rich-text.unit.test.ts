import assert from "node:assert/strict";
import test from "node:test";
import {
  isAllowedFooterHref,
  sanitizeLiveFooterHtml,
} from "~/utils/footer-rich-text";
import {
  sanitizeFooterHtml,
  sanitizeFooterTheme,
} from "~/utils/footer-rich-text.server";

test("footer HTML keeps formatting while removing executable content", () => {
  const clean = sanitizeFooterHtml(
    '<p>Hello <strong>world</strong><script>alert(1)</script><a href="javascript:alert(1)" target="_blank">bad link</a></p>',
  );

  assert.match(clean, /<strong>world<\/strong>/);
  assert.doesNotMatch(clean, /<script|javascript:/);
  assert.match(clean, /rel="noopener noreferrer"/);
});

test("the loader boundary sanitizes theme and translation footer HTML", () => {
  const response = sanitizeFooterTheme({
    theme: { bio: "<p>Bio<script>bad()</script></p>" },
    staticContent: {
      themeContent: {
        componentsLayoutFooter: {
          copyright: "<p>© Store<script>bad()</script></p>",
        },
      },
    },
    merchantOverrides: {
      themeSettings: { copyright: "<p>© Merchant<script>bad()</script></p>" },
    },
  });

  assert.doesNotMatch(String(response.theme?.bio), /<script/);
  assert.doesNotMatch(JSON.stringify(response.staticContent), /<script/);
  assert.doesNotMatch(JSON.stringify(response.merchantOverrides), /<script/);
});

test("live footer links use the same URL policy as persisted HTML", () => {
  assert.equal(isAllowedFooterHref("https://example.com"), true);
  assert.equal(isAllowedFooterHref("/pages/about"), true);
  assert.equal(isAllowedFooterHref("mailto:hello@example.com"), true);
  assert.equal(isAllowedFooterHref("javascript:alert(1)"), false);
  assert.equal(isAllowedFooterHref("java\nscript:alert(1)"), false);
  assert.equal(isAllowedFooterHref("data:text/html,unsafe"), false);
  assert.equal(isAllowedFooterHref("//example.com"), false);
});

test("live footer HTML fails closed outside the browser", () => {
  assert.equal(sanitizeLiveFooterHtml("<p>Unsanitized</p>"), "");
});
