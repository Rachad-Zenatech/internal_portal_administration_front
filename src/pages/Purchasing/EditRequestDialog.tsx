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
import { ProjectAutocomplete } from "./ProjectAutocomplete";
import { GLCodeAutocomplete } from "./GLCodeAutocomplete";
import { useRef } from "react";
import { toast } from "sonner";
import { Loader2, Plus, FolderKanban, Trash2, Maximize2, FileText, Truck, DollarSign, AlertTriangle, Landmark, ShoppingCart, Clock, FileSpreadsheet } from "lucide-react";
import { formatMoney } from "./purchasingMeta";
import { RequestStatus, type ItemMode, type PurchaseRequestItem, type WireTransferInput, type FrequencyType, type CustomScheduleDate } from "@/types/purchasing";
import { WireGeneralPaymentFields } from "./WireGeneralPaymentFields";
import { WireBankingFields } from "./WireBankingFields";
import { ScheduleDatesBuilder } from "./ScheduleDatesBuilder";
import { calculateInstallmentsCount } from "./recurringScheduleUtils";
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
  wireTransfer,
}: {
  request: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wireTransfer?: WireTransferInput | null;
}) {
  const isMulti = request?.item_mode === "MULTIPLE" || (request?.items && request.items.length > 0);
  const parsedStatus = parseRequestStatus(request?.status);
  const [itemMode, setItemMode] = useState<ItemMode>(isMulti ? "MULTIPLE" : "SINGLE");
  const { data: usersList = [] } = useUsersList();
  const { data: rolesList = [] } = useRolesList();
  const { user, roles = [] } = useAuth();
  const userRolesList = roles || [];
  const userDept = (user?.department || "").toUpperCase();
  const isAPRole = userRolesList.some((r) => {
    const c = (r.code || "").toUpperCase();
    const n = (r.name || "").toUpperCase();
    return c.includes("AP") || c.includes("PAY") || c.includes("ACCT") || n.includes("AP") || n.includes("PAY") || n.includes("ACCT");
  }) || userDept.includes("AP") || userDept.includes("ACCOUNT");

  const isPurchaserRole = userRolesList.some((r) => {
    const c = (r.code || "").toUpperCase();
    const n = (r.name || "").toUpperCase();
    return c.includes("PURCHAS") || n.includes("PURCHAS");
  }) || userDept.includes("PURCHAS");

  const isSuperAdmin = Boolean(user?.is_super_admin);

  const isCompleted = parsedStatus === RequestStatus.Completed || (parsedStatus as string)?.toUpperCase() === "COMPLETED";

  const isPostOrderStage = [
    RequestStatus.Purchased,
    "ORDERED",
    RequestStatus.Shipped,
    RequestStatus.GoodsReceived,
    RequestStatus.InvoiceReceived,
    RequestStatus.WaitingPayment,
    "SENT_TO_AP",
  ].includes(parsedStatus as any);

  const canEditWholeRequest = !isCompleted && ((isPostOrderStage && (isAPRole || isPurchaserRole || isSuperAdmin)) || parsedStatus === RequestStatus.Initial || parsedStatus === RequestStatus.New || parsedStatus === RequestStatus.UnderReview);
  const isLinkEditable = canEditWholeRequest;
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
    project_name: "",
  });

  const [items, setItems] = useState<PurchaseRequestItem[]>([]);
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [isScheduled, setIsScheduled] = useState<boolean>(false);
  const [schedFrequency, setSchedFrequency] = useState<FrequencyType>("MONTHLY");
  const [schedStartDate, setSchedStartDate] = useState<string>("");
  const [schedEndDate, setSchedEndDate] = useState<string>("");
  const [schedDates, setSchedDates] = useState<CustomScheduleDate[]>([]);
  const [taxFee, setTaxFee] = useState<number>(0);
  const [discountFee, setDiscountFee] = useState<number>(0);
  const [isFullScreenTable, setIsFullScreenTable] = useState(false);
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState<string>("");
  const [apWireForm, setApWireForm] = useState<WireTransferInput>(() => ({
    entered_by: wireTransfer?.entered_by || "",
    entered_by_user_id: wireTransfer?.entered_by_user_id || undefined,
    entry_date: wireTransfer?.entry_date || new Date().toISOString().split("T")[0],
    due_date: wireTransfer?.due_date || request?.due_date?.split("T")[0] || "",
    payment_date: wireTransfer?.payment_date || new Date().toISOString().split("T")[0],
    vendor: wireTransfer?.vendor || "",
    is_new_vendor: wireTransfer?.is_new_vendor || false,
    pay_date: wireTransfer?.pay_date || "Same Day",
    amount: wireTransfer?.amount ?? (request?.amount || 0),
    currency: wireTransfer?.currency || "USD",
    conversion_rate: wireTransfer?.conversion_rate ? String(wireTransfer.conversion_rate) : "1.0",
    pay_from: wireTransfer?.pay_from || "",
    invoice_number: wireTransfer?.invoice_number || "",
    comments: wireTransfer?.comments || "",
    vendor_address: wireTransfer?.vendor_address || "",
    bank_address: wireTransfer?.bank_address || "",
    vendor_email: wireTransfer?.vendor_email || "",
    bank_name: wireTransfer?.bank_name || "",
    tax_id: wireTransfer?.tax_id || "",
    bank_country: wireTransfer?.bank_country || "",
    routing_wire: wireTransfer?.routing_wire || "",
    routing_ach: wireTransfer?.routing_ach || "",
    bank_account_number: wireTransfer?.bank_account_number || "",
    swift_code: wireTransfer?.swift_code || "",
    sort_code: wireTransfer?.sort_code || "",
    transit_code_ca: wireTransfer?.transit_code_ca || "",
    transit_number_ca: wireTransfer?.transit_number_ca || "",
    institution_code: wireTransfer?.institution_code || "",
    branch_code: wireTransfer?.branch_code || "",
    bsb_australia: wireTransfer?.bsb_australia || "",
    clearing_code: wireTransfer?.clearing_code || "",
    bank_code: wireTransfer?.bank_code || "",
    iban: wireTransfer?.iban || "",
    bic: wireTransfer?.bic || "",
    transit: wireTransfer?.transit || "",
    aba: wireTransfer?.aba || "",
    region: wireTransfer?.region || "",
    contact_name_china: wireTransfer?.contact_name_china || "",
  }));

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

      const qtyVal = request.quantity ? Number(request.quantity) : 1;
      const upriceVal = request.unit_price && Number(request.unit_price) > 0
        ? Number(request.unit_price)
        : (request.amount && qtyVal > 0 ? Math.round((Number(request.amount) / qtyVal) * 100) / 100 : 0);
      const amtVal = request.amount && Number(request.amount) > 0
        ? Number(request.amount)
        : (upriceVal * qtyVal);

      const initialForm = {
        title: request.title || "",
        requester: request.requester || "",
        request_type: request.request_type || "SPEND",
        priority: request.priority || "MEDIUM",
        department: dept,
        item_url: request.item_url || "",
        unit_price: upriceVal ? upriceVal.toString() : "",
        quantity: qtyVal ? qtyVal.toString() : "1",
        amount: amtVal ? amtVal.toString() : "",
        description: request.description || "",
        gl_code: request.gl_code || "",
        due_date: request.due_date ? request.due_date.split("T")[0] : "",
        project_name: request.project_name || "",
      };
      setFormData(initialForm);

      const sched = request?.recurring_schedule;
      let sDates: CustomScheduleDate[] = [];
      if (sched?.schedule_dates && sched.schedule_dates.length > 0) {
        sDates = sched.schedule_dates;
      } else if (sched?.custom_dates && sched.custom_dates.length > 0) {
        sDates = sched.custom_dates.map((d: string, i: number) => ({
          date: d,
          amount: sched?.amount_per_cycle || request?.amount,
          note: `Installment #${i + 1}`,
        }));
      }
      setIsScheduled(Boolean(sched?.is_scheduled));
      setSchedFrequency((sched?.frequency as FrequencyType) || "MONTHLY");
      setSchedStartDate(sched?.start_date ? sched.start_date.split("T")[0] : (request?.due_date ? request.due_date.split("T")[0] : ""));
      setSchedEndDate(sched?.end_date ? sched.end_date.split("T")[0] : "");
      setSchedDates(sDates);

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
          gl_code: itm.gl_code || "",
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

      const initialWt: WireTransferInput = {
        entered_by: wireTransfer?.entered_by || request?.wire_transfer?.entered_by || "",
        entered_by_user_id: wireTransfer?.entered_by_user_id || request?.wire_transfer?.entered_by_user_id || undefined,
        entry_date: wireTransfer?.entry_date || request?.wire_transfer?.entry_date || new Date().toISOString().split("T")[0],
        due_date: wireTransfer?.due_date || request?.wire_transfer?.due_date || (request?.due_date ? request.due_date.split("T")[0] : ""),
        payment_date: wireTransfer?.payment_date || request?.wire_transfer?.payment_date || new Date().toISOString().split("T")[0],
        vendor: wireTransfer?.vendor || request?.wire_transfer?.vendor || "",
        is_new_vendor: wireTransfer?.is_new_vendor ?? request?.wire_transfer?.is_new_vendor ?? false,
        pay_date: wireTransfer?.pay_date || request?.wire_transfer?.pay_date || "Same Day",
        amount: wireTransfer?.amount ?? request?.wire_transfer?.amount ?? (request?.amount || 0),
        currency: wireTransfer?.currency || request?.wire_transfer?.currency || "USD",
        conversion_rate: wireTransfer?.conversion_rate ? String(wireTransfer.conversion_rate) : (request?.wire_transfer?.conversion_rate ? String(request.wire_transfer.conversion_rate) : "1.0"),
        pay_from: wireTransfer?.pay_from || request?.wire_transfer?.pay_from || "",
        invoice_number: wireTransfer?.invoice_number || request?.wire_transfer?.invoice_number || "",
        comments: wireTransfer?.comments || request?.wire_transfer?.comments || "",
        vendor_address: wireTransfer?.vendor_address || request?.wire_transfer?.vendor_address || "",
        bank_address: wireTransfer?.bank_address || request?.wire_transfer?.bank_address || "",
        vendor_email: wireTransfer?.vendor_email || request?.wire_transfer?.vendor_email || "",
        bank_name: wireTransfer?.bank_name || request?.wire_transfer?.bank_name || "",
        tax_id: wireTransfer?.tax_id || request?.wire_transfer?.tax_id || "",
        bank_country: wireTransfer?.bank_country || request?.wire_transfer?.bank_country || "",
        routing_wire: wireTransfer?.routing_wire || request?.wire_transfer?.routing_wire || "",
        routing_ach: wireTransfer?.routing_ach || request?.wire_transfer?.routing_ach || "",
        bank_account_number: wireTransfer?.bank_account_number || request?.wire_transfer?.bank_account_number || "",
        swift_code: wireTransfer?.swift_code || request?.wire_transfer?.swift_code || "",
        sort_code: wireTransfer?.sort_code || request?.wire_transfer?.sort_code || "",
        transit_code_ca: wireTransfer?.transit_code_ca || request?.wire_transfer?.transit_code_ca || "",
        transit_number_ca: wireTransfer?.transit_number_ca || request?.wire_transfer?.transit_number_ca || "",
        institution_code: wireTransfer?.institution_code || request?.wire_transfer?.institution_code || "",
        branch_code: wireTransfer?.branch_code || request?.wire_transfer?.branch_code || "",
        bsb_australia: wireTransfer?.bsb_australia || request?.wire_transfer?.bsb_australia || "",
        clearing_code: wireTransfer?.clearing_code || request?.wire_transfer?.clearing_code || "",
        bank_code: wireTransfer?.bank_code || request?.wire_transfer?.bank_code || "",
        iban: wireTransfer?.iban || request?.wire_transfer?.iban || "",
        bic: wireTransfer?.bic || request?.wire_transfer?.bic || "",
        transit: wireTransfer?.transit || request?.wire_transfer?.transit || "",
        aba: wireTransfer?.aba || request?.wire_transfer?.aba || "",
        region: wireTransfer?.region || request?.wire_transfer?.region || "",
        contact_name_china: wireTransfer?.contact_name_china || request?.wire_transfer?.contact_name_china || "",
      };
      setApWireForm(initialWt);

      // Save initial snapshot for dirty tracking
      setInitialSnapshot(
        JSON.stringify({
          formData: initialForm,
          itemMode: initialMode,
          items: parsedItems,
          shippingFee: calculatedShipping,
          taxFee: calculatedTax,
          discountFee: calculatedDiscount,
          apWireForm: initialWt,
        })
      );
      setShowUnsavedConfirm(false);
    }
  }, [request, open, wireTransfer]);

  const isDirty = useMemo(() => {
    if (!open || !initialSnapshot) return false;
    const currentSnapshot = JSON.stringify({
      formData,
      itemMode,
      items,
      shippingFee,
      taxFee,
      discountFee,
      apWireForm,
    });
    return currentSnapshot !== initialSnapshot;
  }, [open, initialSnapshot, formData, itemMode, items, shippingFee, taxFee, discountFee, apWireForm]);

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
    if (formData.request_type === "ACCOUNTS_PAYABLE") {
      const val = apWireForm.amount !== undefined && apWireForm.amount !== null && !isNaN(Number(apWireForm.amount))
        ? Number(apWireForm.amount)
        : (formData.amount ? parseFloat(formData.amount) : 0);
      return Math.max(0, Math.round(val * 100) / 100);
    }
    if (formData.request_type === "RECURRING") {
      const val = formData.amount ? parseFloat(formData.amount) : (formData.unit_price ? parseFloat(formData.unit_price) : 0);
      return Math.max(0, Math.round(val * 100) / 100);
    }
    const up = formData.unit_price ? parseFloat(formData.unit_price) : 0;
    const qty = formData.quantity ? parseInt(formData.quantity) : 1;
    return Math.round(up * qty * 100) / 100;
  }, [itemMode, itemsSubtotal, shippingFee, taxFee, discountFee, formData.unit_price, formData.quantity, formData.request_type, formData.amount, apWireForm.amount]);

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
        project_name: formData.project_name?.trim() || null,
      };

      if (formData.request_type === "RECURRING" || isScheduled) {
        const isCustom = schedFrequency === "CUSTOM";
        const customDates = isCustom ? schedDates : [];
        const isSched = Boolean(
          isScheduled &&
          (isCustom ? customDates.length > 0 : schedStartDate && schedEndDate)
        );

        let totalCycles: number | null = null;
        let totalAmt: number | null = null;

        if (isSched) {
          if (isCustom) {
            totalCycles = customDates.length;
            totalAmt = customDates.reduce((acc, itm) => acc + (itm.amount || calculatedAmount), 0);
          } else {
            totalCycles = calculateInstallmentsCount(schedStartDate, schedEndDate, schedFrequency);
            totalAmt = totalCycles ? Math.round(calculatedAmount * totalCycles * 100) / 100 : null;
          }
        }

        const effectiveStartDate = isCustom && customDates.length > 0 ? customDates[0].date : schedStartDate;
        const effectiveEndDate = isCustom && customDates.length > 0 ? customDates[customDates.length - 1].date : schedEndDate;

        payload.due_date = formData.due_date || (isSched ? effectiveStartDate : null);
        payload.recurring_schedule = isSched
          ? {
              is_scheduled: true,
              frequency: schedFrequency,
              start_date: effectiveStartDate,
              end_date: effectiveEndDate,
              total_installments: totalCycles,
              completed_installments: request?.recurring_schedule?.completed_installments || 0,
              amount_per_cycle: calculatedAmount,
              total_amount: totalAmt,
              custom_dates: isCustom ? customDates.map((d) => d.date) : null,
              schedule_dates: isCustom ? customDates : null,
            }
          : {
              is_scheduled: false,
              frequency: schedFrequency || "MONTHLY",
              start_date: formData.due_date || schedStartDate || new Date().toISOString().split("T")[0],
              end_date: null,
              total_installments: 24,
              completed_installments: request?.recurring_schedule?.completed_installments || 0,
              amount_per_cycle: calculatedAmount,
              total_amount: calculatedAmount * 24,
            };
      }

      if (formData.request_type === "ACCOUNTS_PAYABLE") {
        payload.amount = calculatedAmount;
        payload.unit_price = calculatedAmount;
        payload.quantity = 1;
        payload.item_url = formData.item_url || null;
        payload.items = [];
        payload.due_date = apWireForm.due_date || formData.due_date || null;
        payload.wire_transfer = {
          ...apWireForm,
          amount: calculatedAmount,
          vendor: apWireForm.vendor || formData.title,
        };
      } else if (formData.request_type === "RECURRING") {
        payload.unit_price = calculatedAmount;
        payload.quantity = 1;
        payload.item_url = formData.item_url || null;
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
              <span>{formData.request_type === "RECURRING" ? "Edit Recurring Payment Request" : formData.request_type === "ACCOUNTS_PAYABLE" ? "Edit Accounts Payable Request" : "Edit Purchase Request"} #{request?.id}</span>
              {itemMode === "MULTIPLE" && formData.request_type !== "RECURRING" && (
                <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 border-indigo-200">
                  <FileText className="h-3 w-3 mr-1" /> Multi-Part Quote
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-1">
            {/* 1. Request Type Selector (Clean Segmented Cards at Top) */}
            <div className="space-y-1.5 pb-3 border-b border-slate-100 dark:border-zinc-800">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Request Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { value: "SPEND", label: "Spend Request", icon: ShoppingCart, desc: "Hardware & purchases" },
                  { value: "RECURRING", label: "Recurring", icon: Clock, desc: "Scheduled cycles" },
                  { value: "QUOTE", label: "Quote Request", icon: FileSpreadsheet, desc: "Estimates & RFQs" },
                  { value: "ADMIN", label: "Admin Triage", icon: FileText, desc: "Administrative & misc" },
                  { value: "ACCOUNTS_PAYABLE", label: "Accounts Payable", icon: Landmark, desc: "Vendor invoices & wires" },
                ].map((opt) => {
                  const isSelected = formData.request_type === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, request_type: opt.value }));
                        if (opt.value === "ACCOUNTS_PAYABLE" || opt.value === "RECURRING") {
                          setItemMode("SINGLE");
                        }
                      }}
                      className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all relative ${
                        isSelected
                          ? "bg-indigo-50/80 border-indigo-500 dark:bg-indigo-950/40 dark:border-indigo-500 shadow-2xs ring-1 ring-indigo-500/30"
                          : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800/60"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5 w-full">
                        <opt.icon className={`h-3.5 w-3.5 shrink-0 ${isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`} />
                        <span className={`text-xs font-semibold ${isSelected ? "text-indigo-900 dark:text-indigo-100" : "text-slate-800 dark:text-zinc-200"}`}>
                          {opt.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-zinc-400 leading-tight line-clamp-1">
                        {opt.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Mode Switcher (Single vs Multiple) - Only for Spend, Quote, Admin */}
            {formData.request_type !== "ACCOUNTS_PAYABLE" && formData.request_type !== "RECURRING" && (
              <div className="p-3 bg-slate-50/70 dark:bg-zinc-800/40 rounded-lg border border-slate-200 dark:border-zinc-700 space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">
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

            {/* 3. Multiple Parts Line Items Table */}
            {itemMode === "MULTIPLE" && formData.request_type !== "ACCOUNTS_PAYABLE" && formData.request_type !== "RECURRING" && (
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

            {/* Product / Website Link (Placed directly above Request Title) */}
            {(formData.request_type === "ACCOUNTS_PAYABLE" || (formData.request_type !== "RECURRING" && itemMode === "SINGLE")) && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Product / Website Link <span className="text-slate-400 font-normal">(optional, e.g. Amazon URL or Vendor invoice link)</span>
                  </label>
                  {!isLinkEditable && formData.request_type !== "ACCOUNTS_PAYABLE" && (
                    <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-normal">
                      Locked (not editable from Waiting Approval onward)
                    </span>
                  )}
                </div>
                <Input
                  type="url"
                  value={formData.item_url || ""}
                  onChange={(e) => setFormData({ ...formData, item_url: e.target.value })}
                  placeholder="https://..."
                  disabled={!isLinkEditable && formData.request_type !== "ACCOUNTS_PAYABLE"}
                  className={`h-9 text-xs ${!isLinkEditable && formData.request_type !== "ACCOUNTS_PAYABLE" ? "bg-slate-100 dark:bg-zinc-800/60 cursor-not-allowed text-slate-500 dark:text-zinc-400" : ""}`}
                />
              </div>
            )}

            {/* 4. General Details: Title + 3-Column Meta Row (Requester | Department | Priority) */}
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
            </div>

            {/* 5. Conditional Type Fields: ACCOUNTS_PAYABLE vs RECURRING vs SINGLE ITEM */}
            {formData.request_type === "ACCOUNTS_PAYABLE" ? (
              <div className="space-y-3.5 pt-1">
                <WireGeneralPaymentFields
                  form={apWireForm}
                  setForm={setApWireForm}
                  onAmountChange={(amt) => {
                    setFormData((f) => ({ ...f, amount: String(amt), unit_price: String(amt) }));
                  }}
                  onDueDateChange={(d) => {
                    setFormData((f) => ({ ...f, due_date: d }));
                  }}
                  onVendorChange={(v) => {
                    if (!formData.title || formData.title === apWireForm.vendor) {
                      setFormData((f) => ({ ...f, title: v }));
                    }
                  }}
                />

                <WireBankingFields
                  form={apWireForm}
                  setForm={setApWireForm}
                />

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">GL Code / Account</label>
                  <GLCodeAutocomplete
                    value={formData.gl_code}
                    onChange={(val) => setFormData({ ...formData, gl_code: val })}
                  />
                </div>
              </div>
            ) : formData.request_type === "RECURRING" ? (
              <div className="space-y-3.5 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Amount (USD) <span className="text-red-500">*</span></label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value, unit_price: e.target.value })}
                      className="h-9 text-xs font-mono"
                      required
                    />
                  </div>

                  {formData.request_type === "RECURRING" && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Next Due Date</label>
                      <Input
                        type="date"
                        value={formData.due_date}
                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                        className="h-9 text-xs"
                      />
                    </div>
                  )}
                </div>

                {formData.request_type === "RECURRING" && (
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
                    baseAmount={parseFloat(formData.amount) || 0}
                  />
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">GL Code / Account</label>
                  <GLCodeAutocomplete
                    value={formData.gl_code}
                    onChange={(val) => setFormData({ ...formData, gl_code: val })}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3.5 pt-1">
                {itemMode === "SINGLE" && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Quantity</label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Unit Price ($)</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.unit_price}
                        onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                        className="h-9 text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Est. Amount (Pre-tax)</label>
                      <div className="h-9 px-3 py-2 rounded-md border border-slate-200 bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900/50 flex items-center text-xs text-slate-700 dark:text-zinc-300 font-semibold font-mono">
                        {formatMoney(calculatedAmount)}
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">GL Code / Account</label>
                  <GLCodeAutocomplete
                    value={formData.gl_code}
                    onChange={(val) => setFormData({ ...formData, gl_code: val })}
                  />
                </div>
              </div>
            )}



            {/* 6. Description / Terms */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                {formData.request_type === "RECURRING" ? "Description / Terms" : "Description / Notes"}
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="text-xs bg-white dark:bg-zinc-900"
              />
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
                    <th className="p-3 w-24 text-right font-semibold">Qty</th>
                    <th className="p-3 w-32 text-right font-semibold">Unit Price ($)</th>
                    <th className="p-3 w-32 text-right font-semibold">Total ($)</th>
                    <th className="p-3 w-48 font-semibold">GL Code / Account</th>
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
                      <td className="p-3 w-32 text-right font-bold font-mono text-base text-slate-900 dark:text-zinc-100">
                        {formatMoney(itm.total)}
                      </td>
                      <td className="p-3 w-48">
                        <GLCodeAutocomplete
                          value={itm.gl_code || ""}
                          onChange={(val) => handleItemChange(idx, "gl_code", val)}
                          placeholder="Select GL code"
                        />
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
                      <td colSpan={7} className="text-center py-12 text-slate-400 text-sm">
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
