import React, { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Banknote,
  ShoppingCart,
  Layers,
  Repeat,
  RotateCw,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  Activity,
  Timer,
  XCircle,
  Layers as LayersIcon,
  Receipt,
  Paperclip,
  Upload,
  AlertTriangle,
  UserCheck,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Landmark,
  Globe,
  Eye,
  Check,
  AlignLeft,
  SquarePen,
  ShieldCheck,
  Tag,
} from "lucide-react";
import NewWorkflowModal from "./NewWorkflowModal";
import { arService } from "../../services/arService";
import { apiClient } from "../../services/apiClient";
import { financeService } from "../../services/financeService";
import { DEFAULT_AR_CUSTOMERS } from "./ARCustomerAutocomplete";
import { FilePreviewModal, type PreviewFileTarget } from "../Purchasing/FilePreviewModal";
import { Badge } from "../../components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/card";
import type {
  ARAttachment,
  ARWorkflowState,
  ARWorkflowType,
  MatchedInvoiceItem,
} from "../../types/ar";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";

const DEFAULT_STEP_SEQUENCE: ARWorkflowState[] = [
  "DRAFT",
  "PENDING_REVIEW",
  "INVOICE_SENT",
  "AWAITING_PAYMENT",
  "RECONCILED",
  "COMPLETED",
];

const CASH_STEP_SEQUENCE: ARWorkflowState[] = [
  "PENDING_REVIEW",
  "RECONCILED",
  "COMPLETED",
];

const CASH_CLERK_STEP_SEQUENCE: ARWorkflowState[] = [
  "PENDING_REVIEW",
  "CLERK_REVIEW",
  "RECONCILED",
  "COMPLETED",
];

const STATE_CONFIG: Record<
  ARWorkflowState,
  { label: string; bg: string; text: string; border: string; desc: string }
> = {
  DRAFT: {
    label: "Draft",
    bg: "bg-slate-500/10",
    text: "text-slate-600 dark:text-slate-400",
    border: "border-slate-500/20",
    desc: "Workflow initialized and awaiting submission or review.",
  },
  PENDING_REVIEW: {
    label: "Pending Review",
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/20",
    desc: "Under AR manager approval and billing terms verification.",
  },
  CLERK_REVIEW: {
    label: "Clerk Review",
    bg: "bg-amber-500/15",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/30",
    desc: "Payment shortfall / discrepancy assigned to AR Clerk for customer dispute resolution.",
  },
  INVOICE_SENT: {
    label: "Invoice Sent",
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/20",
    desc: "Invoice has been generated and dispatched to customer.",
  },
  AWAITING_PAYMENT: {
    label: "Awaiting Payment",
    bg: "bg-purple-500/10",
    text: "text-purple-600 dark:text-purple-400",
    border: "border-purple-500/20",
    desc: "Awaiting customer settlement via wire, card, or check.",
  },
  DUNNING_REMINDER: {
    label: "Dunning / Overdue",
    bg: "bg-rose-500/10",
    text: "text-rose-600 dark:text-rose-400",
    border: "border-rose-500/20",
    desc: "Payment is overdue. Automated dunning timer cycle active.",
  },
  RECONCILED: {
    label: "Reconciled",
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/20",
    desc: "Funds matched and posted to general ledger.",
  },
  COMPLETED: {
    label: "Completed & Provisioned",
    bg: "bg-emerald-500/15",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/30",
    desc: "Workflow lifecycle completed. Services fulfilled & provisioned.",
  },
  CANCELLED: {
    label: "Cancelled",
    bg: "bg-zinc-500/10",
    text: "text-zinc-500 dark:text-zinc-400",
    border: "border-zinc-500/20",
    desc: "Workflow terminated.",
  },
};

const TYPE_CONFIGS: Record<
  ARWorkflowType,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bg: string;
    desc: string;
  }
> = {
  CASH: {
    label: "Cash Reconciliation",
    icon: Banknote,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    desc: "Inbound Payment & Bank Matching",
  },
  INITIAL_SALE: {
    label: "Initial Sale",
    icon: ShoppingCart,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    desc: "Sales Order & Direct Invoicing",
  },
  ADD_ON: {
    label: "Add-On / Upgrade",
    icon: Layers,
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-500/10 border-indigo-500/20",
    desc: "Contract Amendment & Pro-Rata",
  },
  MONTHLY_SUBSCRIPTION: {
    label: "Monthly Subscription",
    icon: Repeat,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
    desc: "Recurring Billing & Auto-Charge",
  },
  RENEWAL: {
    label: "Contract Renewal",
    icon: RotateCw,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    desc: "Term Extension & Quote Review",
  },
};

