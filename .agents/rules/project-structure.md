---
trigger: model_decision
description: Project directory layout and code organization.
---

<!-- project-structure:start -->
## Project Structure

```text
src/
  assets/                   # Images and icons
  components/               # Reusable UI, one folder per feature
    AppShell/               # Layout chrome: sidebar, top bar, navigation, notifications
    ChartOfAccounts/        # Chart of accounts table and add-account dialog
    Configurations/         # Business contact dialogs and payee banking editor
    Dashboard/              # Dashboard charts, cards and recent transactions
    Tasks/                  # Task board, list, detail panel and form dialog
    common/                 # Shared by several pages: error boundary, loading screen, route guards
    ui/                     # shadcn/ui primitives (button, dialog, ...); don't put feature code here
  hooks/                    # Custom React hooks
  lib/                      # App-wide helpers: auth context, env, storage, utils
  pages/                    # One folder per feature/route group
    AccountReceivable/      # AR invoices, quotes, customer quote view and billing workflows
    Auth/                   # Login and pending-access screens
    Configurations/         # Users, roles and permission settings
    Dashboard/              # Home dashboard
    Logs/                   # Audit and system logs
    Purchasing/             # Purchase requests, approvals, wire transfers and recurring payments
    Reports/                # Reports page (not currently routed)
    Settings/               # Settings page (not currently routed)
    Tasks/                  # Task board for request follow-ups
    UploadFiles/            # Uploaded files archive
  services/                 # API calls: apiClient + one <feature>Service.ts per backend area
  template/                 # Spreadsheet templates (bank reconciliation workbook)
  types/                    # TypeScript types, one file per feature
  utils/                    # Pure helper functions
  App.tsx                   # Web routes (lazy-loaded pages)
  main.tsx                  # Web entry: providers and router
```

### Where new code goes

* **New page:** `src/pages/<Feature>/`. Pages that belong together share a folder; a `.native.tsx` variant sits next to its web file.
* **Split pages and dialogs.** A big page/dialog stays the entry point and sits next to a folder named after it (`generateInvoice/`, `requestDetail/`...):
  * `hooks/` - `use<Name>.ts` is the composer; `use<Name>Data|Actions|Derived|State*.ts` hold the state, queries, handlers and derived values, in the original order.
  * `sections/` - JSX blocks that read from the composer's state via a single `s` (or `v`) prop.
  * `types.ts`, `constants.ts`, `utils.ts`, `components/` - what used to be module-level in the page.
  * `<Name>Body.tsx` - only for pages with early-return guards (loading / not-found): the page keeps the hooks and guards, the Body renders once they pass.
  Add new state or handlers to the matching hook and new markup to a section; keep the entry file small.
* **Large feature folders** (`Purchasing`, `AccountReceivable`) keep route pages at the top level and put supporting code in sub-folders: `fields/` (autocompletes, pickers, form fields), `dialogs/` or `modals/` (dialogs, drawers), `components/` (tables, steppers, badges, threads) and `utils/` (pure helpers). Put new supporting files in the matching sub-folder.
* **Components:** used by one feature go in `src/components/<Feature>/`; used by several go in `src/components/common/`. `src/components/ui/` is only for shadcn primitives.
* **New API calls** go in `src/services/<feature>Service.ts` through `apiClient`, not `fetch` inside components (some older pages still do this; move those calls when you touch them). Types go in `src/types/<feature>.ts`.
* **Don't add loose files** to `src/pages/` or `src/components/`.
* **When you move a file,** update every import to it (and the imports inside it), then run `npm run build` (`tsc -b && vite build`).
<!-- project-structure:end -->
