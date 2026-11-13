import { DEMO_USER, DEMO_VENDOR_ID, VENDORS } from "@/lib/fake-api/fixtures";
import type { DemoUser, Vendor } from "@/lib/fake-api/types";

/** The signed-in person and the vendor organization they act for; the demo has exactly one of each. */
type Session = {
  user: DemoUser;
  vendor: Vendor;
};

function demoVendor(): Vendor {
  const vendor = VENDORS.find((candidate) => candidate.id === DEMO_VENDOR_ID);
  if (!vendor) throw new Error(`Fixtures have no vendor ${DEMO_VENDOR_ID}`);
  return vendor;
}

export const SESSION: Session = { user: DEMO_USER, vendor: demoVendor() };
