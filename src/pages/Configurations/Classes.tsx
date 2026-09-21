import { useState, useMemo, useRef } from "react";
import {
  Layers,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Upload,
  X,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/alert-dialog";
import {
  useMasterClasses,
  useCreateMasterClass,
  useUpdateMasterClass,
  useDeleteMasterClass,
  useImportMasterClasses,
} from "@/hooks/useMasterTables";
import { cleanAndStandardizeText } from "@/utils/textStandardizer";
import type { MasterItem } from "@/services/masterTablesService";
import { format } from "date-fns";
import { toast } from "sonner";

export default function Classes() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data, isLoading, isRefetching, refetch } = useMasterClasses();
  const createMutation = useCreateMasterClass();
  const updateMutation = useUpdateMasterClass();
  const deleteMutation = useDeleteMasterClass();
  const importMutation = useImportMasterClasses();

  const classes = data?.items || [];
  const totalCount = data?.total || classes.length;
  const lastImportedAt = data?.last_imported_at;
  const lastFilename = data?.last_filename;

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<MasterItem | null>(null);

  // Form states
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editActive, setEditActive] = useState(true);

  // Import states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtered classes
  const filteredClasses = useMemo(() => {
    if (!searchTerm.trim()) return classes;
    const term = searchTerm.toLowerCase();
    return classes.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        (c.raw_name && c.raw_name.toLowerCase().includes(term)) ||
        (c.description && c.description.toLowerCase().includes(term))
    );
  }, [classes, searchTerm]);

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error("Class name is required");
      return;
    }
    await createMutation.mutateAsync({
      name: newName.trim(),
      description: newDescription.trim() || undefined,
    });
    setNewName("");
    setNewDescription("");
    setCreateDialogOpen(false);
  };

  const handleUpdate = async () => {
    if (!editingItem || !editName.trim()) return;
    await updateMutation.mutateAsync({
      id: editingItem.id,
      payload: {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        is_active: editActive,
      },
    });
    setEditingItem(null);
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    await deleteMutation.mutateAsync(deletingItem.id);
    setDeletingItem(null);
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "xlsx" || ext === "csv" || ext === "xls") {
      setSelectedFile(file);
    } else {
      toast.error("Please select a valid .xlsx, .csv, or .xls file.");
    }
  };

  const handleImportSubmit = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to import");
      return;
    }
    await importMutation.mutateAsync(selectedFile);
    setSelectedFile(null);
    setImportDialogOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-950/70 rounded-xl text-indigo-700 dark:text-indigo-300">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
                Class Master Table
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage and standardize company classes, departments, and financial cost centers.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="h-9 gap-1.5 text-xs font-medium"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportDialogOpen(true)}
            className="h-9 gap-1.5 text-xs font-medium bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            Import (.xlsx, .csv, .xls)
          </Button>

          <Button
            size="sm"
            onClick={() => setCreateDialogOpen(true)}
            className="h-9 gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Class
          </Button>
        </div>
      </div>

      {/* Stats and Last Imported Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="bg-slate-50/70 dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Classes
              </p>
              <p className="text-2xl font-bold font-mono text-slate-900 dark:text-zinc-100 mt-1">
                {totalCount}
              </p>
            </div>
            <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl shadow-xs border border-slate-200 dark:border-zinc-700">
              <Layers className="h-5 w-5 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-50/70 dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-800 sm:col-span-2">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                Last Imported Date
              </p>
              <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                {lastImportedAt
                  ? format(new Date(lastImportedAt), "MMMM d, yyyy 'at' h:mm a")
                  : "Not imported yet (using defaults)"}
              </p>
              {lastFilename && (
                <p className="text-[11px] text-muted-foreground font-mono">
                  Source: {lastFilename}
                </p>
              )}
            </div>
            <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl shadow-xs border border-slate-200 dark:border-zinc-700">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search classes by name, raw text, or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 pr-10 h-10 text-sm bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-zinc-800/60">
            <TableRow className="border-slate-200 dark:border-zinc-800 text-[11px] font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">
              <TableHead className="w-[35%] py-3">Class Name (Standardized)</TableHead>
              <TableHead className="w-[30%] py-3">Original / Raw Name</TableHead>
              <TableHead className="w-[15%] py-3">Status</TableHead>
              <TableHead className="w-[10%] py-3">Updated</TableHead>
              <TableHead className="w-[10%] py-3 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100 dark:divide-zinc-800/60 text-xs">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredClasses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  <Layers className="h-8 w-8 mx-auto text-slate-300 dark:text-zinc-600 mb-2" />
                  <p className="font-medium text-sm">No classes found</p>
                  <p className="text-xs mt-1">
                    {searchTerm ? "Try adjusting your search terms" : "Click 'Add Class' or 'Import' to add records."}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredClasses.map((item) => (
                <TableRow key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                  <TableCell className="py-3 font-semibold text-slate-900 dark:text-zinc-100">
                    <div className="flex items-center gap-2">
                      <Layers className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                      <span>{item.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-slate-500 dark:text-zinc-400 font-mono text-[11px]">
                    {item.raw_name || "—"}
                  </TableCell>
                  <TableCell className="py-3">
                    {item.is_active ? (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 text-[10px]">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 text-[10px]">
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="py-3 text-slate-500 text-[11px]">
                    {item.updated_at ? format(new Date(item.updated_at), "MMM d, yyyy") : "—"}
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200"
                        onClick={() => {
                          setEditingItem(item);
                          setEditName(item.name);
                          setEditDescription(item.description || "");
                          setEditActive(item.is_active);
                        }}
                        title="Edit Class"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                        onClick={() => setDeletingItem(item)}
                        title="Delete Class"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Class Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-indigo-600" />
              Add New Class
            </DialogTitle>
            <DialogDescription>
              Enter class / department name. It will be automatically formatted per company standards.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">
                Class Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g. Casado Design LTD or Direct Cost"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="text-sm font-medium"
              />
              {newName && (
                <p className="text-[11px] text-indigo-700 dark:text-indigo-300 font-mono bg-indigo-50 dark:bg-indigo-950/50 p-2 rounded border border-indigo-200 dark:border-indigo-900">
                  Preview: <strong>{cleanAndStandardizeText(newName)}</strong>
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Description (Optional)</label>
              <Textarea
                rows={2}
                placeholder="Additional details about this class or department..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending || !newName.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {createMutation.isPending ? "Adding..." : "Add Class"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Class Dialog */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-indigo-600" />
              Edit Class
            </DialogTitle>
            <DialogDescription>
              Update class details and status.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">
                Class Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="text-sm font-medium"
              />
              {editName && (
                <p className="text-[11px] text-indigo-700 dark:text-indigo-300 font-mono bg-indigo-50 dark:bg-indigo-950/50 p-2 rounded border border-indigo-200 dark:border-indigo-900">
                  Preview: <strong>{cleanAndStandardizeText(editName)}</strong>
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Description</label>
              <Textarea
                rows={2}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="text-xs resize-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="editClassActive"
                checked={editActive}
                onChange={(e) => setEditActive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="editClassActive" className="text-xs font-medium cursor-pointer">
                Active in autocomplete and dropdowns
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updateMutation.isPending || !editName.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertCircle className="h-5 w-5" />
              Delete Class
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deletingItem?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import File Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
              Import Classes File
            </DialogTitle>
            <DialogDescription>
              Upload a spreadsheet (.xlsx, .csv, or .xls). Values will be cleaned and standardized automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                isDragging
                  ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20"
                  : selectedFile
                  ? "border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20"
                  : "border-slate-300 dark:border-zinc-700 hover:border-slate-400 bg-slate-50/50 dark:bg-zinc-800/30"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.csv,.xls"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    validateAndSetFile(e.target.files[0]);
                  }
                }}
              />

              {selectedFile ? (
                <div className="space-y-1">
                  <FileSpreadsheet className="h-8 w-8 text-emerald-600 mx-auto" />
                  <p className="font-semibold text-sm text-slate-800 dark:text-zinc-200">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB — Click or drag to replace
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 text-slate-400 mx-auto" />
                  <div>
                    <p className="font-semibold text-sm text-slate-800 dark:text-zinc-200">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Supports Excel (.xlsx, .xls) and CSV (.csv)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Formatting Guidelines Note */}
            <div className="rounded-lg bg-slate-50 dark:bg-zinc-800/60 p-3 text-xs text-slate-600 dark:text-zinc-300 space-y-1 border border-slate-200 dark:border-zinc-800">
              <p className="font-semibold text-slate-800 dark:text-zinc-100 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600" />
                Automatic Standardization Rules Applied:
              </p>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-muted-foreground">
                <li>Company names and entity codes preserved with proper punctuation</li>
                <li>Extra spaces and technical formatting stripped</li>
                <li>Automatic deduplication on import</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleImportSubmit}
              disabled={importMutation.isPending || !selectedFile}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              {importMutation.isPending ? "Importing & Standardizing..." : "Import Classes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
