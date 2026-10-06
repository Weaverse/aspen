import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  DESKTOP_MIN_PX,
  isDesktopWidth,
  MEDIA_DESKTOP,
  MEDIA_UNTIL_DESKTOP,
  TABLET_MAX_PX,
} from "../app/utils/breakpoints.ts";

test("tablet extends through 1032px and desktop starts at 1033px", () => {
  assert.equal(TABLET_MAX_PX, 1032);
  assert.equal(DESKTOP_MIN_PX, 1033);
  for (const width of [1024, 1025, 1032, 1032.5]) {
    assert.equal(isDesktopWidth(width), false);
  }
  for (const width of [1033, 1440]) {
    assert.equal(isDesktopWidth(width), true);
  }
  assert.equal(MEDIA_UNTIL_DESKTOP, `(width < ${DESKTOP_MIN_PX}px)`);
  assert.equal(MEDIA_DESKTOP, `(min-width: ${DESKTOP_MIN_PX}px)`);
});

test("CSS breakpoints stay synchronized with the JS desktop boundary", async () => {
  const css = await readFile(
    new URL("../app/styles/app.css", import.meta.url),
    "utf8",
  );
  for (const name of ["lg", "desktop"]) {
    assert.ok(css.includes(`--breakpoint-${name}: ${DESKTOP_MIN_PX}px;`));
  }
  assert.doesNotMatch(css, /@media[^{]*(?:1024|1025)px/);
});
