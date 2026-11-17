import { InventoryActivityProvider } from "@/components/inventory/inventory-activity-provider";

export default function InventoryLayout({ children }: { children: React.ReactNode }) {
  return <InventoryActivityProvider>{children}</InventoryActivityProvider>;
}
