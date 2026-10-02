# Enterprise Administration Portal - Frontend (`internal_portal_administration_front`)

Enterprise administrative and accounting operations frontend for ZenaTech. Built with **React 19**, **TypeScript**, **Vite 8**, **Tailwind CSS v4**, and **shadcn/ui**.

Delivers complete interfaces for **Accounts Receivable (AR)**, **Invoice Generation**, **Purchase Requests**, **Multi-Tier Batch Approvals**, **Wire Transfers**, **Recurring Schedules**, **QuickBooks Online Export**, **Tasks Management**, and **Master Entity Maintenance**.

---

## System Architecture Diagram

```mermaid
flowchart TD
    subgraph BrowserApp [Desktop Browser :5174]
        Root[React 19 Application Root]
        Router[React Router v7 Route Engine]
        Shell[AppShell Layout & Collapsible Sidebar]
    end

    subgraph StateAndCache [Client State & Data Sync]
        AuthContext[Auth Context & Session Tokens]
        TanStackQuery[TanStack React Query v5 Cache]
        SSEListener[useNotifications EventSource Hook]
        ThemeEngine[Next Themes: Light / Dark Mode]
    end

    subgraph FunctionalModules [Admin Operations Modules]
        Purchasing[Purchasing & Wire Requests Table]
        Approvals[Batch & My Approvals Dashboard]
        Invoicing[Accounts Receivable & Invoice Builder]
        QuickBooks[QuickBooks Online Sync & Export Modal]
        Recurring[Recurring Payments & Dates Builder]
        MasterData[Master Entities: COA, Entities, Vendors]
        Tasks[Workflow Task Assignment Board]
        Audit[Audit Logs & Telemetry Console]
    end

    subgraph UIComponents [Component System]
        Shadcn[shadcn/ui Radix Primitives]
        VirtualTable[TanStack React Table v8 + Virtualizer]
        Charts[Recharts Financial Metrics]
        Toasts[Sonner Dynamic Action Toasts]
    end

    subgraph BackendAPI [FastAPI Administration Backend :8002]
        RestEndpoints[/api/purchasing, /api/ar, /api/quickbooks]
        SSEStream[/api/notifications/stream]
    end

    Root --> Router
    Router --> Shell
    Shell --> FunctionalModules
    FunctionalModules --> UIComponents

    FunctionalModules <--> StateAndCache
    AuthContext -->|Route Authorization| Router
    TanStackQuery -->|REST API with Cookies| RestEndpoints
    SSEListener -->|Real-time Approval Events| SSEStream
```

---

## Technologies & System Specifications

| Category | Technology | Description |
| :--- | :--- | :--- |
| **Framework & Build** | [React 19](https://react.dev/), [Vite 8](https://vitejs.dev/) | Sub-millisecond HMR development server pinned to port `5174` |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Strict type definitions across accounting models, forms, and API contracts |
| **Styling & Theme** | [Tailwind CSS v4](https://tailwindcss.com/), `@shadcn/react`, `next-themes` | Modern utility CSS engine with dark mode tokens and responsive design |
| **Data Fetching & Cache**| [TanStack React Query v5](https://tanstack.com/query) | Stale-time caching, optimistic updates, and background refetching |
| **Data Grids & Virtualization** | [TanStack React Table v8](https://tanstack.com/table), [TanStack Virtual](https://tanstack.com/virtual) | Virtualized data grids handling thousands of transactions without DOM lag |
| **Drag & Drop** | `@hello-pangea/dnd` | Reorderable lists, priority boards, and workflow assignments |
| **Charts & Visualizations**| [Recharts](https://recharts.org/) | Purchasing volume, spending category breakdowns, and AR aging charts |
| **Animations & UI Primitives** | [Framer Motion](https://www.framer.com/motion/), `vaul`, `sonner`, Radix UI | Bottom sheet drawers, toast alerts, accessible dropdowns, and dialogs |
| **Spreadsheet Utilities**| `exceljs`, `date-fns`, `clsx`, `tailwind-merge` | Client-side spreadsheet generation and export utilities |

---

## Key Modules & Features

1. **Purchasing & Wire Transfer Hub (`/purchasing/*`)**:
   - Create, inspect, edit, and track multi-currency purchase orders.
   - Comprehensive wire transfer fields (SWIFT, BIC, IBAN, Intermediary Banking details).
   - In-app PDF invoice preview and Gemini AI automated quote extraction.
2. **Approval Engine (`/purchasing/approvals`)**:
   - `MyApprovals` personal queue and `BatchApproval` interface for multi-selection approval/rejection.
   - Delegated approver changes and multi-level approval history audit trail.
3. **Accounts Receivable & Invoicing (`/accounting/ar`)**:
   - Customer account overview, payment terms, and interactive invoice builder with itemized taxes and discounts.
4. **QuickBooks Online Export (`/accounting/quickbooks`)**:
   - Review pending items, map vendor accounts and GL codes, and push journal entries directly to Intuit QBO.
5. **Recurring Payments & Schedule Dates Builder**:
   - Interactive modal calculating future payment milestones, amortizations, and recurring billing dates.
6. **Task & Workflow Assignment (`/tasks`)**:
   - Assignment of operational accounting tasks, priority flags, deadline tracking, and status boards.
7. **Master Data & Hierarchy Management (`/configurations/*`)**:
   - Central maintenance of Chart of Accounts, Entities, Locations, Classes, Departments, and Business Contacts.

---

## Directory Structure

```text
internal_portal_administration_front/
├── public/                 # Static brand assets and templates
├── src/
│   ├── components/         # Shared UI components
│   │   ├── AppShell/       # TopBar, dynamic breadcrumbs, sidebar
│   │   ├── ui/             # shadcn/ui component library
│   │   └── Autocomplete/   # GL, Vendor, Currency, Class comboboxes
│   ├── hooks/              # Custom React hooks (usePurchasing, useSSE, useAuth)
│   ├── pages/
│   │   ├── Purchasing/     # Purchase requests, wire transfers, approvals
│   │   ├── AR/             # Accounts Receivable and invoice builder
│   │   ├── Accounting/     # QuickBooks integration and GL reviews
│   │   ├── Tasks/          # Operational task boards
│   │   ├── MasterData/     # Entities, locations, COA, vendors
│   │   ├── Configurations/ # Users, roles, and permission assignments
│   │   └── Log/            # Audit logs and system consoles
│   ├── services/           # apiClient, purchasingService, qboService
│   ├── types/              # Domain TypeScript types
│   ├── App.tsx             # Application routing matrix
│   └── main.tsx            # Bootstrap entry point
├── package.json
└── vite.config.ts          # Vite configuration pinned to port 5174
```

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables (.env)
```env
# Backend API Base URL (FastAPI running on port 8002)
VITE_API_BASE_URL=http://localhost:8002
```

### 3. Run Development Server
```bash
npm run dev
```
Open application at `http://localhost:5174`.

### 4. Build for Production
```bash
npm run build
```

### 5. Lint
```bash
npm run lint
```
