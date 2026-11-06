import HelpIcon from "@/components/ui/HelpIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Search, ChevronDown, Trash2 } from "lucide-react";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { flexRender } from "@tanstack/react-table";
import { useUsers } from "./users/hooks/useUsers";

export default function Users() {
  const s = useUsers();
  const { userToDeactivate, updateMutation, confirmDeactivate, setIsDeactivateDialogOpen, isDeactivateDialogOpen, bulkDeleteMutation, confirmBulkDelete, selectedRowCount, setIsBulkDeleteDialogOpen, isBulkDeleteDialogOpen, deleteMutation, confirmDelete, userToDelete, setIsDeleteDialogOpen, isDeleteDialogOpen, editingUser, createMutation, setIsDialogOpen, formData, setFormData, handleSubmit, isDialogOpen, table, columns, isLoading, setGlobalFilter, globalFilter, hasPermission, setRowSelection, openCreateDialog } = s;
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2"><h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">Users</h2><HelpIcon text="Manage portal user accounts. Create, search, update details, lock/unlock accounts, and delete users." /></div>
          <p className="text-sm text-slate-500 dark:text-zinc-400">Manage system users and their access.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {hasPermission("CONFIG_USERS_CREATE") && (
            <Button onClick={openCreateDialog} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Add User
            </Button>
          )}
        </div>
      </div>

      {/* BULK ACTION BAR */}
      {selectedRowCount > 0 && (
        <div className="flex items-center justify-between p-3 px-4 bg-blue-50/70 dark:bg-zinc-800/80 border border-blue-200 dark:border-zinc-700 rounded-lg animate-in fade-in slide-in-from-top-2 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-zinc-300">
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-600 text-white">
              {selectedRowCount}
            </span>
            <span>{selectedRowCount === 1 ? "user selected" : "users selected"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRowSelection({})}
              className="bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-700"
            >
              Clear Selection
            </Button>
            {hasPermission("CONFIG_USERS_DELETE") && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsBulkDeleteDialogOpen(true)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="mr-1.5 h-4 w-4" /> Remove Selected ({selectedRowCount})
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500 dark:text-zinc-400" />
            <Input 
              placeholder="Search users..." 
              className="pl-9 w-64 sm:w-80 bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 focus-visible:ring-blue-500/30"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id.replace(/_/g, " ")}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Card className="flex-1 min-h-0 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm flex flex-col p-0">
          <Table className="m-0 relative" containerClassName="w-full overflow-x-auto">
            <TableHeader >
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-t-0">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="h-12">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center py-8 text-slate-500">Loading users...</TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
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
                  <TableCell colSpan={columns.length} className="text-center py-8 text-slate-500">No users found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>

        {/* PAGINATION */}
        <div className="border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-3">
          <DataTablePagination table={table} noun="user(s)" />
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input 
                value={formData.full_name} 
                onChange={e => {
                  const sanitized = e.target.value.replace(/[^a-zA-Z\s]/g, "");
                  setFormData({...formData, full_name: sanitized});
                }} 
                placeholder="John Doe"
              />
              <p className="text-[11px] text-muted-foreground">Letters and spaces only (no symbols or numbers).</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <div className="flex rounded-md shadow-sm">
                <Input 
                  type="text"
                  required
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value.replace(/@.*$/, "")})} 
                  placeholder="john"
                  className="rounded-r-md rounded-tr-none rounded-br-none focus-visible:ring-0 focus-visible:ring-offset-0 border-r-0"
                />
                <span className="inline-flex items-center rounded-r-md border border-l-0 border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-400">
                  @zenatech.com
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <input 
                type="checkbox" 
                id="is_active"
                checked={formData.is_active}
                onChange={e => setFormData({...formData, is_active: e.target.checked})}
                className="rounded border-slate-300"
              />
              <label htmlFor="is_active" className="text-sm font-medium">Active Account</label>
            </div>
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="is_super_admin"
                checked={formData.is_super_admin}
                onChange={e => setFormData({...formData, is_super_admin: e.target.checked})}
                className="rounded border-slate-300"
              />
              <label htmlFor="is_super_admin" className="text-sm font-medium text-purple-700 dark:text-purple-400">Super Admin Privileges</label>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingUser ? "Update User" : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* SINGLE USER DELETE DIALOG */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to remove this user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate and remove the user account for {userToDelete?.full_name || userToDelete?.email}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteMutation.isPending ? "Removing..." : "Remove User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* BULK USER DELETE DIALOG */}
      <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to remove {selectedRowCount} user{selectedRowCount === 1 ? "" : "s"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate and remove the selected {selectedRowCount} user account{selectedRowCount === 1 ? "" : "s"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmBulkDelete}
              disabled={bulkDeleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {bulkDeleteMutation.isPending ? "Removing..." : "Remove Users"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ACTIVATE / DEACTIVATE DIALOG */}
      <AlertDialog open={isDeactivateDialogOpen} onOpenChange={setIsDeactivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {userToDeactivate?.is_active ? "Deactivate User" : "Activate User"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {userToDeactivate?.is_active 
                ? "This will deactivate the user account. They will no longer be able to log in, but their data will be preserved."
                : "This will reactivate the user account, allowing them to log in again."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeactivate}
              disabled={updateMutation.isPending}
              className={userToDeactivate?.is_active ? "bg-orange-600 hover:bg-orange-700 text-white" : "bg-green-600 hover:bg-green-700 text-white"}
            >
              {updateMutation.isPending ? "Updating..." : (userToDeactivate?.is_active ? "Deactivate" : "Activate")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
