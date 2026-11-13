import { RiFileZipLine, RiFolderLine } from "@remixicon/react";

import { SiBitbucket, SiGithub, SiGitlab } from "@/components/ui/brand-icons";
import type { SourceChannel } from "@/lib/sources/channels";
import { cn } from "@/lib/utils";

export function SourceChannelIcon({
  channel,
  className,
}: {
  channel: SourceChannel;
  className?: string;
}) {
  const iconClassName = cn("size-4 shrink-0", className);
  switch (channel) {
    case "github":
      return <SiGithub className={iconClassName} />;
    case "gitlab":
      return <SiGitlab className={iconClassName} />;
    case "bitbucket":
      return <SiBitbucket className={iconClassName} />;
    case "upload":
      return <RiFileZipLine className={iconClassName} />;
    case "folder":
      return <RiFolderLine className={iconClassName} />;
  }
}
