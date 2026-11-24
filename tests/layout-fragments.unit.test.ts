import assert from "node:assert/strict";
import test from "node:test";
import { parse, visit } from "graphql";
import { LAYOUT_QUERY } from "../app/utils/root.server";
test("composed layout documents define each menu fragment once and resolve every spread", () => {
  const document = parse(LAYOUT_QUERY);
  const fragments = document.definitions.filter(
    (d) => d.kind === "FragmentDefinition",
  );
  const names = fragments.map((d) => d.name.value);
  assert.equal(names.length, new Set(names).size);
  assert.deepEqual(
    new Set(names),
    new Set([
      "Shop",
      "Menu",
      "MenuItem",
      "ParentMenuItem",
      "ParentMenuItem2",
      "ChildMenuItem",
    ]),
  );
  visit(document, {
    FragmentSpread(node) {
      assert.ok(names.includes(node.name.value));
    },
  });
  const base = fragments.find((f) => f.name.value === "MenuItem");
  const fields = base.selectionSet.selections
    .filter((s) => s.kind === "Field")
    .map((s) => s.name.value);
  for (const key of [
    "id",
    "url",
    "title",
    "type",
    "resource",
    "resourceId",
    "tags",
  ]) {
    assert.ok(fields.includes(key));
  }
});
