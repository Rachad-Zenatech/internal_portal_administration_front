import { ShieldCheck, RefreshCw, ExternalLink, Zap, DownloadCloud, Loader2, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useOAuthConfiguration } from "./oAuthConfiguration/hooks/useOAuthConfiguration";
import { ConnectionStatusCard } from "./oAuthConfiguration/sections/ConnectionStatusCard";
import { LeftColumnAppCredentials } from "./oAuthConfiguration/sections/LeftColumnAppCredentials";
import { RightColumnSyncPipelines } from "./oAuthConfiguration/sections/RightColumnSyncPipelines";
import { MainMailboxHeaderCard } from "./oAuthConfiguration/sections/MainMailboxHeaderCard";

export default function OAuthConfiguration() {
  const s = useOAuthConfiguration();
  const { activeTab, setActiveTab, isEntraConnected, handleFetchReceivableEmails, receivableEmails, isConnected, isLoadingEmails, isSyncing, handleSyncProducts, isLoadingEntraStatus, isLoadingStatus, loadEntraStatus, loadStatus } = s;
  return (
    <div className="w-full space-y-6 pb-16 px-4 sm:px-6 lg:px-8">
      {/* ── Top Page Header (Full Width) ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                OAuth &amp; Enterprise Integrations
              </h1>
              <Badge variant="outline" className="text-xs font-medium border-muted-foreground/30 px-2.5 py-0.5">
                System &amp; Security
              </Badge>
              {isConnected ? (
                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs px-2.5 py-0.5 font-semibold inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  HubSpot Active
                </Badge>
              ) : null}
              {isEntraConnected ? (
                <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30 text-xs px-2.5 py-0.5 font-semibold inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  Entra Mailbox Connected
                </Badge>
              ) : null}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Connect external enterprise platforms to sync products, companies, and monitor Accounts Receivable emails via Microsoft Entra.
            </p>
          </div>
        </div>

        {/* Global Action Header Buttons */}
        <div className="flex items-center gap-2 self-start md:self-center shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadStatus();
              loadEntraStatus();
            }}
            disabled={isLoadingStatus || isLoadingEntraStatus}
            className="h-9 text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${(isLoadingStatus || isLoadingEntraStatus) ? "animate-spin text-orange-500" : ""}`} />
            <span>Reload All</span>
          </Button>

          {activeTab === "hubspot" && isConnected && (
            <Button
              variant="default"
              size="sm"
              onClick={handleSyncProducts}
              disabled={isSyncing}
              className="h-9 text-xs gap-1.5 bg-orange-600 hover:bg-orange-700 text-white shadow-xs font-semibold"
            >
              {isSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <DownloadCloud className="w-3.5 h-3.5" />}
              <span>Sync Products Catalog</span>
            </Button>
          )}

          {activeTab === "microsoft" && isEntraConnected && (
            <Button
              variant="default"
              size="sm"
              onClick={handleFetchReceivableEmails}
              disabled={isLoadingEmails}
              className="h-9 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-xs font-semibold"
            >
              {isLoadingEmails ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Inbox className="w-3.5 h-3.5" />}
              <span>Check Receivable Emails</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── Service Tabs Switcher ── */}
      <div className="flex items-center gap-2 border-b border-border/60">
        <button
          type="button"
          onClick={() => setActiveTab("hubspot")}
          className={`flex items-center gap-2.5 px-5 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === "hubspot"
              ? "border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-500/5 rounded-t-lg"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
          }`}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
          <span>HubSpot CRM Connector</span>
          {isConnected && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("microsoft");
            if (isEntraConnected && receivableEmails.length === 0) {
              handleFetchReceivableEmails();
            }
          }}
          className={`flex items-center gap-2.5 px-5 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === "microsoft"
              ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-500/5 rounded-t-lg"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
          }`}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
          <span>Microsoft Entra (Receivable Mailbox)</span>
          {isEntraConnected && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("quickbooks")}
          className={`flex items-center gap-2.5 px-5 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === "quickbooks"
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 rounded-t-lg"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
          }`}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>QuickBooks Online</span>
        </button>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* 1. HUBSPOT TAB VIEW                                                  */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === "hubspot" && (
        <div className="space-y-6">
          {/* Connection Status Card */}
          <ConnectionStatusCard s={s} />

          {/* Three-step workflow */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-border/70 bg-card/60 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-orange-600 dark:text-orange-400">
                <span className="w-5 h-5 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center font-bold">1</span>
                <span>Configure App</span>
              </div>
              <h3 className="text-sm font-bold text-foreground">Developer App Credentials</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Add your HubSpot Developer App Client ID, Secret, and register the Redirect URI.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border/70 bg-card/60 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-orange-600 dark:text-orange-400">
                <span className="w-5 h-5 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center font-bold">2</span>
                <span>Authorize</span>
              </div>
              <h3 className="text-sm font-bold text-foreground">1-Click OAuth Login</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Click "Authorize with HubSpot" to approve catalog &amp; company read permissions via popup.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border/70 bg-card/60 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-orange-600 dark:text-orange-400">
                <span className="w-5 h-5 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center font-bold">3</span>
                <span>Automatic Sync</span>
              </div>
              <h3 className="text-sm font-bold text-foreground">Live Company Filtering</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Products and company mappings are automatically available in Quotes &amp; Invoices autocomplete.
              </p>
            </div>
          </div>

          {/* Two-column split: App Credentials & Pipeline Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: App Credentials Form */}
            <LeftColumnAppCredentials s={s} />

            {/* Right Column: Sync Pipelines & Catalog Overview */}
            <RightColumnSyncPipelines s={s} />
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* 2. MICROSOFT ENTRA (RECEIVABLE MAILBOX) TAB VIEW                    */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <MainMailboxHeaderCard s={s} />

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* 3. QUICKBOOKS TAB VIEW                                               */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === "quickbooks" && (
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">QuickBooks Online OAuth Integration</h2>
              <p className="text-xs text-muted-foreground">
                Sync invoices, expenses, purchase requests, and Chart of Accounts with QuickBooks Online.
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl">
            QuickBooks sync operations, automated expense exports, and general ledger journal posting are active in the purchasing module. You can view detailed synchronization history and manage manual batch transfers on the dedicated sync page.
          </p>

          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => (window.location.href = "/purchasing/quickbooks")}
              className="text-xs gap-2"
            >
              <span>Open QuickBooks Sync Dashboard</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
