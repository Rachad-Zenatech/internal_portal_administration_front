import { Link } from "react-router-dom";
import { Zap, AlertTriangle, RefreshCw, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { QuickBooksState } from "../hooks/useQuickBooks";

export function BreadcrumbTopBar({ s }: { s: QuickBooksState }) {
  const { isLoadingPreview, fetchPreview, setIsDisconnectOpen, realmId, companyName, isConnected } = s;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5 font-medium">
            <Link to="/purchasing/requests" className="hover:text-foreground transition-colors">
              Purchasing &amp; AP
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground font-semibold">QuickBooks Online Integration &amp; Exports</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs border border-emerald-500/20">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
                <span>QuickBooks Online Integration</span>
                <Badge variant="outline" className="text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                  SaasAnt Staging Engine
                </Badge>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pre-flight staging ledger, automated matching, direct Expenses, Bills &amp; A/R Invoices REST sync, and complete transaction packages.
              </p>
            </div>
          </div>
        </div>

        {/* Connection Widget */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {isConnected ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 text-xs shadow-2xs">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="font-bold truncate max-w-[200px]">{companyName}</span>
              </div>
              <span className="text-emerald-600 dark:text-emerald-400/80">•</span>
              <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300/80">Realm: {realmId}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDisconnectOpen(true)}
                className="h-6 px-2 text-[11px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 ml-1 rounded"
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800/60 bg-amber-50/80 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 text-xs">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                <span className="font-semibold">QuickBooks Disconnected</span>
              </div>
              <Button
                size="sm"
                className="h-8 text-xs font-semibold gap-1.5 bg-[#028340] hover:bg-[#027037] text-white shadow-xs"
                onClick={() => {
                  const apiBase = import.meta.env.VITE_API_BASE_URL || "";
                  const returnUrl = encodeURIComponent(window.location.origin);
                  window.location.href = `${apiBase}/api/quickbooks/connect?state=${returnUrl}`;
                }}
              >
                <Zap className="h-3.5 w-3.5" />
                <span>Connect QuickBooks</span>
              </Button>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={fetchPreview}
            disabled={isLoadingPreview}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoadingPreview ? "animate-spin text-emerald-600" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>
  );
}
