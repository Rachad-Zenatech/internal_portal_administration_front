import { Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { EntitiesState } from "../hooks/useEntitiesPage";

export function EditEntityDialog({ s }: { s: EntitiesState }) {
  const { updateMutation, setEditDialogOpen, formData, setFormData, handleEditSubmit, editingEntity, editDialogOpen } = s;
  return (
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
  );
}
