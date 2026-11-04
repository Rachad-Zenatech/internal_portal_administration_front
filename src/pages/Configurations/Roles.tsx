import HelpIcon from "@/components/ui/HelpIcon";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useRoles } from "./roles/hooks/useRoles";
import { LeftPanelTree } from "./roles/sections/LeftPanelTree";

export default function Roles() {
  const s = useRoles();
  const { confirmDeactivate, selectedRole, setIsDeactivateDialogOpen, isDeactivateDialogOpen, confirmDelete, setIsDeleteDialogOpen, isDeleteDialogOpen } = s;
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2"><h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">Roles</h2><HelpIcon text="Manage application roles and set default roles assigned to new users." /></div>
          <p className="text-sm text-slate-500 dark:text-zinc-400">Manage organizational role hierarchy and security groups.</p>
        </div>
      </div>

      <LeftPanelTree s={s} />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to completely delete the role "{selectedRole?.name}"? This action cannot be undone and will remove all associated permissions and user assignments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Yes, delete role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeactivateDialogOpen} onOpenChange={setIsDeactivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate "{selectedRole?.name}"? Users with this role will lose access to its associated permissions until it is reactivated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeactivate} className="bg-orange-600 hover:bg-orange-700 text-white">
              Yes, deactivate role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
