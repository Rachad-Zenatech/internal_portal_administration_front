import { useState, useMemo } from "react";
import { toast } from "sonner";
import { postRequestMessage, updateRequest } from "@/services/purchasingService";
import { useBusinessContacts } from "@/hooks/useBusinessContact";
import { RequestStatus } from "@/types/purchasing";
import { formatDate, formatDateMmDdYyyy } from "../../../utils/purchasingMeta";
import type { RequestDetailViewState } from "../../hooks/useRequestDetailTail";
import type { MatchComponentState, ComponentDetails, ThreeWayMatchSummary } from "./types";

export function useThreeWayMatching(v: RequestDetailViewState) {
  const { request, purchase_order, inv, data, dispatch, onAction, refetch, transition } = v;
  const [isRoutingToDept, setIsRoutingToDept] = useState(false);
  const [isRoutingToPayment, setIsRoutingToPayment] = useState(false);
  const [isSavingPoNumber, setIsSavingPoNumber] = useState(false);
  const [overrides, setOverrides] = useState<{ po?: boolean; receipt?: boolean; invoice?: boolean }>({});
  const { data: apContactsData } = useBusinessContacts(undefined, "ap");

  // 1. Component 1: Approved PO
  const poComponent: ComponentDetails = useMemo(() => {
    const hasPo = Boolean(
      purchase_order ||
      request.quote_data?.po_number ||
      (request.items && request.items.length > 0) ||
      request.status === RequestStatus.Approved ||
      request.status === RequestStatus.GoodsReceived ||
      request.status === RequestStatus.InvoiceReceived ||
      request.status === RequestStatus.WaitingPayment ||
      request.status === RequestStatus.Completed ||
      request.level_1_approved_at
    );

    const isPoApproved = Boolean(
      purchase_order?.approval_status === "APPROVED" ||
      request.level_1_approved_at ||
      request.status === RequestStatus.Approved ||
      request.status === RequestStatus.GoodsReceived ||
      request.status === RequestStatus.InvoiceReceived ||
      request.status === RequestStatus.WaitingPayment ||
      request.status === RequestStatus.Completed
    );

    const poNumber = request.quote_data?.po_number || purchase_order?.id || `PO-${request.id}`;
    const poAmount = Number(purchase_order?.amount ?? request.amount ?? 0);
    const invoiceAmount = Number(inv?.amount ?? data?.wire_transfer?.amount ?? request.amount ?? 0);

    let state: MatchComponentState = "MISSING";
    let stateLabel = "PO Missing / Unapproved";

    if (overrides.po !== undefined) {
      state = overrides.po ? "PRESENT" : "MISSING";
      stateLabel = overrides.po ? "Approved PO Verified" : "PO Marked Pending / Unapproved";
    } else if (hasPo && isPoApproved) {
      if (invoiceAmount > 0 && poAmount > 0 && Math.abs(poAmount - invoiceAmount) > 0.01) {
        state = "MISMATCHED";
        stateLabel = "Amount Mismatch with Invoice";
      } else {
        state = "PRESENT";
        stateLabel = "Approved PO Verified";
      }
    }

    return {
      title: "1. Approved Purchase Order (PO)",
      subtitle: "Verified purchasing terms & authorized commitment",
      state,
      stateLabel,
      primaryInfo: hasPo ? `PO #${poNumber}` : "No PO Generated",
      secondaryInfo: hasPo ? `Vendor: ${purchase_order?.vendor || request.title}` : undefined,
      amount: poAmount,
      currency: purchase_order?.currency || request.currency || "USD",
      date: purchase_order?.created_at ? formatDate(purchase_order.created_at) : (request.level_1_approved_at ? formatDate(request.level_1_approved_at) : undefined),
      actor: request.level_1_approver_name || (isPoApproved ? "Authorized Approver" : undefined),
      department: request.department,
    };
  }, [purchase_order, request, inv, data?.wire_transfer]);

  // 2. Component 2: Goods receipt or department confirmation that services were completed
  const receiptComponent: ComponentDetails = useMemo(() => {
    const isConfirmed = Boolean(
      purchase_order?.goods_received ||
      request.status === RequestStatus.GoodsReceived ||
      request.status === RequestStatus.InvoiceReceived ||
      request.status === RequestStatus.WaitingPayment ||
      request.status === RequestStatus.Completed ||
      purchase_order?.goods_received_at
    );

    const confirmedAt = purchase_order?.goods_received_at ? formatDate(purchase_order.goods_received_at) : undefined;
    const confirmedBy = purchase_order?.goods_received_by || (isConfirmed ? (request.requester || "Department Manager") : undefined);

    let state: MatchComponentState = "MISSING";
    let stateLabel = "Pending Dept Confirmation";

    if (overrides.receipt !== undefined) {
      state = overrides.receipt ? "PRESENT" : "MISSING";
      stateLabel = overrides.receipt ? "Services / Goods Confirmed (Manual)" : "Pending Dept Confirmation";
    } else if (isConfirmed) {
      state = "PRESENT";
      stateLabel = "Services / Goods Confirmed";
    }

    return {
      title: "2. Goods Receipt / Service Confirmation",
      subtitle: `Department confirmation that services/goods completed`,
      state,
      stateLabel,
      primaryInfo: isConfirmed ? "Services / Goods Delivery Confirmed" : `Awaiting confirmation from ${request.department}`,
      secondaryInfo: `Requesting Department: ${request.department} (${request.requester})`,
      date: confirmedAt,
      actor: confirmedBy,
      department: request.department,
      notes: purchase_order?.goods_received_note || undefined,
    };
  }, [purchase_order, request]);

  // 3. Component 3: Vendor invoice
  const invoiceComponent: ComponentDetails = useMemo(() => {
    const invoiceNumber = inv?.id || data?.wire_transfer?.invoice_number || "";
    const hasInvoice = Boolean(
      inv ||
      (data?.invoices && data.invoices.length > 0) ||
      (data?.wire_transfer?.invoice_number && data.wire_transfer.invoice_number.trim() !== "") ||
      (data?.attachments && data.attachments.length > 0) ||
      request.status === RequestStatus.InvoiceReceived ||
      request.status === RequestStatus.WaitingPayment ||
      request.status === RequestStatus.Completed
    );

    const invAmount = Number(inv?.amount ?? data?.wire_transfer?.amount ?? request.amount ?? 0);
    const poAmount = Number(purchase_order?.amount ?? request.amount ?? 0);

    let state: MatchComponentState = "MISSING";
    let stateLabel = "Vendor Invoice Missing";

    if (overrides.invoice !== undefined) {
      state = overrides.invoice ? "PRESENT" : "MISSING";
      stateLabel = overrides.invoice ? "Vendor Invoice Matched (Manual)" : "Vendor Invoice Missing";
    } else if (hasInvoice) {
      if (poAmount > 0 && invAmount > 0 && Math.abs(poAmount - invAmount) > 0.01) {
        state = "MISMATCHED";
        stateLabel = "Invoice Total Variance";
      } else {
        state = "PRESENT";
        stateLabel = "Vendor Invoice Matched";
      }
    }

    const vendorName = (inv?.vendor || data?.wire_transfer?.vendor || purchase_order?.vendor || request.title || "").trim();
    const matchedContact = (apContactsData?.items || []).find((c) => {
      const target = vendorName.toLowerCase();
      return Boolean(target) && (
        (c.display_name || "").trim().toLowerCase() === target ||
        (c.full_name || "").trim().toLowerCase() === target
      );
    });
    const rawDueDate = inv?.due_date || data?.wire_transfer?.due_date || request.due_date;

    return {
      title: "3. Vendor Invoice",
      subtitle: "Supplier billing statement & remittance details",
      state,
      stateLabel,
      primaryInfo: invoiceNumber ? `Invoice #${invoiceNumber}` : (hasInvoice ? "Bill / Receipt Attached" : "Awaiting Vendor Bill"),
      secondaryInfo: `Vendor: ${vendorName}`,
      amount: invAmount,
      currency: inv?.currency || data?.wire_transfer?.currency || request.currency || "USD",
      date: rawDueDate ? formatDateMmDdYyyy(rawDueDate) : undefined,
      dateLabel: "Due Date",
      paymentTerms: matchedContact?.payment_terms || undefined,
    };
  }, [inv, data?.invoices, data?.wire_transfer, data?.attachments, request, purchase_order, apContactsData?.items, overrides.invoice]);

  // Overall match status
  const summary: ThreeWayMatchSummary = useMemo(() => {
    const components = [poComponent, receiptComponent, invoiceComponent];
    const readyCount = components.filter((c) => c.state === "PRESENT").length;
    const missingCount = components.filter((c) => c.state === "MISSING").length;
    const mismatchedCount = components.filter((c) => c.state === "MISMATCHED").length;
    const hasMismatch = mismatchedCount > 0;
    const isFullyMatched = readyCount === 3;
    const isPaymentReadyQueue = request.status === RequestStatus.WaitingPayment;

    let overallStatus: "FULLY_MATCHED" | "INCOMPLETE" | "MISMATCHED" = "INCOMPLETE";
    let statusText = `${readyCount} of 3 Ready`;

    if (hasMismatch) {
      overallStatus = "MISMATCHED";
      statusText = readyCount === 2
        ? "2 Parts Right, 1 Discrepancy"
        : `${readyCount} of 3 Ready (${mismatchedCount} Discrepancy)`;
    } else if (isFullyMatched) {
      overallStatus = "FULLY_MATCHED";
      statusText = "3 of 3 Ready (Fully Matched)";
    } else if (readyCount === 2) {
      statusText = "2 Parts Right, 1 Pending";
    } else if (readyCount === 1) {
      statusText = "1 Part Ready, 2 Not Ready";
    } else {
      statusText = "0 of 3 Ready (All Pending)";
    }

    return {
      po: poComponent,
      receipt: receiptComponent,
      invoice: invoiceComponent,
      overallStatus,
      readyCount,
      missingCount,
      mismatchedCount,
      statusText,
      isPaymentReadyQueue,
    };
  }, [poComponent, receiptComponent, invoiceComponent, request.status]);

  const togglePo = () => {
    const next = poComponent.state !== "PRESENT";
    setOverrides((prev) => ({ ...prev, po: next }));
    toast.info(next ? "PO component marked as Verified" : "PO component marked as Pending");
  };

  const toggleReceipt = () => {
    const next = receiptComponent.state !== "PRESENT";
    setOverrides((prev) => ({ ...prev, receipt: next }));
    toast.info(next ? "Receipt/Services marked as Confirmed" : "Receipt/Services marked as Pending");
  };

  const toggleInvoice = () => {
    const next = invoiceComponent.state !== "PRESENT";
    setOverrides((prev) => ({ ...prev, invoice: next }));
    toast.info(next ? "Vendor Invoice marked as Matched" : "Vendor Invoice marked as Pending");
  };

  // Action: Route receipt / service confirmation to requesting department
  const handleRouteToDepartment = async () => {
    setIsRoutingToDept(true);
    try {
      await postRequestMessage(String(request.id), {
        message_text: `[3-Way Match Verification] Receipt of goods or department confirmation that services were completed is requested from ${request.department} (${request.requester}). Please verify completion so AP can finalize matching for invoice payment.`,
        message_type: "REQUEST_INFO",
        notify_email: true,
      });
      toast.success(`Service confirmation request routed to ${request.department} (${request.requester}).`);
      refetch?.();
    } catch (err) {
      toast.error((err as Error).message || "Failed to route confirmation to department");
    } finally {
      setIsRoutingToDept(false);
    }
  };

  // Action: Confirm goods / services directly
  const handleConfirmReceipt = () => {
    onAction("CONFIRM_GOODS_RECEIVED");
  };

  // Action: Route fully matched item to payment-ready queue (Waiting Payment)
  const handleRouteToPaymentQueue = async () => {
    setIsRoutingToPayment(true);
    try {
      const ok = await dispatch({ action: "SEND_TO_AP" });
      if (ok) {
        toast.success(`Request #${request.id} routed to Payment-Ready Queue (Waiting Payment).`);
        refetch?.();
      }
    } catch (err) {
      toast.error((err as Error).message || "Failed to route to payment queue");
    } finally {
      setIsRoutingToPayment(false);
    }
  };

  // Action: Save / insert generated or custom PO number onto request
  const handleSavePoNumber = async (poNumber: string): Promise<boolean> => {
    setIsSavingPoNumber(true);
    try {
      await updateRequest(String(request.id), {
        quote_data: { ...(request.quote_data || {}), po_number: poNumber },
      });
      toast.success(`PO number updated to ${poNumber}.`);
      refetch?.();
      return true;
    } catch (err) {
      toast.error((err as Error).message || "Failed to save PO number");
      return false;
    } finally {
      setIsSavingPoNumber(false);
    }
  };

  return {
    summary,
    currentPoNumber: request.quote_data?.po_number || purchase_order?.id || "",
    isSavingPoNumber,
    handleSavePoNumber,
    togglePo,
    toggleReceipt,
    toggleInvoice,
    handleRouteToDepartment,
    handleConfirmReceipt,
    handleRouteToPaymentQueue,
    isRoutingToDept,
    isRoutingToPayment,
    isTransitionPending: transition.isPending,
  };
}
