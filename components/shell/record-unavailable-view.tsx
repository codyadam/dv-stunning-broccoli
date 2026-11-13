import Link from "next/link";

import { PageContainer } from "@/components/shell/page-layout";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";

/** A record page whose record is missing or failed to load, with a way back and, on failure, a retry. */
export function RecordUnavailableView({
  title,
  description,
  href,
  action,
  onRetry,
}: {
  title: string;
  description: string;
  href: string;
  action: string;
  onRetry?: () => void;
}) {
  return (
    <PageContainer layout="full-normal">
      <Empty className="min-h-48">
        <EmptyHeader>
          <EmptyTitle>{title}</EmptyTitle>
          <EmptyDescription>{description}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="flex-row justify-center">
          {onRetry ? <Button onClick={onRetry}>Try again</Button> : null}
          <Button variant="outline" render={<Link href={href} />}>
            {action}
          </Button>
        </EmptyContent>
      </Empty>
    </PageContainer>
  );
}
