"use client";

import { ActivityTrayView } from "@/components/activity/activity-tray";
import { useInventoryActivity } from "@/components/inventory/inventory-activity-provider";
import { activityStatusLabel, activitySummary } from "@/lib/activity/jobs";

export function InventoryActivityTray({ raised = false }: { raised?: boolean }) {
  const activity = useInventoryActivity();
  return (
    <ActivityTrayView
      label="Inventory activity"
      summary={activitySummary(activity.jobs)}
      jobs={activity.jobs}
      statusLabel={activityStatusLabel}
      expanded={activity.expanded}
      raised={raised}
      onExpandedChange={activity.setExpanded}
      onClear={activity.clear}
    />
  );
}
