import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  DESKTOP_MIN_PX,
  isDesktopWidth,
  MEDIA_DESKTOP,
  MEDIA_UNTIL_DESKTOP,
  MOBILE_MAX_PX,
  TABLET_MAX_PX,
  TABLET_MIN_PX,
} from "../app/utils/breakpoints.ts";
import {
  DESKTOP_MIN_PX as TEST_DESKTOP_MIN_PX,
  TABLET_MAX_PX as TEST_TABLET_MAX_PX,
} from "./responsive-test-widths.mjs";

test("tablet extends through 1032px and desktop starts at 1033px", () => {
  assert.equal(TABLET_MAX_PX, 1032);
  assert.equal(DESKTOP_MIN_PX, 1033);
  assert.equal(TEST_TABLET_MAX_PX, TABLET_MAX_PX);
  assert.equal(TEST_DESKTOP_MIN_PX, DESKTOP_MIN_PX);
  for (const width of [1024, 1025, 1032, 1032.5]) {
    assert.equal(isDesktopWidth(width), false);
  }
  for (const width of [1033, 1440]) {
    assert.equal(isDesktopWidth(width), true);
  }
  assert.equal(MEDIA_UNTIL_DESKTOP, `(width < ${DESKTOP_MIN_PX}px)`);
  assert.equal(MEDIA_DESKTOP, `(min-width: ${DESKTOP_MIN_PX}px)`);
});

test("CSS and generated page padding share the JS desktop boundary", async () => {
  const css = await readFile(
    new URL("../app/styles/app.css", import.meta.url),
    "utf8",
  );
  for (const name of ["lg", "desktop"]) {
    assert.ok(css.includes(`--breakpoint-${name}: ${DESKTOP_MIN_PX}px;`));
  }

  const pixelMediaBoundaryValues = [
    ...css.matchAll(/\((?:(?:min|max)-width\s*:|width\s*[<>=])\s*(\d+)px\)/g),
  ].map((match) => Number(match[1]));
  assert.ok(pixelMediaBoundaryValues.includes(DESKTOP_MIN_PX));
  assert.deepEqual(
    [...new Set(pixelMediaBoundaryValues)].sort((a, b) => a - b),
    [MOBILE_MAX_PX, TABLET_MIN_PX, DESKTOP_MIN_PX],
    "raw CSS media queries must use a documented theme boundary",
  );

  const globalStyle = await readFile(
    new URL("../app/weaverse/style.tsx", import.meta.url),
    "utf8",
  );
  assert.ok(globalStyle.includes("import { DESKTOP_MIN_PX }"));
  assert.match(globalStyle, /@media \(min-width: \$\{DESKTOP_MIN_PX\}px\)/);
});
