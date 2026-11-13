# DataVendor

A frontend-only copy of the DataVendor vendor app: browse the marketplace, open a listing, open an inventory asset, and add codebases and raw data to your inventory. There is no backend; a small fake API in the browser serves invented data.

## Run it

Requires Node 26 (see `.nvmrc`).

```bash
git clone <this repo> datavendor && cd datavendor
nvm use            # or install the Node version in .nvmrc
npm install
npm run dev        # http://localhost:3000
```

Other scripts: `npm run build`, `npm start`, `npm run lint`, `npm run typecheck`.

You are always signed in as Jordan Lee of Fernhill Labs, a vendor. Changes persist in localStorage; **Reset demo data** in the user menu (bottom left) restores the fixtures.

## Tour

| Page | Route | Code |
| --- | --- | --- |
| Browse | `/browse` | `app/(app)/browse/` |
| Listing | `/listings/[id]` | `app/(app)/listings/[id]/` |
| Asset | `/assets/[id]` | `app/(app)/assets/[id]/` |
| Inventory | `/inventory` | `app/(app)/inventory/` |

- **Shell**: sidebar, header and breadcrumbs in `components/shell/`, navigation in `lib/shell/nav.ts`.
- **Ingestion**: the Add asset dialog and its source picker (`components/inventory/add-asset-*.tsx`, `components/sources/`), the page-wide `.zip` drop zone (`components/inventory/inventory-page-drop-zone.tsx`) and the upload tray (`components/inventory/inventory-activity-*.tsx`). Uploads simulate transfer progress, then the asset reads its data for a few seconds while the inventory polls.
- **UI kit**: shadcn components on Base UI in `components/ui/`, shared patterns (table, floating bar, type tabs) in `components/patterns/`, theme tokens in `app/globals.css`.

### Fake API

Everything lives in `lib/fake-api/`:

- `hooks.ts`: the TanStack Query hooks the pages use.
- `api.ts`: async functions behind the hooks, with a short simulated delay.
- `db.ts`: state persisted to localStorage.
- `fixtures.ts`: the seed listings, vendors and inventory.
- `types.ts`: the data types.
