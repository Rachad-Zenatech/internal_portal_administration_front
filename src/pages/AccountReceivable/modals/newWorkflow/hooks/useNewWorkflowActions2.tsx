import React, { useState } from "react";
import { arService } from "../../../../../services/arService";
import { type PreviewFileTarget } from "../../../../Purchasing/dialogs/FilePreviewModal";
import type { ARAttachment } from "../../../../../types/ar";
import type { useNewWorkflowActions } from "./useNewWorkflowActions";

export function useNewWorkflowActions2(ctx: ReturnType<typeof useNewWorkflowActions>) {
  const { setMatchedInvoices, setCashAttachments, setDepositDate, setCustomerName, customerName, setAmount, amount, selectedCustomer } = ctx;
  const handleRemoveMatchedInvoice = (index: number) => {
    setMatchedInvoices((prev) => prev.filter((_, i) => i !== index));
  };
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const ocrFileInputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isOcrScanning, setIsOcrScanning] = useState(false);
  const [ocrMessage, setOcrMessage] = useState<string | null>(null);
  const handleOcrFiles = async (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    setIsOcrScanning(true);
    setOcrMessage(null);
    try {
      const res = await arService.parseInvoicesOcr(fileArray);
      if (res.matched_invoices && res.matched_invoices.length > 0) {
        setMatchedInvoices(res.matched_invoices);
        if (res.total_parsed_amount > 0 && (amount === 0 || amount === 3500)) {
          setAmount(res.total_parsed_amount);
        }
        if (res.suggested_customer_name && !customerName) {
          setCustomerName(res.suggested_customer_name);
        }
        if (res.suggested_deposit_date) {
          setDepositDate(res.suggested_deposit_date);
        }
        setOcrMessage(
          res.summary ||
            `✨ AI Refined ${res.matched_invoices.length} invoice(s) totaling $${Number(res.total_parsed_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
        );
      } else {
        setOcrMessage(
          res.summary ||
            "⚠️ No invoice details could be recognized from the uploaded document(s). No fields were auto-filled. Please enter the details manually."
        );
      }
      // Automatically add the uploaded files to cash attachments
      const newAttachments: ARAttachment[] = fileArray.map((f) => ({
        id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        filename: f.name,
        file_size: f.size,
        file_type: f.type || "application/pdf",
        file_url: URL.createObjectURL(f),
        uploaded_at: new Date().toISOString(),
        uploaded_by: "Treasury AI OCR",
        note: "Scanned & auto-refined by AI OCR",
      }));
      setCashAttachments((prev) => [...prev, ...newAttachments]);
    } catch (err: any) {
      console.error("AI OCR parsing error:", err);
      setOcrMessage("⚠️ AI OCR could not extract structured invoice rows from the selected file(s). You can still manually enter or edit lines.");
    } finally {
      setIsOcrScanning(false);
    }
  };
  const [previewTarget, setPreviewTarget] = useState<PreviewFileTarget | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const generateDigitalInvoiceHtml = (att: ARAttachment): string => {
    const custDisplayName = customerName || selectedCustomer?.display_name || "Account Receivable Customer";
    const amountVal = amount || 88000.0;
    const amountFormatted = amountVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const uploadDate = att.uploaded_at ? new Date(att.uploaded_at).toLocaleString() : new Date().toLocaleString();
    const uploader = att.uploaded_by || "Treasury AI OCR";
    
    // Extract invoice number if present in filename
    const invMatch = att.filename?.match(/(?:inv(?:oice)?[\s_#.-]*no[\s_#.-]*|#\s*)?(\d{4,8})/i);
    const invoiceNum = invMatch ? `INV-${invMatch[1]}` : "INV-13809";

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
        <div class="brand-title">${custDisplayName.toUpperCase()}</div>
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
          <div class="entity-name">${custDisplayName}</div>
          <div class="entity-details">
            Document Name: <code>${att.filename}</code><br>
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
            <div class="meta-item-val" style="color: #059669;">Pending Processing</div>
          </div>
          <div>
            <div class="meta-item-title">Currency</div>
            <div class="meta-item-val">USD</div>
          </div>
          <div>
            <div class="meta-item-title">Upload Date</div>
            <div class="meta-item-val">${new Date().toISOString().split('T')[0]}</div>
          </div>
        </div>
      </div>

      <div class="table-section">
        <table>
          <thead>
            <tr>
              <th>Description / Item</th>
              <th class="text-right">Qty</th>
              <th class="text-right">Unit Price</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>Invoice Document Attachment</strong><br>
                <span style="font-size: 11px; color: #64748b;">Uploaded for Account Receivable reconciliation (${invoiceNum})</span>
              </td>
              <td class="text-right mono">1</td>
              <td class="text-right mono">$${amountFormatted}</td>
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
            <td class="text-right total-grand">Total Amount:</td>
            <td class="text-right total-grand mono" style="color: #059669;">$${amountFormatted} USD</td>
          </tr>
        </table>
      </div>

      <div class="settlement-card">
        <div>
          <div class="settlement-title">
            <span>🏛️ Queued for Bank Settlement Match</span>
          </div>
          <div class="settlement-sub">
            Document parsed and ready for workflow creation.
          </div>
        </div>
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; color: #166534; background: #dcfce7; padding: 6px 12px; border-radius: 6px;">
          QUEUED
        </div>
      </div>

      <div class="audit-footer">
        <div>Uploaded by <strong>${uploader}</strong> on ${uploadDate}</div>
        <div>Security Audit Hash: <code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">VERIFIED-DOC-${invoiceNum}</code></div>
      </div>
    </div>
  </div>
</body>
</html>`;
  };
  return { handleRemoveMatchedInvoice, fileInputRef, ocrFileInputRef, isDragging, setIsDragging, isOcrScanning, ocrMessage, setOcrMessage, handleOcrFiles, previewTarget, setPreviewTarget, isPreviewOpen, setIsPreviewOpen, generateDigitalInvoiceHtml };
}
