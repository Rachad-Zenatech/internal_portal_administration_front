import { ExternalLink, Paperclip } from "lucide-react";
import { arEmailPaymentService } from "../../../../services/arEmailPaymentService";

interface PaymentAttachmentItem {
  index?: number;
  name?: string;
}

export function PaymentAttachmentsCell({
  paymentId,
  attachments,
}: {
  paymentId?: string;
  attachments?: PaymentAttachmentItem[];
}) {
  if (!paymentId || !Array.isArray(attachments) || attachments.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {attachments.map((att, aIdx) => (
        <a
          key={aIdx}
          href={arEmailPaymentService.getPaymentAttachmentUrl(paymentId, att.index ?? aIdx, true)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10px] hover:underline"
          title={att.name}
        >
          <Paperclip className="w-2.5 h-2.5" />
          <span className="max-w-[110px] truncate">{att.name || "Attachment"}</span>
          <ExternalLink className="w-2.5 h-2.5 opacity-70" />
        </a>
      ))}
    </div>
  );
}
