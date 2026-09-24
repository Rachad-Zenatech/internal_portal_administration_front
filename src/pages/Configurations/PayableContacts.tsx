import { useState, useMemo, type ReactNode } from "react";
import {
  Mail,
  MapPin,
  Phone,
  ReceiptText,
  Search,
  Users,
  RefreshCw,
  Building2,
  Trash2,
  Landmark,
  Eye,
  EyeOff,
  Copy,
  Check,
} from "lucide-react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table";

import { AddBusinessContactDialog } from "@/components/Configurations/AddBusinessContactDialog";
import { DeleteBusinessContactDialog } from "@/components/Configurations/DeleteBusinessContactDialog";
import { EditBusinessContactDialog } from "@/components/Configurations/EditBusinessContactDialog";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  useBusinessContacts,
  useSyncBusinessContacts,
  useBatchDeleteBusinessContacts,
} from "@/hooks/useBusinessContact";
import type { BusinessContactReference, BankingDetails } from "@/types/businessContact";

function BankingDetailsCell({
  banking,
  contact,
}: {
  banking?: BankingDetails | null;
  contact: BusinessContactReference;
}) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!banking || typeof banking !== "object") {
    return (
      <span className="text-[11px] text-muted-foreground italic">
        Not configured
      </span>
    );
  }

  const hasBankingInfo =
    Object.entries(banking).some(
      ([k, v]) => k !== "bank_country" && typeof v === "string" && v.trim().length > 0
    ) || Boolean(banking.bank_name?.trim());

  if (!hasBankingInfo) {
    return (
      <span className="text-[11px] text-muted-foreground italic">
        Not configured
      </span>
    );
  }

  const copyVal = (key: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const maskedAcct = banking.bank_account_number
    ? banking.bank_account_number.length > 4
      ? `•••• •••• ${banking.bank_account_number.slice(-4)}`
      : "••••"
    : null;

  const maskedIban = banking.iban
    ? banking.iban.length > 8
      ? `${banking.iban.slice(0, 4)} •••• ${banking.iban.slice(-4)}`
      : "••••"
    : null;

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="text-left group cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800/80 p-1.5 -m-1.5 rounded-lg transition-colors max-w-[280px]"
          title="Click to view & copy banking instructions"
        >
          <div className="flex items-center gap-1.5">
            <Landmark className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
            <span className="font-semibold text-xs text-slate-800 dark:text-zinc-200 truncate">
              {banking.bank_name || "Banking Configured"}
            </span>
            {banking.bank_country && (
              <span className="text-[10px] text-muted-foreground shrink-0 font-normal">
                ({banking.bank_country})
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 flex-wrap mt-1">
            {maskedIban ? (
              <span className="font-mono text-[10px] bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-zinc-300">
                IBAN: {maskedIban}
              </span>
            ) : maskedAcct ? (
              <span className="font-mono text-[10px] bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-zinc-300">
                Acct: {maskedAcct}
              </span>
            ) : null}

            {banking.routing_wire && (
              <span className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-mono text-[10px] px-1 py-0.5 rounded border border-indigo-100 dark:border-indigo-900/40">
                Wire: {banking.routing_wire}
              </span>
            )}
            {banking.transit_code_ca && (
              <span className="bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 font-mono text-[10px] px-1 py-0.5 rounded border border-amber-100 dark:border-amber-900/40">
                Transit: {banking.transit_code_ca}
              </span>
            )}
            {banking.institution_code && (
              <span className="bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 font-mono text-[10px] px-1 py-0.5 rounded border border-amber-100 dark:border-amber-900/40">
                Inst: {banking.institution_code}
              </span>
            )}
            {banking.sort_code && (
              <span className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-mono text-[10px] px-1 py-0.5 rounded border border-blue-100 dark:border-blue-900/40">
                Sort: {banking.sort_code}
              </span>
            )}
            {banking.bsb_australia && (
              <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-mono text-[10px] px-1 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/40">
                BSB: {banking.bsb_australia}
              </span>
            )}
            {banking.swift_code && (
              <span className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-mono text-[10px] px-1 py-0.5 rounded">
                SWIFT: {banking.swift_code}
              </span>
            )}
          </div>
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-4 shadow-xl rounded-xl border border-slate-200 dark:border-zinc-800 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Landmark className="h-4 w-4 text-indigo-600 shrink-0" />
            <div>
              <div className="font-bold text-xs text-slate-900 dark:text-zinc-100">
                {banking.bank_name || "Banking Instructions"}
              </div>
              <div className="text-[10px] text-muted-foreground truncate max-w-[170px]">
                {banking.bank_country || "United States"} &middot; {contact.display_name}
              </div>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setRevealed(!revealed)}
            className="h-6 text-[10px] px-1.5 gap-1 text-muted-foreground hover:text-slate-900"
          >
            {revealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3 text-indigo-600" />}
            <span>{revealed ? "Mask" : "Reveal"}</span>
          </Button>
        </div>

        <div className="space-y-1.5 text-xs">
          {banking.bank_account_number && (
            <div className="flex items-center justify-between bg-slate-50 dark:bg-zinc-900 px-2.5 py-1.5 rounded-lg border border-slate-100 dark:border-zinc-800">
              <div>
                <span className="text-[10px] text-muted-foreground block">Account Number</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-zinc-100">
                  {revealed ? banking.bank_account_number : maskedAcct}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => copyVal("acct", banking.bank_account_number || "")}
                className="h-6 w-6 p-0"
                title="Copy Account Number"
              >
                {copiedKey === "acct" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3 text-slate-500" />}
              </Button>
            </div>
          )}

          {banking.routing_wire && (
            <div className="flex items-center justify-between bg-slate-50 dark:bg-zinc-900 px-2.5 py-1.5 rounded-lg border border-slate-100 dark:border-zinc-800">
              <div>
                <span className="text-[10px] text-muted-foreground block">Routing (Wire)</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-zinc-100">
                  {revealed ? banking.routing_wire : `••••• ${banking.routing_wire.slice(-4)}`}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => copyVal("wire", banking.routing_wire || "")}
                className="h-6 w-6 p-0"
                title="Copy Wire Routing"
              >
                {copiedKey === "wire" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3 text-slate-500" />}
              </Button>
            </div>
          )}

          {banking.routing_ach && (
            <div className="flex items-center justify-between bg-slate-50 dark:bg-zinc-900 px-2.5 py-1.5 rounded-lg border border-slate-100 dark:border-zinc-800">
              <div>
                <span className="text-[10px] text-muted-foreground block">Routing (ACH)</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-zinc-100">
                  {revealed ? banking.routing_ach : `••••• ${banking.routing_ach.slice(-4)}`}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => copyVal("ach", banking.routing_ach || "")}
                className="h-6 w-6 p-0"
                title="Copy ACH Routing"
              >
                {copiedKey === "ach" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3 text-slate-500" />}
              </Button>
            </div>
          )}

          {banking.swift_code && (
            <div className="flex items-center justify-between bg-slate-50 dark:bg-zinc-900 px-2.5 py-1.5 rounded-lg border border-slate-100 dark:border-zinc-800">
              <div>
                <span className="text-[10px] text-muted-foreground block">SWIFT / BIC Code</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-zinc-100 uppercase">
                  {banking.swift_code}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => copyVal("swift", banking.swift_code || "")}
                className="h-6 w-6 p-0"
                title="Copy SWIFT Code"
              >
                {copiedKey === "swift" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3 text-slate-500" />}
              </Button>
            </div>
          )}

          {banking.iban && (
            <div className="flex items-center justify-between bg-slate-50 dark:bg-zinc-900 px-2.5 py-1.5 rounded-lg border border-slate-100 dark:border-zinc-800">
              <div>
                <span className="text-[10px] text-muted-foreground block">IBAN</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-zinc-100 uppercase">
                  {revealed ? banking.iban : maskedIban}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => copyVal("iban", banking.iban || "")}
                className="h-6 w-6 p-0"
                title="Copy IBAN"
              >
                {copiedKey === "iban" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3 text-slate-500" />}
              </Button>
            </div>
          )}

          {banking.sort_code && (
            <div className="flex items-center justify-between bg-slate-50 dark:bg-zinc-900 px-2.5 py-1.5 rounded-lg border border-slate-100 dark:border-zinc-800">
              <div>
                <span className="text-[10px] text-muted-foreground block">Sort Code (UK)</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-zinc-100">{banking.sort_code}</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => copyVal("sort", banking.sort_code || "")}
                className="h-6 w-6 p-0"
              >
                {copiedKey === "sort" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3 text-slate-500" />}
              </Button>
            </div>
          )}

          {banking.transit_code_ca && (
            <div className="flex items-center justify-between bg-slate-50 dark:bg-zinc-900 px-2.5 py-1.5 rounded-lg border border-slate-100 dark:border-zinc-800">
              <div>
                <span className="text-[10px] text-muted-foreground block">Transit Code (CA)</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-zinc-100">{banking.transit_code_ca}</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => copyVal("transit", banking.transit_code_ca || "")}
                className="h-6 w-6 p-0"
              >
                {copiedKey === "transit" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3 text-slate-500" />}
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

const compactLines = (value?: string | null) =>
  (value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(", ");

function ContactSection({
  title,
  description,
  badge,
  contactLabel,
  contacts,
  total,
  isPending,
  action,
}: {
  title: string;
  description: string;
  badge: string;
  contactLabel: string;
  contacts: BusinessContactReference[];
  total: number;
  isPending: boolean;
  action: ReactNode;
}) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const batchDeleteMutation = useBatchDeleteBusinessContacts();

  const selectedCount = Object.keys(rowSelection).length;
  const selectedIds = useMemo(() => {
    return Object.keys(rowSelection)
      .map((idx) => contacts[Number(idx)]?.id)
      .filter(Boolean);
  }, [rowSelection, contacts]);

  const columns = useMemo<ColumnDef<BusinessContactReference>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
            className="translate-y-[2px]"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="translate-y-[2px]"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "display_name",
        header: contactLabel,
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-foreground">{row.original.display_name}</div>
            <div className="text-xs text-muted-foreground">{row.original.contact_type}</div>
          </div>
        ),
      },
      {
        id: "account",
        header: "Accounting Account",
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-foreground">
              {row.original.account_number} &middot; {row.original.account_name}
            </div>
            <div className="text-xs text-muted-foreground">{row.original.account_type}</div>
          </div>
        ),
      },
      {
        accessorKey: "full_name",
        header: "Contact",
        cell: ({ row }) => row.original.full_name || "-",
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) =>
          row.original.email ? (
            <span className="inline-flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              {row.original.email}
            </span>
          ) : (
            "-"
          ),
      },
      {
        accessorKey: "phone_numbers",
        header: "Phone",
        cell: ({ row }) =>
          row.original.phone_numbers ? (
            <span className="inline-flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              {row.original.phone_numbers}
            </span>
          ) : (
            "-"
          ),
      },
      {
        id: "address",
        header: "Address",
        cell: ({ row }) =>
          row.original.bill_address || row.original.ship_address ? (
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate max-w-[200px] inline-block align-bottom">
                {compactLines(row.original.bill_address || row.original.ship_address)}
              </span>
            </span>
          ) : (
            "-"
          ),
      },
      {
        id: "banking",
        header: "Banking & Settlement",
        cell: ({ row }) => (
          <BankingDetailsCell
            banking={row.original.banking_details}
            contact={row.original}
          />
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <EditBusinessContactDialog contact={row.original} />
            <DeleteBusinessContactDialog contact={row.original} />
          </div>
        ),
      },
    ],
    [contactLabel]
  );

  const table = useReactTable({
    data: contacts,
    columns,
    state: {
      rowSelection,
    },
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const handleBatchDelete = async () => {
    if (!selectedIds.length) return;
    await batchDeleteMutation.mutateAsync(selectedIds);
    setRowSelection({});
  };

  return (
    <Card className="flex min-h-[360px] flex-col overflow-hidden rounded-lg">
      <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/40">
        <div>
          <h2 className="font-semibold text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground">
            {description} &middot; {total.toLocaleString("en-US")} matching
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive" className="gap-1.5">
                  <Trash2 className="h-4 w-4" />
                  Delete Selected ({selectedCount})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {selectedCount} Selected Contacts?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete the {selectedCount} selected contacts? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={batchDeleteMutation.isPending}
                    onClick={handleBatchDelete}
                  >
                    {batchDeleteMutation.isPending ? "Deleting..." : "Confirm Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Badge variant="secondary">{badge}</Badge>
          {action}
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted/80 shadow-xs">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="bg-muted/80 hover:bg-muted/80 border-t-0"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="h-12 font-semibold text-foreground"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isPending ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  {Array.from({ length: columns.length }).map((__, cell) => (
                    <TableCell key={cell}>
                      <Skeleton className="h-5 w-36" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-border hover:bg-muted/40 data-[state=selected]:bg-muted"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No matching contacts found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="border-t p-4 bg-muted/20">
        <DataTablePagination table={table} noun="contact(s)" />
      </div>
    </Card>
  );
}

export default function PayableContacts() {
  const [search, setSearch] = useState("");
  const arQuery = useBusinessContacts(search, "ar");
  const apQuery = useBusinessContacts(search, "ap");
  const syncMutation = useSyncBusinessContacts();

  const arContacts = arQuery.data?.items || [];
  const apContacts = apQuery.data?.items || [];
  const activeCount = arQuery.data?.active_count ?? apQuery.data?.active_count ?? 0;

  const handleSync = async () => {
    try {
      await syncMutation.mutateAsync();
    } catch (e) {
      console.error("Failed to sync contacts:", e);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col space-y-6 pb-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Business Contacts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            AR customer and AP payee references synced with Finance Portal and QuickBooks GL accounts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={syncMutation.isPending}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
            {syncMutation.isPending ? "Syncing from Finance..." : "Sync from Finance"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active contacts</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{activeCount}</p>
            </div>
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
        </Card>
        <Card className="rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">AR customers</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{arQuery.data?.ar_count ?? 0}</p>
            </div>
            <Building2 className="h-5 w-5 text-muted-foreground" />
          </div>
        </Card>
        <Card className="rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">AP payees</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{apQuery.data?.ap_count ?? 0}</p>
            </div>
            <ReceiptText className="h-5 w-5 text-muted-foreground" />
          </div>
        </Card>
      </div>

      <Tabs defaultValue="ap" className="min-h-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <TabsList className="grid w-full sm:max-w-[520px] grid-cols-2 h-10">
            <TabsTrigger value="ap">A/P Payees ({apQuery.data?.ap_count ?? 0})</TabsTrigger>
            <TabsTrigger value="ar">A/R Customers ({arQuery.data?.ar_count ?? 0})</TabsTrigger>
          </TabsList>

          <div className="relative w-full sm:w-[320px] lg:w-[400px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search AR and AP contacts..."
              className="pl-9 h-10 bg-background"
            />
          </div>
        </div>

        <TabsContent value="ap" className="mt-4">
          <ContactSection
            title="Accounts Payable"
            description="Payee contacts mapped to 2000 Accounts Payable"
            badge="AP payees"
            contactLabel="Payee"
            contacts={apContacts}
            total={apQuery.data?.total ?? 0}
            isPending={apQuery.isPending}
            action={<AddBusinessContactDialog accountSide="ap" />}
          />
        </TabsContent>
        <TabsContent value="ar" className="mt-4">
          <ContactSection
            title="Accounts Receivable"
            description="Customer contacts mapped to 1100 Accounts Receivable"
            badge="AR customers"
            contactLabel="Customer"
            contacts={arContacts}
            total={arQuery.data?.total ?? 0}
            isPending={arQuery.isPending}
            action={<AddBusinessContactDialog accountSide="ar" />}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
