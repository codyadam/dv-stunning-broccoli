import { ColoredAvatar } from "@/components/shell/colored-avatar";
import { cn } from "@/lib/utils";

type OrgAvatarOrg = {
  /** Seeds the fallback color, so it must be the same id on every surface. */
  id: string;
  name: string;
  /** An uploaded logo; without one the avatar shows initials. */
  imageUrl?: string | null;
};

/** An organization's logo, falling back to its initials on a color seeded by its id. */
export function OrgAvatar({
  org,
  size = "sm",
  className,
}: {
  org: OrgAvatarOrg;
  size?: "sm" | "default" | "lg" | "xl";
  className?: string;
}) {
  return (
    <ColoredAvatar
      seed={org.id || org.name}
      alt={org.name}
      imageUrl={org.imageUrl}
      size={size}
      shape="rounded"
      className={cn("shrink-0 after:border-border/70", className)}
    />
  );
}
