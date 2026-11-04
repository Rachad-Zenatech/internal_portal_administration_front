import { useState, useEffect, useMemo } from "react";
import { useUpdateRequest, useUsersList, useRolesList } from "@/hooks/usePurchasing";
import { resolveUserDepartment } from "@/lib/userDepartment";
import { useAuth } from "@/lib/AuthContext";
import { RequestStatus, type ItemMode, type PurchaseRequestItem, type WireTransferInput, type FrequencyType, type CustomScheduleDate } from "@/types/purchasing";
import { parseRequestStatus } from "@/lib/requestStatus";
import type { EditRequestDialogProps } from "../types";

export function useEditRequestDialogActions(props: EditRequestDialogProps) {
  const { request, open, onOpenChange, wireTransfer } = props;
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
    shipping_address: "",
    phone_number: "",
    item_url: "",
    unit_price: "",
    quantity: "1",
    amount: "0",
    description: "",
    gl_code: "",
    due_date: "",
    project_name: "",
    currency: "USD",
  });
  const currentRequesterUser = useMemo(() => {
    const q = (formData.requester || "").toLowerCase().trim();
    if (!q) return user;
    return (
      usersList.find(
        (u) =>
          (u.full_name && u.full_name.toLowerCase().trim() === q) ||
          (u.email && u.email.toLowerCase().trim() === q)
      ) || user
    );
  }, [formData.requester, usersList, user]);
  const allSavedAddresses = useMemo(() => {
    const list: string[] = [];
    if (currentRequesterUser) {
      if ((currentRequesterUser as any).shipping_address) {
        list.push((currentRequesterUser as any).shipping_address);
      }
      const rawSaved = (currentRequesterUser as any).saved_shipping_addresses;
      if (Array.isArray(rawSaved)) {
        rawSaved.forEach((a) => {
          if (typeof a === "string" && a.trim() && !list.includes(a.trim())) {
            list.push(a.trim());
          }
        });
      }
    }
    return list;
  }, [currentRequesterUser]);
  const lastUsedAddress = allSavedAddresses[0] || "";
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
    category: wireTransfer?.category || "Others",
  }));
  useEffect(() => {
    if (request && open) {
      const isMultiReq = request.item_mode === "MULTIPLE" || (request.items && request.items.length > 0);
      const initialMode: ItemMode = isMultiReq ? "MULTIPLE" : "SINGLE";
      setItemMode(initialMode);

      let dept = "";
      const targetRequester = request.requester || user?.full_name || user?.email || "";
      const matched = usersList.find(
        (u) =>
          (u.full_name && u.full_name.toLowerCase() === targetRequester.toLowerCase().trim()) ||
          (u.email && u.email.toLowerCase() === targetRequester.toLowerCase().trim()) ||
          (user?.id && u.id === user.id)
      );
      if (matched?.department && matched.department.trim() && matched.department.toUpperCase() !== "REQUESTER") {
        dept = matched.department.trim();
      } else if (request.department && request.department.toUpperCase() !== "GENERAL" && request.department.toUpperCase() !== "REQUESTER") {
        dept = request.department.trim();
      } else {
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
        shipping_address: (request as any).shipping_address || matched?.shipping_address || (user as any)?.shipping_address || "",
        phone_number: (request as any).phone_number || matched?.phone_number || (user as any)?.phone_number || "",
        item_url: request.item_url || "",
        unit_price: upriceVal ? upriceVal.toString() : "",
        quantity: qtyVal ? qtyVal.toString() : "1",
        amount: amtVal ? amtVal.toString() : "",
        description: request.description || "",
        gl_code: request.gl_code || "",
        due_date: request.due_date ? request.due_date.split("T")[0] : "",
        project_name: request.project_name || "",
        currency: request.currency || "USD",
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
        category: wireTransfer?.category || request?.wire_transfer?.category || "Others",
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
  return { isMulti, itemMode, setItemMode, usersList, rolesList, isLinkEditable, formData, setFormData, allSavedAddresses, lastUsedAddress, items, setItems, shippingFee, setShippingFee, isScheduled, setIsScheduled, schedFrequency, setSchedFrequency, schedStartDate, setSchedStartDate, schedEndDate, setSchedEndDate, schedDates, setSchedDates, taxFee, setTaxFee, discountFee, isFullScreenTable, setIsFullScreenTable, showUnsavedConfirm, setShowUnsavedConfirm, apWireForm, setApWireForm, isDirty, handleRequestClose, updateMutation, handleItemChange };
}
