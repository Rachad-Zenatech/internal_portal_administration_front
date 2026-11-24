import { useEffect, useState } from "react";
import { ExternalLink, FileText, Loader2, Mail, Paperclip, Trash2 } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import { sanitizeHtml } from "../../../../lib/sanitizeHtml";
import { oauthService, type ReceivableEmailDetail } from "../../../../services/oauthService";
import { arEmailPaymentService, type EmailPaymentAttachment, type EmailPaymentMatch } from "../../../../services/arEmailPaymentService";

interface Props {
  unmatched: EmailPaymentMatch[];
  selected: EmailPaymentMatch | null;
  isSubmitting: boolean;
  onSelect: (matchId: string) => void;
  onDismiss: (emailId: string, matchId?: string) => void;
}

function formatDisplayDate(raw?: string | null): string {
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function AttachmentPreviewBox({ att, blobUrl, isLoading }: { att: EmailPaymentAttachment; blobUrl: string | null; isLoading: boolean }) {
  const isImage = (att.content_type || "").toLowerCase().startsWith("image/") || /\.(png|jpe?g|webp|gif)$/i.test(att.name || "");

  if (isLoading) {
    return (
      <div className="flex-1 min-h-[380px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 flex items-center justify-center gap-2 text-slate-400 text-xs">
        <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
        <span>Loading attachment preview...</span>
      </div>
    );
  }
  if (!blobUrl) {
    return (
      <div className="flex-1 min-h-[380px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 flex flex-col items-center justify-center gap-1.5 text-slate-400 text-xs p-4 text-center">
        <FileText className="w-6 h-6 opacity-60" />
        <span>Preview unavailable for {att.name}</span>
      </div>
    );
  }
  return (
    <div className="flex-1 min-h-[380px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-950 overflow-hidden flex items-center justify-center">
      {isImage ? (
        <img src={blobUrl} alt={att.name} className="w-full h-full object-contain p-3" />
      ) : (
        <iframe src={`${blobUrl}#view=FitH&navpanes=0`} title={att.name} className="w-full h-full border-0" />
      )}
    </div>
  );
}

function EmailBodyPreviewBox({
  selected,
  detail,
  isLoading,
}: {
  selected: EmailPaymentMatch;
  detail: ReceivableEmailDetail | null;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex-1 min-h-[380px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 flex items-center justify-center gap-2 text-slate-400 text-xs">
        <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
        <span>Loading email content...</span>
      </div>
    );
  }
  const rawBody = detail?.body_content || detail?.body_preview || selected.extracted_data?.evidence || "";
  const isHtml = (detail?.body_content_type || "").toLowerCase() === "html" || /<[a-z][\s\S]*>/i.test(rawBody);
  const recStr = detail?.received_at || selected.received_at;

  return (
    <div className="flex-1 min-h-[380px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 overflow-y-auto p-4 space-y-3">
      <div className="pb-2.5 border-b border-slate-100 dark:border-slate-800 space-y-1">
        <div className="text-sm font-bold text-slate-900 dark:text-white">{detail?.subject || selected.subject || "(No Subject)"}</div>
        <div className="text-[11px] text-slate-500 flex items-center justify-between gap-2 flex-wrap">
          <span>From: <strong>{detail?.sender_name || selected.sender_name}</strong> &lt;{detail?.sender_email || selected.sender_email}&gt;</span>
          {recStr && <span>Received: <strong>{new Date(recStr).toLocaleString()}</strong></span>}
        </div>
      </div>
      {!rawBody.trim() ? (
        <div className="text-xs text-slate-400 italic py-6 text-center">No text content in this email.</div>
      ) : isHtml ? (
        <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed" dangerouslySetInnerHTML={{ __html: sanitizeHtml(rawBody) }} />
      ) : (
        <pre className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">{rawBody}</pre>
      )}
    </div>
  );
}

function UnmatchedEmailStrip({
  unmatched,
  selectedId,
  onSelect,
}: {
  unmatched: EmailPaymentMatch[];
  selectedId?: string;
  onSelect: (matchId: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0">
      {unmatched.map((item) => {
        const ex = item.extracted_data || {};
        const active = selectedId === item.id;
        const isSplit = (item.item_count || 1) > 1;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={`shrink-0 max-w-[280px] text-left px-3 py-2 rounded-xl border text-xs transition-colors flex items-center gap-2.5 cursor-pointer ${
              active ? "bg-indigo-50 border-indigo-300 dark:bg-indigo-950/50 dark:border-indigo-700" : "bg-white border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800"
            }`}
          >
            <div className="min-w-0">
              <div className="font-semibold text-slate-900 dark:text-white truncate">{item.subject || "(No Subject)"}</div>
              <div className="text-[10.5px] text-slate-500 truncate">
                {ex.payer_name || item.sender_name}
                {isSplit ? ` · Check ${(item.item_index || 0) + 1}/${item.item_count}` : ""}
              </div>
            </div>
            {ex.total_amount != null && <span className="font-mono font-bold text-emerald-600 shrink-0">${Number(ex.total_amount).toFixed(2)}</span>}
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 shrink-0">{item.match_status}</Badge>
          </button>
        );
      })}
    </div>
  );
}

export function UnmatchedEmailPreviewPane({ unmatched, selected, isSubmitting, onSelect, onDismiss }: Props) {
  const [activeTab, setActiveTab] = useState<string>("body");
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [emailDetail, setEmailDetail] = useState<ReceivableEmailDetail | null>(null);
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);

  const activeAtt = activeTab !== "body" ? selected?.attachments?.find((a) => a.id === activeTab) || null : null;

  useEffect(() => {
    const preferredName = (selected?.extracted_data?.attachment_name || "").toLowerCase();
    const matchedAtt = preferredName
      ? selected?.attachments?.find((a) => (a.name || "").toLowerCase() === preferredName)
      : null;
    setActiveTab(matchedAtt?.id || selected?.attachments?.[0]?.id || "body");
  }, [selected?.id]);

  useEffect(() => {
    if (!selected) {
      setEmailDetail(null);
      return;
    }
    let cancelled = false;
    setIsLoadingEmail(true);
    setEmailDetail(null);
    oauthService
      .getReceivableEmailDetail(selected.email_id, selected.conversation_id, "receivable")
      .then((res) => { if (!cancelled) setEmailDetail(res); })
      .catch(() => { if (!cancelled) setEmailDetail(null); })
      .finally(() => { if (!cancelled) setIsLoadingEmail(false); });
    return () => { cancelled = true; };
  }, [selected?.email_id]);

  useEffect(() => {
    if (!selected || !activeAtt) {
      setBlobUrl(null);
      return;
    }
    let cancelled = false;
    let objectUrl: string | null = null;
    setIsLoadingPreview(true);
    setBlobUrl(null);
    arEmailPaymentService
      .fetchEmailAttachmentBlob(selected.email_id, activeAtt.id, selected.conversation_id)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      })
      .catch(() => { if (!cancelled) setBlobUrl(null); })
      .finally(() => { if (!cancelled) setIsLoadingPreview(false); });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [selected?.email_id, activeAtt?.id]);

  const displayDate = formatDisplayDate(selected?.extracted_data?.payment_date || selected?.received_at || emailDetail?.received_at);

  return (
    <div className="lg:col-span-8 flex flex-col gap-2.5 min-h-0 overflow-hidden">
      <UnmatchedEmailStrip unmatched={unmatched} selectedId={selected?.id} onSelect={onSelect} />

      {selected && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 flex flex-col gap-2.5 text-xs bg-slate-50/60 dark:bg-slate-900/40 flex-1 min-h-0">
          <div className="flex items-center justify-between gap-2 flex-wrap shrink-0">
            <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500">
              <strong className="text-slate-900 dark:text-white text-xs">{selected.extracted_data?.payer_name || selected.sender_name}</strong>
              <span>· Method: <strong className="text-slate-700 dark:text-slate-200">{selected.extracted_data?.payment_method || "CHECK"}</strong></span>
              <span>· Date: <strong className="text-slate-700 dark:text-slate-200">{displayDate}</strong></span>
              <span>· Ref: <strong className="text-slate-700 dark:text-slate-200">{selected.extracted_data?.reference_number || "—"}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveTab("body")}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer ${
                  activeTab === "body" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-300"
                }`}
              >
                <Mail className="w-3 h-3 shrink-0" /> Email Body
              </button>
              {selected.attachments.map((att) => (
                <button
                  key={att.id}
                  type="button"
                  onClick={() => setActiveTab(att.id)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer ${
                    activeTab === att.id ? "bg-indigo-600 text-white border-indigo-600" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-300"
                  }`}
                >
                  <Paperclip className="w-3 h-3 shrink-0" />
                  <span className="max-w-[180px] truncate">{att.name}</span>
                </button>
              ))}
              {activeAtt && blobUrl && (
                <a href={blobUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-indigo-600 text-[11px] hover:bg-indigo-50" title="Open full screen in new tab">
                  <ExternalLink className="w-3 h-3" /> Open
                </a>
              )}
              <Button variant="ghost" size="sm" onClick={() => onDismiss(selected.email_id, selected.id)} disabled={isSubmitting} className="h-7 px-2 text-[11px] text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1 cursor-pointer">
                <Trash2 className="w-3.5 h-3.5" /> Dismiss
              </Button>
            </div>
          </div>

          {activeAtt ? (
            <AttachmentPreviewBox att={activeAtt} blobUrl={blobUrl} isLoading={isLoadingPreview} />
          ) : (
            <EmailBodyPreviewBox selected={selected} detail={emailDetail} isLoading={isLoadingEmail} />
          )}
        </div>
      )}
    </div>
  );
}
