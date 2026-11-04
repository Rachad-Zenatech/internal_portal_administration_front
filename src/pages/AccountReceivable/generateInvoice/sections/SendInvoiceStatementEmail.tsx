import { Loader2, Mail, Send } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Textarea } from "../../../../components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../../components/ui/dialog";
import type { GenerateInvoiceState } from "../hooks/useGenerateInvoice";

export function SendInvoiceStatementEmail({ s }: { s: GenerateInvoiceState }) {
  const { sendEmailMutation, emailSender, emailRecipient, setIsSendEmailDialogOpen, setEmailCustomMessage, emailCustomMessage, setEmailSubject, emailSubject, setEmailRecipient, setEmailSender, isSendEmailDialogOpen } = s;
  return (
    <Dialog open={isSendEmailDialogOpen} onOpenChange={setIsSendEmailDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-600" />
              <span>Send Invoice Statement via SendGrid</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Send this invoice statement directly to your customer using a configured role-based email address.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Sender Role-Based Email <span className="text-red-500">*</span></span>
                <span className="text-[10px] text-muted-foreground font-normal">Role Mailer Address</span>
              </Label>
              <Input
                type="email"
                value={emailSender}
                onChange={(e) => setEmailSender(e.target.value)}
                placeholder="test-invoices@zenatech.com"
                className="text-xs font-mono"
              />
              <p className="text-[11px] text-muted-foreground">
                Default: <code className="bg-muted px-1 py-0.5 rounded text-foreground">test-invoices@zenatech.com</code>
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Recipient Email (To) <span className="text-red-500">*</span>
              </Label>
              <Input
                type="email"
                value={emailRecipient}
                onChange={(e) => setEmailRecipient(e.target.value)}
                placeholder="customer-billing@client.com"
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Subject Line
              </Label>
              <Input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Invoice Statement from ZenaTech Inc."
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Optional Message / Notes
              </Label>
              <Textarea
                rows={3}
                value={emailCustomMessage}
                onChange={(e) => setEmailCustomMessage(e.target.value)}
                placeholder="Add a custom note or payment instructions to include in the email body..."
                className="text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsSendEmailDialogOpen(false)}
              className="text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => sendEmailMutation.mutate()}
              disabled={sendEmailMutation.isPending || !emailRecipient.trim() || !emailSender.trim()}
              className="text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer"
            >
              {sendEmailMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>Send Email</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  );
}
