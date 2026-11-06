import { useState, useMemo } from "react";
import { Building2, Edit2, Trash2, Globe } from "lucide-react";
import { getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import type { ColumnDef, RowSelectionState, SortingState } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useEntities, useCreateEntity, useUpdateEntity, useDeleteEntity, useBatchDeleteEntities } from "@/hooks/useEntities";
import type { Entity, EntityCreateRequest } from "@/types/entity";
import { toast } from "sonner";

export function useEntitiesDerived() {
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
  return { search, setSearch, selectedGroup, setSelectedGroup, createDialogOpen, setCreateDialogOpen, editDialogOpen, setEditDialogOpen, editingEntity, formData, setFormData, isLoading, refetch, createMutation, updateMutation, batchDeleteMutation, total, activeCount, groups, selectedCount, handleOpenCreate, handleCreateSubmit, handleEditSubmit, handleBatchDelete, columns, table };
}
