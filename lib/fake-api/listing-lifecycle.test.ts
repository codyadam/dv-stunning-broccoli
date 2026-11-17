import assert from "node:assert/strict";
import test from "node:test";

import {
  createListing, getAsset, getListing, getListingDraft, publishListing,
  submitListing, unpublishListing, updateAsset, updateListing,
} from "./api";
import { inventoryStatus } from "../inventory/status";

test("reviewed content, publication and shared asset edits stay consistent", async (t) => {
  Object.defineProperty(globalThis, "window", { value: globalThis, configurable: true });
  t.mock.timers.enable({ apis: ["Date"], now: Date.now() });
  const asset = await getAsset("ast_yardslot");
  const draft = await createListing({
    title: "Scheduling lifecycle verification",
    oneLiner: "A scheduling codebase for warehouse operators.",
    description: "A dock scheduling service with carrier booking, warehouse appointments, and operations reporting. ".repeat(3),
    members: [{ assetId: asset.id, priceUsd: 2000 }],
    autoClearingPriceUsd: 1500,
  });
  assert.equal(inventoryStatus(await getAsset(asset.id)), "draft");
  assert.equal((await submitListing(draft.id)).status, "in_review");
  assert.equal((await getAsset(asset.id)).contentLocked, true);
  await assert.rejects(updateAsset(asset.id, { description: null }), /review/);
  await assert.rejects(updateListing(draft.id, { title: "Changed during review" }), /still running/);
  t.mock.timers.tick(60_000);
  assert.equal((await getListingDraft(draft.id)).status, "ready");
  assert.equal((await getAsset(asset.id)).contentLocked, false);

  await publishListing(draft.id);
  assert.equal((await getListing(draft.id)).workspace?.status, "live");
  assert.equal(inventoryStatus(await getAsset(asset.id)), "published");
  await assert.rejects(updateAsset(asset.id, { description: null }), /hide any live listings/);
  await updateAsset(asset.id, { priceUsd: 3000 });
  assert.equal((await getListing(draft.id)).buyNowPrice, 2000);
  assert.equal((await getListingDraft(draft.id)).autoClearingPriceUsd, 1500);

  await unpublishListing(draft.id);
  assert.equal((await getListingDraft(draft.id)).status, "ready");
  await updateAsset(asset.id, { description: null });
  assert.equal((await getListingDraft(draft.id)).status, "draft");
  assert.equal((await getListing(draft.id)).qcVerdicts.length, 0);
  assert.equal((await getListing(draft.id)).dvQualityCertified, false);
  await assert.rejects(publishListing(draft.id), /quality checks pass/);
  await submitListing(draft.id);
  t.mock.timers.tick(60_000);
  assert.equal((await getListingDraft(draft.id)).status, "needs_fixes");
  await updateAsset(asset.id, { description: asset.description, priceUsd: asset.priceUsd });
  await submitListing(draft.id);
  t.mock.timers.tick(60_000);
  assert.equal((await getListingDraft(draft.id)).status, "ready");
});
