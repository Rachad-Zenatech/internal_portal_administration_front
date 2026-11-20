import { useEffect, useState } from "react";
import { Download, Eye, ExternalLink, FileText, Loader2, MoreVertical, Paperclip, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { oauthService, type ReceivableEmailAttachment, type ReceivableEmailDetail, type ReceivableEmailItem } from "@/services/oauthService";
import type { OAuthConfigurationState } from "../hooks/useOAuthConfiguration";

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

type PreviewKind = "pdf" | "image" | "text" | null;

function getPreviewKind(att: ReceivableEmailAttachment): PreviewKind {
  const ct = (att.content_type || "").toLowerCase();
  const ext = (att.name || "").toLowerCase().split(".").pop() || "";
  if (ct === "application/pdf" || ext === "pdf") return "pdf";
  if (ct.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return "image";
  if (
    ct.startsWith("text/") ||
    ct === "application/json" ||
    ct === "application/xml" ||
    ["txt", "csv", "json", "xml", "md", "log", "tsv"].includes(ext)
  ) {
    return "text";
  }
  return null;
}

function EmailAttachmentsSection({
  attachments,
  fallbackDate,
  loadingAttId,
  onPreview,
  onDownload,
}: {
  attachments: ReceivableEmailAttachment[];
  fallbackDate?: string;
  loadingAttId: string | null;
  onPreview: (att: ReceivableEmailAttachment) => void;
  onDownload: (att: ReceivableEmailAttachment) => void;
}) {
  if (attachments.length === 0) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
        <Paperclip className="w-3.5 h-3.5 text-emerald-600" />
        <span>Attachments ({attachments.length})</span>
      </div>
      <div className="flex flex-wrap gap-2.5">
        {attachments.map((att) => {
          const previewKind = getPreviewKind(att);
          const dateVal = att.last_modified_at || fallbackDate;
          const dateLabel = dateVal ? new Date(dateVal).toLocaleDateString() : "";
          return (
            <div
              key={att.id}
              onClick={() => onPreview(att)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPreview(att); } }}
              title={previewKind ? "Click to preview" : "Preview not supported — use menu to download"}
              className="group flex items-center justify-between gap-2.5 rounded-xl border border-border/70 bg-muted/20 hover:bg-muted/40 px-3 py-2 text-xs transition-colors cursor-pointer min-w-[230px] max-w-[300px]"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 shrink-0">
                  {loadingAttId === att.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">{att.name}</p>
                  <p className="text-[10.5px] text-muted-foreground font-mono truncate">
                    {dateLabel ? `${dateLabel} • ` : ""}{formatBytes(att.size)}
                  </p>
                </div>
              </div>
              <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
                      <MoreVertical className="w-3.5 h-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36 text-xs">
                    {previewKind && (
                      <DropdownMenuItem onClick={() => onPreview(att)} className="gap-2 cursor-pointer">
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onDownload(att)} className="gap-2 cursor-pointer">
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AttachmentPreviewPane({
  previewUrl,
  previewText,
  previewAtt,
  onClose,
}: {
  previewUrl: string | null;
  previewText: string | null;
  previewAtt: ReceivableEmailAttachment | null;
  onClose: () => void;
}) {
  if (!previewAtt || (!previewUrl && previewText === null)) return null;
  const kind = getPreviewKind(previewAtt);
  return (
    <div className="rounded-xl border border-blue-500/30 bg-background overflow-hidden">
      <div className="px-3.5 py-2 bg-muted/40 border-b border-border/60 flex items-center justify-between text-xs">
        <span className="font-semibold flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px]">Preview</Badge>
          {previewAtt.name}
        </span>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-6 px-2 text-xs">Close Preview</Button>
      </div>
      {kind === "image" && previewUrl ? (
        <div className="p-4 flex justify-center bg-muted/10">
          <img src={previewUrl} alt={previewAtt.name} className="max-h-[420px] rounded-md object-contain" />
        </div>
      ) : kind === "text" && previewText !== null ? (
        <pre className="p-4 max-h-[420px] overflow-auto text-xs font-mono whitespace-pre-wrap bg-muted/10 text-foreground">{previewText}</pre>
      ) : previewUrl ? (
        <iframe title={previewAtt.name} src={previewUrl} className="w-full h-[460px] bg-white" />
      ) : null}
    </div>
  );
}

function EmailBodySection({ detail, selectedEmail }: { detail: ReceivableEmailDetail | null; selectedEmail: ReceivableEmailItem }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background overflow-hidden">
      {detail?.body_content_type === "html" ? (
        <iframe title="Email body" sandbox="" srcDoc={detail.body_content} className="w-full min-h-[280px] bg-white" />
      ) : (
        <pre className="p-4 text-xs whitespace-pre-wrap font-sans leading-relaxed text-foreground min-h-[180px]">
          {detail?.body_content || selectedEmail.body_preview || "(No content)"}
        </pre>
      )}
    </div>
  );
}

export function ReceivableEmailDetailModal({ s }: { s: OAuthConfigurationState }) {
  const { selectedEmail, selectedEmailDetail, isLoadingEmailDetail, handleCloseEmailDetail } = s;
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [previewAtt, setPreviewAtt] = useState<ReceivableEmailAttachment | null>(null);
  const [loadingAttId, setLoadingAttId] = useState<string | null>(null);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);
  if (!selectedEmail) return null;

  const detail = selectedEmailDetail;
  const fetchAttachment = async (att: ReceivableEmailAttachment, download: boolean) => {
    const kind = getPreviewKind(att);
    if (!download && !kind) {
      toast.info(`Preview is not supported for "${att.name}". Use the menu to download.`);
      return;
    }
    try {
      setLoadingAttId(att.id);
      const url = oauthService.getReceivableEmailAttachmentUrl(selectedEmail.id, att.id, detail?.conversation_id || selectedEmail.conversation_id, download);
      const token = localStorage.getItem("access_token");
      const res = await fetch(url, { credentials: "include", headers: token ? { Authorization: `Bearer ${token}` } : undefined });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      if (download) {
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = att.name || "attachment";
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      } else if (kind === "text") {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setPreviewText(await blob.text());
        setPreviewAtt(att);
      } else {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewText(null);
        setPreviewUrl(URL.createObjectURL(blob));
        setPreviewAtt(att);
      }
    } catch (err: any) {
      toast.error(`Failed to load attachment: ${err?.message || "Unknown error"}`);
    } finally {
      setLoadingAttId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4" onClick={handleCloseEmailDetail}>
      <div className="w-full max-w-4xl max-h-[90vh] rounded-2xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-border/70 flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <h3 className="text-base font-bold text-foreground break-words">{detail?.subject || selectedEmail.subject}</h3>
            <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>From: <strong className="text-foreground">{selectedEmail.sender_name}</strong> &lt;{selectedEmail.sender_email}&gt;</span>
              <span className="font-mono">{selectedEmail.received_at ? new Date(selectedEmail.received_at).toLocaleString() : ""}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {detail?.web_link && (
              <a href={detail.web_link} target="_blank" rel="noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1">
                <span>Outlook</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <Button variant="ghost" size="sm" onClick={handleCloseEmailDetail} className="h-8 w-8 p-0"><X className="w-4 h-4" /></Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoadingEmailDetail ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-xs">Loading full email content &amp; attachments...</span>
            </div>
          ) : (
            <>
              <EmailBodySection detail={detail} selectedEmail={selectedEmail} />
              <EmailAttachmentsSection attachments={detail?.attachments || []} fallbackDate={selectedEmail.received_at} loadingAttId={loadingAttId} onPreview={(att) => fetchAttachment(att, false)} onDownload={(att) => fetchAttachment(att, true)} />
              <AttachmentPreviewPane previewUrl={previewUrl} previewText={previewText} previewAtt={previewAtt} onClose={() => { setPreviewUrl(null); setPreviewText(null); setPreviewAtt(null); }} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
