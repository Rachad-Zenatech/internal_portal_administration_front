import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { arQuoteService } from "../../../../../services/arQuoteService";
import type { QuoteDetailDrawerProps } from "../types";

export function useQuoteDetailDrawerData(props: QuoteDetailDrawerProps) {
  const { quote, isOpen, onClose } = props;
  const queryClient = useQueryClient();
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  // Record Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number | string>("");
  const [paymentMethod, setPaymentMethod] = useState("WIRE");
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  // Fetch Audit Logs for this quote
  const { data: auditLogs = [] } = useQuery({
    queryKey: ["ar-quote-audit", quote?.id],
    queryFn: () => (quote ? arQuoteService.getAuditLogs(quote.id) : []),
    enabled: isOpen && !!quote,
  });
  // Publish Mutation
  const publishMutation = useMutation({
    mutationFn: (id: string) => arQuoteService.publishQuote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ar-quotes"] });
      queryClient.invalidateQueries({ queryKey: ["ar-quote-summary"] });
    },
  });
  // Move to Draft Mutation
  const draftMutation = useMutation({
    mutationFn: (id: string) => arQuoteService.moveQuoteToDraft(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ar-quotes"] });
      queryClient.invalidateQueries({ queryKey: ["ar-quote-summary"] });
    },
  });
  // Revoke Links Mutation
  const revokeLinksMutation = useMutation({
    mutationFn: (id: string) => arQuoteService.revokeCustomerLink(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ar-quotes"] });
    },
  });
  // Convert to Invoice Mutation
  const convertInvoiceMutation = useMutation({
    mutationFn: (id: string) => arQuoteService.convertToInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ar-quotes"] });
      queryClient.invalidateQueries({ queryKey: ["ar-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["ar-quote-summary"] });
    },
  });
  // Create Revision Mutation
  const revisionMutation = useMutation({
    mutationFn: (id: string) => arQuoteService.createRevision(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ar-quotes"] });
    },
  });
  // Delete Draft Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => arQuoteService.deleteQuote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ar-quotes"] });
      queryClient.invalidateQueries({ queryKey: ["ar-quote-summary"] });
      onClose();
    },
    onError: (err: any) => {
      alert(`Failed to delete draft quote: ${err.message || err}`);
    },
  });
  // Record Payment Submit
  const handleRecordPayment = async () => {
    if (!quote || Number(paymentAmount) <= 0) return;
    setPaymentSubmitting(true);
    try {
      await arQuoteService.recordPayment(quote.id, {
        amount: Number(paymentAmount),
        payment_method: paymentMethod,
        reference_number: paymentRef,
        notes: paymentNotes,
      });
      queryClient.invalidateQueries({ queryKey: ["ar-quotes"] });
      queryClient.invalidateQueries({ queryKey: ["ar-quote-summary"] });
      setIsPaymentModalOpen(false);
      setPaymentAmount("");
      setPaymentRef("");
      setPaymentNotes("");
    } catch (err: any) {
      alert("Failed to record payment: " + err.message);
    } finally {
      setPaymentSubmitting(false);
    }
  };
  const handleCopyLink = async () => {
    if (!quote) return;
    try {
      const res = await arQuoteService.generateCustomerLink(
        quote.id,
        quote.customer_email || "client@example.com",
        quote.customer_name
      );
      await navigator.clipboard.writeText(res.full_url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
      queryClient.invalidateQueries({ queryKey: ["ar-quotes"] });
    } catch (err: any) {
      alert("Failed to generate link: " + err.message);
    }
  };
  return { isSendModalOpen, setIsSendModalOpen, copiedLink, isPaymentModalOpen, setIsPaymentModalOpen, paymentAmount, setPaymentAmount, paymentMethod, setPaymentMethod, paymentRef, setPaymentRef, paymentNotes, setPaymentNotes, paymentSubmitting, auditLogs, publishMutation, draftMutation, revokeLinksMutation, convertInvoiceMutation, revisionMutation, deleteMutation, handleRecordPayment, handleCopyLink };
}
