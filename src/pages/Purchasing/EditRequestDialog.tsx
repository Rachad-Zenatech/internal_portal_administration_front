import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateRequest } from "@/hooks/usePurchasing";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { GLCodeAutocomplete } from "./GLCodeAutocomplete";

export function EditRequestDialog({ request, open, onOpenChange }: { request: any, open: boolean, onOpenChange: (open: boolean) => void }) {
  const [formData, setFormData] = useState({
    title: "",
    request_type: "",
    priority: "",
    department: "",
    item_url: "",
    unit_price: "",
    quantity: "1",
    description: "",
    gl_code: ""
  });

  useEffect(() => {
    if (request && open) {
      setFormData({
        title: request.title || "",
        request_type: request.request_type || "",
        priority: request.priority || "MEDIUM",
        department: request.department || "",
        item_url: request.item_url || "",
        unit_price: request.unit_price ? request.unit_price.toString() : "",
        quantity: request.quantity ? request.quantity.toString() : "1",
        description: request.description || "",
        gl_code: request.gl_code || ""
      });
    }
  }, [request, open]);

  const updateMutation = useUpdateRequest();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.request_type || !formData.department) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      const unitPrice = formData.unit_price ? parseFloat(formData.unit_price) : 0;
      const quantity = formData.quantity ? parseInt(formData.quantity) : 1;
      const payload = {
        ...formData,
        unit_price: unitPrice,
        quantity: quantity,
        amount: unitPrice * quantity,
      };

      await updateMutation.mutateAsync({ id: request.id, data: payload });
      toast.success("Request updated successfully.");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to update request.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Request</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium">Title <span className="text-red-500">*</span></label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Type <span className="text-red-500">*</span></label>
              <Select value={formData.request_type} onValueChange={(val) => setFormData({ ...formData, request_type: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SPEND">Spend Request</SelectItem>
                  <SelectItem value="QUOTE">Quote Request (Estimate / RFQ)</SelectItem>
                  <SelectItem value="ADMIN">Admin Triage</SelectItem>
                  <SelectItem value="RECURRING">Recurring (Subscription)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Priority <span className="text-red-500">*</span></label>
              <Select value={formData.priority} onValueChange={(val) => setFormData({ ...formData, priority: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Department <span className="text-red-500">*</span></label>
              <Input
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity</label>
              <Input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Unit Price</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
              />
            </div>

            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium">Est. Amount (Pre-tax)</label>
              <div className="h-10 px-3 py-2 rounded-md border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50 flex items-center text-sm text-slate-500 font-medium">
                ${((formData.unit_price ? parseFloat(formData.unit_price) : 0) * (formData.quantity ? parseInt(formData.quantity) : 1)).toFixed(2)}
              </div>
            </div>

            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium">Link / URL</label>
              <Input
                type="url"
                value={formData.item_url}
                onChange={(e) => setFormData({ ...formData, item_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium">GL Code / Account</label>
              <GLCodeAutocomplete
                value={formData.gl_code}
                onChange={(val) => setFormData({ ...formData, gl_code: val })}
              />
            </div>

            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
