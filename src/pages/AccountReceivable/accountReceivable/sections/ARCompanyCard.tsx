import { ExternalLink, FileText, Globe, Mail, MapPin, Pencil, Phone, Receipt, Trash2, Users } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import { BrandBadges } from "../../components/BrandBadges";
import type { HubSpotCompanyItem } from "../../../../services/oauthService";

interface Props {
  comp: HubSpotCompanyItem;
  isDeleting: boolean;
  onEdit: (comp: HubSpotCompanyItem) => void;
  onDelete: (comp: HubSpotCompanyItem) => void;
  onGenerateQuote: (comp: HubSpotCompanyItem) => void;
  onGenerateInvoice: (comp: HubSpotCompanyItem) => void;
}

export function ARCompanyCard({ comp, isDeleting, onEdit, onDelete, onGenerateQuote, onGenerateInvoice }: Props) {
  const email = comp.billing_email || comp.contact_email;
  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-orange-400 dark:hover:border-orange-500 transition-all flex flex-col justify-between group">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <Badge variant="outline" className="text-[10px] font-mono text-slate-500 border-slate-200 dark:border-slate-700">
                {comp.hubspot_id}
              </Badge>
              {comp.industry && (
                <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-none text-[9px] px-1.5 py-0">
                  {comp.industry}
                </Badge>
              )}
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-orange-600 transition-colors truncate">
              {comp.name}
            </h4>
            <BrandBadges brand={comp.brand} className="mt-1" />
            {comp.domain && (
              <a
                href={comp.website || `https://${comp.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-0.5"
              >
                <Globe className="w-3 h-3 text-slate-400" />
                <span className="truncate">{comp.domain}</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-60" />
              </a>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button type="button" size="icon" variant="ghost" onClick={() => onEdit(comp)} title={`Edit ${comp.name}`} className="h-7 w-7 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 cursor-pointer">
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button type="button" size="icon" variant="ghost" disabled={isDeleting} onClick={() => onDelete(comp)} title={`Delete ${comp.name}`} className="h-7 w-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
          {comp.contact_name && (
            <div className="flex items-center gap-2"><Users className="w-3.5 h-3.5 text-slate-400 shrink-0" /><span className="truncate">{comp.contact_name}</span></div>
          )}
          {email && (
            <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" /><span className="truncate font-mono text-[11px]">{email}</span></div>
          )}
          {comp.phone && (
            <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" /><span className="truncate font-mono text-[11px]">{comp.phone}</span></div>
          )}
          {comp.address && (
            <div className="flex items-start gap-2"><MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" /><span className="line-clamp-2">{comp.address}</span></div>
          )}
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => onGenerateQuote(comp)} className="h-8 flex-1 text-xs gap-1.5 border-amber-200 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 cursor-pointer font-semibold rounded-xl">
          <FileText className="w-3.5 h-3.5 text-amber-600" /><span>Generate Quote</span>
        </Button>
        <Button size="sm" variant="outline" onClick={() => onGenerateInvoice(comp)} className="h-8 flex-1 text-xs gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 cursor-pointer font-semibold rounded-xl">
          <Receipt className="w-3.5 h-3.5 text-indigo-600" /><span>Generate Invoice</span>
        </Button>
      </div>
    </div>
  );
}
