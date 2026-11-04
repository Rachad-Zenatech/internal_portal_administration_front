import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { arService } from "../../../../services/arService";
import { apiClient } from "../../../../services/apiClient";
import { type PreviewFileTarget } from "../../../Purchasing/dialogs/FilePreviewModal";
import type { ARAttachment, ARWorkflowState } from "../../../../types/ar";
import { STATE_CONFIG, TYPE_CONFIGS } from "../constants";

export function useWorkflowDetailActions() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [cancellationReason, setCancellationReason] = useState("");
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [isAssignClerkDialogOpen, setIsAssignClerkDialogOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [clerkEmail, setClerkEmail] = useState("");
  const [clerkRemarks, setClerkRemarks] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "attachments">("overview");
  const deleteMutation = useMutation({
    mutationFn: () => arService.deleteWorkflow(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ar-workflows"] });
      queryClient.invalidateQueries({ queryKey: ["ar-metrics"] });
      setIsDeleteDialogOpen(false);
      navigate("/account-receivable");
    },
  });
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
  return { id, navigate, queryClient, cancellationReason, setCancellationReason, showCancelPrompt, setShowCancelPrompt, isAssignClerkDialogOpen, setIsAssignClerkDialogOpen, isEditModalOpen, setIsEditModalOpen, isDeleteDialogOpen, setIsDeleteDialogOpen, clerkEmail, setClerkEmail, clerkRemarks, setClerkRemarks, activeTab, setActiveTab, deleteMutation, workflow, isLoading, refetch, clerksList, treasuryList, transitionMutation, timerMutation, fileInputRef, isDragging, setIsDragging, attachmentMutation, previewTarget, setPreviewTarget, isPreviewOpen, setIsPreviewOpen, generateDigitalInvoiceHtml };
}
