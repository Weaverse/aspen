import assert from "node:assert/strict";
import test from "node:test";
import sanitizeHtml from "sanitize-html";

test("the sanitizer imports and runs directly on the minimum Node runtime", () => {
  assert.equal(
    sanitizeHtml(
      "<p>Hello <strong>world</strong><script>alert(1)</script></p>",
    ),
    "<p>Hello <strong>world</strong></p>",
  );
});

test("raw-text mis-closes cannot reintroduce executable markup", () => {
  const html = sanitizeHtml(
    "<textarea></textarea/><img src=x onerror=alert(1)>",
    { allowedTags: ["textarea"], allowedAttributes: {} },
  );
  assert.doesNotMatch(html, /<img\b|<script\b/i);
});

test("SVG animations cannot retarget a link to a script URL", () => {
  const html = sanitizeHtml(
    '<svg><a href="#safe"><animate attributeName="href" values="#safe;javascript:alert(1)" /></a></svg>',
    {
      allowedTags: ["svg", "a", "animate"],
      allowedAttributes: { a: ["href"], animate: ["attributename", "values"] },
    },
  );
  assert.doesNotMatch(html, /<animate\b/i);
});
