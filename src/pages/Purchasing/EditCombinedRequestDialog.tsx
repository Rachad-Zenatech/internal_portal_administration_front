import { useState, useEffect, useMemo, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VendorAutocomplete } from "./VendorAutocomplete";
import DepartmentAutocomplete from "./DepartmentAutocomplete";
import { GLCodeAutocomplete } from "./GLCodeAutocomplete";
import { CurrencyAutocomplete } from "./CurrencyAutocomplete";
import { WireGeneralPaymentFields } from "./WireGeneralPaymentFields";
import { WireBankingFields } from "./WireBankingFields";
import { useUpdateRequest, useUsersList, useRolesList } from "@/hooks/usePurchasing";
import { resolveUserDepartment } from "@/lib/userDepartment";
import { updateWireTransfer } from "@/services/purchasingService";
import type {
  RequestDetail as RequestDetailType,
  Priority,
  PaymentMethod,
  ItemMode,
  WireTransferInput,
} from "@/types/purchasing";
import { PAYMENT_METHOD_LABEL, RequestStatus } from "@/types/purchasing";
import { TAX_RATE, formatMoney } from "./purchasingMeta";
import {
  Package,
  FileText,
  Layers,
  DollarSign,
  Calendar,
  User,
  ShoppingBag,
  ExternalLink,
  Building2,
  Link2,
  AlertCircle,
  RefreshCw,
  Plus,
  Trash2,
  Landmark,
} from "lucide-react";
import { toast } from "sonner";

interface EditCombinedRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: RequestDetailType;
  refetch?: () => void;
  initialTab?: "request" | "po" | "invoice";
}

