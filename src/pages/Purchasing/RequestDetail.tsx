import { useState, useEffect } from "react";
import HelpIcon from "@/components/ui/HelpIcon";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  Bell,
  ExternalLink,
  FileText,
  Package,
  ReceiptText,
  Stamp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { usePurchaseRequest, useTransitionRequest, usePossibleApprovers } from "@/hooks/usePurchasing";
import Stepper from "@/components/Stepper";
import type {
  PurchaseOrderInput,
  InvoiceInput,
  ApprovalInput,
  TrackingInput,
  TransitionInput,
  WorkflowAction,
} from "@/types/purchasing";
import {
  ACTION_META,
  ADMIN_FLOW,
  SPEND_FLOW,
  RECURRING_FLOW,
  QUOTE_FLOW,
  PAYMENT_BADGE,
  PAYMENT_LABEL,
  PRIORITY_BADGE,
  STATUS_BADGE,
  getStatusBadge,
  getStatusLabel,
  formatDate,
  formatMoney,
} from "./purchasingMeta";

type FormKind = "po" | "invoice" | "approval" | "tracking" | "confirmGoods";

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError } = usePurchaseRequest(id);
  const transition = useTransitionRequest(id ?? "");
  const { data: approvers = [], isLoading: isLoadingApprovers } = usePossibleApprovers(id);

  const [activeForm, setActiveForm] = useState<{ action: WorkflowAction; kind: FormKind } | null>(null);
  const [po, setPo] = useState<PurchaseOrderInput>({ vendor: "", item: "", amount: 0, quote_number: "", description: "", expected_delivery_date: "" });
  const [invoice, setInvoice] = useState<InvoiceInput>({ vendor: "", amount: 0, invoice_date: "", due_date: "", gl_code: "", asset_flag: false });
  const [approval, setApproval] = useState<ApprovalInput>({ approver: "", comment: "" });
  const [tracking, setTracking] = useState<TrackingInput>({ tracking_number: "" });

  useEffect(() => {
    if (approvers && approvers.length > 0 && !approval.approver) {
      setApproval(prev => ({ ...prev, approver: approvers[0].user_id }));
    }
  }, [approvers, approval.approver]);

  useEffect(() => {
    if (data?.request) {
      document.dispatchEvent(
        new CustomEvent("set-breadcrumb-title", {
          detail: {
            path: `/purchasing/requests/${data.request.id}`,
            title: `${data.request.title} (${data.request.id})`,
          },
        })
      );
    }
  }, [data?.request]);

  if (isLoading) {
    return <div className="p-8 text-sm text-muted-foreground">Loading request...</div>;
  }
  if (isError || !data) {
    return (
      <div className="p-8">
        <Button variant="outline" onClick={() => navigate("/purchasing/requests")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <p className="mt-4 text-sm text-red-600">Request not found.</p>
      </div>
    );
  }

  const { request, purchase_order, invoice: inv, approvals, notifications, available_actions } = data;
  let flow = SPEND_FLOW;
  if (request.request_type === "ADMIN") flow = ADMIN_FLOW;
  else if (request.request_type === "RECURRING") flow = RECURRING_FLOW;
  else if (request.request_type === "QUOTE") flow = QUOTE_FLOW;

  const dispatch = async (payload: TransitionInput) => {
    try {
      await transition.mutateAsync(payload);
      toast.success(`${ACTION_META[payload.action].label} done`);
      setActiveForm(null);
    } catch (err) {
      toast.error((err as Error).message || "Action failed");
    }
  };

  const onAction = (action: WorkflowAction) => {
    const meta = ACTION_META[action];
    if (!meta.form) {
      void dispatch({ action });
      return;
    }
    // Prefill sensible defaults from existing data.
    if (meta.form === "invoice" && purchase_order) {
      setInvoice({ vendor: purchase_order.vendor, amount: purchase_order.amount, invoice_date: "", due_date: "", gl_code: "", asset_flag: false });
    }
    setActiveForm({ action, kind: meta.form });
  };

  const submitForm = () => {
    if (!activeForm) return;
    const { action, kind } = activeForm;
    if (kind === "po") {
      if (!po.vendor || !po.item) return toast.error("Vendor and item are required.");
      void dispatch({ action, purchase_order: { ...po, amount: Number(po.amount) || 0 } });
    } else if (kind === "invoice") {
      if (!invoice.vendor || !invoice.invoice_date) return toast.error("Vendor and invoice date are required.");
      void dispatch({ action, invoice: { ...invoice, amount: Number(invoice.amount) || 0 } });
    } else if (kind === "approval") {
      if (!approval.approver) return toast.error("Approver is required.");
      void dispatch({ action, approval });
    } else if (kind === "tracking") {
      if (!tracking.tracking_number) return toast.error("Tracking number is required.");
      void dispatch({ action, tracking });
    } else if (kind === "confirmGoods") {
      void dispatch({ action });
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4">
          <Button variant="outline" size="icon" className="mt-1 shrink-0 h-8 w-8 rounded-full" onClick={() => navigate("/purchasing/requests")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-zinc-100">
                {request.title}
              </h2>
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                #{request.id}
              </span>
              <HelpIcon text="Detailed view of a single purchase request, including purchase order, invoices, and workflow approval logs." />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={getStatusBadge(request.status)}>{getStatusLabel(request.status)}</Badge>
              <Badge variant="outline" className={PRIORITY_BADGE[request.priority]}>{request.priority}</Badge>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {available_actions.length === 0 ? (
            <span className="text-sm text-slate-500 self-center">No further actions.</span>
          ) : (
            available_actions.map((action) => {
              const meta = ACTION_META[action];
              return (
                <Button
                  key={action}
                  variant={meta.variant === "destructive" ? "destructive" : meta.variant === "outline" ? "outline" : "default"}
                  disabled={transition.isPending}
                  onClick={() => onAction(action)}
                >
                  {meta.label}
                </Button>
              );
            })
          )}
        </div>
      </div>

      {/* Workflow Stepper */}
      <Card className="border border-slate-200 dark:border-zinc-800 shadow-sm">
        <CardContent className="py-5 px-6">
          <Stepper flow={flow} requestStatus={request.status} />
          {request.status === "REJECTED" && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm font-medium text-red-600 dark:text-red-400">
              This request was rejected.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-slate-200 dark:border-zinc-800">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" /> Request Details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <Field label="Requester" value={request.requester} />
              <Field label="Department" value={request.department} />
              <Field label="Type" value={request.request_type} />
              <Field label="Assigned To" value={request.assigned_user ?? "—"} />
              <Field label="Requested" value={formatDate(request.request_date)} />
              <Field label="Last Updated" value={formatDate(request.updated_at)} />
              <div className="col-span-2">
                <div className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Description</div>
                <div className="text-slate-800 dark:text-zinc-200">{request.description || "—"}</div>
              </div>
              {(request.item_url || purchase_order?.item_url) && (
                <div className="col-span-2">
                  <div className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Product / Vendor Link</div>
                  <a
                    href={(request.item_url || purchase_order?.item_url || "").startsWith("http") ? (request.item_url || purchase_order?.item_url || "#") : `https://${request.item_url || purchase_order?.item_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open Product Page ({request.item_url || purchase_order?.item_url})
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {purchase_order && (
            <Card className="border border-slate-200 dark:border-zinc-800">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Package className="h-4 w-4" /> Purchase Order · {purchase_order.id}</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <Field label="Vendor" value={purchase_order.vendor} />
                <Field label="Item" value={purchase_order.item} />
                <Field label="Quote / PO #" value={purchase_order.quote_number ?? "—"} />
                <Field label="Amount" value={formatMoney(purchase_order.amount)} />
                <Field label="Approval" value={purchase_order.approval_status} />
                <Field label="Tracking #" value={purchase_order.tracking_number ?? "—"} />
                <Field label="Goods Received" value={purchase_order.goods_received ? `Yes, on ${formatDate(purchase_order.goods_received_at)}` : "No"} />
              </CardContent>
            </Card>
          )}

          {inv && (
            <Card className="border border-slate-200 dark:border-zinc-800">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><ReceiptText className="h-4 w-4" /> Invoice · {inv.id}</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <Field label="Vendor" value={inv.vendor} />
                <Field label="Amount" value={formatMoney(inv.amount)} />
                <Field label="Invoice Date" value={formatDate(inv.invoice_date)} />
                <Field label="Due Date" value={formatDate(inv.due_date)} />
                <div>
                  <div className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Payment Status</div>
                  {/* payment_status only tracks the pre-payment lifecycle; a settled
                      invoice is identified by paid_date. */}
                  {inv.paid_date ? (
                    <Badge variant="outline" className={STATUS_BADGE.COMPLETED}>Settled · {formatDate(inv.paid_date)}</Badge>
                  ) : (
                    <Badge variant="outline" className={PAYMENT_BADGE[inv.payment_status]}>{PAYMENT_LABEL[inv.payment_status]}</Badge>
                  )}
                </div>

                <Field label="GL Code" value={inv.gl_code ?? "—"} />
                <Field label="Asset Flag" value={inv.asset_flag ? "Yes" : "No"} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Activity: approvals + notifications */}
        <div className="space-y-6">
          <Card className="border border-slate-200 dark:border-zinc-800">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Stamp className="h-4 w-4" /> Approvals</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {approvals.length === 0 ? (
                <p className="text-slate-500">No approval activity yet.</p>
              ) : (
                approvals.map((a) => (
                  <div key={a.id} className="border-l-2 pl-3 border-slate-200 dark:border-zinc-700">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{a.approver}</span>
                      <Badge variant="outline" className={a.decision === "APPROVED" ? STATUS_BADGE.APPROVED : STATUS_BADGE.REJECTED}>
                        {a.decision}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-500">{formatDate(a.approval_date)}</div>
                    {a.comment && <div className="text-slate-700 dark:text-zinc-300 mt-1">{a.comment}</div>}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border border-slate-200 dark:border-zinc-800">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4" /> Notifications</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {notifications.length === 0 ? (
                <p className="text-slate-500">No notifications sent yet.</p>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className="border-l-2 pl-3 border-blue-200 dark:border-blue-900">
                    <div className="text-slate-800 dark:text-zinc-200">{n.message}</div>
                    <div className="text-xs text-slate-500">To {n.recipient} · {formatDate(n.sent_date)}</div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action dialog */}
      <Dialog open={!!activeForm} onOpenChange={(open) => !open && setActiveForm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{activeForm ? ACTION_META[activeForm.action].label : ""}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {activeForm?.kind === "po" && (
              <>
                <TwoUp>
                  <FieldInput label="Vendor" value={po.vendor} onChange={(v) => setPo({ ...po, vendor: v })} />
                  <FieldInput label="Item" value={po.item} onChange={(v) => setPo({ ...po, item: v })} />
                </TwoUp>
                <TwoUp>
                  <FieldInput label="Quote / PO #" value={po.quote_number ?? ""} onChange={(v) => setPo({ ...po, quote_number: v })} />
                  <FieldInput label="Amount" type="number" value={String(po.amount)} onChange={(v) => setPo({ ...po, amount: Number(v) })} />
                </TwoUp>
              </>
            )}
            {activeForm?.kind === "invoice" && (
              <>
                <TwoUp>
                  <FieldInput label="Vendor" value={invoice.vendor} onChange={(v) => setInvoice({ ...invoice, vendor: v })} />
                  <FieldInput label="Amount" type="number" value={String(invoice.amount)} onChange={(v) => setInvoice({ ...invoice, amount: Number(v) })} />
                </TwoUp>
                <TwoUp>
                  <FieldInput label="Invoice Date" type="date" value={invoice.invoice_date} onChange={(v) => setInvoice({ ...invoice, invoice_date: v })} />
                  <FieldInput label="Due Date" type="date" value={invoice.due_date ?? ""} onChange={(v) => setInvoice({ ...invoice, due_date: v })} />
                </TwoUp>
                <TwoUp>
                  <FieldInput label="GL Code" value={invoice.gl_code ?? ""} onChange={(v) => setInvoice({ ...invoice, gl_code: v })} />
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Asset Flag</label>
                    <div className="flex items-center h-10">
                      <input type="checkbox" className="h-4 w-4" checked={invoice.asset_flag || false} onChange={(e) => setInvoice({ ...invoice, asset_flag: e.target.checked })} />
                      <span className="ml-2 text-sm text-slate-700">Mark as Asset</span>
                    </div>
                  </div>
                </TwoUp>
              </>
            )}
            {activeForm?.kind === "approval" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Approver</label>
                  <Select
                    value={approval.approver}
                    onValueChange={(v) => setApproval({ ...approval, approver: v })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select approver..." />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingApprovers ? (
                        <SelectItem value="_loading" disabled>Loading approvers...</SelectItem>
                      ) : approvers.length > 0 ? (
                        approvers.map((appr) => (
                          <SelectItem key={appr.user_id} value={appr.user_id}>
                            {appr.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="_none" disabled>No assignees found</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Comment</label>
                  <Textarea value={approval.comment ?? ""} onChange={(e) => setApproval({ ...approval, comment: e.target.value })} rows={2} />
                </div>
              </>
            )}
            {activeForm?.kind === "tracking" && (
              <>
                <FieldInput label="Tracking Number" value={tracking.tracking_number} onChange={(v) => setTracking({ ...tracking, tracking_number: v })} />
                <label className="text-sm font-medium">Note</label>
                <Textarea
                  rows={3}
                  placeholder="Add a note..."
                  value={tracking.note ?? ''}
                  onChange={(e) => setTracking({ ...tracking, note: e.target.value })}
                />
              </>
            )}
            {activeForm?.kind === "confirmGoods" && (
              <p className="text-sm text-muted-foreground">Are you sure you want to confirm goods received?</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveForm(null)}>Cancel</Button>
            <Button onClick={submitForm} disabled={transition.isPending}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-500 dark:text-zinc-400 mb-1">{label}</div>
      <div className="text-slate-800 dark:text-zinc-200">{value}</div>
    </div>
  );
}

function TwoUp({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-4">{children}</div>;
}

function FieldInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

// Test

