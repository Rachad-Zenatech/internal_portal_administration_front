import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { type PreviewFileTarget } from "../../dialogs/FilePreviewModal";
import { usePurchaseRequests, useProjects, usePurchasingSummary, useCreateRequest, useUsersList, useRolesList, useExtractQuote } from "@/hooks/usePurchasing";
import { RequestStatus, type RequestCreateInput, type RequestType, type ItemMode, type PurchaseRequest, type PurchaseRequestItem, type QuoteExtractionResponse, type WireTransferInput, type FrequencyType, type CustomScheduleDate } from "@/types/purchasing";
import { parseRequestStatus } from "@/lib/requestStatus";
import { useAuth } from "@/lib/AuthContext";
import { resolveUserDepartment } from "@/lib/userDepartment";
import { extractProductInfoFromUrl } from "@/services/purchasingService";
import { EMPTY_WIRE_FORM, EMPTY_FORM } from "../constants";
import { parseExtractedPrice } from "../utils";

export function usePurchaseRequestsActions() {
  const kpiRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [convertingRequest, setConvertingRequest] = useState<PurchaseRequest | null>(null);
  const [itemMode, setItemMode] = useState<ItemMode>("SINGLE");
  const [form, setForm] = useState<RequestCreateInput>(EMPTY_FORM);
  const [apWireForm, setApWireForm] = useState<WireTransferInput>(EMPTY_WIRE_FORM);
  // Recurring Schedule States for RECURRING request_type
  const [isScheduled, setIsScheduled] = useState<boolean>(false);
  const [schedFrequency, setSchedFrequency] = useState<FrequencyType>("MONTHLY");
  const [schedStartDate, setSchedStartDate] = useState<string>("");
  const [schedEndDate, setSchedEndDate] = useState<string>("");
  const [schedDates, setSchedDates] = useState<CustomScheduleDate[]>([]);
  // URL Product Extraction state
  const [isExtractingUrl, setIsExtractingUrl] = useState(false);
  const [extractedProductInfo, setExtractedProductInfo] = useState<any | null>(null);
  const lastExtractedUrlRef = useRef<string>("");
  const urlExtractionTimeoutRef = useRef<any>(null);
  const handleUrlExtraction = async (rawUrl: string, force = false) => {
    const trimmed = (rawUrl || "").trim();
    if (!trimmed || trimmed.length < 8) return;
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://") && !trimmed.includes(".")) return;
    if (!force && lastExtractedUrlRef.current === trimmed) return;

    lastExtractedUrlRef.current = trimmed;
    setIsExtractingUrl(true);
    try {
      const res = await extractProductInfoFromUrl(trimmed);
      if (res && res.name && res.name !== "N/A") {
        setExtractedProductInfo(res);
        setForm((prev) => {
          const updates: any = {};
          // Populate title if empty or default placeholder
          if (!prev.title || prev.title.trim() === "" || prev.title.startsWith("e.g.")) {
            updates.title = res.name;
          }
          // Populate price
          const parsedPrice = parseExtractedPrice(res.price);
          if (parsedPrice !== null) {
            updates.unit_price = parsedPrice;
            updates.amount = parsedPrice * (prev.quantity || 1);
          }
          // Populate currency
          if (res.currency && res.currency !== "N/A") {
            updates.currency = res.currency;
          }
          // Populate description if empty
          if (res.description && res.description !== "N/A" && (!prev.description || prev.description.trim() === "")) {
            updates.description = res.description;
          }
          return { ...prev, ...updates };
        });
        const currSymbol = res.currency === "CAD" ? "CA$" : res.currency === "EUR" ? "€" : res.currency === "GBP" ? "£" : "$";
        const priceDisplay = res.price && res.price !== "N/A" ? `${currSymbol}${res.price} ${res.currency || "USD"}` : "";
        toast.success(`Extracted: ${res.name.slice(0, 40)}...${priceDisplay ? ` (${priceDisplay})` : ""}`);
      }
    } catch (err: any) {
      console.warn("URL extraction notice:", err);
    } finally {
      setIsExtractingUrl(false);
    }
  };
  // Multi-parts Quote OCR state
  const [quoteFile, setQuoteFile] = useState<File | null>(null);
  const [quoteExtraction, setQuoteExtraction] = useState<QuoteExtractionResponse | null>(null);
  const quoteFileInputRef = useRef<HTMLInputElement | null>(null);
  const [quoteItems, setQuoteItems] = useState<PurchaseRequestItem[]>([]);
  const [lineItemsCurrency, setLineItemsCurrency] = useState("USD");
  const itemUrlExtractionTimeoutsRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const lastExtractedItemUrlsRef = useRef<Map<number, string>>(new Map());
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [taxFee, setTaxFee] = useState<number>(0);
  const [isFullScreenTable, setIsFullScreenTable] = useState(false);
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);
  const [isQBExportOpen, setIsQBExportOpen] = useState(false);
  useEffect(() => {
    return () => {
      for (const timeout of itemUrlExtractionTimeoutsRef.current.values()) {
        clearTimeout(timeout);
      }
    };
  }, []);
  // File Preview Modal State
  const [previewTarget, setPreviewTarget] = useState<PreviewFileTarget | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const handlePreviewFile = (file: File) => {
    const url = URL.createObjectURL(file);
    setPreviewTarget({
      name: file.name,
      size: file.size,
      url,
      contentType: file.type,
      onDownload: () => {
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      },
    });
    setIsPreviewOpen(true);
  };
  const handleClosePreview = (open: boolean) => {
    setIsPreviewOpen(open);
    if (!open && previewTarget?.url) {
      URL.revokeObjectURL(previewTarget.url);
      setPreviewTarget(null);
    }
  };
  const { user, roles = [], hasPermission } = useAuth();
  const canCreate = Boolean(user?.is_super_admin || hasPermission("PURCHASING_CREATE"));
  const { data: usersList = [] } = useUsersList();
  const { data: rolesList = [] } = useRolesList();
  const currentRequesterUser = useMemo(() => {
    const q = (form.requester || "").toLowerCase().trim();
    if (!q) return user;
    return (
      usersList.find(
        (u) =>
          (u.full_name && u.full_name.toLowerCase().trim() === q) ||
          (u.email && u.email.toLowerCase().trim() === q)
      ) || user
    );
  }, [form.requester, usersList, user]);
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
  const statusFilter = searchParams.get("status") || "OPEN";
  const typeFilter = searchParams.get("request_type") || "ALL";
  const projectFilter = searchParams.get("project") || "ALL";
  const { data: knownProjects = [] } = useProjects();
  const handleStatusFilterChange = (val: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (val === "OPEN") {
      newParams.delete("status");
    } else {
      newParams.set("status", val);
    }
    setSearchParams(newParams);
  };
  const filters = useMemo(
    () => ({
      search: search || undefined,
      status: statusFilter === "ALL" ? undefined : statusFilter,
      request_type: typeFilter === "ALL" ? undefined : typeFilter,
      project: projectFilter === "ALL" ? undefined : projectFilter,
    }),
    [search, statusFilter, typeFilter, projectFilter],
  );
  const { data: requests = [], isLoading } = usePurchaseRequests(filters);
  const { data: summary } = usePurchasingSummary();
  const isTaskOwnedByUser = (task: any, currentUser: any) => {
    if (!currentUser) return false;
    const userFull = (currentUser.full_name || "").trim().toLowerCase();
    const userEmail = (currentUser.email || "").trim().toLowerCase();
    const userName = (currentUser.username || "").trim().toLowerCase();
    const userId = String(currentUser.id || "").trim();

    const reqStr = String(task.requester || task.requester_name || "").trim().toLowerCase();
    const createdByStr = String(task.created_by || task.created_by_name || task.created_by_user_id || task.user_id || "").trim().toLowerCase();
    const reqIdStr = String(task.requester_id || "").trim();

    return Boolean(
      (userFull && reqStr === userFull) ||
      (userEmail && reqStr === userEmail) ||
      (userName && reqStr === userName) ||
      (userId && (userId === reqIdStr || userId === createdByStr || userId === reqStr)) ||
      (userFull && createdByStr === userFull) ||
      (userEmail && createdByStr === userEmail)
    );
  };
  const visibleRequests = useMemo(() => {
    return requests.filter((r) => {
      if (r.request_type === "RECURRING") {
        return false;
      }
      const isDraft = parseRequestStatus(r.status) === RequestStatus.Initial;
      if (isDraft) {
        return isTaskOwnedByUser(r, user);
      }
      return true;
    });
  }, [requests, user]);
  const createMutation = useCreateRequest();
  const extractQuoteMutation = useExtractQuote();
  const openCreate = (initialType: RequestType = "SPEND") => {
    if (!canCreate) {
      toast.error("You do not have permission to create purchase requests");
      return;
    }
    const defaultRequester = user?.full_name || user?.email || "";
    const matchedUser = usersList.find(
      (u) =>
        (u.full_name && u.full_name.toLowerCase() === defaultRequester.toLowerCase().trim()) ||
        (u.email && u.email.toLowerCase() === defaultRequester.toLowerCase().trim()) ||
        (user?.id && u.id === user.id)
    );
    const effectiveRoles = rolesList.length > 0 ? rolesList : roles;
    const defaultDept = matchedUser
      ? resolveUserDepartment(matchedUser, effectiveRoles)
      : (resolveUserDepartment({ ...user, roles }, effectiveRoles) || (user?.department && user.department.toUpperCase() !== "REQUESTER" ? user.department : "") || "");

    const todayIso = new Date().toISOString().split("T")[0];
    const initialShippingAddress = matchedUser?.shipping_address || (user as any)?.shipping_address || "";
    const initialPhoneNumber = matchedUser?.phone_number || (user as any)?.phone_number || "";

    setForm({
      ...EMPTY_FORM,
      request_type: initialType,
      requester: defaultRequester,
      department: defaultDept || "",
      shipping_address: initialShippingAddress,
      phone_number: initialPhoneNumber,
      due_date: initialType === "RECURRING" ? todayIso : "",
    });
    setApWireForm({
      ...EMPTY_WIRE_FORM,
      entry_date: todayIso,
      payment_date: todayIso,
    });
    setItemMode("SINGLE");
    setIsScheduled(false);
    setSchedFrequency("MONTHLY");
    setSchedStartDate(todayIso);
    setSchedEndDate("");
    setSchedDates([]);
    setQuoteFile(null);
    setQuoteExtraction(null);
    setQuoteItems([]);
    setLineItemsCurrency("USD");
    setShippingFee(0);
    setTaxFee(0);
    setShowUnsavedConfirm(false);
    setIsDialogOpen(true);
  };
  return { kpiRef, navigate, queryClient, searchParams, setSearchParams, search, setSearch, isDialogOpen, setIsDialogOpen, convertingRequest, setConvertingRequest, itemMode, setItemMode, form, setForm, apWireForm, setApWireForm, isScheduled, setIsScheduled, schedFrequency, setSchedFrequency, schedStartDate, setSchedStartDate, schedEndDate, setSchedEndDate, schedDates, setSchedDates, isExtractingUrl, extractedProductInfo, urlExtractionTimeoutRef, handleUrlExtraction, quoteFile, setQuoteFile, quoteExtraction, setQuoteExtraction, quoteFileInputRef, quoteItems, setQuoteItems, lineItemsCurrency, setLineItemsCurrency, itemUrlExtractionTimeoutsRef, lastExtractedItemUrlsRef, shippingFee, setShippingFee, taxFee, setTaxFee, isFullScreenTable, setIsFullScreenTable, showUnsavedConfirm, setShowUnsavedConfirm, isQBExportOpen, setIsQBExportOpen, previewTarget, isPreviewOpen, handlePreviewFile, handleClosePreview, canCreate, usersList, rolesList, allSavedAddresses, lastUsedAddress, statusFilter, typeFilter, projectFilter, knownProjects, handleStatusFilterChange, isLoading, summary, visibleRequests, createMutation, extractQuoteMutation, openCreate };
}
