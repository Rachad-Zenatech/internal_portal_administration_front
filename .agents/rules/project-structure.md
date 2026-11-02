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
* **Components:** used by one feature go in `src/components/<Feature>/`; used by several go in `src/components/common/`. `src/components/ui/` is only for shadcn primitives.
* **New API calls** go in `src/services/<feature>Service.ts` through `apiClient`, not `fetch` inside components (some older pages still do this; move those calls when you touch them). Types go in `src/types/<feature>.ts`.
* **Don't add loose files** to `src/pages/` or `src/components/`.
* **When you move a file,** update every import to it (and the imports inside it), then run `npm run build` (`tsc -b && vite build`).
<!-- project-structure:end -->
