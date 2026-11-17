import assert from "node:assert/strict";
import test from "node:test";

import { createDraftListings, getListingDraft, submitListing, updateListing } from "./api";
import { readDb } from "./db";

test("listing creation requires assets and rejected changes leave the record intact", async () => {
  // Run with Node's --localstorage-file pointing at an isolated test file.
  Object.defineProperty(globalThis, "window", { value: globalThis, configurable: true });
  const before = readDb().listings.length;
  for (const mode of ["all", "per_asset"] as const) {
    await assert.rejects(createDraftListings([], mode), /Pick at least one asset/);
    assert.equal(readDb().listings.length, before);
  }
  await assert.rejects(createDraftListings(["ast_dockside", "ast_dockside"], "all"), /only once/);
  assert.equal(readDb().listings.length, before);

  const { ids } = await createDraftListings(["ast_dockside"], "all");
  assert.equal(ids.length, 1);
  const original = await getListingDraft(ids[0]!);
  assert.equal(original.members[0]?.asset.id, "ast_dockside");
  assert.equal(original.members[0]?.priceUsd, 18000);
  assert.ok(original.title.trim());

  await assert.rejects(updateListing(original.id, { members: [] }), /Add at least one asset/);
  await assert.rejects(updateListing(original.id, { title: "  " }), /Add a title/);
  await assert.rejects(submitListing(original.id), /one-liner/);
  assert.deepEqual(await getListingDraft(original.id), original);

  const saved = await updateListing(original.id, {
    title: "Warehouse operations",
    oneLiner: "Warehouse management codebase",
    description: "A warehouse operations codebase with receiving, slotting, and wave picking.",
  });
  assert.equal(saved.title, "Warehouse operations");
  assert.equal(saved.members.length, 1);
});
