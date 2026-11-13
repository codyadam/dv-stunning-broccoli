import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** A codebase's languages as badges. */
export function LanguageBadges({
  languages,
  className,
}: {
  languages: readonly string[];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap justify-end gap-1", className)}>
      {languages.map((language) => (
        <Badge key={language} variant="blue">
          {language}
        </Badge>
      ))}
    </div>
  );
}
