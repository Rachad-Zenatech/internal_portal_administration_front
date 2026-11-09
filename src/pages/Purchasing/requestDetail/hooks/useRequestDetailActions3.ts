import { useEffect, useRef } from "react";
import { toast } from "sonner";
import * as purchasingService from "@/services/purchasingService";
import { RequestStatus } from "@/types/purchasing";
import { resolveTaxRate } from "../../utils/purchasingMeta";
import type { RequestDetailGuardedState } from "./useRequestDetail";
import type { useRequestDetailActions2 } from "./useRequestDetailActions2";

export function useRequestDetailActions3(ctx: RequestDetailGuardedState & ReturnType<typeof useRequestDetailActions2>) {
  const { completeData, dispatch, hold, confirmGoods, tracking, approval, user, setPendingFiles, pendingFiles, uploadAttachments, id, invoiceItems, invoice, invoicePoNumber, request, po, data, purchase_order, poItems, isMulti, activeForm, inv, poFxRate, poItemCurrency, setPo, poShippingFee, setPoFxRate, setPoItemCurrency, userRoles, hasRole, workflow_roles } = ctx;
  const submitForm = () => {
    if (!activeForm) return;
    const { action, kind } = activeForm;
    if (kind === "po") {
      if (!po.vendor || !po.item) return toast.error("Vendor and item are required.");
      if (!po.payment_method) return toast.error("Payment format is required.");
      if (!po.shipped_to_location || !po.shipped_to_location.trim()) return toast.error("Shipped to location is required.");
      void dispatch({
        action,
        purchase_order: {
          ...po,
          amount: Number(po.amount) || 0,
          quantity: Number(po.quantity) || 1,
          unit_price: Number(po.unit_price) || 0,
          item_url: po.item_url || request.item_url || undefined,
          expected_delivery_date: po.expected_delivery_date?.trim() || undefined,
          items: isMulti ? poItems : undefined,
          // Tax counts toward the $10k Level 2 threshold (backend uses at least its minimum rate).
          estimated_tax_rate: poTax.rate,
        },
      });
    } else if (kind === "invoice") {
      if (!invoicePoNumber || !invoicePoNumber.trim()) return toast.error("PO # is required.");
      if (!invoice.vendor || !invoice.invoice_date) return toast.error("Vendor and bill date are required.");
      if (!invoice.department || !invoice.department.trim()) return toast.error("Class is required.");
      if (!invoice.from_location || !invoice.from_location.trim()) return toast.error("From Location is required.");

      const isMulti = invoiceItems.length > 1;
      if (isMulti) {
        const missingCategory = invoiceItems.some(it => !it.gl_code || !it.gl_code.trim());
        if (missingCategory) {
          return toast.error("Category is required for all line items.");
        }
      } else {
        if (!invoice.gl_code || !invoice.gl_code.trim()) {
          return toast.error("Category is required.");
        }
      }

      void (async () => {
        const cleanDueDate = invoice.due_date && invoice.due_date.trim() !== "" ? invoice.due_date : undefined;
        const isMaTxn = Boolean(
          (request as any)?.source_portal === "m7a" ||
          (request as any)?.source_portal === "m&a" ||
          (request as any)?.source_portal === "m_and_a" ||
          (request as any)?.is_ma ||
          request.department?.toLowerCase().includes("m&a")
        );
        const currentPo = purchase_order || data?.purchase_order || po;
        const ok = await dispatch({
          action,
          purchase_order: {
            ...currentPo,
            vendor: currentPo?.vendor || invoice.vendor || "Vendor",
            item: currentPo?.item || request.title || "Item",
            amount: Number(currentPo?.amount || invoice.amount || 0),
            payment_method: currentPo?.payment_method || (isMaTxn ? "WIRE" : "CC"),
            shipped_to_location: currentPo?.shipped_to_location || "Headquarters",
            quote_number: invoicePoNumber.trim(),
          },
          invoice: {
            ...invoice,
            invoice_type: "Purchase",
            amount: Number(invoice.amount) || 0,
            due_date: cleanDueDate,
            department: invoice.department?.trim() || undefined,
            from_location: invoice.from_location?.trim() || undefined,
            gl_code: invoice.gl_code?.trim() || (invoiceItems.length > 0 ? invoiceItems[0].gl_code?.trim() : undefined),
            items: isMulti ? invoiceItems.map(it => ({
              ...it,
              amount: Number(it.amount) || 0,
              quantity: Number(it.quantity) || 1,
              unit_price: Number(it.unit_price) || 0,
              gl_code: it.gl_code.trim(),
            })) : undefined,
          },
        });
        if (ok && pendingFiles.length > 0 && id) {
          try {
            await uploadAttachments.mutateAsync(pendingFiles);
            setPendingFiles([]);
          } catch {
            toast.error("Bill recorded, but attachment upload failed.");
          }
        }
      })();
    } else if (kind === "approval") {
      const approverId = approval.approver || user?.id || user?.full_name || user?.email || "Approver";
      void dispatch({ action, approval: { ...approval, approver: approverId } });
    } else if (kind === "tracking") {
      if (!tracking.tracking_number) return toast.error("Tracking number is required.");
      void dispatch({ action, tracking });
    } else if (kind === "confirmGoods") {
      void dispatch({ action, confirm_goods: { description: confirmGoods.description.trim() } });
    } else if (kind === "hold") {
      if (!hold.reason || !hold.reason.trim()) return toast.error("Hold reason is required.");
      void dispatch({ action, hold });
    } else if (kind === "complete") {
      if (!completeData.next_due_date || !completeData.next_due_date.trim()) {
        return toast.error("Next due date is required.");
      }
      void dispatch({
        action,
        next_due_date: completeData.next_due_date,
        comment: completeData.comment?.trim() || undefined,
      });
    }
  };
  // Crawled product foreign currency & original price resolution
  const pInfo = request.product_info;
  const pVendor = (pInfo?.vendor || "").toLowerCase();
  const isCaVendor = pVendor.includes(".ca") || pVendor.includes("amazon.ca") || (request.item_url || "").toLowerCase().includes("amazon.ca");
  let crawledOrigPrice: number | null = null;
  let crawledOrigCurr: string | null = null;
  if (pInfo?.original_price && pInfo?.original_currency) {
    crawledOrigPrice = Number(pInfo.original_price);
    crawledOrigCurr = pInfo.original_currency;
  } else if (pInfo?.currency && pInfo.currency.toUpperCase() !== "USD" && pInfo.currency.toUpperCase() !== "N/A" && pInfo.price && pInfo.price !== "N/A") {
    crawledOrigPrice = Number(String(pInfo.price).replace(/[^0-9.]/g, ""));
    crawledOrigCurr = pInfo.currency;
  } else if (isCaVendor) {
    crawledOrigCurr = "CAD";
    if (pInfo?.price && pInfo.price !== "N/A") {
      const pNum = Number(String(pInfo.price).replace(/[^0-9.]/g, ""));
      crawledOrigPrice = pNum > 0 ? Math.round((pNum / 0.73) * 100) / 100 : null;
    } else if (request.unit_price) {
      crawledOrigPrice = Math.round((request.unit_price / 0.73) * 100) / 100;
    }
  }
  const hasCrawledForeignPrice = Boolean(
    crawledOrigPrice &&
    crawledOrigPrice > 0 &&
    crawledOrigCurr &&
    crawledOrigCurr.toUpperCase() !== (request.currency || "USD").toUpperCase()
  );
  // After-tax total: the actual cost recorded at payment wins; otherwise estimate from the regional rate
  const reqTax = resolveTaxRate({
    shippingAddress: purchase_order?.shipped_to_location || (request as any).shipped_to_location || (request as any).shipping_address,
    vendorAddress: request.quote_data?.vendor?.address,
    vendorName: purchase_order?.vendor || request.quote_data?.vendor?.name,
    currency: hasCrawledForeignPrice ? crawledOrigCurr : request.currency,
  });
  // Report this screen's tax rate so the server (and the CEO dashboard) hold the same after-tax amount.
  const reportedTaxRate = useRef<string | null>(null);
  useEffect(() => {
    const reqId = (request as any)?.id;
    if (!reqId || hasCrawledForeignPrice) return;
    const serverRate = Number((request as any).tax_rate);
    const serverTotal = Number((request as any).amount_after_tax);
    const expected = Math.round((Number(request.amount) || 0) * (1 + reqTax.rate) * 100) / 100;
    if ((request as any).tax_source === "note" && Math.abs(serverTotal - expected) < 0.01 && Math.abs(serverRate - reqTax.rate) < 0.0001) return;
    const key = `${reqId}:${reqTax.rate}`;
    if (reportedTaxRate.current === key) return;
    reportedTaxRate.current = key;
    void purchasingService.recordTaxEstimate(reqId, reqTax.rate).catch(() => { reportedTaxRate.current = null; });
  }, [(request as any)?.id, (request as any)?.tax_source, (request as any)?.amount_after_tax, request?.amount, reqTax.rate, hasCrawledForeignPrice]);
  const actualCostInvoice = (data?.invoices || []).find((i) => i.actual_cost_after_tax != null)
    || (inv?.actual_cost_after_tax != null ? inv : null);
  const recalculatePoUsdTotal = (items: any[], shippingFeeNative: number, rate: number) => {
    const sumNative = items.reduce((acc, it) => acc + (Number(it.total) || 0), 0);
    const subtotalUsd = Math.round(sumNative * rate * 100) / 100;
    const shippingUsd = Math.round(shippingFeeNative * rate * 100) / 100;
    const totalUsd = Math.round((subtotalUsd + shippingUsd) * 100) / 100;
    return { sumNative, subtotalUsd, shippingUsd, totalUsd };
  };
  // po.amount is persisted in USD; review fields display and accept the selected item currency
  const poUsdToNative = (usd: number) => (poFxRate > 0 ? Math.round((usd / poFxRate) * 100) / 100 : usd);
  const poNativeToUsd = (native: number) => Math.round(native * poFxRate * 100) / 100;
  const poTax = resolveTaxRate({
    shippingAddress: po.shipped_to_location,
    vendorAddress: request.quote_data?.vendor?.address,
    vendorName: po.vendor,
    currency: poItemCurrency,
  });
  const handlePoItemCurrencyChange = async (newCurr: string) => {
    const targetCurr = (newCurr || "USD").toUpperCase();
    setPoItemCurrency(targetCurr);
    if (targetCurr === "USD") {
      setPoFxRate(1.0);
      const { totalUsd } = recalculatePoUsdTotal(poItems, poShippingFee, 1.0);
      setPo((prev) => ({ ...prev, amount: totalUsd, currency: "USD" }));
      return;
    }

    try {
      let rate = 1.0;
      if (targetCurr === quoteNativeCurrency && quoteExchangeRate > 0) {
        rate = quoteExchangeRate;
      } else {
        const res = await purchasingService.getExchangeRate(targetCurr, "USD");
        rate = Number(res?.exchange_rate) || 1.0;
      }
      setPoFxRate(rate);

      const { totalUsd } = recalculatePoUsdTotal(poItems, poShippingFee, rate);
      setPo((prev) => ({ ...prev, amount: totalUsd, currency: "USD" }));
      toast.info(`Item currency: ${targetCurr} (Rate: 1 ${targetCurr} = $${rate.toFixed(4)} USD)`);
    } catch (err: any) {
      toast.error(`Failed to fetch exchange rate for ${targetCurr}: ${err?.message || "Unknown error"}`);
    }
  };
  const isReviewed = request.review_status === "REVIEWED";
  // The attachments endpoint is not status-gated, so files can be attached at any
  // active stage (including WAITING_PAYMENT). Only terminal requests are locked.
  const canAttachFiles = request.status !== "COMPLETED" && request.status !== "REJECTED";
  const quoteNativeCurrency = (
    request.quote_data?.conversion?.original_currency ||
    request.quote_data?.currency ||
    (request.items && request.items[0]?.original_currency) ||
    request.currency ||
    "USD"
  ).toUpperCase();
  const quoteExchangeRate = Number(request.quote_data?.conversion?.exchange_rate) || 1.0;
  const isForeignQuote = Boolean(
    (request.quote_data?.conversion?.is_converted && quoteNativeCurrency !== "USD") ||
    (quoteNativeCurrency !== "USD")
  );
  const rawItemsList = (request.items && request.items.length > 0) ? request.items : (request.quote_data?.items || []);
  const itemsSumNative = rawItemsList.reduce((acc: number, itm: any) => {
    const itmTotal = Number(itm.original_total ?? itm.total ?? (Number(itm.quantity || 1) * Number(itm.unit_price || 0)));
    return acc + itmTotal;
  }, 0);
  const quoteShippingNative = Number(request.quote_data?.conversion?.original_shipping ?? request.quote_data?.totals?.shipping) || 0;
  const quoteTaxNative = Number(request.quote_data?.conversion?.original_tax ?? request.quote_data?.totals?.tax) || 0;
  const quoteDiscountNative = Number(request.quote_data?.conversion?.original_discount ?? request.quote_data?.totals?.discount) || 0;
  const calculatedQuoteTotalNative = Math.round((itemsSumNative + quoteShippingNative + quoteTaxNative - quoteDiscountNative) * 100) / 100;
  const statedGrandTotalNative = Math.round(Number(request.quote_data?.conversion?.original_total ?? request.quote_data?.totals?.total ?? (isForeignQuote ? itemsSumNative : request.amount)) * 100) / 100;
  const statedGrandTotalUsd = Math.round(Number(request.amount || request.quote_data?.conversion?.converted_total || (statedGrandTotalNative * quoteExchangeRate)) * 100) / 100;
  const calculatedQuoteTotalUsd = Math.round((calculatedQuoteTotalNative * quoteExchangeRate) * 100) / 100;
  const totalsMatch = Math.abs(calculatedQuoteTotalNative - statedGrandTotalNative) < 0.05 || Math.abs(calculatedQuoteTotalUsd - statedGrandTotalUsd) < 0.05;
  const vendorCompanyName = request.quote_data?.vendor?.name || (request.title?.includes(" - ") ? request.title.split(" - ")[0] : "");
  const customerCompanyName = request.quote_data?.customer?.name;
  const isEditableStatus =
    request.status !== RequestStatus.Completed &&
    (request.status as string) !== "COMPLETED" &&
    request.status !== RequestStatus.Rejected &&
    (request.status as string) !== "REJECTED";
  // Role checks for PURCHASING, AP, MANAGER, EXECUTIVE, and SUPER ADMIN (plus ADMIN)
  const isPurchasing = Boolean(
    workflow_roles.includes("PURCHASING") ||
    workflow_roles.includes("PURCHASER") ||
    hasRole?.("PURCHASING") ||
    hasRole?.("PURCHASER") ||
    hasRole?.("BUYER") ||
    userRoles.some((r) => {
      const c = (r.code || "").toUpperCase();
      const n = (r.name || "").toUpperCase();
      return c === "PURCHASING" || c === "PURCHASER" || c.includes("PURCHAS") || n === "PURCHASING" || n.includes("PURCHAS");
    }) ||
    user?.department?.toUpperCase().includes("PURCHAS")
  );
  const isAPRole = Boolean(
    workflow_roles.includes("AP") ||
    workflow_roles.includes("ACCOUNTS_PAYABLE") ||
    workflow_roles.includes("ACCTS_PAY") ||
    hasRole?.("AP") ||
    hasRole?.("ACCTS_PAY") ||
    hasRole?.("ACCOUNTS_PAYABLE") ||
    userRoles.some((r) => {
      const c = (r.code || "").toUpperCase();
      const n = (r.name || "").toUpperCase();
      return c === "AP" || c === "ACCTS_PAY" || c.includes("AP") || n === "AP" || n.includes("ACCOUNTS PAYABLE");
    }) ||
    user?.department?.toUpperCase().includes("ACCOUNT") ||
    user?.department?.toUpperCase().includes("AP")
  );
  const isManager = Boolean(
    workflow_roles.includes("MANAGER") ||
    hasRole?.("MANAGER") ||
    userRoles.some((r) => {
      const c = (r.code || "").toUpperCase();
      const n = (r.name || "").toUpperCase();
      return c === "MANAGER" || c.includes("MANAGER") || n === "MANAGER" || n.includes("MANAGER");
    })
  );
  const isExecutive = Boolean(
    workflow_roles.includes("EXECUTIVE") ||
    workflow_roles.includes("EXEC") ||
    hasRole?.("EXECUTIVE") ||
    hasRole?.("EXEC") ||
    userRoles.some((r) => {
      const c = (r.code || "").toUpperCase();
      const n = (r.name || "").toUpperCase();
      return c === "EXECUTIVE" || c === "EXEC" || c.includes("EXEC") || n === "EXECUTIVE" || n.includes("EXECUTIVE");
    })
  );
  const isSuperAdmin = Boolean(
    user?.is_super_admin ||
    workflow_roles.includes("SUPER_ADMIN") ||
    workflow_roles.includes("SUPER ADMIN") ||
    workflow_roles.includes("SUPERADMIN") ||
    hasRole?.("SUPER_ADMIN") ||
    hasRole?.("SUPER ADMIN") ||
    hasRole?.("SUPERADMIN") ||
    userRoles.some((r) => {
      const c = (r.code || "").toUpperCase();
      const n = (r.name || "").toUpperCase();
      return c === "SUPER_ADMIN" || c === "SUPER ADMIN" || c.includes("SUPER_ADMIN") || n === "SUPER ADMIN" || n.includes("SUPER ADMIN");
    })
  );
  const isAdmin = Boolean(
    isSuperAdmin ||
    workflow_roles.includes("ADMIN") ||
    workflow_roles.includes("ADMINISTRATOR") ||
    hasRole?.("ADMIN") ||
    hasRole?.("ADMINISTRATOR") ||
    userRoles.some((r) => {
      const c = (r.code || "").toUpperCase();
      const n = (r.name || "").toUpperCase();
      return c === "ADMIN" || c.includes("ADMIN") || n === "ADMIN" || n.includes("ADMIN");
    })
  );
  const isPrivilegedPurchasingRole = isPurchasing || isAPRole || isManager || isExecutive || isAdmin || isSuperAdmin;
  const isRequester = Boolean(
    user && (
      (request.requester_id && String(request.requester_id) === String(user.id)) ||
      (request.requester && (
        (user.full_name && request.requester.toLowerCase().trim() === user.full_name.toLowerCase().trim()) ||
        (user.email && request.requester.toLowerCase().trim() === user.email.toLowerCase().trim()) ||
        (request.requester_email && user.email && request.requester_email.toLowerCase().trim() === user.email.toLowerCase().trim())
      ))
    )
  );
  const isAssigned = Boolean(
    user && (
      (request.assigned_user_id && String(request.assigned_user_id) === String(user.id)) ||
      (request.assigned_user_ids && request.assigned_user_ids.some(uid => String(uid) === String(user.id))) ||
      (request.assigned_user && (
        (user.full_name && request.assigned_user.toLowerCase().includes(user.full_name.toLowerCase().trim())) ||
        (user.email && request.assigned_user.toLowerCase().includes(user.email.toLowerCase().trim()))
      ))
    )
  );
  const isUnderReview = request.status === RequestStatus.UnderReview || (request.status as string) === "UNDER_REVIEW";
  const canEditRequest = isEditableStatus && (
    isPrivilegedPurchasingRole ||
    isAssigned ||
    (isUnderReview ? false : isRequester)
  );
  const isWaitingApproval = (
    [RequestStatus.WaitingApproval, RequestStatus.UnderReview, "WAITING_APPROVAL", "UNDER_REVIEW"] as readonly string[]
  ).includes(request.status);
  // Super admins may approve/reject their own requests (the backend allows it too).
  const isSelfApprovalBlocked = isWaitingApproval && isRequester && !isSuperAdmin;
  return { submitForm, crawledOrigPrice, crawledOrigCurr, hasCrawledForeignPrice, reqTax, actualCostInvoice, recalculatePoUsdTotal, poUsdToNative, poNativeToUsd, poTax, handlePoItemCurrencyChange, isReviewed, canAttachFiles, quoteNativeCurrency, quoteExchangeRate, isForeignQuote, itemsSumNative, quoteShippingNative, quoteTaxNative, quoteDiscountNative, calculatedQuoteTotalNative, statedGrandTotalNative, statedGrandTotalUsd, totalsMatch, vendorCompanyName, customerCompanyName, isPrivilegedPurchasingRole, canEditRequest, isSelfApprovalBlocked };
}
