import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { resolveUserDepartment } from "@/lib/userDepartment";
import { ProjectAutocomplete } from "../../../fields/ProjectAutocomplete";
import { toast } from "sonner";
import { FolderKanban } from "lucide-react";
import { formatMoney } from "../../../utils/purchasingMeta";
import { ShippingDeliveryAddressField } from "../../../fields/ShippingDeliveryAddressField";
import { RequesterAutocomplete } from "../components/RequesterAutocomplete";
import type { EditRequestDialogState } from "../hooks/useEditRequestDialog";

export function RequestTitleAndPriority({ s }: { s: EditRequestDialogState }) {
  const { vendorDirectory, effectiveVendorAddress, effectiveVendorName, taxEstimate, setTaxFee, taxFee, currentSubtotal, request, lastUsedAddress, allSavedAddresses, setFormData, formData, rolesList, usersList } = s;
  return (
    <div className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Request Title <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Request Title"
                  className="h-9 text-xs font-medium"
                  required
                />
              </div>

              {/* Priority NOT at top - Clean 3-Column Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <RequesterAutocomplete
                  value={formData.requester}
                  onChange={(val) => {
                    const matched = usersList.find(
                      (u) =>
                        (u.full_name && u.full_name.toLowerCase() === val.toLowerCase().trim()) ||
                        (u.email && u.email.toLowerCase() === val.toLowerCase().trim())
                    );
                    const dept = (matched?.department && matched.department.trim() && matched.department.toUpperCase() !== "REQUESTER")
                      ? matched.department.trim()
                      : (matched ? resolveUserDepartment(matched, rolesList) : "");
                    setFormData((prev) => ({
                      ...prev,
                      requester: val,
                      department: dept || prev.department,
                      shipping_address: matched?.shipping_address !== undefined ? (matched.shipping_address || "") : prev.shipping_address,
                      phone_number: matched?.phone_number !== undefined ? (matched.phone_number || "") : prev.phone_number,
                    }));
                  }}
                  onSelectUser={(selectedUser) => {
                    const dept = (selectedUser?.department && selectedUser.department.trim() && selectedUser.department.toUpperCase() !== "REQUESTER")
                      ? selectedUser.department.trim()
                      : resolveUserDepartment(selectedUser, rolesList);
                    setFormData((prev) => ({
                      ...prev,
                      department: dept || prev.department,
                      shipping_address: selectedUser?.shipping_address !== undefined ? (selectedUser.shipping_address || "") : prev.shipping_address,
                      phone_number: selectedUser?.phone_number !== undefined ? (selectedUser.phone_number || "") : prev.phone_number,
                    }));
                  }}
                  users={usersList}
                  roles={rolesList}
                />

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="h-9 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Priority <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.priority}
                    onValueChange={(val) => setFormData({ ...formData, priority: val })}
                  >
                    <SelectTrigger className="h-9 text-xs">
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
              </div>

              {/* Group Project / Project */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <FolderKanban className="h-3.5 w-3.5 text-indigo-500" />
                    <span>Group Project / Project</span>
                    <span className="text-slate-400 font-normal text-[11px]">(e.g. Drone Project - groups related purchases)</span>
                  </label>
                </div>
                <ProjectAutocomplete
                  value={formData.project_name || ""}
                  onChange={(val) => setFormData((prev) => ({ ...prev, project_name: val }))}
                  placeholder="Select existing project or type project name (e.g. Drone Project)..."
                />
              </div>

              {/* Shipping & Delivery Information (Optional for Spend & Quote Requests) */}
              {(formData.request_type === "SPEND" || formData.request_type === "QUOTE") && (
                <ShippingDeliveryAddressField
                  shippingAddress={formData.shipping_address || ""}
                  onShippingAddressChange={(val) => setFormData((p) => ({ ...p, shipping_address: val }))}
                  phoneNumber={formData.phone_number || ""}
                  onPhoneNumberChange={(val) => setFormData((p) => ({ ...p, phone_number: val }))}
                  allSavedAddresses={allSavedAddresses}
                  lastUsedAddress={lastUsedAddress}
                  currency={request?.currency || "USD"}
                  subtotal={currentSubtotal}
                  currentTaxFee={taxFee}
                  onApplyEstimatedTax={(amt) => {
                    setTaxFee(amt);
                    if (taxEstimate) {
                      toast.info(`Set estimated tax (${taxEstimate.ratePercent}%): $${formatMoney(amt)}`);
                    }
                  }}
                  vendorName={effectiveVendorName}
                  vendorAddress={effectiveVendorAddress}
                  knownVendorLocations={vendorDirectory}
                  idPrefix="edit"
                />
              )}
            </div>
  );
}
