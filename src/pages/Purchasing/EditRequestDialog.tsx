import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useUpdateRequest, useUsersList, useRolesList } from "@/hooks/usePurchasing";
import { resolveUserDepartment } from "@/lib/userDepartment";
import { useAuth } from "@/lib/AuthContext";
import { GLCodeAutocomplete } from "./GLCodeAutocomplete";
import { useRef } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Maximize2, FileText, Truck, DollarSign, AlertTriangle } from "lucide-react";
import { formatMoney } from "./purchasingMeta";
import { RequestStatus, type ItemMode, type PurchaseRequestItem } from "@/types/purchasing";
import { parseRequestStatus } from "@/lib/requestStatus";


function RequesterAutocomplete({
  value,
  onChange,
  onSelectUser,
  users = [],
  roles = [],
}: {
  value: string;
  onChange: (val: string) => void;
  onSelectUser?: (user: any) => void;
  users: any[];
  roles?: any[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredUsers = useMemo(() => {
    const activeUsers = users.filter((u) => u.is_active !== false);
    const q = (value || "").toLowerCase().trim();
    if (!q) return activeUsers.slice(0, 10);
    return activeUsers
      .filter((u) => {
        const name = (u.full_name || "").toLowerCase();
        const email = (u.email || "").toLowerCase();
        const dept = resolveUserDepartment(u, roles).toLowerCase();
        return name.includes(q) || email.includes(q) || dept.includes(q);
      })
      .slice(0, 10);
  }, [value, users, roles]);

  return (
    <div ref={containerRef} className="relative space-y-2">
      <label className="text-sm font-medium">Requester <span className="text-red-500">*</span></label>
      <div className="relative">
        <Input
          value={value}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          placeholder="Search requester (e.g. Rachad, Rachel)..."
          className="w-full"
          required
        />
        {isOpen && filteredUsers.length > 0 && (
          <div className="absolute z-50 left-0 mt-1.5 w-full max-h-60 overflow-y-auto overflow-x-hidden bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg shadow-xl py-1 text-sm divide-y divide-slate-100 dark:divide-zinc-800/60">
            {filteredUsers.map((u) => {
              const displayName = u.full_name || u.email || "Unknown User";
              const email = u.email;
              const dept = resolveUserDepartment(u, roles);

              return (
                <div
                  key={u.id}
                  className="px-3.5 py-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/80 flex flex-col gap-0.5 transition-colors text-left"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onChange(displayName);
                    if (onSelectUser) {
                      onSelectUser(u);
                    }
                    setIsOpen(false);
                  }}
                >
                  <div className="font-semibold text-slate-900 dark:text-zinc-100 text-sm leading-snug">
                    {displayName}
                  </div>
                  {email && (
                    <div className="text-xs text-slate-500 dark:text-zinc-400 truncate leading-snug">
                      {email}
                    </div>
                  )}
                  {dept ? (
                    <div className="text-[11px] font-medium text-slate-600 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                      <span className="text-slate-400 dark:text-zinc-500 font-normal">Dept:</span>
                      <span className="text-indigo-600 dark:text-indigo-400">{dept}</span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 dark:text-zinc-500 italic mt-0.5">
                      No department
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function EditRequestDialog({
  request,
  open,
  onOpenChange,
}: {
  request: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isMulti = request?.item_mode === "MULTIPLE" || (request?.items && request.items.length > 0);
  const parsedStatus = parseRequestStatus(request?.status);
  const isLinkEditable = parsedStatus === RequestStatus.Initial || parsedStatus === RequestStatus.New || parsedStatus === RequestStatus.UnderReview;
  const [itemMode, setItemMode] = useState<ItemMode>(isMulti ? "MULTIPLE" : "SINGLE");
  const { data: usersList = [] } = useUsersList();
  const { data: rolesList = [] } = useRolesList();
  const { user, roles = [] } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    requester: "",
    request_type: "",
    priority: "",
    department: "",
    item_url: "",
    unit_price: "",
    quantity: "1",
    amount: "0",
    description: "",
    gl_code: "",
    due_date: "",
  });

  const [items, setItems] = useState<PurchaseRequestItem[]>([]);
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [taxFee, setTaxFee] = useState<number>(0);
  const [discountFee, setDiscountFee] = useState<number>(0);
  const [isFullScreenTable, setIsFullScreenTable] = useState(false);
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState<string>("");

  useEffect(() => {
    if (open && (!formData.department || formData.department === "General") && (usersList.length > 0 || user)) {
      const targetRequester = formData.requester || request?.requester || user?.full_name || user?.email || "";
      const matched = usersList.find(
        (u) =>
          (u.full_name && u.full_name.toLowerCase() === targetRequester.toLowerCase().trim()) ||
          (u.email && u.email.toLowerCase() === targetRequester.toLowerCase().trim()) ||
          (user?.id && u.id === user.id)
      );
      const effectiveRoles = rolesList.length > 0 ? rolesList : roles;
      const resolved = matched
        ? resolveUserDepartment(matched, effectiveRoles)
        : (resolveUserDepartment({ ...user, roles }, effectiveRoles) || (user?.department && user.department.toUpperCase() !== "REQUESTER" ? user.department : "") || "");
      if (resolved) {
        setFormData((prev) => (!prev.department || prev.department === "General" ? { ...prev, department: resolved } : prev));
      }
    }
  }, [open, formData.requester, formData.department, usersList, rolesList, user, roles, request]);

  useEffect(() => {
    if (request && open) {
      const isMultiReq = request.item_mode === "MULTIPLE" || (request.items && request.items.length > 0);
      const initialMode: ItemMode = isMultiReq ? "MULTIPLE" : "SINGLE";
      setItemMode(initialMode);

      let dept = request.department || "";
      if (!dept || dept === "General") {
        const targetRequester = request.requester || user?.full_name || user?.email || "";
        const matched = usersList.find(
          (u) =>
            (u.full_name && u.full_name.toLowerCase() === targetRequester.toLowerCase().trim()) ||
            (u.email && u.email.toLowerCase() === targetRequester.toLowerCase().trim()) ||
            (user?.id && u.id === user.id)
        );
        const effectiveRoles = rolesList.length > 0 ? rolesList : roles;
        const resolved = matched
          ? resolveUserDepartment(matched, effectiveRoles)
          : (resolveUserDepartment({ ...user, roles }, effectiveRoles) || (user?.department && user.department.toUpperCase() !== "REQUESTER" ? user.department : "") || "");
        if (resolved) {
          dept = resolved;
        }
      }

      const initialForm = {
        title: request.title || "",
        requester: request.requester || "",
        request_type: request.request_type || "SPEND",
        priority: request.priority || "MEDIUM",
        department: dept,
        item_url: request.item_url || "",
        unit_price: request.unit_price ? request.unit_price.toString() : "",
        quantity: request.quantity ? request.quantity.toString() : "1",
        amount: request.amount ? request.amount.toString() : (request.unit_price ? request.unit_price.toString() : "0"),
        description: request.description || "",
        gl_code: request.gl_code || "",
        due_date: request.due_date ? request.due_date.split("T")[0] : "",
      };
      setFormData(initialForm);

      const qShipping = Number(request.quote_data?.totals?.shipping);
      const qTax = Number(request.quote_data?.totals?.tax);
      const qDiscount = Number(request.quote_data?.totals?.discount);

      let parsedItems: PurchaseRequestItem[] = [];
      if (request.items && request.items.length > 0) {
        parsedItems = request.items.map((itm: any, idx: number) => ({
          id: itm.id,
          item_order: itm.item_order ?? idx,
          sku: itm.sku || "",
          description: itm.description || "",
          quantity: Number(itm.quantity) || 1,
          unit_price: Number(itm.unit_price) || 0,
          discount: Number(itm.discount) || 0,
          tax: Number(itm.tax) || 0,
          total: Number(itm.total) || (Number(itm.quantity || 1) * Number(itm.unit_price || 0)),
        }));
      }
      setItems(parsedItems);

      const itemsSum = parsedItems.reduce((acc, itm) => acc + (Number(itm.total) || 0), 0);
      let calculatedShipping = 0;
      if (!isNaN(qShipping) && qShipping > 0) {
        calculatedShipping = qShipping;
      } else if (isMultiReq && request.amount && itemsSum > 0 && request.amount > itemsSum) {
        calculatedShipping = Math.round((request.amount - itemsSum) * 100) / 100;
      }
      setShippingFee(calculatedShipping);

      const calculatedTax = !isNaN(qTax) ? qTax : 0;
      const calculatedDiscount = !isNaN(qDiscount) ? qDiscount : 0;
      setTaxFee(calculatedTax);
      setDiscountFee(calculatedDiscount);

      // Save initial snapshot for dirty tracking
      setInitialSnapshot(
        JSON.stringify({
          formData: initialForm,
          itemMode: initialMode,
          items: parsedItems,
          shippingFee: calculatedShipping,
          taxFee: calculatedTax,
          discountFee: calculatedDiscount,
        })
      );
      setShowUnsavedConfirm(false);
    }
  }, [request, open]);

  const isDirty = useMemo(() => {
    if (!open || !initialSnapshot) return false;
    const currentSnapshot = JSON.stringify({
      formData,
      itemMode,
      items,
      shippingFee,
      taxFee,
      discountFee,
    });
    return currentSnapshot !== initialSnapshot;
  }, [open, initialSnapshot, formData, itemMode, items, shippingFee, taxFee, discountFee]);

  const handleRequestClose = () => {
    if (isDirty) {
      setShowUnsavedConfirm(true);
    } else {
      onOpenChange(false);
    }
  };

  const updateMutation = useUpdateRequest();

  const handleItemChange = (index: number, field: keyof PurchaseRequestItem, val: any) => {
    setItems((prev) => {
      const next = [...prev];
      const target = { ...next[index], [field]: val };
      if (field === "quantity" || field === "unit_price" || field === "discount" || field === "tax") {
        const q = Number(target.quantity) || 0;
        const p = Number(target.unit_price) || 0;
        const d = Number(target.discount) || 0;
        const t = Number(target.tax) || 0;
        target.total = Math.max(0, q * p - d + t);
      }
      next[index] = target;
      return next;
    });
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        item_order: prev.length,
        description: "",
        quantity: 1,
        unit_price: 0,
        discount: 0,
        tax: 0,
        total: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const itemsSubtotal = useMemo(() => {
    return items.reduce((sum, itm) => sum + (Number(itm.total) || 0), 0);
  }, [items]);

  const calculatedAmount = useMemo(() => {
    if (itemMode === "MULTIPLE") {
      const total = itemsSubtotal + Number(shippingFee || 0) + Number(taxFee || 0) - Number(discountFee || 0);
      return Math.max(0, Math.round(total * 100) / 100);
    }
    if (formData.request_type === "RECURRING") {
      const val = formData.amount ? parseFloat(formData.amount) : (formData.unit_price ? parseFloat(formData.unit_price) : 0);
      return Math.max(0, Math.round(val * 100) / 100);
    }
    const up = formData.unit_price ? parseFloat(formData.unit_price) : 0;
    const qty = formData.quantity ? parseInt(formData.quantity) : 1;
    return Math.round(up * qty * 100) / 100;
  }, [itemMode, itemsSubtotal, shippingFee, taxFee, discountFee, formData.unit_price, formData.quantity, formData.request_type, formData.amount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.request_type || !formData.department) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (itemMode === "MULTIPLE" && items.length === 0) {
      toast.error("Please add at least one line item for Multiple Parts mode.");
      return;
    }

    try {
      const unitPrice = formData.unit_price ? parseFloat(formData.unit_price) : 0;
      const quantity = formData.quantity ? parseInt(formData.quantity) : 1;
      const payload: any = {
        title: formData.title,
        request_type: formData.request_type,
        priority: formData.priority,
        requester: formData.requester,
        department: formData.department,
        item_mode: itemMode,
        gl_code: formData.gl_code || null,
        due_date: formData.due_date || null,
        description: formData.description || null,
        amount: calculatedAmount,
      };

      if (formData.request_type === "RECURRING") {
        payload.unit_price = calculatedAmount;
        payload.quantity = 1;
        payload.item_url = null;
        payload.items = [];
      } else if (itemMode === "SINGLE") {
        payload.unit_price = unitPrice;
        payload.quantity = quantity;
        payload.item_url = formData.item_url || null;
        payload.items = [];
      } else {
        payload.items = items;
        payload.quote_data = {
          ...(request.quote_data || {}),
          totals: {
            ...(request.quote_data?.totals || {}),
            subtotal: itemsSubtotal,
            shipping: Number(shippingFee || 0),
            tax: Number(taxFee || 0),
            discount: Number(discountFee || 0),
            total: calculatedAmount,
          },
        };
      }

      await updateMutation.mutateAsync({ id: request.id, data: payload });
      toast.success("Request updated successfully.");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || err?.message || "Failed to update request.");
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            handleRequestClose();
          } else {
            onOpenChange(true);
          }
        }}
      >
        <DialogContent
          aria-describedby={undefined}
          onPointerDownOutside={(e) => {
            if (isDirty) {
              e.preventDefault();
              setShowUnsavedConfirm(true);
            }
          }}
          onEscapeKeyDown={(e) => {
            if (isDirty) {
              e.preventDefault();
              setShowUnsavedConfirm(true);
            }
          }}
          className="!w-[92vw] !max-w-[1000px] sm:!max-w-[1000px] max-h-[90vh] overflow-y-auto"
          style={{ width: "92vw", maxWidth: "1000px" }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{formData.request_type === "RECURRING" ? "Edit Recurring Payment Request" : "Edit Purchase Request"} #{request?.id}</span>
              {itemMode === "MULTIPLE" && formData.request_type !== "RECURRING" && (
                <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 border-indigo-200">
                  <FileText className="h-3 w-3 mr-1" /> Multi-Part Quote
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {/* Mode Switcher */}
            {formData.request_type !== "ACCOUNTS_PAYABLE" && formData.request_type !== "RECURRING" && (
              <div className="p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-lg border border-slate-200 dark:border-zinc-700">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block mb-1.5">
                  Item Configuration
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={itemMode === "SINGLE" ? "default" : "outline"}
                    className="w-full text-xs font-medium justify-center h-9"
                    onClick={() => setItemMode("SINGLE")}
                    disabled={isMulti}
                  >
                    Single Item (Direct entry)
                  </Button>
                  <Button
                    type="button"
                    variant={itemMode === "MULTIPLE" ? "default" : "outline"}
                    className="w-full text-xs font-medium justify-center h-9"
                    onClick={() => setItemMode("MULTIPLE")}
                    disabled={!isMulti}
                  >
                    <FileText className="h-3.5 w-3.5 mr-1.5" /> Multiple Parts ({items.length} parts)
                  </Button>
                </div>
              </div>
            )}

            {/* Multiple Parts Line Items Table */}
            {itemMode === "MULTIPLE" && formData.request_type !== "RECURRING" && (
              <div className="space-y-3 p-3.5 rounded-lg border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-950/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs font-semibold text-slate-900 dark:text-zinc-100">
                      Line Items &amp; Parts Breakdown ({items.length})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsFullScreenTable(true)}
                      className="h-7 text-xs flex items-center gap-1.5 bg-white dark:bg-zinc-900 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 shadow-xs"
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                      <span>Full Screen Table</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddItem}
                      className="h-7 text-xs flex items-center gap-1 bg-white dark:bg-zinc-900"
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add Part
                    </Button>
                  </div>
                </div>

                {/* Table */}
                <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200 dark:border-zinc-700 shadow-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 uppercase text-[11px] font-semibold ">
                      <tr>
                        <th className="p-2 w-10 text-center text-slate-400">#</th>
                        <th className="p-2 w-28">SKU</th>
                        <th className="p-2">Description</th>
                        <th className="p-2 w-20 text-right">Qty</th>
                        <th className="p-2 w-28 text-right">Price ($)</th>
                        <th className="p-2 w-28 text-right">Total ($)</th>
                        <th className="p-2 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                      {items.map((itm, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                          <td className="p-2 text-center text-xs font-mono text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="p-2 w-28">
                            <Input
                              value={itm.sku || ""}
                              onChange={(e) => handleItemChange(idx, "sku", e.target.value)}
                              placeholder="SKU / Part #"
                              className="h-8 text-sm font-mono"
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              value={itm.description}
                              onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                              placeholder="Item description..."
                              className="h-8 text-sm w-full bg-white dark:bg-zinc-900 font-medium"
                            />
                          </td>
                          <td className="p-2 w-20">
                            <Input
                              type="number"
                              min="1"
                              step="1"
                              value={itm.quantity}
                              onChange={(e) => handleItemChange(idx, "quantity", Number(e.target.value))}
                              className="h-8 text-sm text-right font-medium"
                            />
                          </td>
                          <td className="p-2 w-28">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={itm.unit_price}
                              onChange={(e) => handleItemChange(idx, "unit_price", Number(e.target.value))}
                              className="h-8 text-sm text-right font-mono"
                            />
                          </td>
                          <td className="p-2 w-28 text-right font-semibold font-mono text-sm text-slate-900 dark:text-zinc-100">
                            {formatMoney(itm.total)}
                          </td>
                          <td className="p-2 text-center w-10">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                              onClick={() => handleRemoveItem(idx)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {items.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-6 text-slate-400 text-xs">
                            No line items added yet. Click &quot;Add Part&quot; to begin.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Totals Breakdown Card with Shipping Fee */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-xs">
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                      Summary Calculation
                    </div>
                    <div className="flex justify-between text-slate-700 dark:text-zinc-300">
                      <span>Parts Subtotal ({items.length} parts):</span>
                      <span className="font-semibold font-mono">{formatMoney(itemsSubtotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-700 dark:text-zinc-300">
                      <span>Shipping &amp; Handling:</span>
                      <span className="font-semibold font-mono text-indigo-700 dark:text-indigo-400">
                        +{formatMoney(shippingFee)}
                      </span>
                    </div>
                    {taxFee > 0 && (
                      <div className="flex justify-between text-slate-700 dark:text-zinc-300">
                        <span>Taxes &amp; Customs:</span>
                        <span className="font-semibold font-mono">+{formatMoney(taxFee)}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 border-t sm:border-t-0 sm:border-l sm:pl-3 border-slate-200 dark:border-zinc-700 flex flex-col justify-between">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1 mb-1">
                          <Truck className="h-3 w-3 text-indigo-600" />
                          <span>Shipping Fee ($)</span>
                        </label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={shippingFee === 0 ? "" : shippingFee}
                          onChange={(e) => setShippingFee(Number(e.target.value) || 0)}
                          placeholder="0.00"
                          className="h-8 text-xs font-mono font-medium bg-white dark:bg-zinc-900"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1 mb-1">
                          <DollarSign className="h-3 w-3 text-emerald-600" />
                          <span>Tax / Customs ($)</span>
                        </label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={taxFee === 0 ? "" : taxFee}
                          onChange={(e) => setTaxFee(Number(e.target.value) || 0)}
                          placeholder="0.00"
                          className="h-8 text-xs font-mono font-medium bg-white dark:bg-zinc-900"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-zinc-700">
                      <span className="font-bold text-slate-800 dark:text-zinc-200 text-xs">Grand Total:</span>
                      <span className="font-bold text-base text-indigo-700 dark:text-indigo-300 font-mono">
                        {formatMoney(calculatedAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* General Fields */}
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
                <Select
                  value={formData.request_type}
                  onValueChange={(val) => setFormData({ ...formData, request_type: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SPEND">Spend Request</SelectItem>
                    <SelectItem value="RECURRING">Recurring Payment</SelectItem>
                    <SelectItem value="QUOTE">Quote Request (Estimate / RFQ)</SelectItem>
                    <SelectItem value="ADMIN">Admin Triage</SelectItem>
                    <SelectItem value="ACCOUNTS_PAYABLE">Accounts Payable</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Priority <span className="text-red-500">*</span></label>
                <Select
                  value={formData.priority}
                  onValueChange={(val) => setFormData({ ...formData, priority: val })}
                >
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

              <div className="grid grid-cols-2 gap-4 col-span-2">
                <RequesterAutocomplete
                  value={formData.requester}
                  onChange={(val) => {
                    const matched = usersList.find(
                      (u) =>
                        (u.full_name && u.full_name.toLowerCase() === val.toLowerCase().trim()) ||
                        (u.email && u.email.toLowerCase() === val.toLowerCase().trim())
                    );
                    const dept = matched ? resolveUserDepartment(matched, rolesList) : "";
                    setFormData((prev) => ({ ...prev, requester: val, department: dept || prev.department }));
                  }}
                  onSelectUser={(selectedUser) => {
                    const dept = resolveUserDepartment(selectedUser, rolesList);
                    if (dept) {
                      setFormData((prev) => ({ ...prev, department: dept }));
                    }
                  }}
                  users={usersList}
                  roles={rolesList}
                />
                <div className="space-y-2">
                  <label className="text-sm font-medium">Department <span className="text-red-500">*</span></label>
                  <Input
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    required
                  />
                </div>
              </div>

              {formData.request_type === "RECURRING" ? (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Amount (USD) <span className="text-red-500">*</span></label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value, unit_price: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Next Due Date</label>
                    <Input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <label className="text-sm font-medium">GL Code / Account</label>
                    <GLCodeAutocomplete
                      value={formData.gl_code}
                      onChange={(val) => setFormData({ ...formData, gl_code: val })}
                    />
                  </div>
                </>
              ) : (
                <>
                  {itemMode === "SINGLE" && (
                    <>
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
                        <label className="text-sm font-medium">Unit Price ($)</label>
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
                        <div className="h-10 px-3 py-2 rounded-md border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50 flex items-center text-sm text-slate-700 dark:text-zinc-300 font-semibold font-mono">
                          {formatMoney(calculatedAmount)}
                        </div>
                      </div>

                      <div className="space-y-2 col-span-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">Link / URL</label>
                          {!isLinkEditable && (
                            <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-normal">
                              Locked (not editable from Waiting Approval onward)
                            </span>
                          )}
                        </div>
                        <Input
                          type="url"
                          value={formData.item_url}
                          onChange={(e) => setFormData({ ...formData, item_url: e.target.value })}
                          placeholder="https://..."
                          disabled={!isLinkEditable}
                          className={!isLinkEditable ? "bg-slate-100 dark:bg-zinc-800/60 cursor-not-allowed text-slate-500 dark:text-zinc-400" : ""}
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-2 col-span-2">
                    <label className="text-sm font-medium">GL Code / Account</label>
                    <GLCodeAutocomplete
                      value={formData.gl_code}
                      onChange={(val) => setFormData({ ...formData, gl_code: val })}
                    />
                  </div>
                </>
              )}

              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium">{formData.request_type === "RECURRING" ? "Description / Terms" : "Description"}</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={handleRequestClose}>
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

      {/* Full Screen Line Items Table Dialog (Screen-Wide) */}
      <Dialog open={isFullScreenTable} onOpenChange={setIsFullScreenTable}>
        <DialogContent
          aria-describedby={undefined}
          className="!w-[96vw] !max-w-[96vw] sm:!max-w-[96vw] max-h-[94vh] overflow-y-auto p-6"
          style={{ width: "96vw", maxWidth: "96vw" }}
        >
          <DialogHeader className="pb-3 border-b flex flex-row items-center justify-between pr-6">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-indigo-950 dark:text-indigo-200">
              <FileText className="h-6 w-6 text-indigo-600" />
              <span>Full Screen Line Items Table ({items.length} Parts)</span>
            </DialogTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddItem}
              className="h-8 text-xs flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4 mr-0.5" /> Add Part
            </Button>
          </DialogHeader>

          <div className="space-y-5 pt-4">
            <div className="rounded-lg border border-slate-200 dark:border-zinc-700 overflow-hidden shadow-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 uppercase text-xs font-semibold ">
                  <tr>
                    <th className="p-3 w-12 text-center text-slate-400">#</th>
                    <th className="p-3 w-36 font-semibold">SKU</th>
                    <th className="p-3 font-semibold">Description</th>
                    <th className="p-3 w-28 text-right font-semibold">Qty</th>
                    <th className="p-3 w-36 text-right font-semibold">Unit Price ($)</th>
                    <th className="p-3 w-36 text-right font-semibold">Total ($)</th>
                    <th className="p-3 w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                  {items.map((itm, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="p-3 text-center text-xs font-mono text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="p-3 w-36">
                        <Input
                          value={itm.sku || ""}
                          onChange={(e) => handleItemChange(idx, "sku", e.target.value)}
                          placeholder="SKU / Part #"
                          className="h-10 text-sm font-mono"
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          value={itm.description}
                          onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                          placeholder="Part / Item full description..."
                          className="h-10 text-sm w-full bg-white dark:bg-zinc-900 font-medium"
                        />
                      </td>
                      <td className="p-3 w-28">
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          value={itm.quantity}
                          onChange={(e) => handleItemChange(idx, "quantity", Number(e.target.value))}
                          className="h-10 text-sm text-right font-medium"
                        />
                      </td>
                      <td className="p-3 w-36">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={itm.unit_price}
                          onChange={(e) => handleItemChange(idx, "unit_price", Number(e.target.value))}
                          className="h-10 text-sm text-right font-mono"
                        />
                      </td>
                      <td className="p-3 w-36 text-right font-bold font-mono text-base text-slate-900 dark:text-zinc-100">
                        {formatMoney(itm.total)}
                      </td>
                      <td className="p-3 text-center w-12">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                          onClick={() => handleRemoveItem(idx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400 text-sm">
                        No line items added yet. Click &quot;Add Part&quot; above to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Totals Card in Full Screen Modal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-slate-50 dark:bg-zinc-800/70 border border-slate-200 dark:border-zinc-700">
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Quote Summary
                </div>
                <div className="flex justify-between text-sm text-slate-700 dark:text-zinc-300">
                  <span>Parts Subtotal ({items.length} parts):</span>
                  <span className="font-semibold font-mono">{formatMoney(itemsSubtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-700 dark:text-zinc-300">
                  <span>Shipping &amp; Handling:</span>
                  <span className="font-semibold font-mono text-indigo-700 dark:text-indigo-400">
                    +{formatMoney(shippingFee)}
                  </span>
                </div>
                {taxFee > 0 && (
                  <div className="flex justify-between text-sm text-slate-700 dark:text-zinc-300">
                    <span>Taxes &amp; Customs:</span>
                    <span className="font-semibold font-mono">+{formatMoney(taxFee)}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3 border-t sm:border-t-0 sm:border-l sm:pl-4 border-slate-200 dark:border-zinc-700 flex flex-col justify-between">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1 mb-1.5">
                      <Truck className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Shipping Fee ($)</span>
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={shippingFee === 0 ? "" : shippingFee}
                      onChange={(e) => setShippingFee(Number(e.target.value) || 0)}
                      placeholder="0.00"
                      className="h-9 text-sm font-mono font-medium bg-white dark:bg-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1 mb-1.5">
                      <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Tax / Customs ($)</span>
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={taxFee === 0 ? "" : taxFee}
                      onChange={(e) => setTaxFee(Number(e.target.value) || 0)}
                      placeholder="0.00"
                      className="h-9 text-sm font-mono font-medium bg-white dark:bg-zinc-900"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-zinc-700">
                  <span className="font-bold text-slate-900 dark:text-zinc-100 text-sm">Calculated Grand Total:</span>
                  <span className="font-bold text-xl text-indigo-700 dark:text-indigo-300 font-mono">
                    {formatMoney(calculatedAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t">
            <Button type="button" onClick={() => setIsFullScreenTable(false)} size="lg">
              Done Editing Table
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Confirmation Dialog */}
      <AlertDialog open={showUnsavedConfirm} onOpenChange={setShowUnsavedConfirm}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              Unsaved Changes
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-600 dark:text-zinc-300 pt-1">
              You have unsaved changes in this request. If you leave now, your edits will not be saved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex items-center justify-end gap-2 pt-3">
            <AlertDialogCancel
              onClick={() => setShowUnsavedConfirm(false)}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300"
            >
              Stay
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setShowUnsavedConfirm(false);
                onOpenChange(false);
              }}
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
