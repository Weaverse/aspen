import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  CollectionCardOverlay,
  CollectionNameBackground,
} from "~/sections/collection-list-dynamic/collection-card-overlay";

test("featured collection overlay is transparent until hover", () => {
  const markup = renderToStaticMarkup(
    createElement(CollectionCardOverlay, {
      color: "#FF0000",
      opacity: 70,
    }),
  );

  assert.match(markup, /opacity-0/);
  assert.match(
    markup,
    /group-hover:opacity-\[var\(--collection-overlay-opacity\)\]/,
  );
  assert.match(markup, /background-color:#FF0000/);
  assert.match(markup, /--collection-overlay-opacity:0\.7/);
});

test("Style 3 collection name background has no hover effect", () => {
  const markup = renderToStaticMarkup(
    createElement(CollectionNameBackground, {
      color: "#FF0000",
      opacity: 70,
    }),
  );

  assert.match(markup, /opacity-\[var\(--collection-overlay-opacity\)\]/);
  assert.doesNotMatch(markup, /group-hover/);
  assert.doesNotMatch(markup, /transition/);
  assert.match(markup, /background-color:#FF0000/);
  assert.match(markup, /--collection-overlay-opacity:0\.7/);
});
