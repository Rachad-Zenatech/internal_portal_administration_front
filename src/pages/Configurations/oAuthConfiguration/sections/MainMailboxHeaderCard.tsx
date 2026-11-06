import { RefreshCw, ExternalLink, Eye, EyeOff, Zap, Loader2, ChevronDown, ChevronUp, Search, Mail, Paperclip, Inbox, Settings, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { OAuthConfigurationState } from "../hooks/useOAuthConfiguration";

export function MainMailboxHeaderCard({ s }: { s: OAuthConfigurationState }) {
  const { isLoadingEmails, handleFetchReceivableEmails, filteredReceivableEmails, lastEmailFetchTime, setEmailSearch, emailSearch, emailFilterMode, setEmailFilterMode, entraTargetMailbox, receivableEmails, isSavingEntraConfig, isDisconnectingEntra, handleDisconnectEntra, showEntraSecret, setShowEntraSecret, entraStatus, setEntraClientSecret, entraClientSecret, setEntraClientId, entraClientId, setEntraTenantId, entraTenantId, setEntraTargetMailbox, handleSaveEntraConfig, showEntraSettings, setShowEntraSettings, isTestingEntra, handleTestEntraConnection, isSigningInEntra, handleSignInEntra, entraConn, activeTab } = s;
  return (
    <>
      {activeTab === "microsoft" && (
        <div className="space-y-6">
          {/* Main Mailbox Header Card */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="flex items-start gap-4">
                <div className="p-3.5 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/25 shrink-0">
                  <Mail className="w-7 h-7" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-lg font-bold text-foreground">
                      Receivable Email Tracking
                    </h2>
                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs px-2.5 py-0.5 font-semibold inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Active &bull; Continuous Auto-Tracking
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5">
                    <span>Tracking Mailbox:</span>
                    <strong className="font-mono text-foreground font-semibold">
                      {entraConn?.mailbox_address || entraConn?.user_email || entraTargetMailbox || "receivables@zenatech.com"}
                    </strong>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleFetchReceivableEmails}
                  disabled={isLoadingEmails}
                  className="text-xs h-9 px-4 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
                >
                  {isLoadingEmails ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Inbox className="w-3.5 h-3.5" />}
                  <span>Sync Emails</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignInEntra}
                  disabled={isSigningInEntra}
                  className="text-xs h-9 gap-1.5"
                >
                  {isSigningInEntra ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5 text-blue-600" />}
                  <span>Sign in with Microsoft</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestEntraConnection}
                  disabled={isTestingEntra}
                  className="text-xs h-9 gap-1.5"
                >
                  {isTestingEntra ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-amber-500" />}
                  <span>Test Connection</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEntraSettings(!showEntraSettings)}
                  className="text-xs h-9 gap-1.5"
                >
                  <Settings className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{showEntraSettings ? "Hide Settings" : "Connection Settings"}</span>
                  {showEntraSettings ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Collapsible Connection Settings (Simple & Clean) */}
          {showEntraSettings && (
            <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-foreground">Mailbox Connection Settings</h3>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Credentials configured in backend .env
                </span>
              </div>

              <form onSubmit={handleSaveEntraConfig} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="entra-target-mailbox" className="text-xs font-semibold">
                      Target Mailbox Address
                    </Label>
                    <Input
                      id="entra-target-mailbox"
                      type="email"
                      value={entraTargetMailbox}
                      onChange={(e) => setEntraTargetMailbox(e.target.value)}
                      placeholder="receivables@zenatech.com"
                      className="h-9 text-xs font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="entra-tenant-id" className="text-xs font-semibold">
                      Microsoft Entra Tenant ID
                    </Label>
                    <Input
                      id="entra-tenant-id"
                      type="text"
                      value={entraTenantId}
                      onChange={(e) => setEntraTenantId(e.target.value)}
                      placeholder="e.g. 793faa36-870a-465b-93be-d8d07da8a680"
                      className="h-9 text-xs font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="entra-client-id" className="text-xs font-semibold">
                      Application (Client) ID
                    </Label>
                    <Input
                      id="entra-client-id"
                      type="text"
                      value={entraClientId}
                      onChange={(e) => setEntraClientId(e.target.value)}
                      placeholder="e.g. 82959eef-0217-4aa3-a979-bd5b909c097a"
                      className="h-9 text-xs font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="entra-client-secret" className="text-xs font-semibold">
                        Client Secret
                      </Label>
                      {entraStatus?.config?.has_client_secret && (
                        <span className="text-[10.5px] text-emerald-600 dark:text-emerald-400 font-medium">
                          Configured: {entraStatus.config.client_secret_masked}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Input
                        id="entra-client-secret"
                        type={showEntraSecret ? "text" : "password"}
                        value={entraClientSecret}
                        onChange={(e) => setEntraClientSecret(e.target.value)}
                        placeholder={
                          entraStatus?.config?.has_client_secret
                            ? "Leave blank to keep existing secret"
                            : "Paste client secret here..."
                        }
                        className="h-9 text-xs font-mono pr-8"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEntraSecret(!showEntraSecret)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {showEntraSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span>
                    Ensure <strong>Mail.Read</strong> Application Permission has Admin Consent granted in Microsoft Entra admin center.
                  </span>
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleDisconnectEntra}
                      disabled={isDisconnectingEntra}
                      className="h-8 text-xs"
                    >
                      Disconnect
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isSavingEntraConfig}
                      className="h-8 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isSavingEntraConfig ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                      Save Settings
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Full-Width Live Receivable Emails Card */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Inbox className="w-4 h-4 text-blue-600" />
                  <span>Incoming Emails Feed</span>
                  <Badge variant="secondary" className="text-xs font-mono ml-1 font-semibold">
                    {receivableEmails.length}
                  </Badge>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Live incoming messages, remittances, and invoices received at {entraTargetMailbox || "receivables@zenatech.com"}.
                </p>
              </div>

              {/* Filter chips & Sync */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="flex items-center rounded-lg border border-border/70 p-0.5 bg-muted/40">
                  {(["all", "unread", "attachments"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setEmailFilterMode(m)}
                      className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-all cursor-pointer ${
                        emailFilterMode === m
                          ? "bg-background text-foreground shadow-xs font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {m === "all" ? "All Emails" : m === "unread" ? "Unread" : "Has Attachments"}
                    </button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFetchReceivableEmails}
                  disabled={isLoadingEmails}
                  className="h-8 text-xs gap-1.5"
                >
                  {isLoadingEmails ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                  <span>Refresh</span>
                </Button>
              </div>
            </div>

            {/* Email Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search emails by subject, sender, customer name, or remittance keyword..."
                value={emailSearch}
                onChange={(e) => setEmailSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleFetchReceivableEmails();
                }}
                className="h-9 text-xs pl-9 font-sans"
              />
            </div>

            {/* Email Results List / Table */}
            {isLoadingEmails ? (
              <div className="py-16 flex flex-col items-center justify-center gap-2 text-muted-foreground border border-border/60 rounded-xl bg-muted/10">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="text-xs">Checking mailbox for incoming receivable emails...</span>
              </div>
            ) : filteredReceivableEmails.length > 0 ? (
              <div className="space-y-2">
                <div className="text-[11px] text-muted-foreground flex items-center justify-between px-1">
                  <span>Showing {filteredReceivableEmails.length} messages:</span>
                  {lastEmailFetchTime && (
                    <span className="font-mono text-[10px]">Last Synced: {lastEmailFetchTime}</span>
                  )}
                </div>

                <div className="overflow-x-auto border border-border/70 rounded-xl bg-background/50 divide-y divide-border/40">
                  {filteredReceivableEmails.map((em) => (
                    <div
                      key={em.id}
                      className={`p-4 hover:bg-muted/30 transition-colors text-xs flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${
                        !em.is_read ? "bg-blue-500/[0.03]" : ""
                      }`}
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-foreground text-sm truncate max-w-xl">
                            {em.subject}
                          </span>
                          {!em.is_read && (
                            <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30 text-[10px] px-2 py-0.5 font-semibold">
                              Unread
                            </Badge>
                          )}
                          {em.has_attachments && (
                            <Badge variant="outline" className="text-[10px] gap-1 px-2 py-0.5 bg-muted/50 font-normal">
                              <Paperclip className="w-3 h-3 text-emerald-600" />
                              <span>Attachment</span>
                            </Badge>
                          )}
                        </div>

                        <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                          <span>From: <strong className="text-foreground font-semibold">{em.sender_name}</strong> &lt;{em.sender_email}&gt;</span>
                        </div>

                        {em.body_preview && (
                          <p className="text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed">
                            {em.body_preview}
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2">
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {em.received_at
                            ? new Date(em.received_at).toLocaleDateString() + " " + new Date(em.received_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : "—"}
                        </span>
                        {em.web_link && (
                          <a
                            href={em.web_link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-medium"
                          >
                            <span>Open in Outlook</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-14 text-center text-xs text-muted-foreground border border-dashed border-border/70 rounded-xl bg-muted/10 space-y-3">
                <Mail className="w-8 h-8 mx-auto opacity-40 text-blue-600" />
                <div className="space-y-1">
                  <p className="font-semibold text-foreground text-sm">No emails loaded yet</p>
                  <p>Click "Sync Emails" above to check for incoming remittance slips and customer messages.</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFetchReceivableEmails}
                  disabled={isLoadingEmails}
                  className="text-xs gap-1.5 h-8 mt-2"
                >
                  <Inbox className="w-3.5 h-3.5 text-blue-600" />
                  <span>Sync Emails Now</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
