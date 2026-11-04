import { toast } from "sonner";
import { FolderKanban } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type Priority } from "@/types/purchasing";
import { ShippingDeliveryAddressField } from "../../fields/ShippingDeliveryAddressField";
import { formatMoney } from "../../utils/purchasingMeta";
import { resolveUserDepartment } from "@/lib/userDepartment";
import { ProjectAutocomplete } from "../../fields/ProjectAutocomplete";
import { RequesterAutocomplete } from "../components/RequesterAutocomplete";
import type { PurchaseRequestsState } from "../hooks/usePurchaseRequestsPage";

export function RequestTitleAndPriority({ s }: { s: PurchaseRequestsState }) {
  const { vendorDirectory, effectiveVendorAddress, effectiveVendorName, taxEstimate, setTaxFee, taxFee, currentSubtotal, form, lastUsedAddress, allSavedAddresses, setForm, rolesList, usersList } = s;
  return (
    <div className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  {form.request_type === "RECURRING" ? "Subscription / Service Name" : "Request Title"} <span className="text-red-500">*</span>
                </label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder={
                    form.request_type === "RECURRING"
                      ? "e.g. AWS Cloud Infrastructure, Slack Enterprise, Datadog"
                      : form.request_type === "ACCOUNTS_PAYABLE"
                      ? "e.g. Payment for Dell Technologies (Invoice #1049)"
                      : "e.g. Dell laptop for new hire or Quote Q-10294"
                  }
                  className="h-9 text-xs font-medium"
                  required
                />
              </div>

              {/* Priority NOT at top - Clean 3-Column Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <RequesterAutocomplete
                  required
                  value={form.requester}
                  onChange={(val) => {
                    const matched = usersList.find(
                      (u) =>
                        (u.full_name && u.full_name.toLowerCase() === val.toLowerCase().trim()) ||
                        (u.email && u.email.toLowerCase() === val.toLowerCase().trim())
                    );
                    const dept = (matched?.department && matched.department.trim() && matched.department.toUpperCase() !== "REQUESTER")
                      ? matched.department.trim()
                      : (matched ? resolveUserDepartment(matched, rolesList) : "");
                    setForm((prev) => ({
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
                    setForm((prev) => ({
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
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    placeholder="e.g. Technology, Operations"
                    className="h-9 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Priority <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={form.priority}
                    onValueChange={(v) => setForm({ ...form, priority: v as Priority })}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
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

              {/* Group Project / Project Assignment */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <FolderKanban className="h-3.5 w-3.5 text-indigo-500" />
                    <span>Group Project / Project</span>
                    <span className="text-slate-400 font-normal text-[11px]">(Optional: group related purchases e.g. &quot;Drone Project&quot;)</span>
                  </label>
                </div>
                <ProjectAutocomplete
                  value={form.project_name || ""}
                  onChange={(val) => setForm((prev) => ({ ...prev, project_name: val }))}
                  placeholder="Select existing project or type project name (e.g. Drone Project)..."
                />
              </div>

              {/* Shipping & Delivery Information (Optional for Spend & Quote Requests) */}
              {(form.request_type === "SPEND" || form.request_type === "QUOTE") && (
                <ShippingDeliveryAddressField
                  shippingAddress={form.shipping_address || ""}
                  onShippingAddressChange={(val) => setForm((p) => ({ ...p, shipping_address: val }))}
                  phoneNumber={form.phone_number || ""}
                  onPhoneNumberChange={(val) => setForm((p) => ({ ...p, phone_number: val }))}
                  allSavedAddresses={allSavedAddresses}
                  lastUsedAddress={lastUsedAddress}
                  currency={form.currency || "USD"}
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
                  idPrefix="create"
                />
              )}
            </div>
  );
}
