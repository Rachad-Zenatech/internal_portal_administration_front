import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { resolveUserDepartment } from "@/lib/userDepartment";
import { useRolesList, useUsersList } from "@/hooks/usePurchasing";
import { createRequest, getPreviousWirePayments, transitionRequest, uploadAttachments } from "@/services/purchasingService";
import type { PreviousWirePayment, RequestCreateInput, WireTransferInput } from "@/types/purchasing";
import { EMPTY_FORM, EMPTY_WIRE_FORM } from "../../purchaseRequests/constants";
import { isRecurringWireCategory } from "../../utils/purchasingMeta";

const todayIso = () => new Date().toISOString().split("T")[0];

/** Same day of the next month ("2026-03-31" -> "2026-04-30"), for the due date of the next rent/note payment. */
export function addOneMonth(iso: string | null | undefined): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return "";
  const lastDay = new Date(y, m + 1, 0).getDate();
  const next = new Date(y, m, Math.min(d, lastDay));
  const mm = String(next.getMonth() + 1).padStart(2, "0");
  const dd = String(next.getDate()).padStart(2, "0");
  return `${next.getFullYear()}-${mm}-${dd}`;
}

/** Open the dialog already filled from an earlier Rent/Note payment ("Create next payment"). */
export type WirePrefill = { requestId: number; category: string };

