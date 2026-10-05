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
          `<p>Dear {{customer_name}},</p><p>Please review our official quotation proposal <strong>{{quote_number}}</strong> prepared for your organization.</p><p><a href="{{quote_link}}" style="display:inline-block;padding:12px 24px;background-color:#d97706;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;">View &amp; Sign Quote</a></p><p>Secure link expires on {{expiry_date}}.</p><p>Best regards,<br/>{{prepared_by_name}}<br/>{{company_name}}</p>`
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

  const renderedPreviewHtml = customMessage
    .replace(/{{customer_name}}/g, recipientName || quote.customer_name || "Customer")
    .replace(/{{quote_number}}/g, quote.quote_number)
    .replace(/{{company_name}}/g, quote.company_name)
    .replace(/{{quote_link}}/g, "https://portal.zenatech.com/q/sample-secure-token")
    .replace(/{{expiry_date}}/g, expiryDateStr)
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
              <Label className="text-[11px] font-semibold text-slate-600">Recipient Email *</Label>
              <Input
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="client@example.com"
                className="h-8 text-xs bg-white dark:bg-slate-900"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-slate-600">Recipient Contact Name</Label>
              <Input
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
                <Label className="text-[11px] font-semibold text-slate-600">Subject Line</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-semibold text-slate-600">Message Body (HTML / Placeholders supported)</Label>
                  <span className="text-[10px] text-slate-400">
                    Variables: <code>{"{{quote_link}}"}</code>, <code>{"{{expiry_date}}"}</code>, <code>{"{{customer_name}}"}</code>
                  </span>
                </div>
                <Textarea
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
