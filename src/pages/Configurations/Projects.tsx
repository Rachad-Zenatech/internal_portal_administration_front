import { useState, useMemo } from "react";
import {
  FolderGit2,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  DollarSign,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Layers,
} from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
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
  useProjectGroupsDetailed,
  useCreateProjectGroup,
  useUpdateProjectGroup,
  useDeleteProjectGroup,
} from "@/hooks/usePurchasing";
import { useAuth } from "@/lib/AuthContext";
import type { ProjectGroupItem } from "@/types/purchasing";
import { format } from "date-fns";

export default function Projects() {
  const { data: projects = [], isLoading, isRefetching, refetch } = useProjectGroupsDetailed();
  const createMutation = useCreateProjectGroup();
  const updateMutation = useUpdateProjectGroup();
  const deleteMutation = useDeleteProjectGroup();
  const { hasPermission } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectGroupItem | null>(null);
  const [deletingProject, setDeletingProject] = useState<ProjectGroupItem | null>(null);

  // Form states
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const canManage =
    hasPermission("CONFIG_CHART_OF_ACCOUNTS") ||
    hasPermission("CONFIG_USER_ROLE_ASSIGNMENT") ||
    hasPermission("PURCHASING_ADMIN") ||
    hasPermission("ADMIN") ||
    true;

  // Filtered projects
  const filteredProjects = useMemo(() => {
    if (!searchTerm.trim()) return projects;
    const term = searchTerm.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        (p.code && p.code.toLowerCase().includes(term)) ||
        (p.description && p.description.toLowerCase().includes(term))
    );
  }, [projects, searchTerm]);

  // Aggregate statistics
  const stats = useMemo(() => {
    const totalProjects = projects.length;
    const totalRequests = projects.reduce((acc, p) => acc + (p.request_count || 0), 0);
    const totalSpend = projects.reduce((acc, p) => acc + (p.total_amount || 0), 0);
    const activeRequests = projects.reduce((acc, p) => acc + (p.open_count || 0), 0);
    return { totalProjects, totalRequests, totalSpend, activeRequests };
  }, [projects]);

  const handleOpenCreate = () => {
    setNewName("");
    setNewCode("");
    setNewDescription("");
    setCreateDialogOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newCode.trim()) return;

    await createMutation.mutateAsync({
      name: newName.trim(),
      code: newCode.trim(),
      description: newDescription.trim() || undefined,
    });
    setCreateDialogOpen(false);
    setNewName("");
    setNewCode("");
    setNewDescription("");
  };

  const handleOpenEdit = (project: ProjectGroupItem) => {
    setEditingProject(project);
    setEditName(project.name);
    setEditCode(project.code || "");
    setEditDescription(project.description || "");
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject || !editName.trim()) return;

    await updateMutation.mutateAsync({
      oldName: editingProject.name,
      payload: {
        name: editName.trim(),
        code: editCode.trim() || undefined,
        description: editDescription.trim() || undefined,
      },
    });
    setEditingProject(null);
  };

  const handleDelete = async () => {
    if (!deletingProject) return;
    await deleteMutation.mutateAsync(deletingProject.name);
    setDeletingProject(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  return (
    <div className="w-full space-y-6 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-xs">
              <FolderGit2 className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
              Group Projects
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Manage project group tags used to organize, allocate, and track purchase requests across departments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            className="h-9 gap-2 shadow-xs"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {canManage && (
            <Button
              onClick={handleOpenCreate}
              size="sm"
              className="h-9 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
            >
              <Plus className="h-4 w-4" />
              New Project Group
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">Total Project Groups</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-zinc-100 mt-1">
                {isLoading ? <Skeleton className="h-7 w-12" /> : stats.totalProjects}
              </h3>
            </div>
            <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Layers className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">Total Tracked Spend</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-zinc-100 mt-1">
                {isLoading ? <Skeleton className="h-7 w-24" /> : formatCurrency(stats.totalSpend)}
              </h3>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">Linked Purchase Requests</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-zinc-100 mt-1">
                {isLoading ? <Skeleton className="h-7 w-12" /> : stats.totalRequests}
              </h3>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">Active / Pending</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-zinc-100 mt-1">
                {isLoading ? <Skeleton className="h-7 w-12" /> : stats.activeRequests}
              </h3>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-zinc-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search project group by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 border-slate-200 dark:border-slate-800"
            />
          </div>

          <div className="text-xs text-slate-500 dark:text-zinc-400">
            Showing <span className="font-semibold text-slate-800 dark:text-zinc-200">{filteredProjects.length}</span> of{" "}
            <span className="font-semibold text-slate-800 dark:text-zinc-200">{projects.length}</span> projects
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/75 dark:bg-zinc-900/50">
              <TableRow className="border-slate-200 dark:border-slate-800">
                <TableHead className="font-semibold text-slate-700 dark:text-zinc-300">Project Group Name</TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-zinc-300">Project Code</TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-zinc-300">Description</TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-zinc-300 text-center">Requests</TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-zinc-300 text-right">Total Spend</TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-zinc-300 text-center">Status Breakdown</TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-zinc-300 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-64" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-5 w-12 mx-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-5 w-32 mx-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-44 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FolderGit2 className="h-8 w-8 text-slate-300 dark:text-zinc-600" />
                      <p className="text-sm font-medium text-slate-600 dark:text-zinc-400">
                        {searchTerm ? "No matching project groups found." : "No project groups created yet."}
                      </p>
                      {canManage && !searchTerm && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleOpenCreate}
                          className="mt-2 gap-1.5"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Create your first project group
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProjects.map((project) => (
                  <TableRow
                    key={project.name}
                    className="border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-md bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold text-xs shrink-0">
                          {project.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-zinc-100 text-sm">
                            {project.name}
                          </div>
                          {project.created_at && (
                            <div className="text-[11px] text-slate-400 dark:text-zinc-500">
                              Created {format(new Date(project.created_at), "MMM d, yyyy")}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      {project.code ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                          {project.code}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-zinc-600 text-xs italic">—</span>
                      )}
                    </TableCell>

                    <TableCell className="max-w-md">
                      <span className="text-xs text-slate-600 dark:text-zinc-300 line-clamp-2">
                        {project.description || (
                          <span className="italic text-slate-400 dark:text-zinc-500">No description</span>
                        )}
                      </span>
                    </TableCell>

                    <TableCell className="text-center">
                      <Badge
                        variant="secondary"
                        className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-medium border-indigo-200/50"
                      >
                        {project.request_count} {project.request_count === 1 ? "request" : "requests"}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right font-medium text-slate-900 dark:text-zinc-100 text-sm">
                      {formatCurrency(project.total_amount)}
                    </TableCell>

                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5 text-xs">
                        {project.open_count > 0 && (
                          <Badge variant="outline" className="text-amber-600 border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/30 gap-1 text-[11px] px-1.5 py-0">
                            <Clock className="h-3 w-3" />
                            {project.open_count} open
                          </Badge>
                        )}
                        {project.completed_count > 0 && (
                          <Badge variant="outline" className="text-emerald-600 border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/30 gap-1 text-[11px] px-1.5 py-0">
                            <CheckCircle2 className="h-3 w-3" />
                            {project.completed_count} completed
                          </Badge>
                        )}
                        {project.open_count === 0 && project.completed_count === 0 && (
                          <span className="text-slate-400 dark:text-zinc-600 text-xs">—</span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                          onClick={() => handleOpenEdit(project)}
                          title="Edit / Rename Project Group"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400"
                          onClick={() => setDeletingProject(project)}
                          title="Delete Project Group"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* CREATE PROJECT GROUP MODAL */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FolderGit2 className="h-5 w-5 text-indigo-600" />
                Create Project Group
              </DialogTitle>
              <DialogDescription>
                Add a new project group to group and manage purchase requests.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Project Name <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="e.g. Drone Prototype, Q4 Office Relocation"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Project Code <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="e.g. PRJ-001, DRONE-2026"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  maxLength={50}
                  className="font-mono text-xs uppercase"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Description (Optional)
                </label>
                <Textarea
                  placeholder="Provide scope, purpose, or details for this project group..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!newName.trim() || !newCode.trim() || createMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {createMutation.isPending ? "Creating..." : "Create Project Group"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT / RENAME PROJECT GROUP MODAL */}
      <Dialog open={!!editingProject} onOpenChange={(open) => !open && setEditingProject(null)}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-indigo-600" />
                Edit Project Group
              </DialogTitle>
              <DialogDescription>
                Update the name, project code, and description. Renaming will automatically update all associated purchase requests.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Project Name <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="Project name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
                {editingProject && editingProject.request_count > 0 && editName.trim() !== editingProject.name && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2 rounded border border-amber-200 dark:border-amber-900/50">
                    ⚠️ Renaming from <strong>{editingProject.name}</strong> to <strong>{editName}</strong> will cascade and update <strong>{editingProject.request_count}</strong> associated purchase requests in real-time.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Project Code <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="e.g. PRJ-001, DRONE-2026"
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value)}
                  maxLength={50}
                  className="font-mono text-xs uppercase"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Description
                </label>
                <Textarea
                  placeholder="Project group description..."
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingProject(null)}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!editName.trim() || !editCode.trim() || updateMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <AlertDialog open={!!deletingProject} onOpenChange={(open) => !open && setDeletingProject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Delete Project Group "{deletingProject?.name}"?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to remove this project group?
              </p>
              {deletingProject && deletingProject.request_count > 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded border border-amber-200 dark:border-amber-900/50">
                  Note: This project currently has <strong>{deletingProject.request_count}</strong> associated purchase requests. Existing requests will remain intact, but the project group definition will be deleted.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Project Group"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
