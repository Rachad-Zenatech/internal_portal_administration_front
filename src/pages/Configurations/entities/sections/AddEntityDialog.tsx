import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { EntitiesState } from "../hooks/useEntitiesPage";

export function AddEntityDialog({ s }: { s: EntitiesState }) {
  const { createMutation, setCreateDialogOpen, formData, setFormData, handleCreateSubmit, createDialogOpen } = s;
  return (
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
  );
}
