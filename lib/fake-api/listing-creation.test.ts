import assert from "node:assert/strict";
import test from "node:test";

import { createListing, getListingDraft, updateListing } from "./api";
import { readDb } from "./db";

test("first-save creation is atomic and supports deliberately unfinished drafts", async () => {
  // Run with Node's --localstorage-file pointing at an isolated test file.
  Object.defineProperty(globalThis, "window", { value: globalThis, configurable: true });
  const before = readDb().listings.length;
  const fields = {
    title: "Warehouse offering", oneLiner: "", description: "",
    members: [], autoClearingPriceUsd: null,
  };
  await assert.rejects(createListing({ ...fields, title: " " }), /Add a title/);
  await assert.rejects(createListing({
    ...fields,
    members: [{ assetId: "ast_dockside", priceUsd: 18000 }, { assetId: "ast_dockside", priceUsd: 18000 }],
  }), /only once/);
  assert.equal(readDb().listings.length, before);

  const saved = await createListing(fields);
  assert.equal(readDb().listings.length, before + 1);
  assert.equal(saved.title, fields.title);
  assert.equal(saved.members.length, 0);
  const updated = await updateListing(saved.id, {
    members: [{ assetId: "ast_dockside", priceUsd: 18000 }],
  });
  assert.equal(updated.members.length, 1);
  assert.equal(readDb().listings.length, before + 1);
  assert.deepEqual(await getListingDraft(saved.id), updated);
});
