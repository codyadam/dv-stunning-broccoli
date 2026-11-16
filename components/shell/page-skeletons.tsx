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
    <PageContainer
      layout="flush"
      className="grid grid-cols-[1.5rem_minmax(0,1fr)_1.5rem] pb-32 @max-[40rem]/main:pb-40 @min-[64rem]/main:grid-cols-[minmax(1.5rem,1fr)_minmax(0,49.5rem)_2.5rem_20rem_minmax(1.5rem,1fr)]"
    >
      <div className="dark col-span-full grid min-h-[22.5rem] grid-cols-subgrid bg-background py-8 text-foreground @min-[30rem]/main:min-h-[18.75rem] @min-[64rem]/main:row-start-2 @min-[64rem]/main:min-h-[calc(21rem+1px)] @min-[64rem]/main:pt-10 @min-[64rem]/main:pb-12 dark:border-b dark:border-border dark:bg-white/[0.03]">
        <div className="col-start-2 col-end-3 flex min-w-0 flex-col">
          <div className="flex min-h-8 items-center justify-between gap-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24 @min-[40rem]/main:hidden" />
          </div>
          <div className="text-record-title mt-5 flex flex-col">
            <div className="flex h-[1lh] items-center">
              <Skeleton className="h-[0.72em] w-full max-w-[38rem]" />
            </div>
            <div className="flex h-[1lh] items-center">
              <Skeleton className="h-[0.72em] w-3/5 max-w-[20rem]" />
            </div>
            <div className="flex h-[1lh] items-center @min-[30rem]/main:hidden">
              <Skeleton className="h-[0.72em] w-2/5" />
            </div>
          </div>
          <div className="mt-3 flex max-w-[62ch] flex-col text-[1.0625rem] leading-[1.6]">
            <div className="flex h-[1lh] items-center">
              <Skeleton className="h-[0.7em] w-full" />
            </div>
            <div className="flex h-[1lh] items-center">
              <Skeleton className="h-[0.7em] w-1/4" />
            </div>
            <div className="flex h-[1lh] items-center @min-[30rem]/main:hidden">
              <Skeleton className="h-[0.7em] w-1/3" />
            </div>
          </div>
          <div className="mt-auto flex flex-wrap items-center gap-x-6 gap-y-2 pt-6">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="hidden h-5 w-24 @min-[40rem]/main:block" />
          </div>
        </div>
      </div>

      <div className="relative z-10 col-start-2 col-end-3 mt-6 @max-[40rem]/main:fixed @max-[40rem]/main:inset-x-0 @max-[40rem]/main:bottom-0 @max-[40rem]/main:z-30 @max-[40rem]/main:mt-0 @max-[40rem]/main:overflow-hidden @max-[40rem]/main:rounded-t-3xl @max-[40rem]/main:border-t @max-[40rem]/main:border-border @max-[40rem]/main:bg-card/85 @max-[40rem]/main:pb-[env(safe-area-inset-bottom)] @max-[40rem]/main:shadow-[0_-12px_32px_-16px_rgb(0_0_0/0.25)] @max-[40rem]/main:backdrop-blur-xl @min-[64rem]/main:col-start-4 @min-[64rem]/main:col-end-5 @min-[64rem]/main:row-span-3 @min-[64rem]/main:row-start-2 @min-[64rem]/main:mt-0 @min-[64rem]/main:pt-10">
        <div className="absolute inset-x-0 top-0 flex justify-center pt-2 @min-[40rem]/main:hidden">
          <span className="h-1 w-9 rounded-full bg-muted-foreground/30" />
        </div>
        <div className="grid content-start overflow-hidden rounded-2xl border border-border bg-card @max-[40rem]/main:grid-rows-[auto_0fr] @max-[40rem]/main:rounded-none @max-[40rem]/main:border-0 @max-[40rem]/main:bg-transparent @min-[40rem]/main:grid-cols-2 @min-[64rem]/main:sticky @min-[64rem]/main:top-6 @min-[64rem]/main:grid-cols-1">
          <div className="flex flex-col gap-5 p-6 @max-[40rem]/main:flex-row @max-[40rem]/main:items-center @max-[40rem]/main:justify-between @max-[40rem]/main:gap-3 @max-[40rem]/main:px-5 @max-[40rem]/main:pt-6 @max-[40rem]/main:pb-4 @min-[40rem]/main:border-r @min-[40rem]/main:border-border @min-[64rem]/main:border-r-0">
            <div className="flex flex-col gap-1 @max-[40rem]/main:gap-0">
              <div className="flex h-5 items-center @max-[40rem]/main:h-4">
                <Skeleton className="h-3.5 w-14 @max-[40rem]/main:h-3" />
              </div>
              <div className="flex h-9 items-center @max-[40rem]/main:h-7">
                <Skeleton className="h-7 w-32 @max-[40rem]/main:h-5 @max-[40rem]/main:w-24" />
              </div>
            </div>
            <div className="flex flex-col gap-2.5 @max-[40rem]/main:flex-row @max-[40rem]/main:gap-2">
              <Skeleton className="h-10 w-full @max-[40rem]/main:w-[5.5rem]" />
              <Skeleton className="h-10 w-full @max-[40rem]/main:w-[6.5rem]" />
            </div>
          </div>
          <div className="min-h-0 overflow-hidden @max-[40rem]/main:invisible">
            <div className="flex items-center gap-2.5 border-t border-border px-6 py-5 @min-[40rem]/main:border-t-0 @min-[64rem]/main:border-t">
              <Skeleton className="size-8 shrink-0" />
              <div className="flex h-9 flex-col justify-center gap-1.5">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
            <div className="flex flex-col gap-2 border-t border-border px-6 py-4">
              <div className="flex h-4 items-center">
                <Skeleton className="h-3 w-14" />
              </div>
              <div className="flex h-5 gap-1.5">
                <Skeleton className="h-5 w-14" />
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-12" />
              </div>
            </div>
            <div className="flex flex-col gap-6 border-t border-border p-6">
              <div className="flex h-7 items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
              <div className="flex flex-col gap-5">
                <div className="flex gap-3">
                  <Skeleton className="size-8 shrink-0 rounded-full" />
                  <div className="flex flex-1 flex-col gap-0.5">
                    <div className="flex h-[1.425rem] items-center">
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex h-5 items-center">
                        <Skeleton className="h-3.5 w-full" />
                      </div>
                      <div className="flex h-5 items-center">
                        <Skeleton className="h-3.5 w-2/3" />
                      </div>
                      <div className="hidden h-5 items-center @min-[64rem]/main:flex">
                        <Skeleton className="h-3.5 w-1/3" />
                      </div>
                    </div>
                  </div>
                </div>
                <Skeleton className="h-[4.6875rem] w-full" />
                <Skeleton className="h-5 w-28" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="@container/assets col-start-2 col-end-3 mt-6 min-w-0 @min-[64rem]/main:row-start-3 @min-[64rem]/main:mt-10">
        <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card @min-[46rem]/assets:min-h-[21rem]">
          <div className="flex shrink-0 flex-col gap-3 border-b border-border px-5 py-3 @min-[30rem]/assets:flex-row @min-[30rem]/assets:items-center @min-[30rem]/assets:gap-4">
            <div className="flex h-6 items-center">
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex min-w-0 flex-1 items-center">
              <Skeleton className="h-7 w-24 rounded-full" />
            </div>
            <Skeleton className="h-8 w-full @min-[30rem]/assets:w-60" />
          </div>
          <div className="grid min-h-0 flex-1 @min-[46rem]/assets:grid-cols-[19.5rem_minmax(0,1fr)]">
            <div className="flex flex-col gap-0.5 border-b border-border p-2 @min-[46rem]/assets:border-r @min-[46rem]/assets:border-b-0">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="flex h-[3.375rem] items-center gap-3 px-3">
                  <Skeleton className="size-5 shrink-0" />
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-3.5 w-14" />
                </div>
              ))}
            </div>
            <div className="flex min-w-0 flex-col gap-6 p-6">
              <div className="flex h-14 items-center gap-3 @min-[30rem]/assets:h-7">
                <Skeleton className="size-5 shrink-0" />
                <Skeleton className="h-5 w-48" />
                <Skeleton className="ml-auto h-5 w-20" />
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-1">
                  <Skeleton className="h-10 w-[7.75rem]" />
                  <Skeleton className="h-10 w-[5.75rem]" />
                  <Skeleton className="h-10 w-40" />
                </div>
                <Skeleton className="h-[5.5rem] w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="col-start-2 col-end-3 mt-12 flex min-w-0 flex-col gap-4 @min-[64rem]/main:row-start-4 @min-[64rem]/main:mt-14">
        <div className="flex h-4 items-center">
          <Skeleton className="h-3 w-36" />
        </div>
        <div className="flex max-w-[68ch] flex-col gap-2.5">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </PageContainer>
  );
}
