import { useState } from "react";
import { CheckCircle2, ExternalLink, Link2, Paperclip, Sparkles, Unlink } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import { arEmailPaymentService, type EmailPaymentMatch } from "../../../../services/arEmailPaymentService";

interface EmailPaymentLinkSectionProps {
  linkedMatch: EmailPaymentMatch | null;
  availableMatches: EmailPaymentMatch[];
  rememberPayer: boolean;
  onRememberPayerChange: (v: boolean) => void;
  onSelectMatch: (match: EmailPaymentMatch | null) => void;
  onDetachMatch: (emailId: string, matchId?: string) => void;
}

export function EmailPaymentLinkSection({
  linkedMatch,
  availableMatches,
  rememberPayer,
  onRememberPayerChange,
  onSelectMatch,
  onDetachMatch,
}: EmailPaymentLinkSectionProps) {
  const [search, setSearch] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  const filtered = availableMatches.filter((m) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    const ex = m.extracted_data || {};
    return (
      (m.subject || "").toLowerCase().includes(q) ||
      (m.sender_name || "").toLowerCase().includes(q) ||
      String(ex.payer_name || "").toLowerCase().includes(q) ||
      String(ex.reference_number || "").toLowerCase().includes(q) ||
      String(ex.total_amount || "").includes(q)
    );
  });

  if (linkedMatch) {
    const ex = linkedMatch.extracted_data || {};
    const payer = ex.payer_name || linkedMatch.sender_name || linkedMatch.sender_email;
    const showEvidence = Boolean(ex.evidence && ex.evidence.trim() !== (linkedMatch.subject || "").trim());
    const handleOpenAtt = async (attId: string) => {
      try {
        const blob = await arEmailPaymentService.fetchEmailAttachmentBlob(linkedMatch.email_id, attId, linkedMatch.conversation_id);
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank", "noopener,noreferrer");
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      } catch {
        window.open(arEmailPaymentService.getEmailAttachmentUrl(linkedMatch.email_id, attId, linkedMatch.conversation_id, true), "_blank", "noopener,noreferrer");
      }
    };
    return (
      <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/70 bg-emerald-50/70 dark:bg-emerald-950/30 space-y-2 text-xs">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-300">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>Linked A/R Email Payment</span>
            <Badge className="text-[10px] px-2 py-0 bg-emerald-600 text-white">{linkedMatch.confidence}% match</Badge>
            {(linkedMatch.item_count || 1) > 1 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-300 text-emerald-700 dark:text-emerald-300">
                Check {(linkedMatch.item_index || 0) + 1}/{linkedMatch.item_count}
              </Badge>
            )}
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => onDetachMatch(linkedMatch.email_id, linkedMatch.id)} className="h-6 px-2 text-[11px] text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1 cursor-pointer" title="Detach this email match">
            <Unlink className="w-3 h-3" />
            <span>Wrong match</span>
          </Button>
        </div>

        <div className="text-slate-700 dark:text-slate-300 space-y-0.5">
          <div className="font-semibold truncate">{linkedMatch.subject || "(No Subject)"}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Payer: <strong className="text-slate-700 dark:text-slate-200">{payer}</strong>
            {ex.reference_number ? ` · Ref/Check #${ex.reference_number}` : ""}
          </div>
          {showEvidence && <div className="italic text-[10.5px] text-slate-500 line-clamp-2">"{ex.evidence}"</div>}
        </div>

        {linkedMatch.attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {linkedMatch.attachments.map((att) => (
              <button
                key={att.id}
                type="button"
                onClick={() => handleOpenAtt(att.id)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 text-[11px] font-medium cursor-pointer"
              >
                <Paperclip className="w-3 h-3" />
                <span className="max-w-[240px] truncate">{att.name}</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </button>
            ))}
          </div>
        )}

        <label className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 cursor-pointer pt-0.5">
          <input type="checkbox" checked={rememberPayer} onChange={(e) => onRememberPayerChange(e.target.checked)} className="rounded border-slate-300" />
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Remember payer "{payer}" for this customer on future checks</span>
        </label>
      </div>
    );
  }

  return (
    <div className="p-2.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 space-y-2 text-[11px]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-medium">
          <Link2 className="w-3.5 h-3.5 text-indigo-500" />
          <span>Link from A/R Email (Optional)</span>
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowPicker((p) => !p)}
          className="h-6 px-2 text-[10.5px] rounded-lg"
        >
          {showPicker ? "Hide Emails" : `Browse Emails (${availableMatches.length})`}
        </Button>
      </div>

      {showPicker && (
        <div className="space-y-1.5">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by payer, subject, check #, or amount..."
            className="w-full h-7 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px]"
          />
          <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            {filtered.length === 0 ? (
              <div className="p-2.5 text-center text-slate-400 text-[10.5px]">No unrecorded A/R payment emails available.</div>
            ) : (
              filtered.slice(0, 15).map((m) => {
                const ex = m.extracted_data || {};
                const isSplit = (m.item_count || 1) > 1;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      onSelectMatch(m);
                      setShowPicker(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/30 transition-colors flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-slate-800 dark:text-slate-200 truncate">{m.subject || "(No Subject)"}</div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {ex.payer_name || m.sender_name}
                        {ex.reference_number ? ` · #${ex.reference_number}` : ""}
                        {isSplit ? ` · Check ${(m.item_index || 0) + 1}/${m.item_count}` : ""}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {ex.total_amount != null && (
                        <div className="font-mono font-bold text-emerald-600">${Number(ex.total_amount).toFixed(2)}</div>
                      )}
                      {m.attachments.length > 0 && (
                        <div className="text-[9.5px] text-slate-400">{m.attachments.length} file(s)</div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
