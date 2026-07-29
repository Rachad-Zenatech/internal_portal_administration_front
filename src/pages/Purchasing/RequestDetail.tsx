import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  Circle,
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

import { usePurchaseRequest, useTransitionRequest } from "@/hooks/usePurchasing";
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
  COMPLEX_FLOW,
  PAYMENT_BADGE,
  PAYMENT_LABEL,
  PRIORITY_BADGE,
  SIMPLE_FLOW,
  STATUS_BADGE,
  STATUS_LABEL,
  formatDate,
  formatMoney,
} from "./purchasingMeta";

type FormKind = "po" | "invoice" | "approval" | "tracking";

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError } = usePurchaseRequest(id);
  const transition = useTransitionRequest(id ?? "");

  const [activeForm, setActiveForm] = useState<{ action: WorkflowAction; kind: FormKind } | null>(null);
  const [po, setPo] = useState<PurchaseOrderInput>({ vendor: "", item: "", amount: 0, quote_number: "", description: "", expected_delivery_date: "" });
  const [invoice, setInvoice] = useState<InvoiceInput>({ vendor: "", amount: 0, invoice_date: "", due_date: "" });
  const [approval, setApproval] = useState<ApprovalInput>({ approver: "Sean (CEO)", comment: "" });
  const [tracking, setTracking] = useState<TrackingInput>({ tracking_number: "" });

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
  const flow = request.request_type === "SIMPLE" ? SIMPLE_FLOW : COMPLEX_FLOW;
  const currentIndex = flow.indexOf(request.status);

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
      setInvoice({ vendor: purchase_order.vendor, amount: purchase_order.amount, invoice_date: "", due_date: "" });
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
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/purchasing/requests")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-slate-500">{request.id}</span>
              <Badge variant="outline" className={STATUS_BADGE[request.status]}>{STATUS_LABEL[request.status]}</Badge>
              <Badge variant="outline" className={PRIORITY_BADGE[request.priority]}>{request.priority}</Badge>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">{request.title}</h2>
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

      {/* Workflow stepper */}
      <Card className="border border-slate-200 dark:border-zinc-800">
        <CardContent className="p-4 overflow-x-auto">
          <div className="flex items-center gap-1 min-w-max">
            {flow.map((step, i) => {
              const done = request.status !== "REJECTED" && i < currentIndex;
              const current = i === currentIndex;
              return (
                <div key={step} className="flex items-center gap-1">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                    current ? STATUS_BADGE[step] + " border" : done ? "text-green-600" : "text-slate-400"
                  }`}>
                    {done ? <CheckCircle2 className="h-4 w-4" /> : current ? <Circle className="h-4 w-4 fill-current" /> : <Circle className="h-4 w-4" />}
                    {STATUS_LABEL[step]}
                  </div>
                  {i < flow.length - 1 && <div className={`h-px w-6 ${done ? "bg-green-500" : "bg-slate-200 dark:bg-zinc-700"}`} />}
                </div>
              );
            })}
          </div>
          {request.status === "REJECTED" && (
            <p className="mt-3 text-sm font-medium text-red-600">This request was rejected.</p>
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
              <Field label="Type" value={request.request_type === "SIMPLE" ? "Simple Purchase" : "Complex / AP"} />
              <Field label="Assigned To" value={request.assigned_user ?? "—"} />
              <Field label="Requested" value={formatDate(request.request_date)} />
              <Field label="Last Updated" value={formatDate(request.updated_at)} />
              <div className="col-span-2">
                <div className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Description</div>
                <div className="text-slate-800 dark:text-zinc-200">{request.description || "—"}</div>
              </div>
            </CardContent>
          </Card>

          {purchase_order && (
            <Card className="border border-slate-200 dark:border-zinc-800">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Package className="h-4 w-4" /> Purchase Order · {purchase_order.id}</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <Field label="Vendor" value={purchase_order.vendor} />
                <Field label="Item" value={purchase_order.item} />
                <Field label="Quote #" value={purchase_order.quote_number ?? "—"} />
                <Field label="Amount" value={formatMoney(purchase_order.amount)} />
                <Field label="Approval" value={purchase_order.approval_status} />
                <Field label="Expected Delivery" value={formatDate(purchase_order.expected_delivery_date)} />
                <Field label="Tracking #" value={purchase_order.tracking_number ?? "—"} />
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
                  <Badge variant="outline" className={PAYMENT_BADGE[inv.payment_status]}>{PAYMENT_LABEL[inv.payment_status]}</Badge>
                </div>
                <Field label="Paid Date" value={formatDate(inv.paid_date)} />
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
                  <FieldInput label="Quote #" value={po.quote_number ?? ""} onChange={(v) => setPo({ ...po, quote_number: v })} />
                  <FieldInput label="Amount" type="number" value={String(po.amount)} onChange={(v) => setPo({ ...po, amount: Number(v) })} />
                </TwoUp>
                <FieldInput label="Expected Delivery" type="date" value={po.expected_delivery_date ?? ""} onChange={(v) => setPo({ ...po, expected_delivery_date: v })} />
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
              </>
            )}
            {activeForm?.kind === "approval" && (
              <>
                <FieldInput label="Approver" value={approval.approver} onChange={(v) => setApproval({ ...approval, approver: v })} />
                <div className="space-y-2">
                  <label className="text-sm font-medium">Comment</label>
                  <Textarea value={approval.comment ?? ""} onChange={(e) => setApproval({ ...approval, comment: e.target.value })} rows={2} />
                </div>
              </>
            )}
            {activeForm?.kind === "tracking" && (
              <FieldInput label="Tracking Number" value={tracking.tracking_number} onChange={(v) => setTracking({ tracking_number: v })} />
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