export function useCreateWireTransfer(open: boolean, onOpenChange: (open: boolean) => void, onCreated?: () => void, prefill?: WirePrefill | null) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, roles } = useAuth();
  const { data: usersList = [] } = useUsersList();
  const { data: rolesList = [] } = useRolesList();

  const [wire, setWire] = useState<WireTransferInput>({ ...EMPTY_WIRE_FORM });
  const [title, setTitle] = useState("");
  const [requester, setRequester] = useState("");
  const [department, setDepartment] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [selectedPrevious, setSelectedPrevious] = useState<PreviousWirePayment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const prefillApplied = useRef(false);

  const category = wire.category || "Others";
  const isRecurring = isRecurringWireCategory(category);

  // previous payments of Rent / Note series, used to pre-fill the next one
  const previousQuery = useQuery({
    queryKey: ["wire-previous-payments", category],
    queryFn: () => getPreviousWirePayments(category),
    enabled: open && isRecurring,
    staleTime: 30 * 1000,
  });
  const previousPayments = useMemo(() => previousQuery.data?.items ?? [], [previousQuery.data]);

  // fresh form every time the dialog opens
  useEffect(() => {
    if (!open) return;
    const name = user?.full_name || user?.email || "";
    const matched = usersList.find(
      (u) => (u.full_name && u.full_name.toLowerCase() === name.toLowerCase().trim()) || (u.email && u.email.toLowerCase() === name.toLowerCase().trim()) || (user?.id && u.id === user.id),
    );
    const effectiveRoles = rolesList.length > 0 ? rolesList : roles;
    const dept = matched
      ? resolveUserDepartment(matched, effectiveRoles)
      : resolveUserDepartment({ ...user, roles }, effectiveRoles) || (user?.department && String(user.department).toUpperCase() !== "REQUESTER" ? user.department : "") || "";
    prefillApplied.current = false;
    setWire({ ...EMPTY_WIRE_FORM, category: prefill?.category || EMPTY_WIRE_FORM.category, entry_date: todayIso(), payment_date: todayIso() });
    setTitle("");
    setRequester(name);
    setDepartment(dept || "");
    setFile(null);
    setSelectedPrevious(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // switching the payment type drops a template that belongs to another type
  useEffect(() => {
    if (selectedPrevious && selectedPrevious.category !== category) setSelectedPrevious(null);
  }, [category, selectedPrevious]);

  /** Use the latest payment of a series as the template: bank details and vendor come along, dates/invoice start blank. */
  const applyPrevious = useCallback((p: PreviousWirePayment) => {
    setSelectedPrevious(p);
    setWire({
      ...EMPTY_WIRE_FORM,
      ...p.wire,
      category: p.category,
      entry_date: todayIso(),
      payment_date: todayIso(),
      due_date: addOneMonth(p.last_due_date),
      amount: p.amount ?? undefined,
      currency: p.currency || "USD",
      vendor: p.vendor,
      invoice_number: "",
      comments: "",
    });
    setTitle(p.title || `Payment for ${p.vendor}`);
    if (p.department) setDepartment(p.department);
  }, []);

  // "Create next payment": once the series is loaded, fill the form from the payment it was started from
  useEffect(() => {
    if (!open || !prefill || prefillApplied.current || previousQuery.isLoading) return;
    const source = previousPayments.find((p) => p.request_id === prefill.requestId);
    if (source) {
      prefillApplied.current = true;
      applyPrevious(source);
    }
  }, [open, prefill, previousPayments, previousQuery.isLoading, applyPrevious]);

  const clearPrevious = () => {
    setSelectedPrevious(null);
    setWire({ ...EMPTY_WIRE_FORM, category, entry_date: todayIso(), payment_date: todayIso() });
    setTitle("");
  };

  /** mode "draft": save as Draft. mode "submit": save and submit into the workflow right away. */
  const submit = async (mode: "draft" | "submit") => {
    const effectiveTitle = title.trim() || (wire.vendor ? `Payment for ${wire.vendor}${wire.invoice_number ? ` - Inv #${wire.invoice_number}` : ""}` : "");
    if (!effectiveTitle || !requester.trim() || !department.trim()) {
      toast.error("Title, requester and department are required.");
      return;
    }
    if (!wire.vendor?.trim() || !wire.amount || Number(wire.amount) <= 0 || !wire.pay_from?.trim()) {
      toast.error("Please fill in all required wire transfer fields (Vendor, Amount, Pay From).");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: RequestCreateInput = {
        ...EMPTY_FORM,
        title: effectiveTitle,
        requester: requester.trim(),
        department: department.trim(),
        request_type: "ACCOUNTS_PAYABLE",
        item_mode: "SINGLE",
        amount: Number(wire.amount) || 0,
        currency: wire.currency || "USD",
        due_date: wire.due_date || undefined,
        wire_transfer: { ...wire, amount: Number(wire.amount) || 0, vendor: wire.vendor || effectiveTitle },
      };
      const detail = await createRequest(payload);
      const id = detail.request.id;
      if (file) {
        try {
          await uploadAttachments(String(id), [file]);
        } catch (attErr) {
          console.error("Failed to upload wire attachment:", attErr);
          toast.error("Wire transfer created, but the attachment failed to upload.");
        }
      }
      if (mode === "submit") {
        try {
          await transitionRequest(String(id), { action: "SUBMIT_REQUEST" });
        } catch (subErr) {
          toast.error(`Saved as a draft, but it could not be submitted: ${(subErr as Error).message || "unknown error"}`);
          onCreated?.();
          onOpenChange(false);
          return;
        }
      }
      queryClient.invalidateQueries({ queryKey: ["purchasing"] });
      queryClient.invalidateQueries({ queryKey: ["wire-previous-payments"] });
      toast.success(mode === "submit" ? `Wire transfer #${id} submitted` : `Wire transfer #${id} saved as a draft`, {
        action: { label: "View", onClick: () => navigate(`/purchasing/requests/${id}`) },
      });
      onCreated?.();
      onOpenChange(false);
    } catch (err) {
      toast.error((err as Error).message || "Failed to create the wire transfer");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    wire, setWire, title, setTitle, requester, setRequester, department, setDepartment, file, setFile, fileInputRef,
    category, isRecurring, previousPayments, isLoadingPrevious: previousQuery.isLoading, selectedPrevious,
    applyPrevious, clearPrevious, isSubmitting, submit,
  };
}
