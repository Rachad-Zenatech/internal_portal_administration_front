import { mapPaymentMethodToBankAccount } from "@/utils/glAccountUtils";
import { toast } from "sonner";
import * as purchasingService from "@/services/purchasingService";
import type { WireTransferInput, InvoiceItemInput, TransitionInput, WorkflowAction, PaymentMethod } from "@/types/purchasing";
import { ACTION_META, ADMIN_FLOW, SPEND_FLOW, RECURRING_FLOW, QUOTE_FLOW, wireFlowFor } from "../../utils/purchasingMeta";
import type { RequestDetailGuardedState } from "./useRequestDetail";

export function useRequestDetailActions2(ctx: RequestDetailGuardedState) {
  const { data, backUrl, navigate, setActiveForm, transition, setIsWireDialogOpen, setConfirmGoods, user, setApproval, setPo, setPoFxRate, setPoShippingFee, setPoItems, setPoItemCurrency, setPendingFiles, setInvoicePoNumber, glCodes, setInvoice, setInvoiceItems, setCompleteData, calculateNextDueDate, isRecurring } = ctx;
  const { request, purchase_order, invoice: inv, approvals, available_actions } = data;
  const hasInvoiceOrReceipt = Boolean(
    (data?.invoices && data.invoices.length > 0) ||
    data?.invoice ||
    (data?.attachments && data.attachments.length > 0)
  );
  const isMulti = request.item_mode === "MULTIPLE" || Boolean(request.items && request.items.length > 0) || Boolean(request.quote_data?.items && request.quote_data.items.length > 0);
  const multiPartsList: any[] = (request?.items && request.items.length > 0)
    ? request.items
    : (request?.quote_data?.items || request?.quote_data?.line_items || []);
  const getItemGLCode = (itm: any, idx: number): string | null => {
    if (data?.invoice?.items && data.invoice.items.length > 0) {
      const matched = data.invoice.items.find((invItm: any) =>
        (itm.id && String(invItm.request_item_id) === String(itm.id)) ||
        (invItm.sku && itm.sku && itm.sku.trim() !== "" && invItm.sku.trim() === itm.sku.trim())
      ) || data.invoice.items[idx];
      if (matched?.gl_code) return matched.gl_code;
    }
    if (itm.gl_code) return itm.gl_code;
    return null;
  };
  let flow = SPEND_FLOW;
  if (request.request_type === "ADMIN") flow = ADMIN_FLOW;
  else if (request.request_type === "ACCOUNTS_PAYABLE") flow = wireFlowFor(data?.wire_transfer?.category, request.status);
  else if (request.request_type === "RECURRING") flow = RECURRING_FLOW;
  else if (request.request_type === "QUOTE") flow = QUOTE_FLOW;
  const dispatch = async (payload: TransitionInput): Promise<boolean> => {
    try {
      await transition.mutateAsync(payload);
      toast.success(`${ACTION_META[payload.action].label} done`);
      setActiveForm(null);
      if (payload.action === "DELETE_REQUEST") {
        navigate(backUrl);
      }
      return true;
    } catch (err) {
      toast.error((err as Error).message || "Action failed");
      return false;
    }
  };
  const handleConfirmWire = async (wireData: WireTransferInput) => {
    const ok = await dispatch({
      action: "MARK_PURCHASED",
      wire_transfer: wireData,
    });
    if (ok) {
      setIsWireDialogOpen(false);
      toast.success("Wire transfer details saved & marked as purchased.");
    }
  };
  const onAction = (action: WorkflowAction) => {
    const poPm = String(purchase_order?.payment_method || "");
    const isWire =
      poPm === "W" ||
      poPm === "WIRE" ||
      poPm.toLowerCase().includes("wire");
    if (action === "MARK_PURCHASED") {
      if (isWire) {
        setIsWireDialogOpen(true);
        return;
      }
      void dispatch({ action: "MARK_PURCHASED" });
      return;
    }

    const meta = ACTION_META[action];
    if (action === "COMPLETE") {
      if (!hasInvoiceOrReceipt) {
        toast.error("Please record an invoice or upload a receipt before completing this request.");
        return;
      }
      // If it is a scheduled recurring payment, bypass period picker dialog since time range and dates are predetermined
      if (isRecurring) {
        if (request.recurring_schedule?.is_scheduled) {
          void dispatch({ action });
          return;
        }
        const baseDate = request.due_date || request.request_date || new Date().toISOString().split("T")[0];
        const initialCalculated = calculateNextDueDate(baseDate, "MONTHLY");
        setCompleteData({
          selectionType: "PERIOD",
          period: "MONTHLY",
          next_due_date: initialCalculated,
          comment: "",
        });
        setActiveForm({ kind: "complete", action: "COMPLETE" });
        return;
      }
      // Standard requests complete directly without recurring schedule prompt
      void dispatch({ action });
      return;
    }

    if (!meta.form) {
      void dispatch({ action });
      return;
    }
    // Prefill sensible defaults from existing data.
    if (meta.form === "invoice") {
      const defaultVendor =
        purchase_order?.vendor ??
        request.quote_data?.vendor?.name ??
        (request.request_type === 'RECURRING' ? request.title : "") ??
        "";
      const isDefaultAsset =
        request.request_type === 'RECURRING' || request.request_type === 'ACCOUNTS_PAYABLE';

      const rawItems = (request.items && request.items.length > 0)
        ? request.items
        : (request.quote_data?.items || request.quote_data?.line_items || []);

      const prefilledItems: InvoiceItemInput[] = (rawItems || []).map((itm: any) => ({
        request_item_id: itm.id && !isNaN(Number(itm.id)) ? Number(itm.id) : undefined,
        description: itm.description || itm.title || "Item",
        sku: itm.sku || "",
        quantity: Number(itm.quantity) || 1,
        unit_price: Number(itm.unit_price) || 0,
        amount: Number(itm.total ?? itm.amount ?? ((Number(itm.quantity) || 1) * (Number(itm.unit_price) || 0))) || 0,
        gl_code: itm.gl_code || purchase_order?.gl_code || request.gl_code || "",
        asset_flag: isDefaultAsset,
      }));

      const isRecurringReq = request.request_type === 'RECURRING';
      const completedInstallments = request.recurring_schedule?.completed_installments || 0;
      const currentCycleDate = request.recurring_schedule?.schedule_dates?.[completedInstallments];
      const cycleAmount = currentCycleDate?.amount != null && Number(currentCycleDate.amount) > 0
        ? Number(currentCycleDate.amount)
        : (request.recurring_schedule?.amount_per_cycle != null && Number(request.recurring_schedule.amount_per_cycle) > 0
            ? Number(request.recurring_schedule.amount_per_cycle)
            : (purchase_order?.amount ?? request.unit_price ?? request.amount ?? 0));

      const defaultInvoiceAmount = isRecurringReq
        ? cycleAmount
        : (purchase_order?.amount ?? request.amount ?? request.unit_price ?? 0);

      const isMaTxn = Boolean(
        (request as any)?.source_portal === "m7a" ||
        (request as any)?.source_portal === "m&a" ||
        (request as any)?.source_portal === "m_and_a" ||
        (request as any)?.is_ma ||
        request.department?.toLowerCase().includes("m&a")
      );
      const effectivePm = purchase_order?.payment_method || (request as any)?.payment_method || (isMaTxn ? "WIRE" : undefined);

      setInvoiceItems(prefilledItems);
      setInvoice({
        vendor: defaultVendor,
        amount: defaultInvoiceAmount,
        invoice_date: new Date().toISOString().split("T")[0],
        due_date: "",
        gl_code: purchase_order?.gl_code || request.gl_code || "",
        bank_account: mapPaymentMethodToBankAccount(effectivePm, glCodes) || "",
        asset_flag: isDefaultAsset,
        department: "",
        from_location: "",
      });
      const defaultPoNum =
        purchase_order?.quote_number ||
        data?.purchase_order?.quote_number ||
        data?.request?.quote_data?.quote_number ||
        "";
      setInvoicePoNumber(defaultPoNum);
      setPendingFiles([]);
    }
    if (meta.form === "po") {
      const info = request.product_info;
      const isUsable = (v: string | undefined | null) => !!v && !!v.trim() && v.trim().toUpperCase() !== "N/A";
      const quoteVendor = request.quote_data?.vendor?.name;
      const quoteNum = request.quote_data?.quote_number;

      const rawItems = (request.items && request.items.length > 0)
        ? request.items
        : (request.quote_data?.items || request.quote_data?.line_items || []);

      const quoteCurr = (
        request.quote_data?.conversion?.original_currency ||
        request.quote_data?.currency ||
        (request.items && request.items[0]?.original_currency) ||
        request.currency ||
        "USD"
      ).toUpperCase();
      const quoteConv = request.quote_data?.conversion;
      const isForeign = Boolean(quoteConv?.is_converted) || (quoteCurr !== "USD");
      const fxRate = (isForeign && Number(quoteConv?.exchange_rate)) ? Number(quoteConv.exchange_rate) : 1.0;

      setPoItemCurrency(isForeign ? quoteCurr : "USD");
      setPoFxRate(fxRate);

      const parsedPoItems = rawItems.map((i: any, idx: number) => {
        const q = Number(i.quantity) || 1;
        const p = Number(i.original_unit_price ?? i.unit_price ?? 0);
        const t = Number(i.original_total ?? i.total ?? (Math.round(q * p * 100) / 100));
        return {
          id: i.id,
          sku: i.sku || "",
          description: i.description || `Part ${idx + 1}`,
          quantity: q,
          unit_price: p,
          total: t,
        };
      });
      setPoItems(parsedPoItems);

      const initShipping = Number(request.quote_data?.conversion?.original_shipping ?? request.quote_data?.totals?.shipping) || 0;
      setPoShippingFee(initShipping);

      const itemsSumNative = parsedPoItems.reduce((acc: number, it: any) => acc + (Number(it.total) || 0), 0);
      const isMultiReq = request.item_mode === "MULTIPLE" || parsedPoItems.length > 0;

      // Totals ALWAYS show USD. Foreign items sum and shipping immediately convert to USD:
      const totalNative = isMultiReq
        ? (itemsSumNative + initShipping)
        : (Number(request.quantity ?? 1) * Number(parsedPoItems[0]?.unit_price ?? request.unit_price ?? 0) + initShipping);

      const usdAmount = isForeign
        ? (request.amount && Math.abs(Number(request.amount) - (totalNative * fxRate)) < 1 ? Number(request.amount) : Math.round(totalNative * fxRate * 100) / 100)
        : Math.round(totalNative * 100) / 100;

      const singleUnitPrice = isMultiReq
        ? 0
        : (parsedPoItems[0]?.unit_price ? parsedPoItems[0].unit_price : (request.unit_price ?? 0));

      const isMaTxn = Boolean(
        (request as any)?.source_portal === "m7a" ||
        (request as any)?.source_portal === "m&a" ||
        (request as any)?.source_portal === "m_and_a" ||
        (request as any)?.is_ma ||
        request.department?.toLowerCase().includes("m&a")
      );

      setPo({
        vendor: purchase_order?.vendor || quoteVendor || (info && isUsable(info.vendor) ? info.vendor : ""),
        item: (isMultiReq ? (parsedPoItems.length ? `Multi Parts (${parsedPoItems.length} parts)` : (request.title || "Multi Parts")) : (request.title || (info && isUsable(info.name) ? info.name : ""))).slice(0, 200),
        quantity: isMultiReq ? (parsedPoItems.length || 1) : (request.quantity ?? 1),
        unit_price: singleUnitPrice,
        amount: usdAmount,
        quote_number: purchase_order?.quote_number || quoteNum || "",
        description: (info && isUsable(info.description) ? info.description : (request.description || "")),
        currency: "USD",
        payment_method: ((purchase_order?.payment_method || (request as any)?.payment_method) as PaymentMethod | undefined) || (isMaTxn ? "WIRE" : undefined),
        shipped_to_location: purchase_order?.shipped_to_location || (request as any)?.shipped_to_location || "",
        expected_delivery_date: purchase_order?.expected_delivery_date || "",
        item_url: purchase_order?.item_url || request.item_url || "",
      });

      // Quote has a foreign currency but no stored conversion rate: fetch a live rate so USD totals are correct
      if (isForeign && !Number(quoteConv?.exchange_rate)) {
        purchasingService.getExchangeRate(quoteCurr, "USD")
          .then((res: any) => {
            const rate = Number(res?.exchange_rate) || 1.0;
            setPoFxRate(rate);
            setPo((prev) => ({ ...prev, amount: Math.round(totalNative * rate * 100) / 100, currency: "USD" }));
          })
          .catch((err: any) => toast.error(`Failed to fetch exchange rate for ${quoteCurr}: ${err?.message || "Unknown error"}`));
      }
    }
    if (meta.form === "approval") {
      const effectiveAmount = Number(data?.request?.amount || data?.purchase_order?.amount || data?.invoice?.amount || 0);
      const isLevel1 = (data?.request?.current_approval_level || 1) === 1;
      // requires_second_level covers requests that cross $10k only once tax is added.
      const needsL2 = Boolean(data?.request?.requires_second_level) || effectiveAmount >= 10000;
      const defaultPassToL2 = action === "APPROVE" && isLevel1 && needsL2;
      setApproval({ approver: user?.id || "", comment: "", pass_to_level_2: defaultPassToL2 });
    }
    setConfirmGoods({ description: "" });
    setActiveForm({ action, kind: meta.form });
  };
  return { request, purchase_order, inv, approvals, available_actions, hasInvoiceOrReceipt, isMulti, multiPartsList, getItemGLCode, flow, dispatch, handleConfirmWire, onAction };
}
