import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { generateDataFromSchema } from "@weaverse/hydrogen";
import { schema as accordionSchema } from "~/sections/accordion";
import {
  resolveCollectionListLayout,
  schema,
} from "~/sections/collection-list-dynamic";
import {
  loader as collectionItemsLoader,
  schema as collectionItemsSchema,
} from "~/sections/collection-list-dynamic/collection-items";
import { schema as collectionListPageSchema } from "~/sections/collection-list-page/collections-items";
import { schema as countdownSchema } from "~/sections/countdown";
import { schema as featuredProductsSchema } from "~/sections/featured-products";
import { schema as heroVideoSchema } from "~/sections/hero-video";
import { schema as hotspotsSchema } from "~/sections/hotspots";
import { schema as imageWithTextSchema } from "~/sections/image-with-text";
import { schema as mainProductSchema } from "~/sections/main-product";
import { schema as mapSchema } from "~/sections/map/map";
import { schema as promotionGridItemsSchema } from "~/sections/promotion-grid/grid-items";
import { schema as scrollingTextSchema } from "~/sections/scrolling-text";
import { schema as singleProductSchema } from "~/sections/single-product";

test("Featured collections exposes Layout first on the parent", () => {
  const firstGroup = schema.settings?.[0];
  const firstInput = firstGroup?.inputs[0];

  assert.equal(firstGroup?.group, "Layout");
  assert.equal(firstInput?.name, "layout");
  assert.equal(firstInput?.label, "Layout");
});

test("Featured collection overlay settings are shown for Styles 1 and 3", () => {
  const parentInputs = schema.settings?.flatMap((group) => group.inputs) ?? [];
  const childInputs =
    collectionItemsSchema.settings?.flatMap((group) => group.inputs) ?? [];
  const overlayInputs = parentInputs.filter(
    (input) => input.name === "overlayColor" || input.name === "overlayOpacity",
  );

  assert.equal(overlayInputs.length, 2);
  assert.equal(
    overlayInputs.find((input) => input.name === "overlayColor")?.label,
    "Effect color",
  );
  assert.equal(
    overlayInputs.find((input) => input.name === "overlayOpacity")?.label,
    "Effect opacity",
  );
  assert.equal(
    overlayInputs.find((input) => input.name === "overlayColor")?.defaultValue,
    "#000000",
  );
  assert.equal(
    overlayInputs.find((input) => input.name === "overlayOpacity")
      ?.defaultValue,
    50,
  );
  assert.equal(
    childInputs.some(
      (input) =>
        input.name === "overlayColor" || input.name === "overlayOpacity",
    ),
    false,
  );

  for (const input of overlayInputs) {
    assert.equal(typeof input.condition, "function");
    const condition = input.condition as (data: {
      layout?: string;
      children?: Array<{ type: string; layout: string }>;
    }) => boolean;
    assert.equal(condition({ layout: "grid" }), true);
    assert.equal(condition({ layout: "slider" }), false);
    assert.equal(condition({ layout: "showcase" }), true);
    assert.equal(
      condition({
        children: [{ type: "collection-list-dynamic-items", layout: "grid" }],
      }),
      true,
    );
    assert.equal(
      condition({
        children: [{ type: "collection-list-dynamic-items", layout: "slider" }],
      }),
      false,
    );
    assert.equal(
      condition({
        children: [
          { type: "collection-list-dynamic-items", layout: "showcase" },
        ],
      }),
      true,
    );
  }
});

test("Style 3 exposes a configurable hover image zoom", () => {
  const parentInputs = schema.settings?.flatMap((group) => group.inputs) ?? [];
  const zoomInput = parentInputs.find(
    (input) => input.name === "showcaseHoverZoom",
  );

  assert.equal(zoomInput?.label, "Hover image zoom");
  assert.equal(zoomInput?.defaultValue, 102);
  assert.deepEqual(zoomInput?.configs, {
    min: 100,
    max: 120,
    step: 1,
    unit: "%",
  });
  assert.equal(typeof zoomInput?.condition, "function");

  const condition = zoomInput?.condition as (data: {
    layout?: string;
    children?: Array<{ type: string; layout: string }>;
  }) => boolean;
  assert.equal(condition({ layout: "grid" }), false);
  assert.equal(condition({ layout: "slider" }), false);
  assert.equal(condition({ layout: "showcase" }), true);
  assert.equal(
    condition({
      children: [{ type: "collection-list-dynamic-items", layout: "showcase" }],
    }),
    true,
  );
});

test("legacy child layout remains authoritative when parent layout is absent", () => {
  const defaults = generateDataFromSchema(schema);

  assert.equal(defaults.layout, undefined);
  assert.equal(resolveCollectionListLayout(undefined, "slider"), "slider");
  assert.equal(resolveCollectionListLayout(undefined, "showcase"), "showcase");
  assert.equal(resolveCollectionListLayout(undefined, undefined), "grid");
  assert.equal(resolveCollectionListLayout("grid", "slider"), "grid");
});

test("the server loader keeps the collection selection bounded", async () => {
  let queriedIds: string[] = [];
  const collections = Array.from({ length: 300 }, (_, index) => ({
    id: `${index + 1}`,
  }));

  await collectionItemsLoader({
    data: { collections, gap: 16, layout: "slider" },
    weaverse: {
      storefront: {
        i18n: { country: "US", language: "EN" },
        query: async (
          _query: string,
          options: { variables: { ids: string[] } },
        ) => {
          queriedIds = options.variables.ids;
          return { nodes: [] };
        },
      },
    },
  } as never);

  assert.equal(queriedIds.length, 250);
});

test("style selectors are the first parent setting", () => {
  const schemas = [
    schema,
    accordionSchema,
    collectionListPageSchema,
    countdownSchema,
    featuredProductsSchema,
    heroVideoSchema,
    hotspotsSchema,
    imageWithTextSchema,
    mainProductSchema,
    mapSchema,
    promotionGridItemsSchema,
    scrollingTextSchema,
    singleProductSchema,
  ];

  for (const sectionSchema of schemas) {
    const firstInput = sectionSchema.settings?.[0]?.inputs[0];
    const configs =
      firstInput && "configs" in firstInput
        ? (firstInput.configs as
            | { options?: Array<{ label?: string }> }
            | undefined)
        : undefined;
    const optionLabels = configs?.options?.map((option) => option.label) ?? [];

    assert.ok(
      optionLabels.includes("Style 1"),
      `${sectionSchema.title} must expose its style selector first`,
    );
  }
});

test("section schemas do not expose Scenario terminology to merchants", () => {
  const sectionsDirectory = fileURLToPath(
    new URL("../app/sections", import.meta.url),
  );
  const getSectionFiles = (directory: string): string[] =>
    readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return getSectionFiles(entryPath);
      }
      return entry.isFile() && entry.name.endsWith(".tsx") ? [entryPath] : [];
    });

  const merchantFacingScenario = getSectionFiles(sectionsDirectory).flatMap(
    (file) =>
      readFileSync(file, "utf8")
        .split("\n")
        .map((line, index) => ({ file, line, lineNumber: index + 1 }))
        .filter(({ line }) => /"[^"\n]*Scenario[^"\n]*"/.test(line)),
  );

  assert.deepEqual(merchantFacingScenario, []);
});
