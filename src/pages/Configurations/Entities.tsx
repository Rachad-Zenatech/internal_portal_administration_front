import { useState, useMemo } from "react";
import {
  Building2,
  ShieldCheck,
  Layers,
  Search,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Globe,
} from "lucide-react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { ColumnDef, RowSelectionState, SortingState } from "@tanstack/react-table";

import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useEntities,
  useCreateEntity,
  useUpdateEntity,
  useDeleteEntity,
  useBatchDeleteEntities,
} from "@/hooks/useEntities";
import type { Entity, EntityCreateRequest } from "@/types/entity";
import { toast } from "sonner";

export default function Entities() {
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("ALL");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Dialog States
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);

  // Form State
  const [formData, setFormData] = useState<EntityCreateRequest>({
    name: "",
    code: "",
    group_name: "DAAS",
    country: "USA",
    state: "",
    currency: "USD",
    description: "",
    is_active: true,
  });

  const { data, isLoading, refetch } = useEntities({
    search: search || undefined,
    group_name: selectedGroup === "ALL" ? undefined : selectedGroup,
  });

  const createMutation = useCreateEntity();
  const updateMutation = useUpdateEntity();
  const deleteMutation = useDeleteEntity();
  const batchDeleteMutation = useBatchDeleteEntities();

  const entities = data?.items || [];
  const total = data?.total || 0;
  const activeCount = data?.active_count || 0;
  const groups = data?.groups || ["DAAS", "Corporate", "Software", "International", "Operating"];

  const selectedCount = Object.keys(rowSelection).length;
  const selectedIds = useMemo(() => {
    return Object.keys(rowSelection)
      .map((idx) => entities[Number(idx)]?.id)
      .filter(Boolean) as number[];
  }, [rowSelection, entities]);

  const handleOpenCreate = () => {
    setFormData({
      name: "",
      code: "",
      group_name: "DAAS",
      country: "USA",
      state: "",
      currency: "USD",
      description: "",
      is_active: true,
    });
    setCreateDialogOpen(true);
  };

  const handleOpenEdit = (entity: Entity) => {
    setEditingEntity(entity);
    setFormData({
      name: entity.name,
      code: entity.code || "",
      group_name: entity.group_name || "DAAS",
      country: entity.country || "USA",
      state: entity.state || "",
      currency: entity.currency || "USD",
      description: entity.description || "",
      is_active: entity.is_active,
    });
    setEditDialogOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      toast.error("Entity name is required");
      return;
    }
    try {
      await createMutation.mutateAsync(formData);
      toast.success(`Entity "${formData.name}" created successfully`);
      setCreateDialogOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || "Failed to create entity");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntity) return;
    if (!formData.name?.trim()) {
      toast.error("Entity name is required");
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id: editingEntity.id,
        payload: formData,
      });
      toast.success(`Entity "${formData.name}" updated successfully`);
      setEditDialogOpen(false);
      setEditingEntity(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || "Failed to update entity");
    }
  };

  const handleDelete = async (entity: Entity) => {
    try {
      await deleteMutation.mutateAsync(entity.id);
      toast.success(`Entity "${entity.name}" deleted`);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || "Failed to delete entity");
    }
  };

  const handleBatchDelete = async () => {
    if (!selectedIds.length) return;
    try {
      const res = await batchDeleteMutation.mutateAsync(selectedIds);
      toast.success(`Deleted ${res.deleted_count} entities`);
      setRowSelection({});
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || "Failed to batch delete entities");
    }
  };

  const columns = useMemo<ColumnDef<Entity>[]>(
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
        accessorKey: "name",
        header: "Entity Name",
        cell: ({ row }) => (
          <div>
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-primary shrink-0" />
              <span>{row.original.name}</span>
            </div>
            {row.original.code && (
              <span className="text-[11px] font-mono text-muted-foreground uppercase">
                Code: {row.original.code}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "group_name",
        header: "Group / Division",
        cell: ({ row }) => {
          const group = row.original.group_name || "DAAS";
          const isDaas = group.toUpperCase() === "DAAS";
          const isCorp = group.toUpperCase() === "CORPORATE";
          return (
            <Badge
              variant={isCorp ? "default" : isDaas ? "secondary" : "outline"}
              className="font-medium text-xs"
            >
              {group}
            </Badge>
          );
        },
      },
      {
        id: "jurisdiction",
        header: "Country & Currency",
        cell: ({ row }) => (
          <div className="flex flex-col text-xs">
            <span className="inline-flex items-center gap-1 text-foreground font-medium">
              <Globe className="h-3.5 w-3.5 text-muted-foreground" />
              {row.original.country || "USA"}
              {row.original.state ? ` (${row.original.state})` : ""}
            </span>
            <span className="text-muted-foreground text-[11px]">
              Currency: {row.original.currency || "USD"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground line-clamp-1 max-w-[260px]">
            {row.original.description || "—"}
          </span>
        ),
      },
      {
        accessorKey: "is_active",
        header: "Status",
        cell: ({ row }) =>
          row.original.is_active ? (
            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
              Active
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              Inactive
            </Badge>
          ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => handleOpenEdit(row.original)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Entity: {row.original.name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this entity? This will remove it from the system configuration.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => handleDelete(row.original)}
                  >
                    Delete Entity
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: entities,
    columns,
    state: {
      rowSelection,
      sorting,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="flex h-full min-h-0 flex-col space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Operating Entities</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage legal entities, subsidiaries, and corporate divisions for purchasing, wire transfers, and accounting.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={handleOpenCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Entity
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Entities</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{total}</p>
            </div>
            <Building2 className="h-5 w-5 text-muted-foreground" />
          </div>
        </Card>

        <Card className="rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Entities</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{activeCount}</p>
            </div>
            <ShieldCheck className="h-5 w-5 text-muted-foreground" />
          </div>
        </Card>

        <Card className="rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Entity Groups</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{groups.length}</p>
            </div>
            <Layers className="h-5 w-5 text-muted-foreground" />
          </div>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="flex min-h-[360px] flex-col overflow-hidden rounded-lg">
        {/* Table Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b px-4 py-3 bg-muted/40">
          <div className="flex items-center gap-2 flex-1 max-w-lg">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search entities by name, code, country..."
                className="pl-9 h-9 bg-background"
              />
            </div>

            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger className="w-[160px] h-9 bg-background">
                <SelectValue placeholder="All Groups" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Groups</SelectItem>
                {groups.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                    <AlertDialogTitle>Delete {selectedCount} Selected Entities?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete the {selectedCount} selected entities? This action cannot be undone.
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
            <Badge variant="secondary">{total} Total</Badge>
          </div>
        </div>

        {/* Table */}
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
              {isLoading ? (
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
                    No matching entities found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="border-t p-4 bg-muted/20">
          <DataTablePagination table={table} noun="entity(ies)" />
        </div>
      </Card>

      {/* Add Entity Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Create New Entity
            </DialogTitle>
            <DialogDescription>
              Add an operating entity, subsidiary, or corporate division.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label htmlFor="entity-name">
                  Entity Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="entity-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Acme Drone Operations"
                  required
                />
              </div>

              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label htmlFor="entity-code">Code / Identifier</Label>
                <Input
                  id="entity-code"
                  value={formData.code || ""}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. ACME-OPS"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="entity-group">Group / Division</Label>
                <Input
                  id="entity-group"
                  value={formData.group_name || ""}
                  onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
                  placeholder="e.g. DAAS, Corporate"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="entity-currency">Currency</Label>
                <Input
                  id="entity-currency"
                  value={formData.currency || "USD"}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
                  placeholder="USD"
                  maxLength={5}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="entity-country">Country</Label>
                <Input
                  id="entity-country"
                  value={formData.country || "USA"}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="USA"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="entity-state">State / Province</Label>
                <Input
                  id="entity-state"
                  value={formData.state || ""}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="e.g. IL, CA, ON"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="entity-desc">Description / Notes</Label>
              <Textarea
                id="entity-desc"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Details regarding this entity's operational scope..."
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Checkbox
                id="entity-active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: !!checked })}
              />
              <Label htmlFor="entity-active" className="text-sm font-normal cursor-pointer">
                Entity is active and available for transactions
              </Label>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Entity"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Entity Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-primary" />
              Edit Entity: {editingEntity?.name}
            </DialogTitle>
            <DialogDescription>
              Update information and configurations for this entity.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label htmlFor="edit-entity-name">
                  Entity Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-entity-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label htmlFor="edit-entity-code">Code / Identifier</Label>
                <Input
                  id="edit-entity-code"
                  value={formData.code || ""}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-entity-group">Group / Division</Label>
                <Input
                  id="edit-entity-group"
                  value={formData.group_name || ""}
                  onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-entity-currency">Currency</Label>
                <Input
                  id="edit-entity-currency"
                  value={formData.currency || "USD"}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
                  maxLength={5}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-entity-country">Country</Label>
                <Input
                  id="edit-entity-country"
                  value={formData.country || "USA"}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-entity-state">State / Province</Label>
                <Input
                  id="edit-entity-state"
                  value={formData.state || ""}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-entity-desc">Description / Notes</Label>
              <Textarea
                id="edit-entity-desc"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Checkbox
                id="edit-entity-active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: !!checked })}
              />
              <Label htmlFor="edit-entity-active" className="text-sm font-normal cursor-pointer">
                Entity is active and available for transactions
              </Label>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
