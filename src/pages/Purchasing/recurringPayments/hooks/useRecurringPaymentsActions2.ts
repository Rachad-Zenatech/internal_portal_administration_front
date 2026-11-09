import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/services/apiClient";
import { type PurchaseRequest, type RequestDetail, type CustomScheduleDate } from "@/types/purchasing";
import { resolveUserDepartment } from "@/lib/userDepartment";
import { toast } from "sonner";
import { deletePurchaseRequest } from "@/services/purchasingService";
import { calculateInstallmentsCount, formatDateToIso, type FrequencyType } from "../../utils/recurringScheduleUtils";
import type { useRecurringPaymentsActions } from "./useRecurringPaymentsActions";

export function useRecurringPaymentsActions2(ctx: ReturnType<typeof useRecurringPaymentsActions>) {
  const { queryClient, navigate, routeRequestId, setEditingRequest, setIsEditOpen, setEditForm, rolesList, usersList, isLoading, requests, newForm, createMutation, editForm, editingRequest } = ctx;
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      return await apiClient.put<RequestDetail>(
        `/api/purchasing/requests/${id}`,
        payload
      );
    },
    onSuccess: (res) => {
      toast.success(`Recurring request #${res.request.id} updated successfully`);
      handleCloseEdit();
      queryClient.invalidateQueries({ queryKey: ["recurring-requests"] });
      queryClient.invalidateQueries({ queryKey: ["purchasing"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update recurring request");
    },
  });
  const [requestToDelete, setRequestToDelete] = useState<PurchaseRequest | null>(null);
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await deletePurchaseRequest(id);
    },
    onSuccess: () => {
      toast.success("Recurring payment deleted successfully");
      setRequestToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["recurring-requests"] });
      queryClient.invalidateQueries({ queryKey: ["purchasing"] });
      queryClient.invalidateQueries({ queryKey: ["purchasing", "requests"] });
      queryClient.invalidateQueries({ queryKey: ["purchasing-summary"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to delete recurring payment");
    },
  });
  const handleCloseEdit = () => {
    setIsEditOpen(false);
    setEditingRequest(null);
    if (routeRequestId) {
      navigate("/purchasing/recurring", { replace: true });
    }
  };
  const handleOpenEdit = (req: PurchaseRequest) => {
    setEditingRequest(req);
    let dept = req.department || "";
    if (!dept || dept === "General") {
      const matched = usersList.find(
        (u) =>
          (u.full_name && u.full_name.toLowerCase() === (req.requester || "").toLowerCase()) ||
          (u.email && u.email.toLowerCase() === (req.requester || "").toLowerCase())
      );
      if (matched) {
        dept = resolveUserDepartment(matched, rolesList);
      }
    }
    const sched = req.recurring_schedule;
    const isSched = Boolean(sched?.is_scheduled);
    let schedDates: CustomScheduleDate[] = [];
    if (sched?.schedule_dates && sched.schedule_dates.length > 0) {
      schedDates = sched.schedule_dates;
    } else if (sched?.custom_dates && sched.custom_dates.length > 0) {
      schedDates = sched.custom_dates.map((d: string, i: number) => ({
        date: d,
        amount: sched?.amount_per_cycle || req.amount,
        note: `Installment #${i + 1}`,
      }));
    } else if (isSched) {
      const baseDate = sched?.start_date ? sched.start_date.split("T")[0] : (req.due_date ? req.due_date.split("T")[0] : new Date().toISOString().split("T")[0]);
      const nextMonth = new Date(baseDate + "T00:00:00");
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const nextMonthIso = formatDateToIso(nextMonth);
      schedDates = [
        { date: baseDate, amount: req.amount || undefined, note: "Installment #1" },
        { date: nextMonthIso, amount: req.amount || undefined, note: "Installment #2" },
      ];
    }
    const reqLoc = (req as any).location || (req as any).from_location || req.quote_data?.location || req.quote_data?.shipped_to_location || "";
    const reqClass = (req as any).class || req.quote_data?.class || "";
    const rawDomain = String(
      sched?.payment_domain || req.quote_data?.payment_domain || ""
    ).toUpperCase().trim();
    const isApDomain =
      rawDomain === "AP" ||
      Boolean(sched?.is_ap || req.quote_data?.is_ap) ||
      String((req as any).category || req.request_type || "").toUpperCase() === "ACCOUNTS_PAYABLE" ||
      Boolean((req as any).wire_transfer);
    setEditForm({
      id: req.id,
      title: req.title || "",
      requester: req.requester || "",
      department: dept,
      class: reqClass,
      location: reqLoc,
      amount: req.amount ? req.amount.toString() : "",
      currency: (req.currency || "USD").toUpperCase(),
      due_date: req.due_date ? req.due_date.split("T")[0] : "",
      description: req.description || "",
      item_url: req.item_url || "",
      gl_code: req.gl_code || "",
      priority: req.priority || "MEDIUM",
      is_scheduled: isSched,
      payment_domain: isApDomain ? "AP" : "PURCHASE_REQUEST",
      frequency: (sched?.frequency as FrequencyType) || (isSched ? "CUSTOM" : "MONTHLY"),
      start_date: sched?.start_date ? sched.start_date.split("T")[0] : (schedDates[0]?.date || (req.due_date ? req.due_date.split("T")[0] : "")),
      end_date: sched?.end_date ? sched.end_date.split("T")[0] : (schedDates[schedDates.length - 1]?.date || ""),
      completed_installments: sched?.completed_installments || 0,
      schedule_dates: schedDates,
    });
    setIsEditOpen(true);
  };
  // Auto-open request when navigating to /purchasing/requests/:id
  useEffect(() => {
    if (!routeRequestId) return;
    const found = requests.find((r) => String(r.id) === String(routeRequestId));
    if (found) {
      handleOpenEdit(found);
    } else if (!isLoading) {
      apiClient
        .get<RequestDetail>(`/api/purchasing/requests/${routeRequestId}`)
        .then((res) => {
          if (res?.request) {
            handleOpenEdit(res.request);
          }
        })
        .catch((err) => {
          console.error("Failed to load request #" + routeRequestId, err);
        });
    }
  }, [routeRequestId, requests, isLoading]);
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!newForm.requester.trim()) {
      toast.error("Please select a requester");
      return;
    }
    if (!newForm.department.trim()) {
      toast.error("Please enter or select a department");
      return;
    }
    const isCustom = newForm.frequency === "CUSTOM";
    const customDates = isCustom ? newForm.schedule_dates : [];
    const isSched = Boolean(
      newForm.is_scheduled &&
      (isCustom ? customDates.length > 0 : newForm.start_date && newForm.end_date)
    );

    const customSum = isCustom ? customDates.reduce((acc, itm) => acc + (itm.amount != null ? itm.amount : 0), 0) : 0;
    let baseAmt = parseFloat(newForm.amount) || 0;

    if (isSched && isCustom) {
      if (customDates.length === 0) {
        toast.error("Please add at least one installment date");
        return;
      }
      if (customSum <= 0 && baseAmt <= 0) {
        toast.error("Please enter an amount for the installment dates (greater than 0.00)");
        return;
      }
    } else {
      if (baseAmt <= 0) {
        toast.error("Please enter a valid amount greater than 0.00");
        return;
      }
    }

    let totalCycles: number | null = null;
    let totalAmt: number | null = null;
    let amt = baseAmt;

    if (isSched) {
      if (isCustom) {
        totalCycles = customDates.length;
        totalAmt = customSum > 0 ? customSum : (baseAmt > 0 ? baseAmt * totalCycles : 0);
        const cycleAmt = customDates[0]?.amount != null && customDates[0].amount > 0
          ? customDates[0].amount
          : (baseAmt > 0 ? baseAmt : (totalCycles > 0 ? Math.round((totalAmt / totalCycles) * 100) / 100 : 0));
        const sanitizedDates = customDates.map((d, i) => ({
          date: d.date,
          amount: d.amount != null && d.amount > 0 ? d.amount : cycleAmt,
          interest: d.interest != null ? d.interest : null,
          principal_paid: d.principal_paid != null ? d.principal_paid : null,
          balance: d.balance != null ? d.balance : null,
          note: d.note || `Installment #${i + 1}`,
        }));

        const effectiveStartDate = sanitizedDates.length > 0 ? sanitizedDates[0].date : newForm.start_date;
        const effectiveEndDate = sanitizedDates.length > 0 ? sanitizedDates[sanitizedDates.length - 1].date : newForm.end_date;
        const effectiveDueDate = effectiveStartDate || newForm.due_date;

        createMutation.mutate({
          title: newForm.title,
          requester: newForm.requester,
          department: newForm.class || newForm.department,
          request_type: "SCHEDULED_PAYMENT",
          priority: newForm.priority,
          currency: (newForm.currency || "USD").toUpperCase(),
          amount: cycleAmt,
          unit_price: cycleAmt,
          quantity: 1,
          description: newForm.description,
          item_url: newForm.item_url?.trim() || null,
          gl_code: null,
          due_date: effectiveDueDate || null,
          quote_data: {
            location: newForm.location || "",
            class: newForm.class || "",
            department: newForm.department || "",
            payment_domain: newForm.payment_domain || "PURCHASE_REQUEST",
            is_ap: newForm.payment_domain === "AP",
          },
          recurring_schedule: {
            is_scheduled: true,
            payment_domain: newForm.payment_domain || "PURCHASE_REQUEST",
            is_ap: newForm.payment_domain === "AP",
            frequency: newForm.frequency,
            start_date: effectiveStartDate,
            end_date: effectiveEndDate,
            total_installments: totalCycles,
            completed_installments: 0,
            amount_per_cycle: cycleAmt,
            total_amount: totalAmt,
            custom_dates: sanitizedDates.map((d) => d.date),
            schedule_dates: sanitizedDates,
          },
        });
        return;
      } else {
        totalCycles = calculateInstallmentsCount(newForm.start_date, newForm.end_date, newForm.frequency);
        totalAmt = totalCycles ? Math.round(amt * totalCycles * 100) / 100 : null;
      }
    }

    const effectiveStartDate = isCustom && customDates.length > 0 ? customDates[0].date : newForm.start_date;
    const effectiveEndDate = isCustom && customDates.length > 0 ? customDates[customDates.length - 1].date : newForm.end_date;
    const effectiveDueDate = (isSched && effectiveStartDate) ? effectiveStartDate : newForm.due_date;

    createMutation.mutate({
      title: newForm.title,
      requester: newForm.requester,
      department: newForm.class || newForm.department,
      request_type: isSched ? "SCHEDULED_PAYMENT" : "RECURRING",
      priority: newForm.priority,
      currency: (newForm.currency || "USD").toUpperCase(),
      amount: amt,
      unit_price: amt,
      quantity: 1,
      description: newForm.description,
      item_url: newForm.item_url?.trim() || null,
      gl_code: null,
      due_date: effectiveDueDate || null,
      quote_data: {
        location: newForm.location || "",
        class: newForm.class || "",
        department: newForm.department || "",
        payment_domain: newForm.payment_domain || "PURCHASE_REQUEST",
        is_ap: newForm.payment_domain === "AP",
      },
      recurring_schedule: isSched
        ? {
            is_scheduled: true,
            payment_domain: newForm.payment_domain || "PURCHASE_REQUEST",
            is_ap: newForm.payment_domain === "AP",
            frequency: newForm.frequency,
            start_date: effectiveStartDate,
            end_date: effectiveEndDate,
            total_installments: totalCycles,
            completed_installments: 0,
            amount_per_cycle: totalCycles && totalCycles > 0 ? Math.round((totalAmt! / totalCycles) * 100) / 100 : amt,
            total_amount: totalAmt,
            custom_dates: isCustom ? customDates.map((d) => d.date) : null,
            schedule_dates: isCustom ? customDates : null,
          }
        : {
            is_scheduled: false,
            payment_domain: newForm.payment_domain || "PURCHASE_REQUEST",
            is_ap: newForm.payment_domain === "AP",
            frequency: newForm.frequency || "MONTHLY",
            start_date: newForm.due_date || newForm.start_date || new Date().toISOString().split("T")[0],
            end_date: null,
            total_installments: null,
            completed_installments: 0,
            amount_per_cycle: amt,
            total_amount: null,
          },
    });
  };
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!editForm.requester.trim()) {
      toast.error("Please select a requester");
      return;
    }
    if (!editForm.department.trim()) {
      toast.error("Please enter or select a department");
      return;
    }

    const isCustom = editForm.frequency === "CUSTOM";
    const customDates = isCustom ? editForm.schedule_dates : [];
    const isSched = Boolean(
      editForm.is_scheduled &&
      (isCustom ? customDates.length > 0 : editForm.start_date && editForm.end_date)
    );

    const customSum = isCustom ? customDates.reduce((acc, itm) => acc + (itm.amount != null ? itm.amount : 0), 0) : 0;
    let baseAmt = parseFloat(editForm.amount) || 0;

    if (isSched && isCustom) {
      if (customDates.length === 0) {
        toast.error("Please add at least one installment date");
        return;
      }
      if (customSum <= 0 && baseAmt <= 0) {
        toast.error("Please enter an amount for the installment dates (greater than 0.00)");
        return;
      }
    } else {
      if (baseAmt <= 0) {
        toast.error("Please enter a valid amount greater than 0.00");
        return;
      }
    }

    let totalCycles: number | null = null;
    let totalAmt: number | null = null;
    let amt = baseAmt;

    if (isSched) {
      if (isCustom) {
        totalCycles = customDates.length;
        totalAmt = customSum > 0 ? customSum : (baseAmt > 0 ? baseAmt * totalCycles : 0);
        const completedCount = editForm.completed_installments || 0;
        const activeCycleDate = customDates[completedCount] || customDates[0];
        const cycleAmt = activeCycleDate?.amount != null && activeCycleDate.amount > 0
          ? activeCycleDate.amount
          : (baseAmt > 0 ? baseAmt : (totalCycles > 0 ? Math.round((totalAmt / totalCycles) * 100) / 100 : 0));
        const sanitizedDates = customDates.map((d, i) => ({
          date: d.date,
          amount: d.amount != null && d.amount > 0 ? d.amount : cycleAmt,
          interest: d.interest != null ? d.interest : null,
          principal_paid: d.principal_paid != null ? d.principal_paid : null,
          balance: d.balance != null ? d.balance : null,
          note: d.note || `Installment #${i + 1}`,
        }));

        const effectiveStartDate = sanitizedDates.length > 0 ? sanitizedDates[0].date : editForm.start_date;
        const effectiveEndDate = sanitizedDates.length > 0 ? sanitizedDates[sanitizedDates.length - 1].date : editForm.end_date;
        const effectiveDueDate = effectiveStartDate || editForm.due_date;

        updateMutation.mutate({
          id: editForm.id,
          payload: {
            title: editForm.title,
            requester: editForm.requester,
            department: editForm.class || editForm.department,
            priority: editForm.priority,
            currency: (editForm.currency || "USD").toUpperCase(),
            amount: cycleAmt,
            unit_price: cycleAmt,
            quantity: 1,
            description: editForm.description,
            item_url: editForm.item_url !== undefined ? (editForm.item_url.trim() || null) : (editingRequest?.item_url || null),
            gl_code: editingRequest?.gl_code || editForm.gl_code || null,
            due_date: effectiveDueDate || null,
            quote_data: {
              ...(editingRequest?.quote_data || {}),
              location: editForm.location || "",
              class: editForm.class || "",
              department: editForm.department || "",
              payment_domain: editForm.payment_domain || "PURCHASE_REQUEST",
              is_ap: editForm.payment_domain === "AP",
            },
            recurring_schedule: {
              is_scheduled: true,
              payment_domain: editForm.payment_domain || "PURCHASE_REQUEST",
              is_ap: editForm.payment_domain === "AP",
              frequency: editForm.frequency,
              start_date: effectiveStartDate,
              end_date: effectiveEndDate,
              total_installments: totalCycles,
              completed_installments: editForm.completed_installments || 0,
              amount_per_cycle: cycleAmt,
              total_amount: totalAmt,
              custom_dates: sanitizedDates.map((d) => d.date),
              schedule_dates: sanitizedDates,
            },
          },
        });
        return;
      } else {
        totalCycles = calculateInstallmentsCount(editForm.start_date, editForm.end_date, editForm.frequency);
        totalAmt = totalCycles ? Math.round(amt * totalCycles * 100) / 100 : null;
      }
    }

    const effectiveStartDate = isCustom && customDates.length > 0 ? customDates[0].date : editForm.start_date;
    const effectiveEndDate = isCustom && customDates.length > 0 ? customDates[customDates.length - 1].date : editForm.end_date;
    const effectiveDueDate = (isSched && effectiveStartDate) ? effectiveStartDate : editForm.due_date;

    updateMutation.mutate({
      id: editForm.id,
      payload: {
        title: editForm.title,
        requester: editForm.requester,
        department: editForm.class || editForm.department,
        priority: editForm.priority,
        currency: (editForm.currency || "USD").toUpperCase(),
        amount: amt,
        unit_price: amt,
        quantity: 1,
        description: editForm.description,
        item_url: editForm.item_url !== undefined ? (editForm.item_url.trim() || null) : (editingRequest?.item_url || null),
        gl_code: editingRequest?.gl_code || editForm.gl_code || null,
        due_date: effectiveDueDate || null,
        quote_data: {
          ...(editingRequest?.quote_data || {}),
          location: editForm.location || "",
          class: editForm.class || "",
          department: editForm.department || "",
          payment_domain: editForm.payment_domain || "PURCHASE_REQUEST",
          is_ap: editForm.payment_domain === "AP",
        },
        recurring_schedule: isSched
          ? {
              is_scheduled: true,
              payment_domain: editForm.payment_domain || "PURCHASE_REQUEST",
              is_ap: editForm.payment_domain === "AP",
              frequency: editForm.frequency,
              start_date: effectiveStartDate,
              end_date: effectiveEndDate,
              total_installments: totalCycles,
              completed_installments: editForm.completed_installments || 0,
              amount_per_cycle: totalCycles && totalCycles > 0 ? Math.round((totalAmt! / totalCycles) * 100) / 100 : amt,
              total_amount: totalAmt,
              custom_dates: isCustom ? customDates.map((d) => d.date) : null,
              schedule_dates: isCustom ? customDates : null,
            }
          : {
              is_scheduled: false,
              payment_domain: editForm.payment_domain || "PURCHASE_REQUEST",
              is_ap: editForm.payment_domain === "AP",
              frequency: editForm.frequency || "MONTHLY",
              start_date: editForm.start_date || editForm.due_date || new Date().toISOString().split("T")[0],
              end_date: null,
              total_installments: null,
              completed_installments: editForm.completed_installments || 0,
              amount_per_cycle: amt,
              total_amount: null,
            },
      },
    });
  };
  return { updateMutation, requestToDelete, setRequestToDelete, deleteMutation, handleCloseEdit, handleOpenEdit, handleCreateSubmit, handleEditSubmit };
}
