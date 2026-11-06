import { apiClient as api } from "@/services/apiClient";
import { toast } from "sonner";
import { SPEND_FLOW, ADMIN_FLOW, RECURRING_FLOW, QUOTE_FLOW, resolveTaxRate } from "@/pages/Purchasing/utils/purchasingMeta";
import type { TaskDetailPanelGuardedState } from "./useTaskDetailPanel";

export function useTaskDetailPanelActions(ctx: TaskDetailPanelGuardedState) {
  const { setIsDragging, setNote, note, setEditNoteText, setEditingNoteId, editNoteText, setDeleteNoteId, deleteNoteId, task, onUpdate, onClose } = ctx;
  // Parse product info if JSON string
  let parsedProductInfo: any = null;
  if (task.product_info) {
    if (typeof task.product_info === "object") {
      parsedProductInfo = task.product_info;
    } else if (typeof task.product_info === "string") {
      try {
        parsedProductInfo = JSON.parse(task.product_info);
      } catch (e) {
        parsedProductInfo = null;
      }
    }
  }
  // Parse quote data if JSON string
  let parsedQuoteData: any = null;
  if (task.quote_data) {
    if (typeof task.quote_data === "object") {
      parsedQuoteData = task.quote_data;
    } else if (typeof task.quote_data === "string") {
      try {
        parsedQuoteData = JSON.parse(task.quote_data);
      } catch (e) {
        parsedQuoteData = null;
      }
    }
  }
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const formData = new FormData();
      formData.append("file", file);

      try {
        await api.post(`/tasks/${task.id}/notes/upload`, formData);
        toast.success(`Attached file: ${file.name}`);
        onUpdate();
      } catch (err: any) {
        toast.error(err.message || "Failed to upload file");
      }
    }
  };
  const handleAddNote = async () => {
    if (!note.trim()) return;
    try {
      await api.post<any>(`/tasks/${task.id}/notes`, { note_text: note });
      setNote("");
      toast.success("Note added successfully");
      onUpdate();
    } catch (e: any) {
      console.error("Failed to add note", e);
      toast.error(e.message || "Failed to add note");
    }
  };
  const handleEditNote = async (noteId: number) => {
    if (!editNoteText.trim()) return;
    try {
      await api.put(`/tasks/${task.id}/notes/${noteId}`, { note_text: editNoteText });
      toast.success("Note updated");
      setEditingNoteId(null);
      setEditNoteText("");
      onUpdate();
    } catch (e: any) {
      toast.error(e.message || "Failed to update note");
    }
  };
  const handleDeleteNote = (noteId: number) => {
    setDeleteNoteId(noteId);
  };
  const confirmDeleteNote = async () => {
    if (deleteNoteId === null) return;
    try {
      await api.delete(`/tasks/${task.id}/notes/${deleteNoteId}`);
      toast.success("Note deleted");
      onUpdate();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete note");
    } finally {
      setDeleteNoteId(null);
    }
  };
  const handleApprove = async () => {
    try {
      await api.post<any>(`/tasks/${task.id}/approve`, { action: "APPROVE", comment: "" });
      toast.success("Task approved successfully");
      onUpdate();
      onClose();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to approve task");
    }
  };
  const handleReject = async () => {
    const reason = prompt("Enter rejection reason:");
    if (reason === null) return;
    try {
      await api.post<any>(`/tasks/${task.id}/approve`, { action: "REJECT", comment: reason });
      toast.success("Task rejected successfully");
      onUpdate();
      onClose();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to reject task");
    }
  };
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this order? This action cannot be undone.")) return;

    try {
      await api.delete(`/tasks/${task.id}`);
      toast.success("Order deleted successfully");
      onUpdate();
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete order");
    }
  };
  const isHighValue = Number(task.amount) > 10000;
  const isInvoiceOrWire = task.payment_method?.toLowerCase() === 'invoice' || task.payment_method?.toLowerCase() === 'wire';
  const needsApproval = isHighValue || isInvoiceOrWire;
  const canApprove = task.current_tier_id != null && needsApproval;
  let flow = SPEND_FLOW;
  const category = (task.category || task.request_type || "").toUpperCase();
  if (category === 'ADMIN') flow = ADMIN_FLOW;
  else if (category === 'RECURRING') flow = RECURRING_FLOW;
  else if (category === 'QUOTE') flow = QUOTE_FLOW;
  const totalAmount = Number(task.amount || 0);
  const unitPrice = Number(task.unit_price || 0);
  const quantity = Number(task.quantity || 1);
  const taskTax = resolveTaxRate({
    shippingAddress: task.purchase_order?.shipped_to_location || task.shipping_address,
    vendorAddress: parsedQuoteData?.vendor?.address,
    vendorName: task.purchase_order?.vendor || parsedQuoteData?.vendor?.name || parsedProductInfo?.vendor,
    currency: task.currency,
  });
  const afterTaxAmount = totalAmount * (1 + taskTax.rate);
  const rawItems = (task.items && task.items.length > 0)
    ? task.items
    : (parsedQuoteData?.items || parsedQuoteData?.line_items || []);
  const isMulti = task.item_mode === "MULTIPLE" || rawItems.length > 0;
  const isRecurring = category === 'RECURRING';
  return { parsedProductInfo, parsedQuoteData, handleDragOver, handleDragLeave, handleDrop, handleAddNote, handleEditNote, handleDeleteNote, confirmDeleteNote, handleApprove, handleReject, handleDelete, canApprove, flow, totalAmount, unitPrice, quantity, taskTax, afterTaxAmount, rawItems, isMulti, isRecurring };
}
