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
} from "lucide-react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
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
import type { BusinessContactReference } from "@/types/businessContact";

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