export function EditCombinedRequestDialog({
  open,
  onOpenChange,
  data,
  refetch,
  initialTab = "request",
}: EditCombinedRequestDialogProps) {
  const request = data?.request;
  const purchaseOrder = data?.purchase_order;
  const invoice = data?.invoice;
  const wireTransfer = data?.wire_transfer;

  const hasPo = Boolean(purchaseOrder);
  const hasInvoice = Boolean(invoice);

  const updateMutation = useUpdateRequest();
  const { data: usersList = [] } = useUsersList();
  const { data: rolesList = [] } = useRolesList();

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
  const [dueDate, setDueDate] = useState("");
  const [itemUrl, setItemUrl] = useState("");
  const [reqCurrency, setReqCurrency] = useState("USD");
  const [reqGlCode, setReqGlCode] = useState("");
  const [description, setDescription] = useState("");

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
    amount: wireTransfer?.amount ?? (request?.amount || 0),
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
  const [invGlCode, setInvGlCode] = useState("");
  const [invDescription, setInvDescription] = useState("");
  const [invItems, setInvItems] = useState<any[]>([]);

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
      setDepartment(request?.department || "");
      setPriority(request?.priority || "MEDIUM");
      setDueDate(request?.due_date ? String(request.due_date).split("T")[0] : "");
      setItemUrl(request?.item_url || "");
      setReqCurrency(request?.currency || "USD");
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
        });
      }

      // Purchase Order Details
      if (purchaseOrder) {
        setPoQuoteNumber(purchaseOrder.quote_number || "");
        setPoVendor(purchaseOrder.vendor || "");
        setPoItem(purchaseOrder.item || request?.title || "");
        setPoPaymentMethod(purchaseOrder.payment_method || "CC");
        setPoShippedTo(purchaseOrder.shipped_to_location || "");
        setPoExpectedDeliveryDate(
          purchaseOrder.expected_delivery_date
            ? String(purchaseOrder.expected_delivery_date).split("T")[0]
            : ""
        );
        setPoQuantity(purchaseOrder.quantity ?? request?.quantity ?? 1);
        setPoUnitPrice(purchaseOrder.unit_price ?? request?.unit_price ?? 0);
        setPoShippingFee((purchaseOrder as any).shipping_fee ?? 0);
        setPoAmount(purchaseOrder.amount ?? request?.amount ?? 0);
        setPoCurrency(purchaseOrder.currency || request?.currency || "USD");
        setPoGlCode(purchaseOrder.gl_code || request?.gl_code || "");
        setPoDescription(purchaseOrder.description || "");
      } else {
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

  // Multi-parts calculations
  const itemsSubtotal = useMemo(() => {
    return requestItems.reduce(
      (acc, it) => acc + (Number(it.total) || (Number(it.quantity || 1) * Number(it.unit_price || 0))),
      0
    );
  }, [requestItems]);

  const calculatedGrandTotal = useMemo(() => {
    return Math.max(0, Math.round(itemsSubtotal * 100) / 100);
  }, [itemsSubtotal]);

  // Mode switch handler
  const handleItemModeSwitch = (mode: ItemMode) => {
    setItemMode(mode);
    if (mode === "MULTIPLE" && requestItems.length === 0) {
      // Seed with existing single item data
      const q = Math.max(1, parseInt(quantity, 10) || 1);
      const u = Math.max(0, parseFloat(unitPrice) || 0);
      const a = Math.max(0, parseFloat(amount) || q * u);
      setRequestItems([
        {
          id: String(Date.now()),
          sku: sku.trim() || "",
          description: title.trim() || "Item 1",
          quantity: q,
          unit_price: u,
          discount: 0,
          tax: 0,
          total: a,
          gl_code: reqGlCode || "",
        },
      ]);
    }
  };

  // Add Item / Part Row
  const handleAddPartItem = () => {
    const newItem = {
      id: String(Date.now()),
      sku: "",
      description: "",
      quantity: 1,
      unit_price: 0,
      discount: 0,
      tax: 0,
      total: 0,
      gl_code: reqGlCode || "",
    };
    const updated = [...requestItems, newItem];
    setRequestItems(updated);

    if (isPricingSynced) {
      const newSub = updated.reduce(
        (acc, it) => acc + (Number(it.total) || (Number(it.quantity || 1) * Number(it.unit_price || 0))),
        0
      );
      const newTotal = Math.round(newSub * 100) / 100;
      setPoAmount(newTotal);
      setInvAmount(newTotal);
    }
  };

  // Remove Item / Part Row
  const handleRemovePartItem = (index: number) => {
    const updated = requestItems.filter((_, idx) => idx !== index);
    setRequestItems(updated);

    if (isPricingSynced) {
      const newSub = updated.reduce(
        (acc, it) => acc + (Number(it.total) || (Number(it.quantity || 1) * Number(it.unit_price || 0))),
        0
      );
      const newTotal = Math.round(newSub * 100) / 100;
      setPoAmount(newTotal);
      setInvAmount(newTotal);
    }
  };

  // Update Item Row
  const handleUpdatePartItem = (index: number, field: string, value: any) => {
    const updated = [...requestItems];
    const it = { ...updated[index], [field]: value };

    const q = Number(it.quantity) || 1;
    const u = Number(it.unit_price) || 0;
    const disc = Number(it.discount) || 0;
    const tx = Number(it.tax) || 0;
    it.total = Math.round((q * u - disc + tx) * 100) / 100;

    updated[index] = it;
    setRequestItems(updated);

    if (isPricingSynced) {
      const newSub = updated.reduce(
        (acc, item) => acc + (Number(item.total) || (Number(item.quantity || 1) * Number(item.unit_price || 0))),
        0
      );
      const newTotal = Math.round(newSub * 100) / 100;
      setPoAmount(newTotal);
      setInvAmount(newTotal);
    }
  };

  // --- SINGLE ITEM PRICING HANDLERS ---
  const handleQuantityChange = (val: string) => {
    setQuantity(val);
    const numericQty = parseInt(val, 10) || 1;
    const numericUnitPrice = parseFloat(unitPrice) || 0;
    const calculatedAmt = Math.round(numericQty * numericUnitPrice * 100) / 100;
    setAmount(String(calculatedAmt));

    if (isPricingSynced) {
      setPoQuantity(numericQty);
      const newPoAmt = Math.round((numericQty * poUnitPrice + poShippingFee) * 100) / 100;
      setPoAmount(newPoAmt);
      setInvAmount(newPoAmt);
    }
  };

  const handleUnitPriceChange = (val: string) => {
    setUnitPrice(val);
    const q = parseFloat(quantity) || 0;
    const u = parseFloat(val) || 0;
    const calculatedAmt = Math.round(q * u * 100) / 100;
    setAmount(String(calculatedAmt));

    if (isPricingSynced) {
      setPoUnitPrice(u);
      const newPoAmt = Math.round((poQuantity * u + poShippingFee) * 100) / 100;
      setPoAmount(newPoAmt);
      setInvAmount(newPoAmt);
    }
  };

  const handleAmountChange = (val: string) => {
    setAmount(val);
    const a = parseFloat(val) || 0;
    const q = parseFloat(quantity) || 1;
    let u = 0;
    if (q > 0) {
      u = Math.round((a / q) * 100) / 100;
      setUnitPrice(String(u));
    }

    if (isPricingSynced) {
      setPoUnitPrice(u);
      const newPoAmt = Math.round((poQuantity * u + poShippingFee) * 100) / 100;
      setPoAmount(newPoAmt);
      setInvAmount(newPoAmt);
    }
  };

  const parsedAmount = parseFloat(amount) || 0;
  const afterTaxAmount = Math.round(parsedAmount * (1 + TAX_RATE) * 100) / 100;

  const handleAfterTaxChange = (val: string) => {
    const after = parseFloat(val) || 0;
    const pre = Math.round((after / (1 + TAX_RATE)) * 100) / 100;
    handleAmountChange(String(pre));
  };

  const handleCurrencyChange = (val: string) => {
    setReqCurrency(val);
    if (isPricingSynced) {
      setPoCurrency(val);
    }
  };

  const handleGlCodeChange = (val: string) => {
    setReqGlCode(val);
    if (isPricingSynced) {
      setPoGlCode(val);
      setInvGlCode(val);
      if (invItems.length > 0) {
        setInvItems((prev) => prev.map((item) => ({ ...item, gl_code: val })));
      }
    }
  };

  // --- PO CHANGED HANDLERS ---
  const handlePoQuantityChange = (val: number) => {
    const q = Math.max(1, val || 1);
    setPoQuantity(q);
    const itemsCost = Math.round(q * (poUnitPrice || 0) * 100) / 100;
    const newPoAmt = Math.round((itemsCost + poShippingFee) * 100) / 100;
    setPoAmount(newPoAmt);
    if (isPricingSynced) {
      setInvAmount(newPoAmt);
    }
  };

  const handlePoUnitPriceChange = (val: number) => {
    const p = Math.max(0, val || 0);
    setPoUnitPrice(p);
    const itemsCost = Math.round((poQuantity || 1) * p * 100) / 100;
    const newPoAmt = Math.round((itemsCost + poShippingFee) * 100) / 100;
    setPoAmount(newPoAmt);
    if (isPricingSynced) {
      setInvAmount(newPoAmt);
    }
  };

  const handlePoShippingChange = (val: number) => {
    const sf = Math.max(0, val || 0);
    setPoShippingFee(sf);
    const itemsCost = Math.round((poQuantity || 1) * (poUnitPrice || 0) * 100) / 100;
    const newPoAmt = Math.round((itemsCost + sf) * 100) / 100;
    setPoAmount(newPoAmt);
    if (isPricingSynced) {
      setInvAmount(newPoAmt);
    }
  };

  const handlePoAmountChange = (val: number) => {
    const amt = Math.max(0, val || 0);
    setPoAmount(amt);
    if (isPricingSynced) {
      setInvAmount(amt);
    }
  };

  const handlePoAfterTaxChange = (val: number) => {
    const after = Math.max(0, val || 0);
    const pre = Math.round((after / (1 + TAX_RATE)) * 100) / 100;
    setPoAmount(pre);
    if (isPricingSynced) {
      setInvAmount(pre);
    }
  };

  // Force one-click sync action
  const handleForceSyncNow = () => {
    if (itemMode === "SINGLE") {
      const q = Math.max(1, parseInt(quantity, 10) || 1);
      const u = Math.max(0, parseFloat(unitPrice) || 0);
      const a = Math.max(0, parseFloat(amount) || 0);

      setPoQuantity(q);
      setPoUnitPrice(u);
      setPoCurrency(reqCurrency);
      const newPoAmt = Math.round((q * u + poShippingFee) * 100) / 100;
      setPoAmount(newPoAmt > 0 ? newPoAmt : a);
      setPoGlCode(reqGlCode);

      setInvAmount(newPoAmt > 0 ? newPoAmt : a);
      setInvGlCode(reqGlCode);
      if (invItems.length > 0 && reqGlCode) {
        setInvItems((prev) => prev.map((item) => ({ ...item, gl_code: reqGlCode })));
      }
    } else {
      setPoAmount(calculatedGrandTotal);
      setPoCurrency(reqCurrency);
      setPoGlCode(reqGlCode || requestItems[0]?.gl_code || "");
      setInvAmount(calculatedGrandTotal);
      setInvGlCode(reqGlCode || requestItems[0]?.gl_code || "");
      if (requestItems.length > 0) {
        setInvItems(
          requestItems.map((it) => ({
            id: it.id,
            description: it.description,
            sku: it.sku,
            quantity: it.quantity,
            unit_price: it.unit_price,
            amount: it.total,
            gl_code: it.gl_code || reqGlCode,
            asset_flag: invAssetFlag,
          }))
        );
      }
    }
    toast.success("Synchronized all prices, quantities, currency, and GL code from Request Details!");
  };

  const isCompleted =
    request?.status === RequestStatus.Completed ||
    String(request?.status || "").toUpperCase() === "COMPLETED";

  // Submit Handler: Saves Request Details, PO (if exists), Invoice (if exists), and Wire Transfer (if AP)
  const handleSave = async () => {
    if (isCompleted) {
      toast.error("Completed requests cannot be modified.");
      return;
    }

    if (!title.trim()) {
      toast.error("Title / Product Name is required");
      setActiveTab("request");
      return;
    }
    if (!requester.trim()) {
      toast.error("Requester is required");
      setActiveTab("request");
      return;
    }

    if (itemMode === "MULTIPLE") {
      if (requestItems.length === 0) {
        toast.error("Please add at least one line item in Multiple Parts mode");
        setActiveTab("request");
        return;
      }
      for (let i = 0; i < requestItems.length; i++) {
        if (!requestItems[i].description?.trim()) {
          toast.error(`Description is required for Part / Item #${i + 1}`);
          setActiveTab("request");
          return;
        }
      }
    }

    if (hasPo) {
      if (!poQuoteNumber.trim()) {
        toast.error("Quote / PO # is required in Purchase Order");
        setActiveTab("po");
        return;
      }
      if (!poVendor.trim()) {
        toast.error("Vendor is required in Purchase Order");
        setActiveTab("po");
        return;
      }
    }

    if (hasInvoice) {
      if (!invVendor.trim()) {
        toast.error("Vendor is required in Invoice");
        setActiveTab("invoice");
        return;
      }
      if (invItems.length > 1) {
        for (let i = 0; i < invItems.length; i++) {
          if (!invItems[i].gl_code || !invItems[i].gl_code.trim()) {
            toast.error(
              `GL Code is required for invoice line item #${i + 1} (${invItems[i].description || "Item"})`
            );
            setActiveTab("invoice");
            return;
          }
        }
      } else if (!invGlCode.trim() && !reqGlCode.trim() && !poGlCode.trim()) {
        toast.error("GL Code is required in Invoice");
        setActiveTab("invoice");
        return;
      }
    }

    const payload: any = {
      title: title.trim(),
      requester: requester.trim(),
      request_type: requestType,
      item_mode: itemMode,
      department: department.trim(),
      priority,
      due_date: dueDate || null,
      item_url: itemUrl.trim() || null,
      description: description.trim() || null,
      currency: reqCurrency,
      gl_code: reqGlCode.trim() || null,
    };

    if (itemMode === "SINGLE") {
      payload.sku = sku.trim() || null;
      payload.quantity = Math.max(1, parseInt(quantity, 10) || 1);
      payload.unit_price = Math.max(0, parseFloat(unitPrice) || 0);
      payload.amount = Math.max(0, parseFloat(amount) || 0);
      payload.items = [];
    } else {
      payload.amount = calculatedGrandTotal;
      payload.unit_price = calculatedGrandTotal;
      payload.sku = requestItems[0]?.sku?.trim() || null;
      payload.quantity = requestItems.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);
      payload.items = requestItems.map((it, idx) => ({
        id: it.id && !it.id.startsWith("0.") ? it.id : undefined,
        item_order: idx,
        sku: it.sku?.trim() || null,
        description: it.description?.trim() || "",
        quantity: Math.max(1, Number(it.quantity) || 1),
        unit_price: Math.max(0, Number(it.unit_price) || 0),
        discount: Math.max(0, Number(it.discount) || 0),
        tax: Math.max(0, Number(it.tax) || 0),
        total: Math.max(0, Number(it.total) || 0),
        gl_code: it.gl_code?.trim() || reqGlCode.trim() || null,
      }));
    }

    // Attach Purchase Order updates if PO exists
    if (hasPo) {
      payload.purchase_order = {
        quote_number: poQuoteNumber.trim() || null,
        vendor: poVendor.trim(),
        item: poItem.trim() || title.trim(),
        payment_method: poPaymentMethod,
        shipped_to_location: poShippedTo.trim() || "Headquarters",
        expected_delivery_date: poExpectedDeliveryDate || null,
        quantity: poQuantity,
        unit_price: poUnitPrice,
        amount: poAmount,
        currency: poCurrency,
        gl_code: poGlCode.trim() || reqGlCode.trim() || null,
        description: poDescription.trim() || null,
      };
    }

    // Attach Invoice updates if Invoice exists
    if (hasInvoice) {
      payload.invoice = {
        vendor: invVendor.trim(),
        amount: invAmount,
        invoice_date: invDate || new Date().toISOString().split("T")[0],
        due_date: invDueDate || null,
        gl_code: invGlCode.trim() || poGlCode.trim() || reqGlCode.trim() || null,
        asset_flag: invAssetFlag,
        description: invDescription.trim() || null,
        items:
          invItems.length > 0
            ? invItems.map((itm) => ({
                request_item_id: itm.request_item_id,
                description: itm.description,
                sku: itm.sku,
                quantity: itm.quantity,
                unit_price: itm.unit_price,
                amount: itm.amount,
                gl_code: (itm.gl_code || invGlCode || "").trim(),
                asset_flag: Boolean(itm.asset_flag || invAssetFlag),
              }))
            : undefined,
      };
    }

    // Attach Wire Transfer if AP
    if (requestType === "ACCOUNTS_PAYABLE" || wireTransfer) {
      payload.wire_transfer = apWireForm;
    }

    try {
      await updateMutation.mutateAsync({
        id: String(request.id),
        data: payload,
      });

      // Also persist wire transfer if it's AP
      if (requestType === "ACCOUNTS_PAYABLE" || wireTransfer) {
        try {
          await updateWireTransfer(request.id, apWireForm);
        } catch {
          // Handled in update_request
        }
      }

      toast.success("Request and associated records updated successfully");
      onOpenChange(false);
      refetch?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || "Failed to update request");
    }
  };

  // Compute number of tabs for grid columns
  const tabCount = 1 + (hasPo ? 1 : 0) + (hasInvoice ? 1 : 0);
  const priceVariance = hasPo && hasInvoice ? Math.abs(invAmount - poAmount) : 0;
  const hasVariance = priceVariance > 0.01;

  const isRecurring = requestType === "RECURRING";
  const isAccountsPayable = requestType === "ACCOUNTS_PAYABLE" || Boolean(wireTransfer);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl w-[95vw] max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden shadow-2xl rounded-2xl border border-slate-200 dark:border-zinc-800">
        {/* Header with Title, Contextual Info & Smart Sync Toggle */}
        <DialogHeader className="px-8 py-5 border-b border-slate-200/80 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/60 backdrop-blur-xs shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-xs">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2.5">
                  <span>Edit Purchase Requisition</span>
                  <Badge variant="outline" className="font-mono text-xs font-semibold px-2 py-0.5">
                    REQ #{request?.id}
                  </Badge>
                  {request?.status && (
                    <Badge className="text-[11px] font-semibold bg-slate-200 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border-0">
                      {request.status}
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Update requisition parameters, single or multi-part breakdowns, Purchase Order details, and Invoice line allocations.
                </DialogDescription>
              </div>
            </div>

            {/* Smart Synchronization Bar */}
            <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-1.5 px-3 rounded-xl shadow-xs">
              <button
                type="button"
                onClick={() => setIsPricingSynced(!isPricingSynced)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${
                  isPricingSynced
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900"
                }`}
              >
                <Link2 className="h-3.5 w-3.5" />
                <span>{isPricingSynced ? "Sync Active" : "Sync Disabled"}</span>
              </button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleForceSyncNow}
                className="h-7 text-xs px-2 gap-1 text-slate-600 dark:text-zinc-400 hover:text-slate-900"
                title="Force push all Request pricing & GL to PO and Invoice"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Sync Now</span>
              </Button>
            </div>
          </div>
        </DialogHeader>

        {isCompleted && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/60 px-8 py-2.5 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>This purchase request is <strong>Completed</strong> and cannot be edited. All fields are locked for auditing.</span>
          </div>
        )}

        {/* Combined Tabs Navigation */}
        <Tabs
          value={activeTab}
          onValueChange={(val: any) => setActiveTab(val)}
          className="flex-1 flex flex-col min-h-0 overflow-hidden"
        >
          <div className="px-8 pt-3 pb-0 border-b border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0">
            <TabsList
              className="grid w-full h-11 p-1 bg-slate-100/90 dark:bg-zinc-900 rounded-xl max-w-2xl"
              style={{ gridTemplateColumns: `repeat(${tabCount}, minmax(0, 1fr))` }}
            >
              <TabsTrigger
                value="request"
                className="flex items-center justify-center gap-2 text-xs font-semibold py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-300 shadow-xs rounded-lg transition-all"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                <span>1. Request Details</span>
              </TabsTrigger>
              {hasPo && (
                <TabsTrigger
                  value="po"
                  className="flex items-center justify-center gap-2 text-xs font-semibold py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-amber-600 dark:data-[state=active]:text-amber-300 shadow-xs rounded-lg transition-all"
                >
                  <Package className="h-3.5 w-3.5" />
                  <span>2. Purchase Order</span>
                  {purchaseOrder?.quote_number && (
                    <span className="text-[10px] font-mono font-normal opacity-70">
                      ({purchaseOrder.quote_number})
                    </span>
                  )}
                </TabsTrigger>
              )}
              {hasInvoice && (
                <TabsTrigger
                  value="invoice"
                  className="flex items-center justify-center gap-2 text-xs font-semibold py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-300 shadow-xs rounded-lg transition-all"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>3. Invoice / Receipts</span>
                  {hasVariance && (
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" title="Variance detected" />
                  )}
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          {/* TAB 1: Request Details */}
          <TabsContent
            value="request"
            className="flex-1 overflow-y-auto px-8 py-6 space-y-6 m-0 focus-visible:outline-hidden"
          >
            {/* Card 1: General Overview, Requisition Type & Ownership */}
            <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30 p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-zinc-800/80">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-indigo-500" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200 tracking-tight uppercase text-[11px]">
                    General Overview &amp; Ownership
                  </h3>
                </div>

                {/* Item Mode Switcher (Single Item vs Multiple Parts) */}
                <div className="flex items-center p-0.5 bg-slate-200/80 dark:bg-zinc-800 rounded-lg border border-slate-300/60 dark:border-zinc-700">
                  <button
                    type="button"
                    onClick={() => handleItemModeSwitch("SINGLE")}
                    className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      itemMode === "SINGLE"
                        ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                        : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
                    }`}
                  >
                    <ShoppingBag className="h-3.5 w-3.5" />
                    <span>Single Item</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleItemModeSwitch("MULTIPLE")}
                    className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      itemMode === "MULTIPLE"
                        ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                        : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
                    }`}
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
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Apple MacBook Pro 16-inch M3 Max"
                    className="h-10 text-sm font-medium bg-white dark:bg-zinc-900"
                  />
                </div>

                {/* Request Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Request Type <span className="text-rose-500">*</span>
                  </label>
                  <Select value={requestType} onValueChange={(val: string) => setRequestType(val)}>
                    <SelectTrigger className="h-10 text-sm bg-white dark:bg-zinc-900">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SPEND">General Purchasing (Spend)</SelectItem>
                      <SelectItem value="ACCOUNTS_PAYABLE">Accounts Payable (Wire/Check)</SelectItem>
                      <SelectItem value="RECURRING">Recurring Payments</SelectItem>
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
                  <Select value={priority} onValueChange={(val: Priority) => setPriority(val)}>
                    <SelectTrigger className="h-10 text-sm bg-white dark:bg-zinc-900">
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
                      onChange={(e) => {
                        setRequester(e.target.value);
                        setIsUserDropdownOpen(true);
                      }}
                      onFocus={() => setIsUserDropdownOpen(true)}
                      placeholder="Type name or email..."
                      className="h-10 text-sm pr-9 bg-white dark:bg-zinc-900"
                    />
                    <User className="h-4 w-4 absolute right-3 top-3 text-slate-400 pointer-events-none" />
                  </div>
                  {isUserDropdownOpen && filteredUsers.length > 0 && (
                    <div className="absolute z-50 mt-1 w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800/60">
                      {filteredUsers.map((u: any) => {
                        const userDept = resolveUserDepartment(u, rolesList);
                        return (
                          <button
                            key={u.id}
                            type="button"
                            className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors flex flex-col gap-0.5"
                            onClick={() => {
                              setRequester(u.full_name || u.email);
                              if (userDept) setDepartment(userDept);
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
                    onChange={setDepartment}
                    placeholder="Search or enter department..."
                  />
                </div>

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
                      onChange={(e) => setDueDate(e.target.value)}
                      className="h-10 text-sm bg-white dark:bg-zinc-900"
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
                    onChange={(e) => setItemUrl(e.target.value)}
                    placeholder="https://vendor.com/product-page"
                    className="h-10 text-sm bg-white dark:bg-zinc-900"
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Financial Breakdown & Item Details (Single vs Multi) */}
            {itemMode === "SINGLE" ? (
              <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30 p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200 tracking-tight uppercase text-[11px]">
                      Single Item Financials &amp; GL Allocation
                    </h3>
                  </div>
                  <Badge variant="outline" className="text-[11px] font-normal px-2 py-0.5">
                    Single Item Mode
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      SKU / Part #
                    </label>
                    <Input
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="e.g. MK-2026-X"
                      className="h-10 text-sm font-mono bg-white dark:bg-zinc-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Quantity
                    </label>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      value={quantity}
                      onChange={(e) => handleQuantityChange(e.target.value)}
                      className="h-10 text-sm font-mono bg-white dark:bg-zinc-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Unit Price ({reqCurrency})
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={unitPrice}
                      onChange={(e) => handleUnitPriceChange(e.target.value)}
                      className="h-10 text-sm font-mono bg-white dark:bg-zinc-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Currency
                    </label>
                    <CurrencyAutocomplete value={reqCurrency} onChange={handleCurrencyChange} />
                  </div>
                </div>

                {/* Subtotals & Taxes Highlight Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-medium text-slate-500 dark:text-zinc-400 block">
                        Pre-Tax Amount ({reqCurrency})
                      </span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={amount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        className="h-8 font-mono text-base font-bold bg-transparent border-0 p-0 focus-visible:ring-0"
                      />
                    </div>
                    <Badge variant="outline" className="text-slate-600 font-mono text-xs">
                      Qty × Unit Price
                    </Badge>
                  </div>

                  <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/30 p-3.5 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300 block">
                        Estimated Total After-Tax (13% Tax)
                      </span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={String(afterTaxAmount)}
                        onChange={(e) => handleAfterTaxChange(e.target.value)}
                        className="h-8 font-mono text-base font-bold text-indigo-600 dark:text-indigo-400 bg-transparent border-0 p-0 focus-visible:ring-0"
                      />
                    </div>
                    <Badge className="bg-indigo-600 text-white font-mono text-xs">
                      Total
                    </Badge>
                  </div>
                </div>

                {/* Dedicated Full-Width GL Code Row */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                    <span>GL Code / Account Allocation <span className="text-rose-500">*</span></span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {isPricingSynced ? "Cascades to PO & Invoice automatically" : "Request account assignment"}
                    </span>
                  </label>
                  <GLCodeAutocomplete
                    value={reqGlCode}
                    onChange={handleGlCodeChange}
                    placeholder="Search or enter GL code (e.g. 5200 - IT Hardware)..."
                  />
                </div>
              </div>
            ) : (
              /* Multi-Parts Line Items Table & Breakdown */
              <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30 p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200 tracking-tight uppercase text-[11px]">
                      Line Items &amp; Parts Allocation ({requestItems.length} items)
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddPartItem}
                      className="h-8 text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Item / Part</span>
                    </Button>
                  </div>
                </div>

                <div className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-xs">
                  <div className="bg-slate-100/90 dark:bg-zinc-800/90 px-4 py-3 grid grid-cols-12 gap-3 text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                    <div className="col-span-2">SKU / Part #</div>
                    <div className="col-span-3">Description *</div>
                    <div className="col-span-1 text-center">Qty</div>
                    <div className="col-span-2 text-right">Unit Price</div>
                    <div className="col-span-3 pl-2">GL Code Allocation</div>
                    <div className="col-span-1 text-center">Action</div>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                    {requestItems.map((itm, idx) => (
                      <div
                        key={itm.id || idx}
                        className="px-4 py-3 grid grid-cols-12 gap-3 items-center text-xs hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                      >
                        <div className="col-span-2">
                          <Input
                            value={itm.sku || ""}
                            onChange={(e) => handleUpdatePartItem(idx, "sku", e.target.value)}
                            placeholder="SKU"
                            className="h-8 text-xs font-mono"
                          />
                        </div>
                        <div className="col-span-3">
                          <Input
                            value={itm.description || ""}
                            onChange={(e) => handleUpdatePartItem(idx, "description", e.target.value)}
                            placeholder="Item description *"
                            className="h-8 text-xs font-medium"
                          />
                        </div>
                        <div className="col-span-1 text-center">
                          <Input
                            type="number"
                            min="1"
                            value={itm.quantity}
                            onChange={(e) => handleUpdatePartItem(idx, "quantity", e.target.value)}
                            className="h-8 text-xs text-center font-mono"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={itm.unit_price}
                            onChange={(e) => handleUpdatePartItem(idx, "unit_price", e.target.value)}
                            className="h-8 text-xs text-right font-mono"
                          />
                        </div>
                        <div className="col-span-3 pl-2">
                          <GLCodeAutocomplete
                            value={itm.gl_code || reqGlCode}
                            onChange={(val) => handleUpdatePartItem(idx, "gl_code", val)}
                            placeholder="Select GL code *"
                          />
                        </div>
                        <div className="col-span-1 flex justify-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemovePartItem(idx)}
                            className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            title="Delete line item"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional Fees & Grand Total Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Currency
                    </label>
                    <CurrencyAutocomplete value={reqCurrency} onChange={handleCurrencyChange} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Default / Master GL Code
                    </label>
                    <GLCodeAutocomplete
                      value={reqGlCode}
                      onChange={handleGlCodeChange}
                      placeholder="Select master GL code..."
                    />
                  </div>

                  {/* Financial Summary Pill */}
                  <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/30 p-3 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-zinc-400">
                      <span>Items Subtotal:</span>
                      <span className="font-mono font-semibold text-slate-900 dark:text-zinc-100">
                        {formatMoney(itemsSubtotal, reqCurrency)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold text-indigo-700 dark:text-indigo-300 border-t border-indigo-200/60 dark:border-indigo-800/60 pt-1 mt-1">
                      <span>Grand Total:</span>
                      <span className="font-mono text-sm">
                        {formatMoney(calculatedGrandTotal, reqCurrency)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Card 3: Accounts Payable & Wire Banking Details (when AP) */}
            {isAccountsPayable && (
              <div className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/30 dark:bg-blue-950/20 p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-blue-200/80 dark:border-blue-800/80">
                  <div className="flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200 tracking-tight uppercase text-[11px]">
                      Accounts Payable &amp; Wire Payment Instructions
                    </h3>
                  </div>
                  <Badge variant="outline" className="border-blue-300 text-blue-700 dark:text-blue-300 text-[11px]">
                    AP Details
                  </Badge>
                </div>

                <div className="space-y-6">
                  <WireGeneralPaymentFields
                    form={apWireForm}
                    setForm={setApWireForm}
                    onAmountChange={(amt) => {
                      if (itemMode === "SINGLE") handleAmountChange(String(amt));
                    }}
                    onCurrencyChange={handleCurrencyChange}
                    onDueDateChange={setDueDate}
                  />

                  <WireBankingFields
                    form={apWireForm}
                    setForm={setApWireForm}
                  />
                </div>
              </div>
            )}

            {/* Card 4: Business Justification & Specifications */}
            <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30 p-5 space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-slate-400" />
                <span>Business Justification &amp; Specifications</span>
              </label>
              <Textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide any additional specifications, reasoning, or purchasing justification..."
                className="text-xs resize-none bg-white dark:bg-zinc-900"
              />
            </div>
          </TabsContent>

          {/* TAB 2: Purchase Order */}
          {hasPo && (
            <TabsContent
              value="po"
              className="flex-1 overflow-y-auto px-8 py-6 space-y-6 m-0 focus-visible:outline-hidden"
            >
              {/* Order & Vendor Identification */}
              <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30 p-5 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200/80 dark:border-zinc-800/80">
                  <Package className="h-4 w-4 text-amber-500" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200 tracking-tight uppercase text-[11px]">
                    Vendor &amp; PO Identification
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Quote / PO # <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      value={poQuoteNumber}
                      onChange={(e) => setPoQuoteNumber(e.target.value)}
                      placeholder="e.g., PO-2026-0089"
                      className="h-10 text-sm font-mono font-semibold bg-white dark:bg-zinc-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Vendor Name <span className="text-rose-500">*</span>
                    </label>
                    <VendorAutocomplete
                      value={poVendor}
                      onChange={setPoVendor}
                      placeholder="Search or enter vendor..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Payment Format <span className="text-rose-500">*</span>
                    </label>
                    <Select
                      value={poPaymentMethod}
                      onValueChange={(val: PaymentMethod) => setPoPaymentMethod(val)}
                    >
                      <SelectTrigger className="h-10 text-sm bg-white dark:bg-zinc-900">
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.entries(PAYMENT_METHOD_LABEL) as [PaymentMethod, string][]).map(
                          ([val, lbl]) => (
                            <SelectItem key={val} value={val}>
                              {lbl}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Order Item / Scope <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      value={poItem}
                      onChange={(e) => setPoItem(e.target.value)}
                      placeholder="Item title or product name"
                      className="h-10 text-sm bg-white dark:bg-zinc-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Shipped To Location
                    </label>
                    <Input
                      value={poShippedTo}
                      onChange={(e) => setPoShippedTo(e.target.value)}
                      placeholder="e.g., Montreal Head Office"
                      className="h-10 text-sm bg-white dark:bg-zinc-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>Expected Delivery Date</span>
                    </label>
                    <Input
                      type="date"
                      value={poExpectedDeliveryDate}
                      onChange={(e) => setPoExpectedDeliveryDate(e.target.value)}
                      className="h-10 text-sm bg-white dark:bg-zinc-900"
                    />
                  </div>
                </div>
              </div>

              {/* PO Financial & Pricing Breakdown */}
              <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30 p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-amber-500" />
                    <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200 tracking-tight uppercase text-[11px]">
                      Purchase Order Financials
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {isPricingSynced && (
                      <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                        <Link2 className="h-3 w-3" /> Syncing with Invoice
                      </span>
                    )}
                    <Badge variant="outline" className="text-[11px] font-normal px-2 py-0.5">
                      {itemMode === "MULTIPLE" ? "Multi-Part Totals" : "Pricing & Shipping"}
                    </Badge>
                  </div>
                </div>

                {itemMode === "SINGLE" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        Quantity
                      </label>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        value={String(poQuantity)}
                        onChange={(e) => handlePoQuantityChange(Number(e.target.value))}
                        className="h-10 text-sm font-mono bg-white dark:bg-zinc-900"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        Unit Price ({poCurrency})
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={String(poUnitPrice)}
                        onChange={(e) => handlePoUnitPriceChange(Number(e.target.value))}
                        className="h-10 text-sm font-mono bg-white dark:bg-zinc-900"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        Shipping Fee ({poCurrency})
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={String(poShippingFee)}
                        onChange={(e) => handlePoShippingChange(Number(e.target.value))}
                        className="h-10 text-sm font-mono bg-white dark:bg-zinc-900"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        Currency
                      </label>
                      <CurrencyAutocomplete
                        value={poCurrency}
                        onChange={(val) => {
                          setPoCurrency(val);
                          if (isPricingSynced) setInvAmount(poAmount);
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Subtotals & Taxes Highlight Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-white dark:bg-zinc-900 p-3.5 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-medium text-slate-500 dark:text-zinc-400 block">
                        Pre-Tax Amount ({poCurrency})
                      </span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={String(poAmount)}
                        onChange={(e) => handlePoAmountChange(Number(e.target.value))}
                        className="h-8 font-mono text-base font-bold bg-transparent border-0 p-0 focus-visible:ring-0"
                      />
                    </div>
                    <Badge variant="outline" className="text-amber-700 font-mono text-xs">
                      PO Subtotal
                    </Badge>
                  </div>

                  <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/30 p-3.5 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-medium text-amber-800 dark:text-amber-300 block">
                        Estimated Total After-Tax (13% Tax)
                      </span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={String(Math.round(poAmount * (1 + TAX_RATE) * 100) / 100)}
                        onChange={(e) => handlePoAfterTaxChange(Number(e.target.value))}
                        className="h-8 font-mono text-base font-bold text-amber-800 dark:text-amber-300 bg-transparent border-0 p-0 focus-visible:ring-0"
                      />
                    </div>
                    <Badge className="bg-amber-600 text-white font-mono text-xs">
                      PO Total
                    </Badge>
                  </div>
                </div>

                {/* Dedicated Full-Width PO GL Code Row */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                    <span>GL Code / Account Allocation <span className="text-rose-500">*</span></span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      Allocated account code for Purchase Order
                    </span>
                  </label>
                  <GLCodeAutocomplete
                    value={poGlCode}
                    onChange={(val) => {
                      setPoGlCode(val);
                      if (isPricingSynced) setInvGlCode(val);
                    }}
                    placeholder="Search or enter GL code for PO..."
                  />
                </div>
              </div>

              {/* Card 3: PO Stage-Specific Description */}
              <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30 p-5 space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                  <span>PO Notes &amp; Terms (Stage-Specific)</span>
                </label>
                <Textarea
                  rows={3}
                  value={poDescription}
                  onChange={(e) => setPoDescription(e.target.value)}
                  placeholder="Notes, shipping instructions, or specific vendor terms for this Purchase Order..."
                  className="text-xs resize-none bg-white dark:bg-zinc-900"
                />
              </div>
            </TabsContent>
          )}

          {/* TAB 3: Invoice / Receipts */}
          {hasInvoice && (
            <TabsContent
              value="invoice"
              className="flex-1 overflow-y-auto px-8 py-6 space-y-6 m-0 focus-visible:outline-hidden"
            >
              {/* Variance Banner */}
              {hasVariance && (
                <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-4 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold block">
                      Price Variance Detected: {formatMoney(priceVariance, poCurrency)}
                    </span>
                    <p className="text-amber-800 dark:text-amber-300/90 leading-relaxed">
                      Purchase Order amount is <strong>{formatMoney(poAmount, poCurrency)}</strong> while Invoice billed is <strong>{formatMoney(invAmount, poCurrency)}</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* Invoice Main Information */}
              <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30 p-5 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200/80 dark:border-zinc-800/80">
                  <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200 tracking-tight uppercase text-[11px]">
                    Invoice Header &amp; Billing
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Billed Vendor <span className="text-rose-500">*</span>
                    </label>
                    <VendorAutocomplete
                      value={invVendor}
                      onChange={setInvVendor}
                      placeholder="Vendor billed on invoice..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Invoice Billed Amount ({poCurrency}) <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={String(invAmount)}
                      onChange={(e) => setInvAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="h-10 text-sm font-mono font-bold bg-white dark:bg-zinc-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>Invoice / Bill Date</span>
                    </label>
                    <Input
                      type="date"
                      value={invDate}
                      onChange={(e) => setInvDate(e.target.value)}
                      className="h-10 text-sm bg-white dark:bg-zinc-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>Payment Due Date</span>
                    </label>
                    <Input
                      type="date"
                      value={invDueDate}
                      onChange={(e) => setInvDueDate(e.target.value)}
                      className="h-10 text-sm bg-white dark:bg-zinc-900"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                      <span>GL Code / Account Allocation <span className="text-rose-500">*</span></span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        Primary account code for QuickBooks / AP
                      </span>
                    </label>
                    <GLCodeAutocomplete
                      value={invGlCode}
                      onChange={setInvGlCode}
                      placeholder="Search or enter GL code for invoice..."
                    />
                  </div>
                </div>
              </div>

              {/* Itemized Line Items for Invoice (if multi-items exist) */}
              {invItems.length > 0 && (
                <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30 p-5 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-zinc-800/80">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200 tracking-tight uppercase text-[11px]">
                        Invoice Itemized Allocations ({invItems.length} lines)
                      </h3>
                    </div>
                  </div>

                  <div className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-xs">
                    <div className="bg-slate-100/90 dark:bg-zinc-800/90 px-4 py-3 grid grid-cols-12 gap-3 text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                      <div className="col-span-5">Item Description</div>
                      <div className="col-span-2 text-right">Line Amount</div>
                      <div className="col-span-5 pl-2">Line GL Code Allocation</div>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                      {invItems.map((itm, idx) => (
                        <div
                          key={itm.id || idx}
                          className="px-4 py-3 grid grid-cols-12 gap-3 items-center text-xs hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                        >
                          <div className="col-span-5 font-medium text-slate-800 dark:text-zinc-200">
                            {itm.description || `Item #${idx + 1}`}
                          </div>
                          <div className="col-span-2 text-right font-mono font-semibold">
                            {formatMoney(itm.amount || 0, poCurrency)}
                          </div>
                          <div className="col-span-5 pl-2">
                            <GLCodeAutocomplete
                              value={itm.gl_code || invGlCode}
                              onChange={(val) => {
                                const updated = [...invItems];
                                updated[idx].gl_code = val;
                                setInvItems(updated);
                              }}
                              placeholder="Select GL code for this line *"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Card 3: Invoice Stage-Specific Description */}
              <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30 p-5 space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                  <span>Invoice Notes &amp; Payment Remarks (Stage-Specific)</span>
                </label>
                <Textarea
                  rows={3}
                  value={invDescription}
                  onChange={(e) => setInvDescription(e.target.value)}
                  placeholder="Notes, check numbers, or specific AP remarks for this Invoice..."
                  className="text-xs resize-none bg-white dark:bg-zinc-900"
                />
              </div>
            </TabsContent>
          )}
        </Tabs>

        {/* Footer Actions */}
        <div className="px-8 py-4 border-t border-slate-200/80 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/60 flex items-center justify-between gap-4 shrink-0">
          <div className="text-xs text-slate-400">
            Changes across active tabs will be saved simultaneously.
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-9 px-4 text-xs font-medium"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={updateMutation.isPending || isCompleted}
              className="h-9 px-5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
            >
              {updateMutation.isPending ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <span>Save All Changes</span>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
