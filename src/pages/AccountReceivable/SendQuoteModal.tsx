import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  Eye,
  Mail,
  Send,
  CheckCircle2,
  XCircle,
  Save,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Badge } from "../../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  arQuoteService,
} from "../../services/arQuoteService";
import type {
  ARQuote,
} from "../../services/arQuoteService";

interface SendQuoteModalProps {
  quote: ARQuote | null;
  isOpen: boolean;
  onClose: () => void;
  onSentSuccess?: (msg: string) => void;
}

export function SendQuoteModal({
  quote,
  isOpen,
  onClose,
  onSentSuccess,
}: SendQuoteModalProps) {
  const queryClient = useQueryClient();

  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("default");
  const [subject, setSubject] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch Reusable Email Templates
  const { data: templates = [] } = useQuery({
    queryKey: ["ar-quote-templates"],
    queryFn: () => arQuoteService.listEmailTemplates(),
    enabled: isOpen,
  });

  // Populate Fields when Quote changes or modal opens
  useEffect(() => {
    if (quote && isOpen) {
      setRecipientEmail(quote.customer_email || "");
      setRecipientName(quote.customer_contact_person || quote.customer_name || "");
      setSubject(`Quotation ${quote.quote_number} from ${quote.company_name}`);

      const defaultTemplate = templates.find((t) => t.is_default) || templates[0];
      if (defaultTemplate) {
        setSelectedTemplateId(defaultTemplate.id);
        setCustomMessage(defaultTemplate.body_html);
        if (defaultTemplate.subject) {
          setSubject(defaultTemplate.subject.replace("{{quote_number}}", quote.quote_number).replace("{{company_name}}", quote.company_name));
        }
      } else {
        setCustomMessage(
          `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background-color: #f8fafc; padding: 24px 16px;"><div style="background-color: #0b1329; border-radius: 10px 10px 0 0; padding: 18px 24px; display: flex; align-items: center;"><span style="font-size: 17px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px;">ZENATECH</span><span style="font-size: 14px; font-weight: 500; color: #60a5fa; margin-left: 10px;">Purchasing Portal</span></div><div style="background-color: #ffffff; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0; border-top: none; padding: 32px 28px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);"><h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.3px;">Formal Quotation Proposal (Quote# {{quote_number}})</h2><p style="margin: 0 0 18px 0; font-size: 14px; color: #334155;">Hello <strong>{{customer_name}}</strong>,</p><div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; border-radius: 6px; padding: 14px 18px; margin: 18px 0;"><p style="margin: 0 0 5px 0; font-size: 14px; font-weight: 700; color: #166534;">You have received a formal quotation proposal from {{company_name}}.</p><p style="margin: 0; font-size: 13px; color: #15803d; line-height: 1.5;">Please review the quotation details and summary below. You can inspect itemized line items, download the official PDF, request revisions, or provide your electronic signature.</p></div><table style="width: 100%; border-collapse: collapse; margin: 24px 0 28px 0; font-size: 13px;"><thead><tr style="border-bottom: 2px solid #e2e8f0; text-align: left; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;"><th style="padding: 10px 8px; font-weight: 600;">Quote #</th><th style="padding: 10px 8px; font-weight: 600;">Client</th><th style="padding: 10px 8px; font-weight: 600; text-align: right;">Amount</th><th style="padding: 10px 8px; font-weight: 600; text-align: right;">Valid Until</th></tr></thead><tbody><tr style="border-bottom: 1px solid #f1f5f9; color: #1e293b;"><td style="padding: 14px 8px; font-weight: 700; color: #2563eb;">#{{quote_number}}</td><td style="padding: 14px 8px; font-weight: 500; color: #334155;">{{customer_name}}</td><td style="padding: 14px 8px; font-weight: 700; text-align: right; color: #0f172a; font-family: monospace; font-size: 14px;">{{total_amount}}</td><td style="padding: 14px 8px; text-align: right; color: #d97706; font-weight: 600;">{{expiry_date}}</td></tr></tbody></table><div style="margin: 28px 0 24px 0;"><a href="{{quote_link}}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); text-align: center;">View &amp; Sign Quotation &rarr;</a></div><div style="margin-top: 24px; padding-top: 18px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; line-height: 1.6;"><p style="margin: 0 0 6px 0;">Or copy and paste this secure link into your browser:</p><p style="margin: 0 0 10px 0;"><a href="{{quote_link}}" style="color: #2563eb; word-break: break-all; text-decoration: underline;">{{quote_link}}</a></p><p style="margin: 0; font-style: italic; color: #94a3b8;">Note: This secure link is valid until {{expiry_date}}.</p></div><div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 13px; color: #334155; line-height: 1.5;"><div>Best regards,</div><div style="font-weight: 700; color: #0f172a; margin-top: 2px;">{{prepared_by_name}}</div><div style="color: #64748b;">{{company_name}}</div></div></div></div>`
        );
      }
      setIsPreviewMode(false);
      setStatusMsg(null);
    }
  }, [quote, isOpen, templates]);

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tmpl = templates.find((t) => t.id === templateId);
    if (tmpl && quote) {
      setCustomMessage(tmpl.body_html);
      setSubject(
        tmpl.subject
          .replace("{{quote_number}}", quote.quote_number)
          .replace("{{company_name}}", quote.company_name)
      );
    }
  };

  // Send Mutation
  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!quote) throw new Error("No quote selected");
      return arQuoteService.sendQuoteToCustomer(quote.id, {
        recipient_email: recipientEmail.trim(),
        recipient_name: recipientName.trim() || undefined,
        subject: subject.trim(),
        custom_message: customMessage,
      });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["ar-quotes"] });
      queryClient.invalidateQueries({ queryKey: ["ar-quote-summary"] });
      if (onSentSuccess) {
        onSentSuccess(res.message);
      }
      onClose();
    },
    onError: (err: any) => {
      setStatusMsg({
        type: "error",
        text: err?.response?.data?.detail || err.message || "Failed to send quote.",
      });
    },
  });

  // Save Template Mutation
  const handleSaveAsTemplate = async () => {
    if (!newTemplateName.trim()) return;
    try {
      await arQuoteService.saveEmailTemplate({
        name: newTemplateName.trim(),
        subject: subject,
        body_html: customMessage,
        is_default: false,
      });
      queryClient.invalidateQueries({ queryKey: ["ar-quote-templates"] });
      setIsSavingTemplate(false);
      setNewTemplateName("");
      setStatusMsg({ type: "success", text: "Template preset saved successfully!" });
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      alert("Failed to save template: " + err.message);
    }
  };

  if (!quote) return null;

  // Compute live rendered preview text
  const validityDays = quote.validity_days || 30;
  const expiryDateStr = quote.valid_until
    ? new Date(quote.valid_until).toLocaleDateString()
    : new Date(Date.now() + validityDays * 86400000).toLocaleDateString();

  const totalAmountStr = `$${Number(quote.total_amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${quote.currency || "USD"}`;

  const renderedPreviewHtml = customMessage
    .replace(/{{customer_name}}/g, recipientName || quote.customer_name || "Customer")
    .replace(/{{quote_number}}/g, quote.quote_number)
    .replace(/{{company_name}}/g, quote.company_name)
    .replace(/{{quote_link}}/g, "https://portal.zenatech.com/q/sample-secure-token")
    .replace(/{{expiry_date}}/g, expiryDateStr)
    .replace(/{{total_amount}}/g, totalAmountStr)
    .replace(/{{prepared_by_name}}/g, quote.prepared_by_name);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl lg:max-w-4xl max-h-[92vh] overflow-y-auto w-full p-6 sm:p-8 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-amber-600" />
            <span>Send Quotation to Customer</span>
            <Badge variant="outline" className="font-mono text-xs bg-amber-50 text-amber-700">
              {quote.quote_number}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Dispatch a secure access link (valid for <strong>{validityDays} days</strong>) for <strong>{quote.customer_name}</strong> to view, request changes, or sign this quote.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {statusMsg && (
            <div
              className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                statusMsg.type === "success"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
              }`}
            >
              {statusMsg.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Recipient Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="space-y-1">
              <Label htmlFor="send-quote-recipient-email" className="text-[11px] font-semibold text-slate-600">Recipient Email *</Label>
              <Input
                id="send-quote-recipient-email"
                name="recipientEmail"
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="client@example.com"
                className="h-8 text-xs bg-white dark:bg-slate-900"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="send-quote-recipient-name" className="text-[11px] font-semibold text-slate-600">Recipient Contact Name</Label>
              <Input
                id="send-quote-recipient-name"
                name="recipientName"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="e.g. Jasper O. I"
                className="h-8 text-xs bg-white dark:bg-slate-900"
              />
            </div>
          </div>

          {/* Reusable Template Selector */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 space-y-1">
              <Label className="text-[11px] font-semibold text-slate-600">Email Template Preset</Label>
              <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
                <SelectTrigger className="h-8 text-xs bg-white dark:bg-slate-900">
                  <SelectValue placeholder="Choose template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id} className="text-xs">
                      {t.name} {t.is_default && "(Default)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="pt-5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className="h-8 text-xs gap-1.5 rounded-lg cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{isPreviewMode ? "Edit Mode" : "Preview Email"}</span>
              </Button>
            </div>
          </div>

          {/* Email Subject & Body */}
          {!isPreviewMode ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="send-quote-subject" className="text-[11px] font-semibold text-slate-600">Subject Line</Label>
                <Input
                  id="send-quote-subject"
                  name="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="send-quote-custom-message" className="text-[11px] font-semibold text-slate-600">Message Body (HTML / Placeholders supported)</Label>
                  <span className="text-[10px] text-slate-400">
                    Variables: <code>{"{{quote_link}}"}</code>, <code>{"{{expiry_date}}"}</code>, <code>{"{{customer_name}}"}</code>
                  </span>
                </div>
                <Textarea
                  id="send-quote-custom-message"
                  name="customMessage"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={10}
                  className="text-xs font-mono leading-relaxed"
                />
              </div>

              {/* Save As Template Bar */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                {isSavingTemplate ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      id="send-quote-new-template-name"
                      name="newTemplateName"
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      placeholder="Template preset name (e.g. Follow-up Proposal)..."
                      className="h-7 text-xs flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={handleSaveAsTemplate}
                      className="h-7 text-xs bg-slate-900 text-white rounded-lg cursor-pointer"
                    >
                      Save Preset
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsSavingTemplate(false)}
                      className="h-7 text-xs rounded-lg cursor-pointer"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsSavingTemplate(true)}
                    className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save current message as reusable template</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Live Email Preview */
            <div className="space-y-2">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs text-slate-600">
                <p><strong>To:</strong> {recipientEmail || "(No email specified)"}</p>
                <p><strong>Subject:</strong> {subject}</p>
              </div>

              <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4">
                <div
                  className="prose prose-sm max-w-none text-slate-800 text-xs"
                  dangerouslySetInnerHTML={{ __html: renderedPreviewHtml }}
                />
              </div>
            </div>
          )}

          {/* Link Expiry Notice */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              A unique cryptographic link will be generated automatically. Access expires in <strong>{validityDays} days</strong> based on quote validity.
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="text-xs rounded-xl cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={() => sendMutation.mutate()}
            disabled={sendMutation.isPending || !recipientEmail.trim() || !subject.trim()}
            className="text-xs rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-medium gap-1.5 cursor-pointer shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{sendMutation.isPending ? "Sending Quote..." : "Confirm & Send"}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
