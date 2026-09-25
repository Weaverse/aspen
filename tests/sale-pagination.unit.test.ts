import assert from "node:assert/strict";
import test from "node:test";
import {
  type ProductConnection,
  paginateSaleProducts,
  type SalePageVariables,
  type SaleProduct,
} from "~/utils/sale-pagination.server";

type TestProduct = SaleProduct & { title: string };

function product(id: string, onSale: boolean): TestProduct {
  return {
    id,
    title: id,
    selectedOrFirstAvailableVariant: {
      price: { amount: "10" },
      compareAtPrice: onSale ? { amount: "20" } : null,
    },
  };
}

function connection<T extends SaleProduct>(
  nodes: T[],
  cursors: string[],
  pageInfo: ProductConnection<T>["pageInfo"],
): ProductConnection<T> {
  return { nodes, edges: cursors.map((cursor) => ({ cursor })), pageInfo };
}

test("sale pagination scans light pages and hydrates only visible matches", async () => {
  const initial = connection(
    [product("p1", true), product("p2", false)],
    ["c1", "c2"],
    {
      hasPreviousPage: false,
      hasNextPage: true,
      startCursor: "c1",
      endCursor: "c2",
    },
  );
  const scanVariables: SalePageVariables[] = [];
  const hydratedIds: string[][] = [];

  const result = await paginateSaleProducts(
    initial,
    { first: 2 },
    async (variables) => {
      scanVariables.push(variables);
      return connection(
        [product("p3", true), product("p4", true)],
        ["c3", "c4"],
        {
          hasPreviousPage: true,
          hasNextPage: false,
          startCursor: "c3",
          endCursor: "c4",
        },
      );
    },
    async (ids) => {
      hydratedIds.push(ids);
      return ids.map((id) => product(id, true));
    },
  );

  assert.deepEqual(scanVariables, [{ first: 250, endCursor: "c2" }]);
  assert.deepEqual(hydratedIds, [["p3"]]);
  assert.deepEqual(
    result.nodes.map(({ id }) => id),
    ["p1", "p3"],
  );
  assert.deepEqual(result.edges, [{ cursor: "c1" }, { cursor: "c3" }]);
  assert.equal(result.pageInfo.hasNextPage, true);
});

test("sale pagination caps forward scans at four requests", async () => {
  const initial = connection([product("p0", true)], ["c0"], {
    hasPreviousPage: false,
    hasNextPage: true,
    startCursor: "c0",
    endCursor: "c0",
  });
  const scanVariables: SalePageVariables[] = [];
  let hydrated = false;

  const result = await paginateSaleProducts(
    initial,
    { first: 2 },
    async (variables) => {
      scanVariables.push(variables);
      const index = scanVariables.length;
      return connection([product(`p${index}`, false)], [`c${index}`], {
        hasPreviousPage: true,
        hasNextPage: true,
        startCursor: `c${index}`,
        endCursor: `c${index}`,
      });
    },
    async () => {
      hydrated = true;
      return [];
    },
  );

  assert.equal(scanVariables.length, 4);
  assert.ok(scanVariables.every(({ first }) => first === 250));
  assert.equal(hydrated, false);
  assert.deepEqual(
    result.nodes.map(({ id }) => id),
    ["p0"],
  );
  assert.equal(result.pageInfo.hasNextPage, true);
  // Continue after the scanned source boundary, not after the last visible
  // match, so the next request does not rescan known non-sale products.
  assert.equal(result.pageInfo.endCursor, "c4");
});

test("sale pagination preserves backward order", async () => {
  const initial = connection(
    [product("p7", true), product("p8", false)],
    ["c7", "c8"],
    {
      hasPreviousPage: true,
      hasNextPage: true,
      startCursor: "c7",
      endCursor: "c8",
    },
  );

  const result = await paginateSaleProducts(
    initial,
    { last: 2, startCursor: "after" },
    async (variables) => {
      assert.deepEqual(variables, { last: 250, startCursor: "c7" });
      return connection(
        [product("p5", true), product("p6", true)],
        ["c5", "c6"],
        {
          hasPreviousPage: false,
          hasNextPage: true,
          startCursor: "c5",
          endCursor: "c6",
        },
      );
    },
    async (ids) => ids.map((id) => product(id, true)),
  );

  assert.deepEqual(
    result.nodes.map(({ id }) => id),
    ["p6", "p7"],
  );
  assert.deepEqual(result.edges, [{ cursor: "c6" }, { cursor: "c7" }]);
  assert.equal(result.pageInfo.hasPreviousPage, true);
  assert.equal(result.pageInfo.hasNextPage, true);
});

test("sale pagination rejects a cursor that does not advance", async () => {
  const initial = connection([product("p0", false)], ["c0"], {
    hasPreviousPage: false,
    hasNextPage: true,
    startCursor: "c0",
    endCursor: "c0",
  });

  await assert.rejects(
    paginateSaleProducts(
      initial,
      { first: 2 },
      async () =>
        connection([product("p1", false)], ["c1"], {
          hasPreviousPage: true,
          hasNextPage: true,
          startCursor: "c1",
          endCursor: "c0",
        }),
      async () => [],
    ),
    /did not advance/,
  );
});
