import type { ReactNode } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { avatarColorFromSeed, orgInitials } from "@/lib/shell/org-utils";
import { cn } from "@/lib/utils";

type ColoredAvatarProps = {
  seed: string;
  alt: string;
  imageUrl?: string | null;
  size?: "sm" | "default" | "lg" | "xl";
  shape?: "circle" | "rounded";
  className?: string;
  children?: ReactNode;
};

export function ColoredAvatar({
  seed,
  alt,
  imageUrl,
  size = "sm",
  shape = "circle",
  className,
  children,
}: ColoredAvatarProps) {
  const initials = orgInitials(alt);

  return (
    <Avatar
      size={size}
      shape={shape}
      className={cn("bg-muted", className)}
      aria-label={alt}
    >
      {imageUrl ? <AvatarImage src={imageUrl} alt={alt} /> : null}
      <AvatarFallback
        className="font-medium text-white"
        style={{ backgroundColor: avatarColorFromSeed(seed) }}
      >
        {initials || "?"}
      </AvatarFallback>
      {children}
    </Avatar>
  );
}
