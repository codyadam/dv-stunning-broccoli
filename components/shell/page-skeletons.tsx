import { PageContainer } from "@/components/shell/page-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Loading skeletons, one per page. Each mirrors its page's PageContainer
 * layout and key fixed dimensions (control heights, row heights, column
 * widths) so the real page streams in without layout shift.
 */

/** Browse rows: asset deck, title, one-liner and vendor, then the price. */
export function MarketListingRowsSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-md border border-border bg-card">
      {Array.from({ length: rows }).map((_, index) => (
        <li
          key={index}
          className="grid grid-cols-1 items-center gap-4 px-4 py-3.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-6"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-12 w-[72px] shrink-0 place-items-center">
              <Skeleton className="size-10 rounded-[10px]" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <Skeleton className="h-5 w-2/3 max-w-sm" />
              <Skeleton className="my-0.5 h-3 w-full max-w-lg" />
              <div className="mt-1 flex items-center gap-1.5">
                <Skeleton className="size-6 shrink-0 rounded-md" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 sm:justify-end">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="size-7 rounded-md" />
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * For a page's whole loader: shows at once and holds still. The route's copy hands over to the
 * page's on the way in, and a reveal delay or pulse restarting at the handover would blank it.
 */
const HELD_LOADER_CLASS = "[&_[data-slot=skeleton]]:animate-none";

/** Default widths in px of the All types view's columns, from Asset to Sales. */
const INVENTORY_GHOST_COLUMN_WIDTHS = [292, 112, 80, 96, 180, 120, 128, 120, 64] as const;

const INVENTORY_GHOST_ROWS = 10;

const INVENTORY_GHOST_LINE_WIDTHS = ["w-4/5", "w-3/5", "w-full", "w-1/2", "w-2/3", "w-3/4"] as const;

function InventoryGhostBone({ className }: { className?: string }) {
  return (
    <Skeleton
      className={cn("h-3.5 rounded-sm motion-reduce:animate-none", className)}
    />
  );
}

/** A SmartView row: its checkbox, then one bone per column at the column's default width. */
function GhostTableRow({ lineWidth }: { lineWidth: (column: number) => string }) {
  return (
    <div className="flex h-9 w-max min-w-full items-center gap-4 pr-3">
      <span className="flex h-full w-6 shrink-0 items-center pl-3">
        <InventoryGhostBone className="size-4 shrink-0" />
      </span>
      {INVENTORY_GHOST_COLUMN_WIDTHS.map((width, column) => (
        <div key={column} className="shrink-0" style={{ width }}>
          <InventoryGhostBone className={lineWidth(column)} />
        </div>
      ))}
    </div>
  );
}

/** The inventory table's first page: the All types columns, clipped at the frame like the live ones. */
export function InventoryTableSkeleton() {
  return (
    <div className="w-full min-w-0 overflow-hidden">
      <GhostTableRow lineWidth={() => "w-1/2"} />
      <div className="flex flex-col gap-px py-1">
        {Array.from({ length: INVENTORY_GHOST_ROWS }).map((_, row) => (
          <GhostTableRow
            key={row}
            lineWidth={(column) =>
              INVENTORY_GHOST_LINE_WIDTHS[(row + column) % INVENTORY_GHOST_LINE_WIDTHS.length] ??
              "w-full"
            }
          />
        ))}
      </div>
      <div className="flex justify-end py-2 pr-3">
        <InventoryGhostBone className="h-7 w-44 rounded-md" />
      </div>
    </div>
  );
}

function AssetTypeTabBone({ labelWidth }: { labelWidth: string }) {
  return (
    <div className="flex flex-col items-center gap-2 justify-self-center pt-1 pb-3">
      <InventoryGhostBone className="size-7 rounded-[25%]" />
      <div className="flex h-4 items-center">
        <InventoryGhostBone className={cn("h-3", labelWidth)} />
      </div>
    </div>
  );
}

/** Inventory: search and asset-type bar, the assets table, then Draft listings and Live listings. */
export function InventoryPageSkeleton() {
  return (
    <PageContainer layout="full-normal" className={cn("flex flex-col gap-8", HELD_LOADER_CLASS)}>
      <div className="flex flex-col items-center gap-5">
        <InventoryGhostBone className="h-12 w-full max-w-xl rounded-full" />
        <div className="grid auto-cols-fr grid-flow-col gap-x-6">
          {["w-14", "w-16", "w-13"].map((width) => (
            <AssetTypeTabBone key={width} labelWidth={width} />
          ))}
        </div>
      </div>
      <section className="flex flex-col gap-4">
        <div className="flex min-h-8 items-center justify-between gap-3">
          <InventoryGhostBone className="h-6 w-24" />
          <div className="flex shrink-0 items-center gap-1">
            <InventoryGhostBone className="h-7 w-20 rounded-md" />
            <InventoryGhostBone className="size-7 rounded-md" />
          </div>
        </div>
        <InventoryTableSkeleton />
      </section>
    </PageContainer>
  );
}

/** Inventory asset record: header, linked-source card, description, and the 280px card rail. */
export function AssetRecordPageSkeleton() {
  return (
    <PageContainer layout="content" className="flex flex-col gap-6">
      <div className="flex items-start gap-3">
        <Skeleton className="size-10 shrink-0 rounded-md" />
        <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-5 w-24" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20 rounded-sm" />
              <Skeleton className="h-6 w-14 rounded-sm" />
              <Skeleton className="h-6 w-16 rounded-sm" />
            </div>
          </div>
          <Skeleton className="h-8 w-16 shrink-0" />
        </div>
      </div>

      <div className="grid gap-6 @3xl/main:grid-cols-[minmax(0,1fr)_280px]">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="overflow-hidden rounded-md border border-border bg-card">
            <div className="flex h-10 items-center justify-between gap-4 border-b border-border px-3">
              <div className="flex gap-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex items-center gap-2 px-3 py-2.5">
              <Skeleton className="size-4 shrink-0 rounded-sm" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Card size="sm">
            <CardHeader>
              <Skeleton className="h-5 w-36" />
            </CardHeader>
            <CardContent className="flex flex-col items-start gap-1.5">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-28" />
            </CardContent>
          </Card>
          <Card size="sm">
            <CardHeader>
              <Skeleton className="h-5 w-14" />
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {Array.from({ length: 2 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-3"
                >
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card size="sm">
            <CardHeader>
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="mt-2 h-8 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}

/** Listing record as a buyer sees it: title and purchase panel, the asset browser, then overview and aside. */
export function ListingRecordPageSkeleton() {
  return (
    <PageContainer layout="content" className="flex flex-col gap-6">
      <div className="grid overflow-hidden rounded-md border border-border bg-card md:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="flex min-w-0 flex-col gap-3 p-6">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-5 w-full max-w-prose" />
        </div>
        <div className="flex flex-col gap-5 border-t border-border bg-muted/40 p-7 md:border-t-0 md:border-l">
          <Skeleton className="h-11 w-36" />
          <div className="flex flex-col gap-2.5">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
      </div>
      <div className="flex flex-col overflow-hidden rounded-md border border-border bg-card">
        <div className="flex items-center gap-3 border-b border-border p-3">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-7 w-48 rounded-full" />
          <Skeleton className="ml-auto hidden h-8 w-56 md:block" />
        </div>
        <div className="grid lg:h-[clamp(420px,calc(100dvh-24rem),720px)] lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className="flex flex-col gap-1 border-b border-border p-1.5 lg:border-r lg:border-b-0">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 px-2.5 py-2">
                <Skeleton className="size-7 shrink-0 rounded-sm" />
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
          <div className="hidden flex-col gap-4 p-6 lg:flex">
            <div className="flex items-center gap-3">
              <Skeleton className="size-9 shrink-0 rounded-sm" />
              <Skeleton className="h-5 w-48" />
            </div>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-3">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-4 w-full max-w-prose" />
          <Skeleton className="h-4 w-full max-w-prose" />
          <Skeleton className="h-4 w-3/4 max-w-prose" />
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      </div>
    </PageContainer>
  );
}