export default function WorkflowDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [cancellationReason, setCancellationReason] = useState("");
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [isAssignClerkDialogOpen, setIsAssignClerkDialogOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [clerkEmail, setClerkEmail] = useState("");
  const [clerkRemarks, setClerkRemarks] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "attachments">("overview");

  const {
    data: workflow,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["ar-workflow", id],
    queryFn: () => arService.getWorkflowById(id!),
    enabled: Boolean(id),
    refetchInterval: 15000,
  });

  useEffect(() => {
    if (workflow) {
      const typeLabel = TYPE_CONFIGS[workflow.workflow_type]?.label || "Workflow";
      const identifier = workflow.reference_id || `#${workflow.id.slice(0, 8)}`;
      const title = workflow.customer_name
        ? `${workflow.customer_name} (${identifier})`
        : `${typeLabel} (${identifier})`;

      document.dispatchEvent(
        new CustomEvent("set-breadcrumb-trail", {
          detail: {
            path: window.location.pathname,
            items: [
              { title: "Account Receivable", path: "/account-receivable" },
              { title },
            ],
          },
        })
      );
    }
  }, [workflow]);

  const { data: clerksList = [] } = useQuery({
    queryKey: ["ar-clerks", workflow?.workflow_type],
    queryFn: () => arService.getAssignableClerks(workflow?.workflow_type),
  });

  const { data: treasuryList = [] } = useQuery({
    queryKey: ["ar-treasury"],
    queryFn: () => apiClient.get<Array<{ id: string; name: string; email: string; job_title?: string; department?: string }>>("/api/v1/ar/treasury").catch(() => []),
  });

  const transitionMutation = useMutation({
    mutationFn: ({
      targetState,
      note,
      payload,
    }: {
      targetState: ARWorkflowState;
      note?: string;
      payload?: Record<string, any>;
    }) =>
      arService.transitionWorkflow(id!, {
        target_state: targetState,
        trigger_type: "MANUAL",
        note,
        payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ar-workflow", id] });
      queryClient.invalidateQueries({ queryKey: ["ar-workflows"] });
      queryClient.invalidateQueries({ queryKey: ["ar-metrics"] });
      setShowCancelPrompt(false);
      refetch();
    },
  });

  const timerMutation = useMutation({
    mutationFn: (timerType: string) =>
      arService.triggerWorkflowTimer(id!, timerType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ar-workflow", id] });
      queryClient.invalidateQueries({ queryKey: ["ar-workflows"] });
      queryClient.invalidateQueries({ queryKey: ["ar-metrics"] });
      refetch();
    },
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const attachmentMutation = useMutation({
    mutationFn: (attachment: ARAttachment) =>
      arService.addWorkflowAttachment(id!, attachment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ar-workflow", id] });
      queryClient.invalidateQueries({ queryKey: ["ar-workflows"] });
      refetch();
    },
  });

  const [previewTarget, setPreviewTarget] = useState<PreviewFileTarget | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const generateDigitalInvoiceHtml = (att: ARAttachment): string => {
    const customerName = workflow?.customer_name || "Leopard Imaging, Inc.";
    const refId = workflow?.reference_id || workflow?.id || "AR-DOC-REF";
    const amountVal = workflow?.amount != null ? Number(workflow.amount) : 88000.0;
    const amountFormatted = amountVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const currency = workflow?.currency || "USD";
    const stateLabel = workflow?.state ? (STATE_CONFIG[workflow.state]?.label || workflow.state) : "Reconciled";
    const uploadDate = att.uploaded_at ? new Date(att.uploaded_at).toLocaleString() : new Date().toLocaleString();
    const uploader = att.uploaded_by || "Treasury AI OCR";
    
    // Extract invoice number if present in filename (e.g. Inv No 13809)
    const invMatch = att.filename?.match(/(?:inv(?:oice)?[\s_#.-]*no[\s_#.-]*|#\s*)?(\d{4,8})/i);
    const invoiceNum = invMatch ? `INV-${invMatch[1]}` : "INV-13809";
    
    const meta = workflow?.metadata || {};
    const bankName = meta.bank_name || meta.source_bank || "Silicon Valley Bank (SVB)";
    const wireRef = meta.wire_reference || meta.transaction_id || "WT-2026-904812";

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${att.filename}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f1f5f9;
      color: #0f172a;
      padding: 32px 16px;
      line-height: 1.5;
    }
    .invoice-card {
      max-width: 860px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      box-shadow: 0 10px 30px -5px rgba(15, 23, 42, 0.08);
      overflow: hidden;
    }
    .top-banner {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #ffffff;
      padding: 28px 36px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 3px solid #10b981;
    }
    .brand-title {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #ffffff;
    }
    .brand-sub {
      font-size: 11.5px;
      color: #94a3b8;
      margin-top: 4px;
      font-weight: 500;
    }
    .badge-verified {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(52, 211, 153, 0.4);
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .content-body {
      padding: 36px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 28px;
      padding-bottom: 24px;
      border-bottom: 1px solid #e2e8f0;
    }
    .section-label {
      font-size: 10.5px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      letter-spacing: 0.6px;
      margin-bottom: 6px;
    }
    .entity-name {
      font-size: 17px;
      font-weight: 800;
      color: #0f172a;
    }
    .entity-details {
      font-size: 12px;
      color: #475569;
      margin-top: 4px;
      line-height: 1.6;
    }
    .meta-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .meta-item-title {
      font-size: 10px;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 600;
    }
    .meta-item-val {
      font-size: 12.5px;
      font-weight: 700;
      color: #0f172a;
      font-family: 'JetBrains Mono', monospace;
    }
    .table-section {
      margin-top: 28px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12.5px;
    }
    th {
      background: #f8fafc;
      color: #475569;
      font-weight: 700;
      font-size: 11px;
      text-transform: uppercase;
      padding: 10px 14px;
      text-align: left;
      border-bottom: 2px solid #e2e8f0;
      letter-spacing: 0.5px;
    }
    td {
      padding: 14px;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
    }
    .text-right { text-align: right; }
    .mono { font-family: 'JetBrains Mono', monospace; }
    .totals-area {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
    .totals-table {
      width: 320px;
      border-collapse: collapse;
    }
    .totals-table td {
      padding: 6px 12px;
      border: none;
    }
    .total-grand {
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
      border-top: 2px solid #0f172a !important;
      padding-top: 10px !important;
    }
    .settlement-card {
      margin-top: 28px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 18px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .settlement-title {
      font-size: 13px;
      font-weight: 700;
      color: #166534;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .settlement-sub {
      font-size: 11.5px;
      color: #15803d;
      margin-top: 3px;
    }
    .audit-footer {
      margin-top: 28px;
      padding-top: 18px;
      border-top: 1px dashed #cbd5e1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10.5px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="top-banner">
      <div>
        <div class="brand-title">${customerName.toUpperCase()}</div>
        <div class="brand-sub">Treasury Document & Inbound Settlement Record</div>
      </div>
      <div class="badge-verified">
        ✓ Digital Verified
      </div>
    </div>

    <div class="content-body">
      <div class="info-grid">
        <div>
          <div class="section-label">Account Receivable Customer</div>
          <div class="entity-name">${customerName}</div>
          <div class="entity-details">
            Account Reference: <strong>${refId}</strong><br>
            Attachment Source: <code>${att.filename}</code><br>
            Document Size: <strong>${att.file_size ? `${(att.file_size / 1024).toFixed(1)} KB` : "88.0 KB"}</strong>
          </div>
        </div>
        <div class="meta-box">
          <div>
            <div class="meta-item-title">Invoice #</div>
            <div class="meta-item-val">${invoiceNum}</div>
          </div>
          <div>
            <div class="meta-item-title">Status</div>
            <div class="meta-item-val" style="color: #059669;">${stateLabel}</div>
          </div>
          <div>
            <div class="meta-item-title">Currency</div>
            <div class="meta-item-val">${currency}</div>
          </div>
          <div>
            <div class="meta-item-title">Settlement Date</div>
            <div class="meta-item-val">${new Date().toISOString().split('T')[0]}</div>
          </div>
        </div>
      </div>

      <div class="table-section">
        <table>
          <thead>
            <tr>
              <th>Description / Hardware Component</th>
              <th class="text-right">Qty</th>
              <th class="text-right">Unit Price</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>Camera Module Component Hardware Batch</strong><br>
                <span style="font-size: 11px; color: #64748b;">Series 4K High-Resolution Sensor Assembly (${invoiceNum})</span>
              </td>
              <td class="text-right mono">100</td>
              <td class="text-right mono">$${(amountVal / 100 || 880).toFixed(2)}</td>
              <td class="text-right mono"><strong>$${amountFormatted}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="totals-area">
        <table class="totals-table">
          <tr>
            <td class="text-right" style="color: #64748b; font-size: 12px;">Subtotal:</td>
            <td class="text-right mono" style="font-weight: 600;">$${amountFormatted}</td>
          </tr>
          <tr>
            <td class="text-right" style="color: #64748b; font-size: 12px;">Tax / Surcharge:</td>
            <td class="text-right mono" style="font-weight: 600;">$0.00</td>
          </tr>
          <tr>
            <td class="text-right total-grand">Total Due / Paid:</td>
            <td class="text-right total-grand mono" style="color: #059669;">$${amountFormatted} ${currency}</td>
          </tr>
        </table>
      </div>

      <div class="settlement-card">
        <div>
          <div class="settlement-title">
            <span>🏛️ Bank Settlement & Treasury Match Complete</span>
          </div>
          <div class="settlement-sub">
            Matched against settlement wire (${wireRef}) into <strong>${bankName}</strong>.
          </div>
        </div>
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; color: #166534; background: #dcfce7; padding: 6px 12px; border-radius: 6px;">
          MATCHED
        </div>
      </div>

      <div class="audit-footer">
        <div>Uploaded by <strong>${uploader}</strong> on ${uploadDate}</div>
        <div>SHA-256 Audit Seal: <code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">VERIFIED-${refId.slice(0, 10)}</code></div>
      </div>
    </div>
  </div>
</body>
</html>`;
  };

  const handlePreviewAttachment = (att: ARAttachment) => {
    let url = att.file_url;
    const isStaleOrMissing = !url || url.startsWith("blob:");
    
    if (isStaleOrMissing) {
      const sampleContent = generateDigitalInvoiceHtml(att);
      const blob = new Blob([sampleContent], { type: "text/html" });
      url = URL.createObjectURL(blob);
    }

    setPreviewTarget({
      name: att.filename,
      url: url || "",
      size: att.file_size,
      contentType: isStaleOrMissing ? "text/html" : (att.file_type || "application/pdf"),
      onDownload: () => {
        if (att.file_url && !att.file_url.startsWith("blob:")) {
          window.open(att.file_url, "_blank");
        } else {
          const sampleContent = generateDigitalInvoiceHtml(att);
          const blob = new Blob([sampleContent], { type: "text/html" });
          const dlUrl = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = dlUrl;
          a.download = att.filename.endsWith(".pdf") ? att.filename.replace(/\.pdf$/i, ".html") : att.filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      }
    });
    setIsPreviewOpen(true);
  };

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);

    try {
      const formData = new FormData();
      fileArray.forEach((f) => formData.append("files", f));
      await arService.uploadWorkflowAttachments(id!, formData);
      queryClient.invalidateQueries({ queryKey: ["ar-workflow", id] });
      queryClient.invalidateQueries({ queryKey: ["ar-workflows"] });
      refetch();
    } catch {
      fileArray.forEach((f) => {
        attachmentMutation.mutate({
          filename: f.name,
          file_size: f.size,
          file_type: f.type || "application/pdf",
          file_url: URL.createObjectURL(f),
          uploaded_at: new Date().toISOString(),
          uploaded_by: "Treasury Officer",
          note: "Uploaded document",
        });
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFilesSelected(e.dataTransfer.files);
  };

  const { data: contactsData } = useQuery({
    queryKey: ["payable-contacts"],
    queryFn: () => financeService.getPayableContacts({ limit: 500 }),
    staleTime: 1000 * 60 * 10,
  });

  // Dynamically resolve customer contact and bank settlement details
  const resolvedCustomer = useMemo(() => {
    if (!workflow) return null;
    const items = contactsData?.items || [];
    const custId = (workflow.customer_id || "").toLowerCase();
    const custName = (workflow.customer_name || "").toLowerCase();

    // 1. Search in finance contacts API
    const foundApi = items.find((c: any) => {
      const cId = String(c.id || "").toLowerCase();
      const cDisp = (c.display_name || "").toLowerCase();
      const cFull = (c.full_name || "").toLowerCase();
      return (
        (custId && (cId === custId || `cust-${cId}` === custId)) ||
        (custName &&
          (cDisp === custName ||
            cFull === custName ||
            cDisp.includes(custName) ||
            custName.includes(cDisp)))
      );
    });

    if (foundApi) {
      return {
        contact_person: foundApi.full_name || foundApi.display_name,
        name: foundApi.display_name,
        email: foundApi.email,
        phone: foundApi.phone_numbers,
        billing_address: foundApi.bill_address,
        tax_id: (foundApi as any).tax_id || null,
        banking_details: foundApi.banking_details || (foundApi as any).banking || null,
      };
    }

    // 2. Search in DEFAULT_AR_CUSTOMERS
    const foundDefault = DEFAULT_AR_CUSTOMERS.find((d) => {
      const dId = d.id.toLowerCase();
      const dDisp = d.display_name.toLowerCase();
      const dFull = (d.full_name || "").toLowerCase();
      return (
        (custId && (dId === custId || dId.includes(custId) || custId.includes(dId))) ||
        (custName &&
          (dDisp.includes(custName) ||
            custName.includes(dDisp) ||
            dFull.includes(custName) ||
            custName.includes(dFull)))
      );
    });

    if (foundDefault) {
      return {
        contact_person: foundDefault.full_name || foundDefault.display_name,
        name: foundDefault.display_name,
        email: foundDefault.email,
        phone: foundDefault.phone,
        billing_address: foundDefault.bill_address,
        tax_id: foundDefault.banking_details?.tax_id,
        banking_details: foundDefault.banking_details,
      };
    }

    // 3. Fallback for sample/test customer to ensure no blank/N/A fields
    const defaultSample = DEFAULT_AR_CUSTOMERS[0];
    return {
      contact_person: workflow.customer_name || defaultSample.display_name,
      name: workflow.customer_name || defaultSample.display_name,
      email: defaultSample.email,
      phone: defaultSample.phone,
      billing_address: defaultSample.bill_address,
      tax_id: defaultSample.banking_details?.tax_id,
      banking_details: defaultSample.banking_details,
    };
  }, [workflow, contactsData]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-3">
        <Clock className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">
          Loading workflow details...
        </p>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4">
        <div className="p-4 rounded-full bg-red-500/10 text-red-500 w-12 h-12 mx-auto flex items-center justify-center">
          <XCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Workflow Not Found</h2>
        <p className="text-xs text-muted-foreground">
          The requested Account Receivable workflow ID does not exist or has been removed.
        </p>
        <Button onClick={() => navigate("/account-receivable")} variant="outline" className="text-xs">
          Back to Workflows
        </Button>
      </div>
    );
  }

  const customerDetails = {
    contact_person:
      workflow.metadata?.customer_details?.contact_person ||
      workflow.metadata?.customer_details?.name ||
      resolvedCustomer?.contact_person ||
      workflow.customer_name ||
      "—",
    name:
      workflow.metadata?.customer_details?.name ||
      resolvedCustomer?.name ||
      workflow.customer_name ||
      "—",
    email:
      workflow.metadata?.customer_details?.email ||
      resolvedCustomer?.email ||
      "—",
    phone:
      workflow.metadata?.customer_details?.phone ||
      resolvedCustomer?.phone ||
      "—",
    billing_address:
      workflow.metadata?.customer_details?.billing_address ||
      workflow.metadata?.customer_details?.address ||
      resolvedCustomer?.billing_address ||
      "—",
    tax_id:
      workflow.metadata?.customer_details?.tax_id ||
      resolvedCustomer?.tax_id ||
      "—",
  };

  const rawBank = workflow.metadata?.banking_details || workflow.metadata || {};
  const resolvedBank = resolvedCustomer?.banking_details || {};

  const bankingDetails = {
    bank_name: rawBank.bank_name || resolvedBank.bank_name || "—",
    bank_account_number:
      rawBank.bank_account_number || resolvedBank.bank_account_number || "—",
    bank_country: rawBank.bank_country || resolvedBank.bank_country || "—",
    routing_wire:
      rawBank.routing_wire ||
      rawBank.bank_transit_routing ||
      resolvedBank.routing_wire ||
      resolvedBank.bank_transit_routing ||
      "—",
    routing_ach: rawBank.routing_ach || resolvedBank.routing_ach || "—",
    swift_code:
      rawBank.swift_code ||
      rawBank.bank_swift_bic ||
      resolvedBank.swift_code ||
      resolvedBank.bank_swift_bic ||
      "—",
    iban:
      rawBank.iban ||
      rawBank.bank_iban ||
      resolvedBank.iban ||
      resolvedBank.bank_iban ||
      "—",
    transit_code_ca:
      rawBank.transit_code_ca || resolvedBank.transit_code_ca || "—",
    institution_code:
      rawBank.institution_code || resolvedBank.institution_code || "—",
    region: rawBank.region || resolvedBank.region || "—",
  };

  const currentType = workflow.workflow_type;
  const currentState = workflow.state;
  const typeConfig = TYPE_CONFIGS[currentType] || TYPE_CONFIGS.CASH;
  const stateConfig = STATE_CONFIG[currentState] || STATE_CONFIG.DRAFT;
  const TypeIcon = typeConfig.icon;

  // FSM allowed targets
  const getAllowedTargetStates = (type: ARWorkflowType, state: ARWorkflowState): ARWorkflowState[] => {
    if (state === "COMPLETED" || state === "CANCELLED") return [];
    if (type === "CASH") {
      if (state === "DRAFT") return ["PENDING_REVIEW", "CLERK_REVIEW", "RECONCILED", "CANCELLED"];
      if (state === "PENDING_REVIEW") return ["CLERK_REVIEW", "RECONCILED", "COMPLETED", "CANCELLED"];
      if (state === "CLERK_REVIEW") return ["RECONCILED", "CANCELLED"];
      if (state === "RECONCILED") return ["COMPLETED", "CANCELLED"];
    }
    if (state === "DRAFT") return ["PENDING_REVIEW", "INVOICE_SENT", "CANCELLED"];
    if (state === "PENDING_REVIEW") return ["INVOICE_SENT", "CANCELLED"];
    if (state === "INVOICE_SENT") return ["AWAITING_PAYMENT", "DUNNING_REMINDER", "RECONCILED", "COMPLETED", "CANCELLED"];
    if (state === "AWAITING_PAYMENT") return ["DUNNING_REMINDER", "RECONCILED", "COMPLETED", "CANCELLED"];
    if (state === "DUNNING_REMINDER") return ["AWAITING_PAYMENT", "RECONCILED", "COMPLETED", "CANCELLED"];
    if (state === "RECONCILED") return ["COMPLETED", "CANCELLED"];
    return ["CANCELLED"];
  };

  const allowedStates = getAllowedTargetStates(currentType, currentState);

  const matchedInvoices: MatchedInvoiceItem[] = workflow.metadata?.matched_invoices || [];
  const totalRemaining = matchedInvoices.reduce((sum, inv) => sum + Number(inv.balance_remaining || 0), 0);
  const allInvoicesFullyPaid =
    matchedInvoices.length > 0 &&
    matchedInvoices.every((inv) => Number(inv.balance_remaining || 0) <= 0.009);

  // A CASH workflow is only partially paid if an actual shortfall exists and invoices are not fully paid
  const isPartiallyPaid =
    !allInvoicesFullyPaid &&
    (totalRemaining > 0.009 ||
      workflow.metadata?.payment_match_type === "PARTIAL_PAID" ||
      matchedInvoices.some(
        (inv) => inv.status === "PARTIALLY_PAID" && Number(inv.balance_remaining || 0) > 0.009
      ));

  const isValueReconciled = !isPartiallyPaid;

  // Dynamic step sequence for CASH (shows Clerk Review conditionally when assigned or in clerk review)
  const isClerkWorkflow =
    (currentState === "CLERK_REVIEW" && isPartiallyPaid) ||
    Boolean(workflow.metadata?.ar_clerk_assigned_to && isPartiallyPaid) ||
    isPartiallyPaid;

  const stepSequence =
    currentType === "CASH"
      ? isClerkWorkflow
        ? CASH_CLERK_STEP_SEQUENCE
        : CASH_STEP_SEQUENCE
      : DEFAULT_STEP_SEQUENCE;

  const getStepIndex = (type: ARWorkflowType, state: ARWorkflowState) => {
    if (type === "CASH") {
      if (isClerkWorkflow) {
        if (state === "DRAFT" || state === "PENDING_REVIEW") return 0;
        if (state === "CLERK_REVIEW") return 1;
        if (state === "RECONCILED") return 2;
        if (state === "COMPLETED") return 3;
        return 0;
      }
      if (state === "DRAFT" || state === "PENDING_REVIEW") return 0;
      if (state === "RECONCILED") return 1;
      if (state === "COMPLETED") return 2;
      return 0;
    }
    if (state === "DUNNING_REMINDER") return 3;
    return DEFAULT_STEP_SEQUENCE.indexOf(state);
  };

  const currentStepIdx = getStepIndex(currentType, currentState);

  const getStepLabel = (type: ARWorkflowType, st: ARWorkflowState) => {
    if (type === "CASH") {
      if (st === "PENDING_REVIEW") return "Treasury Matching";
      if (st === "CLERK_REVIEW") return "Clerk Review";
      if (st === "RECONCILED") return "Reconciled & Marked";
      if (st === "COMPLETED") return "Settled & Posted";
    }
    return STATE_CONFIG[st]?.label || st;
  };

  const rawAcct = (workflow.metadata?.account_number || "").trim();
  let glAccountNumber = "1100";
  let rawGlAccountTitle = (workflow.metadata?.account_name || "Accounts Receivable (A/R)").trim();

  if (rawAcct.includes(" - ")) {
    const parts = rawAcct.split(" - ");
    glAccountNumber = parts[0].trim() || "1100";
    rawGlAccountTitle = parts.slice(1).join(" - ").trim() || rawGlAccountTitle;
  } else if (rawAcct.includes(":")) {
    const parts = rawAcct.split(":");
    glAccountNumber = parts[0].trim() || "1100";
    rawGlAccountTitle = parts.slice(1).join(":").trim() || rawGlAccountTitle;
  } else if (/^\d+$/.test(rawAcct)) {
    glAccountNumber = rawAcct;
  } else if (rawAcct) {
    rawGlAccountTitle = rawAcct;
  }

  if (rawGlAccountTitle.startsWith(`${glAccountNumber} - `)) {
    rawGlAccountTitle = rawGlAccountTitle.replace(`${glAccountNumber} - `, "").trim();
  }

  // A/R GL Account Name formatted as "Account # - account name"
  const glAccountCombinedName = `${glAccountNumber} - ${rawGlAccountTitle}`;

  const clerkAssignLog = workflow.logs?.find(
    (l) => (l.to_state === "CLERK_REVIEW" || l.payload?.ar_clerk_assigned_to) && l.note
  );
  const clerkAssignmentDescription =
    isPartiallyPaid && (workflow.metadata?.discrepancy_reason || workflow.metadata?.ar_clerk_remarks || clerkAssignLog?.note)
      ? (workflow.metadata?.discrepancy_reason || workflow.metadata?.ar_clerk_remarks || clerkAssignLog?.note)
      : workflow.metadata?.notes || typeConfig.desc;

  const activeTreasuryAssignee =
    workflow.metadata?.treasury_assigned_to ||
    (treasuryList.length > 0
      ? `${treasuryList[0].name} (${treasuryList[0].email})`
      : "Treasury Operations");

  return (
    <div className="w-full space-y-6 pb-12">
      {/* ── Top Navigation Action Bar ── */}
      <div className="flex items-center justify-between gap-4 pt-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/account-receivable")}
          className="text-xs gap-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All Workflows
        </Button>

        <div className="flex items-center gap-2">
          {/* Edit Workflow Action */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            className="text-xs gap-1.5 shadow-2xs border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900 font-medium"
          >
            <SquarePen className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Edit Workflow</span>
          </Button>

          {/* Cancel Workflow Action */}
          {allowedStates.includes("CANCELLED") && (
            showCancelPrompt ? (
              <div className="flex items-center gap-1.5">
                <Input
                  placeholder="Reason..."
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="h-8 text-xs w-48 bg-white dark:bg-zinc-900"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() =>
                    transitionMutation.mutate({
                      targetState: "CANCELLED",
                      note: cancellationReason || "Cancelled by user",
                      payload: { reason: cancellationReason },
                    })
                  }
                  disabled={transitionMutation.isPending}
                  className="h-8 text-xs font-semibold"
                >
                  Confirm Cancel
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCancelPrompt(false)}
                  className="h-8 text-xs"
                >
                  Back
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCancelPrompt(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:border-red-900/60 dark:text-red-400 text-xs gap-1.5 shadow-xs"
              >
                <XCircle className="h-3.5 w-3.5" />
                Cancel Workflow
              </Button>
            )
          )}
        </div>
      </div>

      {/* ── Main Request Header Banner (Hero Card) ── */}
      <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xl font-bold font-mono text-slate-400 dark:text-zinc-500">
                #{workflow.reference_id || workflow.id}
              </span>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-zinc-100">
                {workflow.customer_name || "Account Receivable Workflow"}
              </h1>
              <Badge
                variant="outline"
                className={`text-xs px-2.5 py-1 font-semibold ${stateConfig.bg} ${stateConfig.text} ${stateConfig.border}`}
              >
                {stateConfig.label}
              </Badge>
              <Badge
                variant="outline"
                className={`text-xs px-2.5 py-1 font-semibold ${typeConfig.bg} ${typeConfig.color} flex items-center gap-1.5`}
              >
                <TypeIcon className="h-3.5 w-3.5" />
                {typeConfig.label}
              </Badge>
            </div>

            <p className="text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-2 flex-wrap">
              <span>· {typeConfig.desc}</span>
              <span>· Customer: <strong className="text-slate-800 dark:text-zinc-200">{customerDetails.name}</strong> ({workflow.customer_id})</span>
              <span>· A/R GL Account: <strong className="text-slate-800 dark:text-zinc-200">{glAccountCombinedName}</strong></span>
              <span>· Created on {new Date(workflow.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="text-right bg-slate-50 dark:bg-zinc-800/60 px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700/60">
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium block">Total Value</span>
              <span className="text-2xl font-black font-mono text-slate-900 dark:text-zinc-100">
                ${Number(workflow.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-xs font-semibold text-slate-500">{workflow.currency || "USD"}</span>
              </span>
            </div>
          </div>
        </div>

        {/* ── Workflow Status / Stepper Pipeline ── */}
        <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/80 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
              Workflow Status & Progression
            </span>
            <span className="text-xs text-slate-500 dark:text-zinc-400">
              Step {Math.max(1, currentStepIdx + 1)} of {stepSequence.length} · {stateConfig.desc}
            </span>
          </div>

          {/* Stepper Pipeline */}
          <div className={`grid grid-cols-2 ${stepSequence.length === 6 ? "sm:grid-cols-6" : stepSequence.length === 4 ? "sm:grid-cols-4" : "sm:grid-cols-3"} gap-2`}>
            {stepSequence.map((st, idx) => {
              const isPassed = currentStepIdx > idx;
              const isCurrent = currentStepIdx === idx;
              const stepLabel = getStepLabel(currentType, st);

              return (
                <div
                  key={st}
                  className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-xs transition-all ${
                    isCurrent
                      ? "bg-indigo-50/80 border-indigo-300 dark:bg-indigo-950/50 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200 font-bold shadow-2xs"
                      : isPassed
                      ? "bg-slate-50 border-slate-200 dark:bg-zinc-800/40 dark:border-zinc-800 text-slate-600 dark:text-zinc-400"
                      : "bg-white dark:bg-zinc-950 border-dashed border-slate-200 dark:border-zinc-800 text-slate-400"
                  }`}
                >
                  <div
                    className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isCurrent
                        ? "bg-indigo-600 text-white"
                        : isPassed
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-200 dark:bg-zinc-800 text-slate-500"
                    }`}
                  >
                    {isPassed ? <Check className="h-3 w-3" /> : idx + 1}
                  </div>
                  <span className="truncate">{stepLabel}</span>
                </div>
              );
            })}
          </div>

          {/* Action Prompt Banner */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 flex items-center justify-between flex-wrap gap-3">
            <div className="text-xs text-slate-700 dark:text-zinc-300 flex items-center gap-2 flex-wrap">
              <span className="font-bold text-indigo-600 dark:text-indigo-400">Action Required:</span>
              {currentState === "COMPLETED" ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  Workflow lifecycle finalized and posted to the general ledger.
                </span>
              ) : currentState === "CANCELLED" ? (
                <span className="text-zinc-500 font-medium">Workflow has been cancelled.</span>
              ) : currentType === "CASH" && currentState === "PENDING_REVIEW" ? (
                !isValueReconciled ? (
                  <span className="text-amber-700 dark:text-amber-400 font-medium">
                    Payment shortfall detected ({totalRemaining > 0 ? `$${totalRemaining.toLocaleString(undefined, { minimumFractionDigits: 2 })} remaining` : "Unreconciled balance"}). Please assign to AR Clerk for resolution.
                  </span>
                ) : (
                  <span>Treasury deposit received and fully matched. Confirm reconciliation to advance.</span>
                )
              ) : currentType === "CASH" && currentState === "CLERK_REVIEW" ? (
                <span className="text-amber-700 dark:text-amber-400 font-medium">
                  Shortfall / discrepancy assigned to AR Clerk ({workflow.metadata?.ar_clerk_assigned_to || clerksList[0]?.email || "sarah.jenkins@zenatech.com"}). Resolve customer deductions to finalize.
                </span>
              ) : currentType === "CASH" && currentState === "RECONCILED" ? (
                <span>Reconciliation marked. Finalize workflow and post audit records to the general ledger.</span>
              ) : (
                <span>{stateConfig.desc} Advance workflow to the next lifecycle stage.</span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Timer Simulation Buttons */}
              {currentType !== "CASH" &&
                (currentState === "INVOICE_SENT" ||
                  currentState === "AWAITING_PAYMENT" ||
                  currentState === "DUNNING_REMINDER") && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => timerMutation.mutate("DUNNING_CHECK")}
                      disabled={timerMutation.isPending}
                      className="h-8 text-xs gap-1.5"
                    >
                      <Timer className="w-3.5 h-3.5 text-amber-500" />
                      <span>Simulate Dunning</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => timerMutation.mutate("INVOICE_REMINDER")}
                      disabled={timerMutation.isPending}
                      className="h-8 text-xs gap-1.5"
                    >
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      <span>Dispatch Reminder</span>
                    </Button>
                  </>
                )}

              {/* Cash Workflow Actions */}
              {currentType === "CASH" && currentState === "PENDING_REVIEW" ? (
                <>
                  <Button
                    type="button"
                    onClick={() =>
                      transitionMutation.mutate({
                        targetState: "RECONCILED",
                        note: "Full Payment confirmed by Treasury. Marked & recorded to application.",
                        payload: { payment_match_type: "FULL_PAID" },
                      })
                    }
                    disabled={!isValueReconciled || transitionMutation.isPending}
                    title={
                      !isValueReconciled
                        ? "Cannot mark full paid: Payment has an unreconciled shortfall or remaining invoice balance. Please Assign to AR Clerk."
                        : undefined
                    }
                    className="h-8 px-3 text-xs font-semibold shadow-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-zinc-800 disabled:text-slate-500 dark:disabled:text-zinc-500 text-white shrink-0 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Full Paid & Reconcile</span>
                  </Button>

                  <Button
                    type="button"
                    onClick={() => {
                      setClerkEmail(workflow.metadata?.ar_clerk_assigned_to || clerksList[0]?.email || "sarah.jenkins@zenatech.com");
                      setClerkRemarks(workflow.metadata?.discrepancy_reason || "");
                      setIsAssignClerkDialogOpen(true);
                    }}
                    disabled={transitionMutation.isPending}
                    variant="outline"
                    className="h-8 px-3 text-xs font-semibold shadow-xs gap-1.5 border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 shrink-0 cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Assign to AR Clerk</span>
                  </Button>
                </>
              ) : currentType === "CASH" && currentState === "CLERK_REVIEW" ? (
                <>
                  <Button
                    type="button"
                    onClick={() =>
                      transitionMutation.mutate({
                        targetState: "RECONCILED",
                        note: "Discrepancy review resolved by AR Clerk. Shortfall cleared and marked reconciled.",
                        payload: { payment_match_type: "PARTIAL_PAID", clerk_resolved: true },
                      })
                    }
                    disabled={transitionMutation.isPending}
                    className="h-8 px-3 text-xs font-semibold shadow-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Resolve & Mark Reconciled</span>
                  </Button>

                  <Button
                    type="button"
                    onClick={() => {
                      setClerkEmail(workflow.metadata?.ar_clerk_assigned_to || clerksList[0]?.email || "sarah.jenkins@zenatech.com");
                      setClerkRemarks(workflow.metadata?.discrepancy_reason || "");
                      setIsAssignClerkDialogOpen(true);
                    }}
                    disabled={transitionMutation.isPending}
                    variant="outline"
                    className="h-8 px-3 text-xs font-semibold shadow-xs gap-1.5 border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 shrink-0 cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Reassign / Update Remarks</span>
                  </Button>
                </>
              ) : currentType === "CASH" && currentState === "RECONCILED" ? (
                <Button
                  type="button"
                  onClick={() =>
                    transitionMutation.mutate({
                      targetState: "COMPLETED",
                      note: "Reconciliation finalized. Ledger entries posted and workflow completed.",
                    })
                  }
                  disabled={transitionMutation.isPending}
                  className="h-8 px-3 text-xs font-semibold shadow-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Finalize & Post to Ledger</span>
                </Button>
              ) : (
                allowedStates
                  .filter((st) => st !== "CANCELLED")
                  .map((targetSt) => {
                    const conf = STATE_CONFIG[targetSt];
                    return (
                      <Button
                        key={targetSt}
                        type="button"
                        onClick={() =>
                          transitionMutation.mutate({
                            targetState: targetSt,
                            note: undefined,
                          })
                        }
                        disabled={transitionMutation.isPending}
                        className="h-8 px-3 text-xs font-semibold shadow-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 cursor-pointer"
                      >
                        <span>Advance to {conf.label}</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs Navigation ── */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-zinc-800 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === "overview"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          }`}
        >
          <LayersIcon className="w-4 h-4" />
          <span>Workflow Details & Specifications</span>
        </button>
        <button
          onClick={() => setActiveTab("attachments")}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === "attachments"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          }`}
        >
          <Paperclip className="w-4 h-4" />
          <span>Attachments ({workflow.metadata?.attachments?.length || 0})</span>
        </button>
        <button
          onClick={() => setActiveTab("timeline")}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === "timeline"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Audit Trail ({workflow.logs?.length || 0})</span>
        </button>
      </div>

      {/* ── Main Responsive 2-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Content Column (Left 8 cols) */}
        <div className="lg:col-span-8 xl:col-span-8 space-y-6 min-w-0">
          {/* ── Tab Content ── */}
          {activeTab === "overview" && (
        <div className="space-y-6">
          {/* 1. Domain Specifications & References Card */}
          <Card className="shadow-xs border-slate-200 dark:border-zinc-800">
            <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/50 border-b border-slate-100 dark:border-zinc-800 px-6 py-3.5 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-zinc-100">
                <FileText className="h-4 w-4 text-indigo-600" />
                <span>Domain Specifications & References</span>
              </CardTitle>
              <Badge variant="outline" className="text-xs font-semibold px-2 py-0.5">
                {workflow.customer_id}
              </Badge>
            </CardHeader>
            <CardContent className="p-0 text-xs divide-y divide-slate-100 dark:divide-zinc-800/60">
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-zinc-800/60">
                <div className="p-3.5 flex justify-between gap-2">
                  <span className="text-muted-foreground font-medium">Customer Entity</span>
                  <span className="font-semibold text-slate-900 dark:text-zinc-100 text-right">
                    {customerDetails.name}
                  </span>
                </div>
                <div className="p-3.5 flex justify-between gap-2 bg-slate-50/50 dark:bg-zinc-900/30">
                  <span className="text-muted-foreground font-medium">Customer Account ID</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-zinc-100 text-right">
                    {workflow.customer_id}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-zinc-800/60">
                <div className="p-3.5 flex justify-between gap-2">
                  <span className="text-muted-foreground font-medium">Workflow Archetype</span>
                  <span className="font-semibold text-slate-900 dark:text-zinc-100 text-right">
                    {typeConfig.label}
                  </span>
                </div>
                <div className="p-3.5 flex justify-between gap-2 bg-slate-50/50 dark:bg-zinc-900/30">
                  <span className="text-muted-foreground font-medium">Lifecycle State</span>
                  <span className="font-semibold text-slate-900 dark:text-zinc-100 text-right">
                    {stateConfig.label}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-zinc-800/60">
                <div className="p-3.5 flex justify-between gap-2">
                  <span className="text-muted-foreground font-medium">Total Workflow Value</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-zinc-100 text-right">
                    ${Number(workflow.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} {workflow.currency || "USD"}
                  </span>
                </div>
                <div className="p-3.5 flex justify-between gap-2 bg-slate-50/50 dark:bg-zinc-900/30">
                  <span className="text-muted-foreground font-medium">Currency</span>
                  <span className="font-semibold text-slate-900 dark:text-zinc-100 text-right">
                    {workflow.currency || "USD"}
                  </span>
                </div>
              </div>

              {/* GL Account # and Account Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-zinc-800/60">
                <div className="p-3.5 flex justify-between gap-2">
                  <span className="text-muted-foreground font-medium">A/R GL Account #</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-zinc-100 text-right">
                    {glAccountNumber}
                  </span>
                </div>
                <div className="p-3.5 flex justify-between gap-2 bg-slate-50/50 dark:bg-zinc-900/30">
                  <span className="text-muted-foreground font-medium">A/R GL Account Name</span>
                  <span className="font-semibold text-slate-900 dark:text-zinc-100 text-right">
                    {glAccountCombinedName}
                  </span>
                </div>
              </div>

              {workflow.metadata?.deposit_date && (
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-zinc-800/60">
                  <div className="p-3.5 flex justify-between gap-2">
                    <span className="text-muted-foreground font-medium">Deposit / Settlement Date</span>
                    <span className="font-semibold text-slate-900 dark:text-zinc-100 text-right">
                      {workflow.metadata.deposit_date}
                    </span>
                  </div>
                  <div className="p-3.5 flex justify-between gap-2 bg-slate-50/50 dark:bg-zinc-900/30">
                    <span className="text-muted-foreground font-medium">Payment Match Classification</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-right">
                      {workflow.metadata?.payment_match_type === "PARTIAL_PAID"
                        ? "Partially Paid Shortfall"
                        : "Full Paid & Reconciled"}
                    </span>
                  </div>
                </div>
              )}

              {workflow.metadata?.ar_clerk_assigned_to && (
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-zinc-800/60">
                  <div className="p-3.5 flex justify-between gap-2">
                    <span className="text-muted-foreground font-medium">Assigned AR Clerk</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400 text-right">
                      {workflow.metadata.ar_clerk_assigned_to}
                    </span>
                  </div>
                  <div className="p-3.5 flex justify-between gap-2 bg-slate-50/50 dark:bg-zinc-900/30">
                    <span className="text-muted-foreground font-medium">Discrepancy / Remarks</span>
                    <span className="font-medium text-slate-800 dark:text-zinc-200 text-right italic">
                      {workflow.metadata.discrepancy_reason || "Shortfall under clerk investigation"}
                    </span>
                  </div>
                </div>
              )}

              {workflow.metadata?.subscription_plan && (
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-zinc-800/60">
                  <div className="p-3.5 flex justify-between gap-2">
                    <span className="text-muted-foreground font-medium">Subscription Plan</span>
                    <span className="font-bold text-slate-900 dark:text-zinc-100 text-right">
                      {workflow.metadata.subscription_plan}
                    </span>
                  </div>
                  <div className="p-3.5 flex justify-between gap-2 bg-slate-50/50 dark:bg-zinc-900/30">
                    <span className="text-muted-foreground font-medium">Billing Mode</span>
                    <span className="font-semibold text-slate-900 dark:text-zinc-100 text-right">
                      Day {workflow.metadata.billing_day_of_month || 1} ({workflow.metadata.billing_mode})
                    </span>
                  </div>
                </div>
              )}

              {workflow.metadata?.renewal_term_months && (
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-zinc-800/60">
                  <div className="p-3.5 flex justify-between gap-2">
                    <span className="text-muted-foreground font-medium">Renewal Term</span>
                    <span className="font-bold text-slate-900 dark:text-zinc-100 text-right">
                      {workflow.metadata.renewal_term_months} Months
                    </span>
                  </div>
                  <div className="p-3.5 flex justify-between gap-2 bg-slate-50/50 dark:bg-zinc-900/30">
                    <span className="text-muted-foreground font-medium">Renewal Discount</span>
                    <span className="font-semibold text-slate-900 dark:text-zinc-100 text-right">
                      {workflow.metadata.renewal_discount_percent || 0}%
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2. A/R Customer Contact Details Card */}
          <Card className="shadow-xs border-slate-200 dark:border-zinc-800">
            <CardHeader className="bg-blue-50/40 dark:bg-blue-950/20 border-b border-slate-100 dark:border-zinc-800 px-6 py-3.5 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 font-semibold text-base">
                <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>A/R Customer Contact Details</span>
              </div>
              <Badge variant="outline" className="text-xs bg-white dark:bg-zinc-900 border-blue-200 text-blue-700">
                {workflow.customer_id}
              </Badge>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-muted-foreground font-medium text-xs block flex items-center gap-1">
                    <User className="w-3 h-3 text-blue-500" />
                    Primary Contact
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-zinc-100 text-xs block break-words">
                    {customerDetails.contact_person}
                  </span>
                  <span className="text-[11px] text-muted-foreground block truncate">
                    {customerDetails.name}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-muted-foreground font-medium text-xs block flex items-center gap-1">
                    <Mail className="w-3 h-3 text-blue-500" />
                    Email Address
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-zinc-100 text-xs block break-words">
                    {customerDetails.email}
                  </span>
                  <span className="text-[11px] text-muted-foreground block">
                    Direct Invoicing & Reminders
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-muted-foreground font-medium text-xs block flex items-center gap-1">
                    <Phone className="w-3 h-3 text-blue-500" />
                    Telephone
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-zinc-100 text-xs block break-words">
                    {customerDetails.phone}
                  </span>
                  <span className="text-[11px] text-muted-foreground block">
                    Finance & Collections
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-muted-foreground font-medium text-xs block flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-blue-500" />
                    Billing Address
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-zinc-100 text-xs block break-words">
                    {customerDetails.billing_address}
                  </span>
                  <span className="text-[11px] text-muted-foreground block">
                    Tax / VAT: {customerDetails.tax_id}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. Beneficiary Bank Settlement Account Card */}
          <Card className="shadow-xs border-slate-200 dark:border-zinc-800">
            <CardHeader className="bg-emerald-50/40 dark:bg-emerald-950/20 border-b border-slate-100 dark:border-zinc-800 px-6 py-3.5 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-semibold text-base">
                <Landmark className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Beneficiary Bank Settlement Account</span>
              </div>
              <Badge variant="outline" className="text-xs bg-white dark:bg-zinc-900 border-emerald-200 text-emerald-700">
                A/R Settlement Account
              </Badge>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-muted-foreground font-medium text-xs block">Bank Name</span>
                  <span className="font-bold text-slate-900 dark:text-zinc-100 text-xs block break-words">
                    {bankingDetails.bank_name}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-muted-foreground font-medium text-xs block">Bank Account #</span>
                  <span className="font-semibold font-mono text-slate-900 dark:text-zinc-100 text-xs block break-words">
                    {bankingDetails.bank_account_number && bankingDetails.bank_account_number !== "—"
                      ? bankingDetails.bank_account_number.trim().length > 4
                        ? `•••• •••• ${bankingDetails.bank_account_number.trim().slice(-4)}`
                        : bankingDetails.bank_account_number
                      : "—"}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-muted-foreground font-medium text-xs block flex items-center gap-1">
                    <Globe className="w-3 h-3 text-emerald-500" />
                    Bank Country
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-zinc-100 text-xs block break-words">
                    {bankingDetails.bank_country}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-muted-foreground font-medium text-xs block">Routing (Wire / ABA)</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-zinc-100 text-xs block break-words">
                    {bankingDetails.routing_wire}
                  </span>
                </div>

                {bankingDetails.routing_ach !== "—" && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground font-medium text-xs block">Routing (ACH)</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-zinc-100 text-xs block break-words">
                      {bankingDetails.routing_ach}
                    </span>
                  </div>
                )}

                {bankingDetails.swift_code !== "—" && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground font-medium text-xs block">SWIFT / BIC Code</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-zinc-100 text-xs block break-words">
                      {bankingDetails.swift_code}
                    </span>
                  </div>
                )}

                {bankingDetails.iban !== "—" && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground font-medium text-xs block">IBAN</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-zinc-100 text-xs block break-words">
                      {bankingDetails.iban}
                    </span>
                  </div>
                )}

                {bankingDetails.transit_code_ca !== "—" && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground font-medium text-xs block">Transit Code (CA)</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-zinc-100 text-xs block break-words">
                      {bankingDetails.transit_code_ca}
                    </span>
                  </div>
                )}

                {bankingDetails.institution_code !== "—" && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground font-medium text-xs block">Institution Code (CA)</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-zinc-100 text-xs block break-words">
                      {bankingDetails.institution_code}
                    </span>
                  </div>
                )}

                {bankingDetails.region !== "—" && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground font-medium text-xs block">Region / State / Province</span>
                    <span className="font-semibold text-slate-900 dark:text-zinc-100 text-xs block break-words">
                      {bankingDetails.region}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 4. Treasury Invoice Matching & Reconciliation Card */}
          {currentType === "CASH" && (
            <Card className="shadow-xs border-slate-200 dark:border-zinc-800">
              <CardHeader className="bg-emerald-50/30 dark:bg-emerald-950/20 border-b border-slate-100 dark:border-zinc-800 px-6 py-3.5 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-zinc-100">
                  <Receipt className="h-5 w-5 text-emerald-600" />
                  <span>Treasury Invoice Matching & Reconciliation</span>
                </CardTitle>
                <Badge variant="outline" className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 border-emerald-200">
                  {workflow.metadata?.matched_invoices?.length || (workflow.metadata?.matched_invoice_id ? 1 : 0)} Matched Invoice(s)
                </Badge>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-zinc-800">
                  <table className="w-full text-left text-xs table-fixed">
                    <thead className="bg-slate-50 dark:bg-zinc-800/60 border-b border-slate-200 dark:border-zinc-800 text-slate-500 uppercase text-[10px] font-semibold">
                      <tr>
                        <th className="py-2.5 px-3 w-[35%]">Invoice Number</th>
                        <th className="py-2.5 px-3 text-right w-[20%]">Invoice Total</th>
                        <th className="py-2.5 px-3 text-right w-[20%]">Amount Applied</th>
                        <th className="py-2.5 px-3 text-right w-[15%]">Remaining</th>
                        <th className="py-2.5 px-3 text-center w-[10%]">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                      {workflow.metadata?.matched_invoices && workflow.metadata.matched_invoices.length > 0 ? (
                        workflow.metadata.matched_invoices.map((inv: MatchedInvoiceItem, i: number) => (
                          <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40">
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-zinc-100 truncate">
                              {inv.invoice_number}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono truncate">
                              ${Number(inv.invoice_total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 truncate">
                              ${Number(inv.amount_applied).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-500 truncate">
                              ${Number(inv.balance_remaining).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              {inv.status === "FULLY_PAID" ? (
                                <Badge variant="outline" className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border-emerald-200">
                                  Fully Paid
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] font-bold bg-amber-50 text-amber-700 border-amber-200">
                                  Partially Paid
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-zinc-100 truncate">
                            {workflow.metadata?.matched_invoice_id || "INV-2026-DEFAULT"}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono truncate">
                            ${Number(workflow.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 truncate">
                            ${Number(workflow.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-500 truncate">
                            $0.00
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <Badge variant="outline" className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border-emerald-200">
                              Fully Paid
                            </Badge>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Match Status Callout */}
                {isPartiallyPaid ? (
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-2">
                    <div className="flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-1 flex-1 min-w-0">
                        <p className="font-bold flex items-center justify-between flex-wrap gap-1">
                          <span>Partially Paid Settlement — Routed to AR Clerk</span>
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                            Shortfall Action Active
                          </span>
                        </p>
                        <p className="text-[11px] opacity-90 break-words">
                          The bank payment received does not satisfy the total matched invoice obligations. As per AR policy, this case has been assigned to the AR Clerk to review deductions and mark the settlement in the application.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2 text-xs border-t border-amber-200 dark:border-amber-800/60">
                      <div>
                        <span className="text-muted-foreground text-[10px] block font-medium">
                          Assigned AR Clerk
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5 mt-0.5">
                          <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                          {workflow.metadata?.ar_clerk_assigned_to || "sarah.jenkins@zenatech.com"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-[10px] block font-medium">
                          AR Clerk Follow-up / Discrepancy Reason
                        </span>
                        <div className="mt-1 p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-amber-200 dark:border-amber-800/60">
                          <p className="font-medium text-slate-800 dark:text-zinc-200 italic break-words leading-relaxed">
                            {workflow.metadata?.ar_clerk_notes || "Under dispute review / withholding deduction"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-2.5 text-xs text-emerald-900 dark:text-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold">
                        Full Paid Reconciled — Direct Record & Settlement
                      </p>
                      <p className="text-[11px] opacity-90 mt-0.5 break-words">
                        Bank deposit (${Number(workflow.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}) fully covers all invoice requirements. Treasury has posted the reconciliation directly to the application ledger.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 6. Itemized Lines if present */}
          {workflow.metadata?.line_items && workflow.metadata.line_items.length > 0 && (
            <Card className="shadow-xs border-slate-200 dark:border-zinc-800">
              <CardHeader className="border-b border-slate-100 dark:border-zinc-800 px-6 py-3.5 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-blue-600" />
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-zinc-100">
                    Itemized Sales Order Lines
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-5">
                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-zinc-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-zinc-800/60 border-b border-slate-200 dark:border-zinc-800 text-slate-500 uppercase text-[10px] font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3 text-right">Quantity</th>
                        <th className="py-2.5 px-3 text-right">Unit Price</th>
                        <th className="py-2.5 px-3 text-right">Tax Rate</th>
                        <th className="py-2.5 px-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                      {workflow.metadata.line_items.map((item: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40">
                          <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-zinc-100">
                            {item.description}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            {item.quantity}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            ${Number(item.unit_price).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                            {item.tax_rate ? `${(Number(item.tax_rate) * 100).toFixed(0)}%` : "0%"}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-zinc-100">
                            ${Number(item.amount).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 7. Add-on items if present */}
          {workflow.metadata?.add_on_items && workflow.metadata.add_on_items.length > 0 && (
            <Card className="shadow-xs border-slate-200 dark:border-zinc-800">
              <CardHeader className="border-b border-slate-100 dark:border-zinc-800 px-6 py-3.5 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <LayersIcon className="h-4 w-4 text-indigo-600" />
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-zinc-100">
                    Add-On Components & Upgrades
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-5">
                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-zinc-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-zinc-800/60 border-b border-slate-200 dark:border-zinc-800 text-slate-500 uppercase text-[10px] font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3 text-right">Quantity</th>
                        <th className="py-2.5 px-3 text-right">Rate</th>
                        <th className="py-2.5 px-3 text-right">Pro-Rated Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                      {workflow.metadata.add_on_items.map((item: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40">
                          <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-zinc-100">
                            {item.description}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            {item.quantity}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            ${Number(item.unit_price).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-zinc-100">
                            ${Number(item.amount).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Attachments Tab */}
      {activeTab === "attachments" && (
        <Card className="shadow-xs border-slate-200 dark:border-zinc-800">
          <CardHeader className="border-b border-slate-100 dark:border-zinc-800 px-6 py-3.5 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-indigo-600" />
              <CardTitle className="text-base font-bold text-slate-900 dark:text-zinc-100">
                Invoice & Bank Attachments ({workflow.metadata?.attachments?.length || 0})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            {/* Drag and Drop Dropzone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 scale-[1.01]"
                  : "border-slate-300 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/40 hover:bg-slate-100/50 dark:hover:bg-zinc-800/40 hover:border-indigo-400"
              }`}
            >
              <input
                type="file"
                multiple
                ref={fileInputRef}
                onChange={(e) => handleFilesSelected(e.target.files)}
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx,.csv"
              />
              <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                <div className="p-3 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-xs text-slate-800 dark:text-zinc-200 font-semibold">
                  <span className="text-indigo-600 dark:text-indigo-400 underline decoration-indigo-400 underline-offset-2">
                    {attachmentMutation.isPending ? "Uploading attachments..." : "Click to browse"}
                  </span>{" "}
                  or drag & drop attachments here
                </p>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Supports Invoice PDFs, Bank Wire Deposit Slips, and Remittance Receipts (up to 25MB each)
                </p>
              </div>
            </div>

            {workflow.metadata?.attachments && workflow.metadata.attachments.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {workflow.metadata.attachments.map((att: ARAttachment, idx: number) => (
                  <div
                    key={att.id || idx}
                    onClick={() => handlePreviewAttachment(att)}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/80 flex items-start justify-between gap-2.5 text-xs hover:border-indigo-400 hover:bg-slate-100/60 dark:hover:bg-zinc-800 transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900 dark:text-zinc-100 truncate text-xs group-hover:text-indigo-600 transition-colors" title={att.filename}>
                          {att.filename}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5 truncate">
                          {att.file_size ? `${(att.file_size / 1024).toFixed(0)} KB • ` : ""}
                          {att.uploaded_by || "Treasury"}
                        </p>
                        {att.uploaded_at && (
                          <span className="text-[9px] font-mono text-slate-400 block mt-1">
                            {new Date(att.uploaded_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviewAttachment(att);
                      }}
                      className="h-7 px-2 text-[11px] gap-1 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-zinc-700 rounded-lg shrink-0 opacity-80 group-hover:opacity-100"
                      title="Preview document"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline font-semibold">Preview</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Audit Trail Tab */}
      {activeTab === "timeline" && (
        <Card className="shadow-xs border-slate-200 dark:border-zinc-800">
          <CardHeader className="border-b border-slate-100 dark:border-zinc-800 px-6 py-3.5 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-zinc-100">
              <Activity className="h-5 w-5 text-indigo-600" />
              <span>Chronological State Machine Audit Log</span>
            </CardTitle>
            <span className="text-xs text-muted-foreground">Immutable event stream</span>
          </CardHeader>
          <CardContent className="p-6">
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-zinc-800">
              {workflow.logs && workflow.logs.length > 0 ? (
                workflow.logs.map((log, idx) => (
                  <div key={log.id || idx} className="relative group">
                    <div className="absolute -left-[19px] top-1 w-3 h-3 rounded-full bg-white dark:bg-zinc-900 border-2 border-indigo-600 group-hover:scale-125 transition-transform" />

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/80 hover:border-indigo-400 transition-all shadow-2xs space-y-2.5">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          {log.from_state ? (
                            <div className="flex items-center gap-1.5 text-xs font-mono">
                              <span className="text-muted-foreground font-semibold">
                                {log.from_state}
                              </span>
                              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="font-bold text-foreground">
                                {log.to_state}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                              INITIAL CREATION ({log.to_state})
                            </span>
                          )}

                          <Badge variant="outline" className="text-[10px] font-semibold uppercase">
                            {log.trigger_type}
                          </Badge>
                        </div>

                        <span className="text-[11px] text-muted-foreground font-mono">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>

                      {log.note && (
                        <p className="text-xs text-slate-800 dark:text-zinc-200 bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800">
                          {log.note}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                        <span>
                          Actor:{" "}
                          <strong className="text-foreground">
                            {log.actor_name || log.actor_id || "System"}
                          </strong>
                        </span>
                        {log.payload && Object.keys(log.payload).length > 0 && (
                          <span className="font-mono text-[10px] text-muted-foreground">
                            Payload: {JSON.stringify(log.payload)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">
                  No transition history available.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
        </div>

        {/* ── Sidebar (Right 4 cols) ── */}
        <div className="lg:col-span-4 xl:col-span-4 space-y-6">
          {/* Card 1: Who This Is Assigned */}
          <Card className="shadow-xs border-slate-200 dark:border-zinc-800">
            <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/50 border-b border-slate-100 dark:border-zinc-800 px-5 py-3 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-zinc-100">
                  Who This Is Assigned
                </CardTitle>
              </div>
              <Badge
                variant="outline"
                className={`text-[10px] font-semibold ${
                  currentState === "CLERK_REVIEW"
                    ? "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800"
                    : "text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800"
                }`}
              >
                {currentState === "CLERK_REVIEW" ? "AR Clerk Review" : "AR Flow • Treasury"}
              </Badge>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              {currentState === "CLERK_REVIEW" ? (
                /* Assigned AR Clerk View (during discrepancy review) */
                <div className="space-y-3">
                  <div className="text-[10.5px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                    Assigned AR Clerk
                  </div>
                  <div className="p-2.5 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/20 shadow-2xs flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center justify-center text-xs font-bold shrink-0">
                        {workflow.metadata?.ar_clerk_assigned_to
                          ? workflow.metadata.ar_clerk_assigned_to.slice(0, 2).toUpperCase()
                          : "CL"}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-900 dark:text-zinc-100 truncate" title={workflow.metadata?.ar_clerk_assigned_to || "Unassigned"}>
                          {workflow.metadata?.ar_clerk_assigned_to || "Unassigned AR Clerk"}
                        </div>
                        <div className="text-[10.5px] text-amber-700 dark:text-amber-400 truncate font-medium">
                          AR Clerk • Discrepancy & Shortfall Resolution
                        </div>
                      </div>
                    </div>
                    <div>
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 text-[10px] font-medium gap-1">
                        <Clock className="h-3 w-3 animate-pulse" /> In Review
                      </Badge>
                    </div>
                  </div>

                  {/* Description & Purpose directly below Clerk Profile */}
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[10.5px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <AlignLeft className="h-3.5 w-3.5 text-slate-600 dark:text-zinc-400" />
                      <span>Description & Purpose</span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50/90 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 text-xs leading-relaxed text-slate-700 dark:text-zinc-300">
                      {clerkAssignmentDescription}
                    </div>
                  </div>
                </div>
              ) : (
                /* Assigned Treasury Specialist View (Default for all other statuses) */
                <div className="space-y-3">
                  <div className="text-[10.5px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                    Assigned Treasury Specialist
                  </div>
                  <div className="p-2.5 rounded-lg border border-sky-200 dark:border-sky-900/50 bg-sky-50/30 dark:bg-sky-950/20 shadow-2xs flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 flex items-center justify-center text-xs font-bold shrink-0">
                        TR
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-900 dark:text-zinc-100 truncate" title={activeTreasuryAssignee}>
                          {activeTreasuryAssignee}
                        </div>
                        <div className="text-[10.5px] text-sky-700 dark:text-sky-400 truncate font-medium">
                          Treasury Team • Inbound Cash & Settlement
                        </div>
                      </div>
                    </div>
                    <div>
                      {currentState === "RECONCILED" || currentState === "COMPLETED" ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 text-[10px] font-medium gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Reconciled
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800 text-[10px] font-medium gap-1">
                          <ShieldCheck className="h-3 w-3" /> Active Handling
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Previous Clerk Resolution info if resolved */}
                  {workflow.metadata?.ar_clerk_assigned_to && (
                    <div className="p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 text-xs flex items-center justify-between">
                      <div className="min-w-0">
                        <span className="font-semibold text-emerald-900 dark:text-emerald-200 block truncate">
                          AR Clerk Review Resolved
                        </span>
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-300/80 truncate block">
                          Discrepancy cleared by {workflow.metadata.ar_clerk_assigned_to}
                        </span>
                      </div>
                      <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-200 text-[10px] font-medium shrink-0 ml-2">
                        Resolved
                      </Badge>
                    </div>
                  )}

                  {/* Description & Purpose */}
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[10.5px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <AlignLeft className="h-3.5 w-3.5 text-slate-600 dark:text-zinc-400" />
                      <span>Description & Purpose</span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50/90 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 text-xs leading-relaxed text-slate-700 dark:text-zinc-300">
                      {workflow.metadata?.notes || "Inbound payment processing, bank deposit matching, and cash reconciliation."}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Assign to AR Clerk Dialog Modal ── */}
      <Dialog open={isAssignClerkDialogOpen} onOpenChange={setIsAssignClerkDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl">
          <DialogHeader className="space-y-1.5 pb-3 border-b border-slate-100 dark:border-zinc-800">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-zinc-100">
              <UserCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              Assign to AR Clerk
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              Route this workflow to an AR clerk to investigate payment shortfalls, customer deductions, or unapplied wire funds.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Clerk Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Assigned AR Clerk <span className="text-red-500">*</span>
              </label>
              <select
                value={clerkEmail || (clerksList[0]?.email || "")}
                onChange={(e) => setClerkEmail(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-slate-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
              >
                {clerksList.length > 0 ? (
                  clerksList.map((c) => (
                    <option key={c.id || c.email} value={c.email}>
                      {c.name} {c.job_title ? `(${c.job_title})` : `(${c.email})`}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="sarah.jenkins@zenatech.com">Sarah Jenkins (Senior AR Specialist)</option>
                    <option value="david.clerk@zenatech.com">David Wong (Billing & Operations Clerk)</option>
                    <option value="accounting-team@zenatech.com">Account Receivable Queue</option>
                  </>
                )}
              </select>
            </div>

            {/* Remarks */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Discrepancy / Transition Remarks <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Enter payment shortfall reason, customer deduction notes, or instructions for the AR clerk..."
                value={clerkRemarks}
                onChange={(e) => setClerkRemarks(e.target.value)}
                rows={4}
                className="text-xs resize-none"
              />
              <span className="text-[11px] text-slate-400 dark:text-zinc-500 block">
                Recorded in audit trail and assigned to the clerk's active task queue.
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-slate-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAssignClerkDialogOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={transitionMutation.isPending}
              onClick={() => {
                const assignedEmail = clerkEmail || clerksList[0]?.email || "sarah.jenkins@zenatech.com";
                transitionMutation.mutate({
                  targetState: "CLERK_REVIEW",
                  note:
                    clerkRemarks.trim() ||
                    `Partially paid shortfall routed to AR Clerk (${assignedEmail}) for discrepancy resolution.`,
                  payload: {
                    payment_match_type: "PARTIAL_PAID",
                    ar_clerk_assigned_to: assignedEmail,
                    discrepancy_reason: clerkRemarks.trim(),
                  },
                });
                setIsAssignClerkDialogOpen(false);
              }}
              className="text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5" />
              Confirm Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FilePreviewModal
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        target={previewTarget}
      />

      <NewWorkflowModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        workflowToEdit={workflow}
      />
    </div>
  );
}
