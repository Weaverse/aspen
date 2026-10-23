import assert from "node:assert/strict";
import test from "node:test";
import {
  backgroundInputs,
  sectionBackgroundInputs,
} from "~/components/background-image";
import { components } from "~/weaverse/components";

const sectionTypes = [
  "feature-collection",
  "featured-products",
  "single-product",
  "promotion-grid",
  "video-embed",
  "contact-stores",
  "map",
  "accordion",
  "instagram",
  "image-with-text",
];

test("section color defaults do not change the global background inputs", () => {
  const sharedColor = backgroundInputs.find(
    (input) => input.name === "backgroundColor",
  );
  assert.ok(sharedColor && "defaultValue" in sharedColor);
  assert.equal(sharedColor.defaultValue, "");
  for (const color of ["#F9F9F9", "#EAEAEA"]) {
    const inputs = sectionBackgroundInputs(color);
    assert.deepEqual(
      inputs.map((input) => input.name),
      backgroundInputs
        .filter((input) => input.name !== "backgroundFor")
        .map((input) => input.name),
    );
    const customColor = inputs.find(
      (input) => input.name === "backgroundColor",
    );
    assert.ok(customColor && "defaultValue" in customColor);
    assert.equal(customColor.defaultValue, color);
    assert.equal(sharedColor.defaultValue, "");
  }
  assert.equal(
    backgroundInputs.filter((input) => input.name === "backgroundFor").length,
    1,
  );
});

test("the ten scoped parent sections expose one shared background control set", () => {
  for (const type of sectionTypes) {
    const schema = components.find(
      (component) => component.schema?.type === type,
    )?.schema;
    assert.ok(schema, type);
    const inputs = schema.settings?.flatMap((group) => group.inputs) ?? [];
    assert.equal(
      inputs.filter(
        (input) => "name" in input && input.name === "backgroundFor",
      ).length,
      0,
      `${type}: no scope selector`,
    );
    for (const name of [
      "backgroundColor",
      "backgroundImage",
      "backgroundFit",
      "backgroundPosition",
    ]) {
      assert.equal(
        inputs.filter((input) => "name" in input && input.name === name).length,
        1,
        `${type}: ${name}`,
      );
    }
  }
});

test("background scope selectors outside the ten sections remain available", () => {
  for (const type of ["videos", "image-gallery", "testimonial"]) {
    const schema = components.find(
      (component) => component.schema?.type === type,
    )?.schema;
    assert.ok(schema);
    assert.equal(
      schema.settings
        ?.flatMap((group) => group.inputs)
        .filter((input) => "name" in input && input.name === "backgroundFor")
        .length,
      1,
    );
  }
});

test("requested section defaults agree between Studio controls and presets", () => {
  for (const [type, color] of [
    ["featured-products", "#FFFFFF"],
    ["map", "#F9F9F9"],
    ["accordion", "#EAEAEA"],
    ["instagram", "#EDEDED"],
    ["image-with-text", "#DBDBDB"],
  ]) {
    const schema = components.find(
      (component) => component.schema?.type === type,
    )?.schema;
    assert.ok(schema);
    const input = schema.settings
      ?.flatMap((group) => group.inputs)
      .find((field) => "name" in field && field.name === "backgroundColor");
    assert.ok(input && "defaultValue" in input);
    assert.equal(input.defaultValue, color, `${type}: control default`);
    assert.equal(
      schema.presets?.backgroundColor,
      color,
      `${type}: preset default`,
    );
  }
});
