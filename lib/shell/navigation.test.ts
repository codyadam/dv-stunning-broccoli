import assert from "node:assert/strict";
import test from "node:test";
import { getNavbarBreadcrumbs } from "./breadcrumbs";
import { navIsActive } from "./nav";

test("owned listing details and editors share Inventory navigation", () => {
  for (const [pathname, owned] of [
    ["/listings/owned", true],
    ["/listings/owned/edit", false],
    ["/listings/new/edit", false],
  ] as const) {
    assert.equal(navIsActive(pathname, "/inventory", owned), true);
    assert.equal(navIsActive(pathname, "/inventory/listings", owned), true);
    assert.equal(navIsActive(pathname, "/inventory/assets", owned), false);
    assert.equal(navIsActive(pathname, "/browse", owned), false);
    assert.equal(getNavbarBreadcrumbs(pathname, owned).sectionHref, "/inventory/listings");
  }
});

test("other vendors' listings retain Marketplace navigation", () => {
  assert.equal(navIsActive("/listings/other", "/browse"), true);
  assert.equal(navIsActive("/listings/other", "/inventory"), false);
  assert.equal(getNavbarBreadcrumbs("/listings/other").sectionHref, "/browse");
  assert.equal(navIsActive("/assets/owned/edit", "/inventory/assets"), true);
  assert.equal(getNavbarBreadcrumbs("/assets/owned/edit").sectionHref, "/inventory/assets");
});
