import { useState, useEffect, useMemo, useRef } from "react";
import { useUpdateRequest, useUsersList, useRolesList, useUploadAttachments, useDeleteAttachment, useVendorDirectory } from "@/hooks/usePurchasing";
import { useAuth } from "@/lib/AuthContext";
import { resolveUserDepartment } from "@/lib/userDepartment";
import * as purchasingService from "@/services/purchasingService";
import type { Priority, PaymentMethod, ItemMode, WireTransferInput, FrequencyType, CustomScheduleDate, AttachmentInfo } from "@/types/purchasing";
import { RequestStatus } from "@/types/purchasing";
import { type PreviewFileTarget } from "../../FilePreviewModal";
import { toast } from "sonner";
import type { EditCombinedRequestDialogProps } from "../types";

export function useEditCombinedRequestActions(props: EditCombinedRequestDialogProps) {
  const { open, data, initialTab = "request" } = props;
  const request = data?.request;
  const purchaseOrder = data?.purchase_order;
  const invoice = data?.invoice;
  const wireTransfer = data?.wire_transfer;
  const hasPo = Boolean(purchaseOrder);
  const hasInvoice = Boolean(invoice);
  const updateMutation = useUpdateRequest();
  const { data: usersList = [] } = useUsersList();
  const { data: rolesList = [] } = useRolesList();
  const { data: vendorDirectory = {} } = useVendorDirectory();
  const isCompleted =
    request?.status === RequestStatus.Completed ||
    String(request?.status || "").toUpperCase() === "COMPLETED";
  // General Overview & Ownership is editable so admins and reviewers can modify fields and convert request types
  const isOverviewLocked = isCompleted;
  // Active Tab state
  const [activeTab, setActiveTab] = useState<"request" | "po" | "invoice">("request");
  // --- SMART CASCADING SYNCHRONIZATION STATE ---
  const [isPricingSynced, setIsPricingSynced] = useState<boolean>(true);
  // --- TAB 1: Request Details States ---
  const [title, setTitle] = useState("");
  const [requestType, setRequestType] = useState<string>("SPEND");
  const [itemMode, setItemMode] = useState<ItemMode>("SINGLE");
  const [requester, setRequester] = useState("");
  const [department, setDepartment] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [projectName, setProjectName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isScheduled, setIsScheduled] = useState<boolean>(false);
  const [schedFrequency, setSchedFrequency] = useState<FrequencyType>("MONTHLY");
  const [schedStartDate, setSchedStartDate] = useState<string>("");
  const [schedEndDate, setSchedEndDate] = useState<string>("");
  const [schedDates, setSchedDates] = useState<CustomScheduleDate[]>([]);
  const [itemUrl, setItemUrl] = useState("");
  const [reqCurrency, setReqCurrency] = useState("USD");
  const [reqGlCode, setReqGlCode] = useState("");
  const [description, setDescription] = useState("");
  const { user } = useAuth();
  const [shippingAddress, setShippingAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const currentRequesterUser = useMemo(() => {
    const q = (requester || "").toLowerCase().trim();
    if (!q) return user;
    return (
      usersList.find(
        (u: any) =>
          (u.full_name && u.full_name.toLowerCase().trim() === q) ||
          (u.email && u.email.toLowerCase().trim() === q)
      ) || user
    );
  }, [requester, usersList, user]);
  const allSavedAddresses = useMemo(() => {
    const list: string[] = [];
    if (currentRequesterUser) {
      if ((currentRequesterUser as any).shipping_address) {
        list.push((currentRequesterUser as any).shipping_address);
      }
      const rawSaved = (currentRequesterUser as any).saved_shipping_addresses;
      if (Array.isArray(rawSaved)) {
        rawSaved.forEach((a: any) => {
          if (typeof a === "string" && a.trim() && !list.includes(a.trim())) {
            list.push(a.trim());
          }
        });
      }
    }
    return list;
  }, [currentRequesterUser]);
  const lastUsedAddress = allSavedAddresses[0] || "";
  // Single item specific fields
  const [sku, setSku] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("0");
  const [amount, setAmount] = useState("0");
  // Multi-parts items for request
  const [requestItems, setRequestItems] = useState<any[]>([]);
  // Wire transfer state for Accounts Payable
  const [apWireForm, setApWireForm] = useState<WireTransferInput>(() => ({
    entered_by: wireTransfer?.entered_by || "",
    entered_by_user_id: wireTransfer?.entered_by_user_id || undefined,
    entry_date: wireTransfer?.entry_date || new Date().toISOString().split("T")[0],
    due_date: wireTransfer?.due_date || request?.due_date?.split("T")[0] || "",
    payment_date: wireTransfer?.payment_date || new Date().toISOString().split("T")[0],
    vendor: wireTransfer?.vendor || purchaseOrder?.vendor || invoice?.vendor || "",
    is_new_vendor: wireTransfer?.is_new_vendor || false,
    pay_date: wireTransfer?.pay_date || "Same Day",
    amount: wireTransfer?.amount ?? (request?.amount || undefined),
    currency: wireTransfer?.currency || request?.currency || "USD",
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
  // User dropdown state for Requester
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  // --- TAB 2: Purchase Order States ---
  const [poQuoteNumber, setPoQuoteNumber] = useState("");
  const [poVendor, setPoVendor] = useState("");
  const [poItem, setPoItem] = useState("");
  const [poPaymentMethod, setPoPaymentMethod] = useState<PaymentMethod>("CC");
  const [poShippedTo, setPoShippedTo] = useState("");
  const [poExpectedDeliveryDate, setPoExpectedDeliveryDate] = useState("");
  const [poTrackingNumber, setPoTrackingNumber] = useState("");
  const [poShippingNote, setPoShippingNote] = useState("");
  const [poGoodsReceivedNote, setPoGoodsReceivedNote] = useState("");
  const [poGoodsReceived, setPoGoodsReceived] = useState<boolean>(false);
  const [poQuantity, setPoQuantity] = useState<number>(1);
  const [poUnitPrice, setPoUnitPrice] = useState<number>(0);
  const [poShippingFee, setPoShippingFee] = useState<number>(0);
  const [poAmount, setPoAmount] = useState<number>(0);
  const [poCurrency, setPoCurrency] = useState<string>("USD");
  const [poGlCode, setPoGlCode] = useState<string>("");
  const [poDescription, setPoDescription] = useState<string>("");
  // --- TAB 3: Invoice States ---
  const [invVendor, setInvVendor] = useState("");
  const [invAmount, setInvAmount] = useState<number>(0);
  const [invDate, setInvDate] = useState("");
  const [invDueDate, setInvDueDate] = useState("");
  const [invAssetFlag, setInvAssetFlag] = useState(false);
  const [invDepartment, setInvDepartment] = useState("");
  const [invFromLocation, setInvFromLocation] = useState("");
  const [invGlCode, setInvGlCode] = useState("");
  const [invDescription, setInvDescription] = useState("");
  const [invItems, setInvItems] = useState<any[]>([]);
  // --- Attachments & Receipt Preview States ---
  const uploadAttachments = useUploadAttachments(request?.id || "");
  const deleteAttachment = useDeleteAttachment(request?.id || "");
  const [previewTarget, setPreviewTarget] = useState<PreviewFileTarget | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const invoiceReceiptInputRef = useRef<HTMLInputElement>(null);
  const handlePreviewAttachment = async (att: AttachmentInfo) => {
    if (!request?.id) return;
    setIsLoadingPreview(true);
    try {
      const blob = await purchasingService.getAttachmentBlob(request.id, att.id);
      const contentType = blob.type || att.content_type || "";
      const url = URL.createObjectURL(blob);
      setPreviewTarget({
        name: att.filename,
        size: att.size,
        url,
        contentType,
        onDownload: () => purchasingService.downloadAttachment(request.id, att.id, att.filename),
      });
      setIsPreviewOpen(true);
    } catch (err: unknown) {
      toast.error("Could not load file preview: " + ((err as Error)?.message || "Unknown error"));
    } finally {
      setIsLoadingPreview(false);
    }
  };
  const handleClosePreview = (open: boolean) => {
    setIsPreviewOpen(open);
    if (!open && previewTarget?.url) {
      URL.revokeObjectURL(previewTarget.url);
      setPreviewTarget(null);
    }
  };
  // Close user dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const filteredUsers = useMemo(() => {
    const activeUsers = usersList.filter((u: any) => u.is_active !== false);
    const q = (requester || "").toLowerCase().trim();
    if (!q) return activeUsers.slice(0, 8);
    return activeUsers
      .filter((u: any) => {
        const name = (u.full_name || "").toLowerCase();
        const email = (u.email || "").toLowerCase();
        const dept = resolveUserDepartment(u, rolesList).toLowerCase();
        return name.includes(q) || email.includes(q) || dept.includes(q);
      })
      .slice(0, 8);
  }, [requester, usersList, rolesList]);
  // Synchronize incoming data when dialog opens
  useEffect(() => {
    if (open && data) {
      setActiveTab(
        initialTab &&
          (initialTab === "request" ||
            (initialTab === "po" && hasPo) ||
            (initialTab === "invoice" && hasInvoice))
          ? initialTab
          : "request"
      );

      // Default sync enabled on fresh open
      setIsPricingSynced(true);

      // Request Details
      const reqType = (request?.request_type || (request as any)?.category || "SPEND").toUpperCase();
      setRequestType(reqType);

      const isMultiReq =
        request?.item_mode === "MULTIPLE" || (request?.items && request.items.length > 0);
      setItemMode(isMultiReq ? "MULTIPLE" : "SINGLE");

      setTitle(request?.title || (request as any)?.product_name || "");
      setRequester(request?.requester || "");
      const matchedUser = usersList.find(
        (u: any) =>
          (request?.requester_id && u.id === request.requester_id) ||
          (request?.requester && (u.full_name?.toLowerCase() === request.requester.toLowerCase() || u.email?.toLowerCase() === request.requester.toLowerCase()))
      );
      let initialDept = request?.department || "";
      if (!initialDept || initialDept.toUpperCase() === "GENERAL") {
        if (matchedUser) {
          initialDept = (matchedUser.department && matchedUser.department.trim() && matchedUser.department.toUpperCase() !== "REQUESTER")
            ? matchedUser.department.trim()
            : resolveUserDepartment(matchedUser, rolesList);
        }
      }
      setDepartment(initialDept);
      setPriority(request?.priority || "MEDIUM");
      setProjectName(request?.project_name || "");
      setDueDate(request?.due_date ? String(request.due_date).split("T")[0] : "");
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
      setSchedStartDate(sched?.start_date ? sched.start_date.split("T")[0] : (request?.due_date ? String(request.due_date).split("T")[0] : ""));
      setSchedEndDate(sched?.end_date ? sched.end_date.split("T")[0] : "");
      setSchedDates(sDates);
      setItemUrl(request?.item_url || "");
      setReqCurrency(request?.currency || "USD");
      setShippingAddress((request as any)?.shipping_address || (matchedUser as any)?.shipping_address || (user as any)?.shipping_address || "");
      setPhoneNumber((request as any)?.phone_number || (matchedUser as any)?.phone_number || (user as any)?.phone_number || "");
      setReqGlCode(request?.gl_code || purchaseOrder?.gl_code || "");
      setDescription(request?.description || "");

      const initialSku =
        request?.sku || (request?.items && request.items.length > 0 ? request.items[0]?.sku : "") || "";
      setSku(initialSku);

      const qty = request?.quantity ?? 1;
      setQuantity(String(qty));
      const uPrice =
        request?.unit_price ??
        (qty > 0 && request?.amount ? Math.round((request.amount / qty) * 100) / 100 : 0);
      setUnitPrice(String(uPrice));
      setAmount(String(request?.amount ?? 0));

      if (request?.items && request.items.length > 0) {
        setRequestItems(
          request.items.map((it: any) => ({
            id: it.id || String(Math.random()),
            sku: it.sku || "",
            description: it.description || "",
            quantity: it.quantity ?? 1,
            unit_price: it.unit_price ?? 0,
            discount: it.discount ?? 0,
            tax: it.tax ?? 0,
            total:
              it.total ??
              Math.round(((it.quantity ?? 1) * (it.unit_price ?? 0) - (it.discount ?? 0) + (it.tax ?? 0)) * 100) / 100,
            gl_code: it.gl_code || request?.gl_code || "",
          }))
        );
      } else {
        setRequestItems([]);
      }

      // Wire Transfer form sync
      if (wireTransfer) {
        setApWireForm({
          entered_by: wireTransfer.entered_by || "",
          entered_by_user_id: wireTransfer.entered_by_user_id || undefined,
          entry_date: wireTransfer.entry_date || new Date().toISOString().split("T")[0],
          due_date: wireTransfer.due_date || request?.due_date?.split("T")[0] || "",
          payment_date: wireTransfer.payment_date || new Date().toISOString().split("T")[0],
          vendor: wireTransfer.vendor || purchaseOrder?.vendor || invoice?.vendor || "",
          is_new_vendor: wireTransfer.is_new_vendor || false,
          pay_date: wireTransfer.pay_date || "Same Day",
          amount: wireTransfer.amount ?? (request?.amount || 0),
          currency: wireTransfer.currency || request?.currency || "USD",
          conversion_rate: wireTransfer.conversion_rate ? String(wireTransfer.conversion_rate) : "1.0",
          pay_from: wireTransfer.pay_from || "",
          invoice_number: wireTransfer.invoice_number || "",
          comments: wireTransfer.comments || "",
          vendor_address: wireTransfer.vendor_address || "",
          bank_address: wireTransfer.bank_address || "",
          vendor_email: wireTransfer.vendor_email || "",
          bank_name: wireTransfer.bank_name || "",
          tax_id: wireTransfer.tax_id || "",
          bank_country: wireTransfer.bank_country || "",
          routing_wire: wireTransfer.routing_wire || "",
          routing_ach: wireTransfer.routing_ach || "",
          bank_account_number: wireTransfer.bank_account_number || "",
          swift_code: wireTransfer.swift_code || "",
          sort_code: wireTransfer.sort_code || "",
          transit_code_ca: wireTransfer.transit_code_ca || "",
          transit_number_ca: wireTransfer.transit_number_ca || "",
          institution_code: wireTransfer.institution_code || "",
          branch_code: wireTransfer.branch_code || "",
          bsb_australia: wireTransfer.bsb_australia || "",
          clearing_code: wireTransfer.clearing_code || "",
          bank_code: wireTransfer.bank_code || "",
          iban: wireTransfer.iban || "",
          bic: wireTransfer.bic || "",
          transit: wireTransfer.transit || "",
          aba: wireTransfer.aba || "",
          region: wireTransfer.region || "",
          contact_name_china: wireTransfer.contact_name_china || "",
          category: wireTransfer.category || "Others",
        });
      }

      // Purchase Order Details
      if (purchaseOrder) {
        const isMaTxn = Boolean(
          (request as any)?.source_portal === "m7a" ||
          (request as any)?.source_portal === "m&a" ||
          (request as any)?.source_portal === "m_and_a" ||
          (request as any)?.is_ma ||
          request?.department?.toLowerCase().includes("m&a")
        );
        setPoQuoteNumber(purchaseOrder.quote_number || "");
        setPoVendor(purchaseOrder.vendor || "");
        setPoItem(purchaseOrder.item || request?.title || "");
        setPoPaymentMethod(purchaseOrder.payment_method || (isMaTxn ? "WIRE" : "CC"));
        setPoShippedTo(purchaseOrder.shipped_to_location || "");
        setPoExpectedDeliveryDate(
          purchaseOrder.expected_delivery_date
            ? String(purchaseOrder.expected_delivery_date).split("T")[0]
            : ""
        );
        setPoTrackingNumber(purchaseOrder.tracking_number || "");
        setPoShippingNote(purchaseOrder.shipping_note || "");
        setPoGoodsReceivedNote(purchaseOrder.goods_received_note || "");
        setPoGoodsReceived(Boolean(purchaseOrder.goods_received));
        setPoQuantity(purchaseOrder.quantity ?? request?.quantity ?? 1);
        setPoUnitPrice(purchaseOrder.unit_price ?? request?.unit_price ?? 0);
        setPoShippingFee((purchaseOrder as any).shipping_fee ?? 0);
        setPoAmount(purchaseOrder.amount ?? request?.amount ?? 0);
        setPoCurrency(purchaseOrder.currency || request?.currency || "USD");
        setPoGlCode(purchaseOrder.gl_code || request?.gl_code || "");
        setPoDescription(purchaseOrder.description || "");
      } else {
        setPoTrackingNumber("");
        setPoShippingNote("");
        setPoGoodsReceivedNote("");
        setPoGoodsReceived(false);
        setPoDescription("");
      }

      // Invoice Details
      if (invoice) {
        setInvVendor(invoice.vendor || purchaseOrder?.vendor || "");
        setInvAmount(invoice.amount ?? purchaseOrder?.amount ?? request?.amount ?? 0);
        setInvDate(
          invoice.paid_date
            ? String(invoice.paid_date).split("T")[0]
            : invoice.invoice_date
            ? String(invoice.invoice_date).split("T")[0]
            : new Date().toISOString().split("T")[0]
        );
        setInvDueDate(invoice.due_date ? String(invoice.due_date).split("T")[0] : "");
        setInvAssetFlag(Boolean(invoice.asset_flag));
        setInvDepartment(invoice.department || request?.department || "");
        setInvFromLocation(invoice.from_location || "");
        setInvGlCode(invoice.gl_code || purchaseOrder?.gl_code || request?.gl_code || "");
        setInvDescription(invoice.description || "");

        if (invoice.items && invoice.items.length > 0) {
          setInvItems(
            invoice.items.map((it: any) => ({
              id: it.id || String(Math.random()),
              request_item_id: it.request_item_id,
              sku: it.sku || "",
              description: it.description || "",
              quantity: it.quantity ?? 1,
              unit_price: it.unit_price ?? 0,
              amount: it.amount ?? (it.quantity ?? 1) * (it.unit_price ?? 0),
              gl_code: it.gl_code || invoice.gl_code || "",
              asset_flag: Boolean(it.asset_flag || invoice.asset_flag),
            }))
          );
        } else {
          setInvItems([]);
        }
      } else {
        setInvDescription("");
        setInvItems([]);
      }
    }
  }, [open, data, initialTab]);
  return { request, purchaseOrder, wireTransfer, hasPo, hasInvoice, updateMutation, usersList, rolesList, vendorDirectory, isCompleted, isOverviewLocked, activeTab, setActiveTab, isPricingSynced, setIsPricingSynced, title, setTitle, requestType, setRequestType, itemMode, setItemMode, requester, setRequester, department, setDepartment, priority, setPriority, projectName, setProjectName, dueDate, setDueDate, isScheduled, setIsScheduled, schedFrequency, setSchedFrequency, schedStartDate, setSchedStartDate, schedEndDate, setSchedEndDate, schedDates, setSchedDates, itemUrl, setItemUrl, reqCurrency, setReqCurrency, reqGlCode, setReqGlCode, description, setDescription, shippingAddress, setShippingAddress, phoneNumber, setPhoneNumber, allSavedAddresses, lastUsedAddress, sku, setSku, quantity, setQuantity, unitPrice, setUnitPrice, amount, setAmount, requestItems, setRequestItems, apWireForm, setApWireForm, isUserDropdownOpen, setIsUserDropdownOpen, userDropdownRef, poQuoteNumber, setPoQuoteNumber, poVendor, setPoVendor, poItem, setPoItem, poPaymentMethod, setPoPaymentMethod, poShippedTo, setPoShippedTo, poExpectedDeliveryDate, setPoExpectedDeliveryDate, poTrackingNumber, setPoTrackingNumber, poShippingNote, setPoShippingNote, poGoodsReceivedNote, setPoGoodsReceivedNote, poGoodsReceived, setPoGoodsReceived, poQuantity, setPoQuantity, poUnitPrice, setPoUnitPrice, poShippingFee, setPoShippingFee, poAmount, setPoAmount, poCurrency, setPoCurrency, poGlCode, setPoGlCode, poDescription, setPoDescription, invVendor, setInvVendor, invAmount, setInvAmount, invDate, setInvDate, invDueDate, setInvDueDate, invAssetFlag, invDepartment, setInvDepartment, invFromLocation, setInvFromLocation, invGlCode, setInvGlCode, invDescription, setInvDescription, invItems, setInvItems, uploadAttachments, deleteAttachment, previewTarget, isPreviewOpen, isLoadingPreview, invoiceReceiptInputRef, handlePreviewAttachment, handleClosePreview, filteredUsers };
}
