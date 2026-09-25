import assert from "node:assert/strict";
import test from "node:test";
import {
  countCollectionProducts,
  MAX_COLLECTION_COUNT_REQUESTS,
} from "~/utils/collection-product-count.server";

test("collection count returns the exact total", async () => {
  const cursors: Array<string | null> = [];
  const pages = [
    { size: 250, hasNextPage: true, endCursor: "c1" },
    { size: 100, hasNextPage: false, endCursor: "c2" },
  ];

  const count = await countCollectionProducts(async (after) => {
    cursors.push(after);
    return pages.shift() ?? null;
  });

  assert.equal(count, 350);
  assert.deepEqual(cursors, [null, "c1"]);
});

test("collection count caps requests and returns N+", async () => {
  let requests = 0;
  const count = await countCollectionProducts(async () => {
    requests += 1;
    return {
      size: 250,
      hasNextPage: true,
      endCursor: `c${requests}`,
    };
  });

  assert.equal(requests, MAX_COLLECTION_COUNT_REQUESTS);
  assert.equal(count, "2000+");
});

test("collection count stops when the cursor does not advance", async () => {
  let requests = 0;
  const count = await countCollectionProducts(async () => {
    requests += 1;
    return { size: 250, hasNextPage: true, endCursor: null };
  });

  assert.equal(requests, 1);
  assert.equal(count, "250+");
});
