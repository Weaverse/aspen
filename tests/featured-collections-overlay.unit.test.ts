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

  assert.match(markup, /--collection-mobile-effect-color:#CABDB7/);
  assert.match(markup, /--collection-mobile-effect-opacity:0\.9/);
  assert.doesNotMatch(markup, /group-hover/);
  assert.doesNotMatch(markup, /transition/);
  assert.match(markup, /--collection-desktop-effect-color:#FF0000/);
  assert.match(markup, /--collection-desktop-effect-opacity:0\.7/);
});

test("Style 3 supports independent tablet/mobile color and zero opacity", () => {
  const markup = renderToStaticMarkup(
    createElement(CollectionNameBackground, {
      color: "#FF0000",
      opacity: 70,
      mobileColor: "#00FF00",
      mobileOpacity: 0,
    }),
  );
  assert.match(markup, /--collection-mobile-effect-color:#00FF00/);
  assert.match(markup, /--collection-mobile-effect-opacity:0;/);
  assert.match(markup, /--collection-desktop-effect-color:#FF0000/);
  assert.match(markup, /--collection-desktop-effect-opacity:0\.7/);
});
