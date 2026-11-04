import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/services/apiClient";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Edit, KeyRound, ArrowUpDown, Power, Ban, MoreHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import type { User } from "@/lib/AuthContext";
import { useNavigate } from "react-router-dom";
import { getCoreRowModel, useReactTable, getPaginationRowModel, getSortedRowModel, getFilteredRowModel } from "@tanstack/react-table";
import type { ColumnDef, SortingState, ColumnFiltersState, VisibilityState, RowSelectionState } from "@tanstack/react-table";

export function useUsersDerived() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
  const [userToDeactivate, setUserToDeactivate] = useState<User | null>(null);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    is_active: true,
    is_super_admin: false,
  });
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => apiClient.get<User[]>("/api/configuration/users"),
  });
  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => apiClient.post("/api/configuration/users", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User created successfully");
      setIsDialogOpen(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || "Failed to create user"),
  });
  const updateMutation = useMutation({
    mutationFn: (data: { id: string, payload: Partial<typeof formData> }) => 
      apiClient.put(`/api/configuration/users/${data.id}`, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User updated successfully");
      setIsDialogOpen(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || "Failed to update user"),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/configuration/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User removed successfully");
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || err.message || "Failed to delete user"),
  });
  const bulkDeleteMutation = useMutation({
    mutationFn: (userIds: string[]) =>
      apiClient.post<{ success: boolean; deleted_count: number }>("/api/configuration/users/bulk-delete", {
        user_ids: userIds,
      }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      const count = res?.deleted_count ?? Object.keys(rowSelection).length;
      toast.success(`Successfully removed ${count} user${count === 1 ? "" : "s"}`);
      setRowSelection({});
      setIsBulkDeleteDialogOpen(false);
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.detail || err.message || "Failed to remove users"),
  });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.full_name && /[^a-zA-Z\s]/.test(formData.full_name)) {
      toast.error("Full Name can only contain letters and spaces (no numbers or symbols).");
      return;
    }
    const cleanPrefix = formData.email.trim().toLowerCase();
    if (!cleanPrefix) {
      toast.error("Email is required.");
      return;
    }
    const finalEmail = cleanPrefix.includes("@") ? cleanPrefix : `${cleanPrefix}@zenatech.com`;

    // Client-side uniqueness check
    const isDuplicate = users.some(
      (u) =>
        u.email?.trim().toLowerCase() === finalEmail &&
        (!editingUser || u.id !== editingUser.id)
    );
    if (isDuplicate) {
      toast.error(`A user with the email '${finalEmail}' already exists.`);
      return;
    }

    const payload = { ...formData, email: finalEmail };

    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, payload });
    } else {
      createMutation.mutate(payload as typeof formData);
    }
  };
  const openCreateDialog = () => {
    setEditingUser(null);
    setFormData({ email: "", full_name: "", is_active: true, is_super_admin: false });
    setIsDialogOpen(true);
  };
  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await deleteMutation.mutateAsync(userToDelete.id);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };
  const confirmBulkDelete = async () => {
    const selectedIds = table.getSelectedRowModel().rows.map((r) => r.original.id);
    if (selectedIds.length === 0) return;
    try {
      await bulkDeleteMutation.mutateAsync(selectedIds);
    } catch (e) {
      console.error(e);
    }
  };
  const confirmDeactivate = async () => {
    if (!userToDeactivate) return;
    try {
      await updateMutation.mutateAsync({
        id: userToDeactivate.id,
        payload: { is_active: !userToDeactivate.is_active }
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeactivateDialogOpen(false);
      setUserToDeactivate(null);
    }
  };
  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setFormData({ 
      email: user.email.replace(/@zenatech\.com$/, ""), 
      full_name: user.full_name || "", 
      is_active: (user as any).is_active ?? true, 
      is_super_admin: user.is_super_admin 
    });
    setIsDialogOpen(true);
  };
  const [sorting, setSorting] = useState<SortingState>([{ id: "full_name", desc: false }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");
  const columns = useMemo<ColumnDef<User>[]>(() => {
    const cols: ColumnDef<User>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center pl-2">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center pl-2">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "full_name",
      header: ({ column }) => (
        <Button variant="ghost" className="px-0 font-semibold" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <span className="font-medium">{row.original.full_name || "-"}</span>,
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <Button variant="ghost" className="px-0 font-semibold" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <span>{row.original.email}</span>,
    },
    {
      accessorKey: "is_active",
      header: ({ column }) => (
        <Button variant="ghost" className="px-0 font-semibold" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const isActive = (row.original as any).is_active ?? true;
        return isActive ? (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400">Active</Badge>
        ) : (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400">Inactive</Badge>
        );
      },
    },
    {
      id: "roles",
      accessorFn: (row) => row.is_super_admin ? "Super Admin" : ((row as any).assigned_roles?.map((r: any) => r.name).join(", ") || ""),
      header: ({ column }) => (
        <Button variant="ghost" className="px-0 font-semibold" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Roles
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const user = row.original as any;
        if (user.is_super_admin) {
          return <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 mb-1 mr-1">Super Admin</Badge>;
        }
        if (user.assigned_roles && user.assigned_roles.length > 0) {
          return (
            <div className="flex flex-wrap gap-1">
              {user.assigned_roles.map((role: any) => (
                <Badge key={role.id} variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400">
                  {role.name}
                </Badge>
              ))}
            </div>
          );
        }
        return <span className="text-slate-500 text-sm italic">No Roles</span>;
      },
    }
  ];

  if (hasPermission("CONFIG_USER_ROLE_ASSIGNMENT_READ") || hasPermission("CONFIG_USERS_UPDATE") || hasPermission("CONFIG_USERS_DELETE")) {
    cols.push({
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const user = row.original;
        const isActive = (user as any).is_active ?? true;
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {hasPermission("CONFIG_USER_ROLE_ASSIGNMENT_READ") && (
                  <DropdownMenuItem onClick={() => navigate(`/configurations/user-role-assignment?userId=${user.id}`)}>
                    <KeyRound className="mr-2 h-4 w-4" /> Manage Roles
                  </DropdownMenuItem>
                )}
                {hasPermission("CONFIG_USERS_UPDATE") && (
                  <DropdownMenuItem onClick={() => openEditDialog(user)}>
                    <Edit className="mr-2 h-4 w-4" /> Edit User
                  </DropdownMenuItem>
                )}
                {hasPermission("CONFIG_USERS_UPDATE") && (
                  <DropdownMenuItem onClick={() => {
                    setUserToDeactivate(user);
                    setIsDeactivateDialogOpen(true);
                  }}>
                    {isActive ? (
                      <><Ban className="mr-2 h-4 w-4 text-orange-600" /> Deactivate</>
                    ) : (
                      <><Power className="mr-2 h-4 w-4 text-green-600" /> Activate</>
                    )}
                  </DropdownMenuItem>
                )}
                {hasPermission("CONFIG_USERS_DELETE") && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                      onClick={() => {
                        setUserToDelete(user);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Remove User
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    });
  }
  return cols;
}, [hasPermission, navigate]);
  const table = useReactTable({
    data: users,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    initialState: {
      pagination: {
        pageSize: 50,
      },
    },
    globalFilterFn: (row, _columnId, filterValue) => {
      const search = filterValue.toLowerCase();
      const name = (row.getValue("full_name") as string)?.toLowerCase() || "";
      const email = (row.getValue("email") as string)?.toLowerCase() || "";
      const roles = (row.getValue("roles") as string)?.toLowerCase() || "";
      return name.includes(search) || email.includes(search) || roles.includes(search);
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  });
  const selectedRowCount = table.getSelectedRowModel().rows.length;
  return { hasPermission, isDialogOpen, setIsDialogOpen, editingUser, isDeleteDialogOpen, setIsDeleteDialogOpen, userToDelete, isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen, isDeactivateDialogOpen, setIsDeactivateDialogOpen, userToDeactivate, setRowSelection, formData, setFormData, isLoading, createMutation, updateMutation, deleteMutation, bulkDeleteMutation, handleSubmit, openCreateDialog, confirmDelete, confirmBulkDelete, confirmDeactivate, globalFilter, setGlobalFilter, columns, table, selectedRowCount };
}
