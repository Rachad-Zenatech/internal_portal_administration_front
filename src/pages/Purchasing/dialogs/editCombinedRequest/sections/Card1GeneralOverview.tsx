import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProjectAutocomplete } from "../../../fields/ProjectAutocomplete";
import DepartmentAutocomplete from "../../../fields/DepartmentAutocomplete";
import { ScheduleDatesBuilder } from "../../../fields/ScheduleDatesBuilder";
import { ShippingDeliveryAddressField } from "../../../fields/ShippingDeliveryAddressField";
import { resolveUserDepartment } from "@/lib/userDepartment";
import type { Priority } from "@/types/purchasing";
import { Layers, Calendar, User, ShoppingBag, ExternalLink, Building2, Lock, FolderKanban } from "lucide-react";
import type { EditCombinedRequestState } from "../hooks/useEditCombinedRequest";

export function Card1GeneralOverview({ s }: { s: EditCombinedRequestState }) {
  const { setItemUrl, isOverviewLocked, itemUrl, dueDate, isRecurring, calculatedGrandTotal, setSchedDates, schedDates, setSchedEndDate, schedEndDate, setSchedStartDate, schedStartDate, setSchedFrequency, schedFrequency, setIsScheduled, isScheduled, setDueDate, vendorDirectory, wireTransfer, invVendor, poVendor, reqCurrency, lastUsedAddress, allSavedAddresses, setPhoneNumber, phoneNumber, setShippingAddress, shippingAddress, requestType, setProjectName, projectName, usersList, requester, setDepartment, department, setIsUserDropdownOpen, setRequester, rolesList, filteredUsers, isUserDropdownOpen, userDropdownRef, setPriority, priority, setRequestType, setTitle, title, itemMode, handleItemModeSwitch } = s;
  return (
    <div className={`rounded-xl border border-slate-200 dark:border-zinc-800 p-5 space-y-4 transition-colors ${
              isOverviewLocked
                ? "bg-slate-100/50 dark:bg-zinc-900/50"
                : "bg-slate-50/40 dark:bg-zinc-900/30"
            }`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-zinc-800/80">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-indigo-500" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200 tracking-tight uppercase text-[11px]">
                    General Overview &amp; Ownership
                  </h3>
                  {isOverviewLocked && (
                    <Badge variant="secondary" className="text-[10px] font-normal gap-1 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                      <Lock className="h-2.5 w-2.5" /> Locked (Completed)
                    </Badge>
                  )}
                </div>

                {/* Item Mode Switcher (Single Item vs Multiple Parts) */}
                <div className="flex items-center p-0.5 bg-slate-200/80 dark:bg-zinc-800 rounded-lg border border-slate-300/60 dark:border-zinc-700">
                  <button
                    type="button"
                    disabled={isOverviewLocked}
                    onClick={() => handleItemModeSwitch("SINGLE")}
                    className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      itemMode === "SINGLE"
                        ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                        : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
                    } ${isOverviewLocked ? "cursor-not-allowed opacity-80" : ""}`}
                  >
                    <ShoppingBag className="h-3.5 w-3.5" />
                    <span>Single Item</span>
                  </button>
                  <button
                    type="button"
                    disabled={isOverviewLocked}
                    onClick={() => handleItemModeSwitch("MULTIPLE")}
                    className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      itemMode === "MULTIPLE"
                        ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                        : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
                    } ${isOverviewLocked ? "cursor-not-allowed opacity-80" : ""}`}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>Multiple Parts / Items</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Title (Span 2) */}
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                    <span>Title / Product Name <span className="text-rose-500">*</span></span>
                    <span className="text-[10px] text-slate-400 font-normal">Primary summary for this requisition</span>
                  </label>
                  <Input
                    value={title}
                    disabled={isOverviewLocked}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Apple MacBook Pro 16-inch M3 Max"
                    className="h-10 text-sm font-medium bg-white dark:bg-zinc-900 disabled:opacity-75 disabled:cursor-not-allowed disabled:bg-slate-100/70 dark:disabled:bg-zinc-800/60"
                  />
                </div>

                {/* Request Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Request Type <span className="text-rose-500">*</span>
                  </label>
                  <Select value={requestType} onValueChange={(val: string) => setRequestType(val)} disabled={isOverviewLocked}>
                    <SelectTrigger className="h-10 text-sm bg-white dark:bg-zinc-900 disabled:opacity-75 disabled:cursor-not-allowed disabled:bg-slate-100/70 dark:disabled:bg-zinc-800/60">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SPEND">General Purchasing (Spend)</SelectItem>
                      <SelectItem value="ACCOUNTS_PAYABLE">Wire Transfer (Wire/Check)</SelectItem>
                      <SelectItem value="RECURRING">Recurring Payments (Subscriptions)</SelectItem>
                      <SelectItem value="SCHEDULED_PAYMENT">Scheduled Payments (Milestones)</SelectItem>
                      <SelectItem value="ADMIN">Admin Purchasing</SelectItem>
                      <SelectItem value="QUOTE">Quote Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Priority Level <span className="text-rose-500">*</span>
                  </label>
                  <Select value={priority} onValueChange={(val: Priority) => setPriority(val)} disabled={isOverviewLocked}>
                    <SelectTrigger className="h-10 text-sm bg-white dark:bg-zinc-900 disabled:opacity-75 disabled:cursor-not-allowed disabled:bg-slate-100/70 dark:disabled:bg-zinc-800/60">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Requester */}
                <div className="space-y-1.5 relative" ref={userDropdownRef}>
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                    <span>Requester <span className="text-rose-500">*</span></span>
                    <span className="text-[10px] text-slate-400 font-normal">Active user search</span>
                  </label>
                  <div className="relative">
                    <Input
                      value={requester}
                      disabled={isOverviewLocked}
                      onChange={(e) => {
                        setRequester(e.target.value);
                        setIsUserDropdownOpen(true);
                      }}
                      onFocus={() => {
                        if (!isOverviewLocked) setIsUserDropdownOpen(true);
                      }}
                      placeholder="Type name or email..."
                      className="h-10 text-sm pr-9 bg-white dark:bg-zinc-900 disabled:opacity-75 disabled:cursor-not-allowed disabled:bg-slate-100/70 dark:disabled:bg-zinc-800/60"
                    />
                    <User className="h-4 w-4 absolute right-3 top-3 text-slate-400 pointer-events-none" />
                  </div>
                  {!isOverviewLocked && isUserDropdownOpen && filteredUsers.length > 0 && (
                    <div className="absolute z-50 mt-1 w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800/60">
                      {filteredUsers.map((u: any) => {
                        const userDept = (u.department && u.department.trim() && u.department.toUpperCase() !== "REQUESTER")
                          ? u.department.trim()
                          : resolveUserDepartment(u, rolesList);
                        return (
                          <button
                            key={u.id}
                            type="button"
                            className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors flex flex-col gap-0.5"
                            onClick={() => {
                              setRequester(u.full_name || u.email);
                              if (userDept) setDepartment(userDept);
                              if (u.shipping_address) setShippingAddress(u.shipping_address);
                              if (u.phone_number) setPhoneNumber(u.phone_number);
                              setIsUserDropdownOpen(false);
                            }}
                          >
                            <span className="font-semibold text-slate-800 dark:text-zinc-200">
                              {u.full_name}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {u.email} {userDept ? `• ${userDept}` : ""}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Department */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Department <span className="text-rose-500">*</span>
                  </label>
                  <DepartmentAutocomplete
                    value={department}
                    disabled={isOverviewLocked}
                    onChange={setDepartment}
                    requesterName={requester}
                    usersList={usersList}
                    placeholder="Search or select department..."
                  />
                </div>

                {/* Group Project / Project */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <FolderKanban className="h-3.5 w-3.5 text-indigo-500" />
                    <span>Group Project / Project</span>
                    <span className="text-slate-400 font-normal text-[11px]">(e.g. Drone Project)</span>
                  </label>
                  <ProjectAutocomplete
                    value={projectName}
                    onChange={setProjectName}
                    disabled={isOverviewLocked}
                    placeholder="Select existing project or type project name (e.g. Drone Project)..."
                  />
                </div>

                {/* Shipping & Delivery Information (Optional for Spend & Quote Requests) */}
                {(requestType === "SPEND" || requestType === "QUOTE") && (
                  <ShippingDeliveryAddressField
                    className="md:col-span-3"
                    shippingAddress={shippingAddress}
                    onShippingAddressChange={setShippingAddress}
                    phoneNumber={phoneNumber}
                    onPhoneNumberChange={setPhoneNumber}
                    allSavedAddresses={allSavedAddresses}
                    lastUsedAddress={lastUsedAddress}
                    currency={reqCurrency || "USD"}
                    disabled={isOverviewLocked}
                    vendorName={poVendor || invVendor || wireTransfer?.vendor || ""}
                    vendorAddress={wireTransfer?.vendor_address || ""}
                    knownVendorLocations={vendorDirectory}
                    idPrefix="combined"
                  />
                )}

                {/* Due Date (Exclusive to RECURRING or if already populated) */}
                {(isRecurring || dueDate) && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                      <span>{isRecurring ? "Next Due Date *" : "Target Due Date"}</span>
                    </label>
                    <Input
                      type="date"
                      value={dueDate}
                      disabled={isOverviewLocked}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="h-10 text-sm bg-white dark:bg-zinc-900 disabled:opacity-75 disabled:cursor-not-allowed disabled:bg-slate-100/70 dark:disabled:bg-zinc-800/60"
                    />
                  </div>
                )}

                {isRecurring && (
                  <div className="md:col-span-3 pt-2">
                    <ScheduleDatesBuilder
                      isScheduled={isScheduled}
                      onIsScheduledChange={setIsScheduled}
                      frequency={schedFrequency}
                      onFrequencyChange={setSchedFrequency}
                      startDate={schedStartDate}
                      onStartDateChange={setSchedStartDate}
                      endDate={schedEndDate}
                      onEndDateChange={setSchedEndDate}
                      scheduleDates={schedDates}
                      onScheduleDatesChange={setSchedDates}
                      baseAmount={calculatedGrandTotal}
                    />
                  </div>
                )}

                {/* Product / Quote URL */}
                <div className={`space-y-1.5 ${(isRecurring || dueDate) ? "md:col-span-2" : "md:col-span-3"}`}>
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                    <span>Product URL / Web Reference</span>
                    {itemUrl && (
                      <a
                        href={itemUrl.startsWith("http") ? itemUrl : `https://${itemUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>Open Link</span>
                      </a>
                    )}
                  </label>
                  <Input
                    value={itemUrl}
                    disabled={isOverviewLocked}
                    onChange={(e) => setItemUrl(e.target.value)}
                    placeholder="https://vendor.com/product-page"
                    className="h-10 text-sm bg-white dark:bg-zinc-900 disabled:opacity-75 disabled:cursor-not-allowed disabled:bg-slate-100/70 dark:disabled:bg-zinc-800/60"
                  />
                </div>
              </div>
            </div>
  );
}
