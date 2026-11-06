import { CheckCircle2, XCircle, RefreshCw, ExternalLink, Globe, Lock, Layers, Zap, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { OAuthConfigurationState } from "../hooks/useOAuthConfiguration";

export function ConnectionStatusCard({ s }: { s: OAuthConfigurationState }) {
  const { connection, isConnected, isConnecting, handleConnectHubSpot, isDisconnecting, handleDisconnect, isRefreshing, handleRefreshToken, isTesting, handleTestConnection, isConfigured } = s;
  return (
    <div
            className={`rounded-2xl border transition-all p-6 shadow-sm ${
              isConnected
                ? "bg-gradient-to-r from-emerald-500/10 via-emerald-500/[0.03] to-transparent border-emerald-500/30"
                : "bg-card border-border/80"
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div
                  className={`p-3.5 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                    isConnected
                      ? "bg-emerald-500 text-white shadow-emerald-500/25"
                      : "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20"
                  }`}
                >
                  {isConnected ? <CheckCircle2 className="w-7 h-7" /> : <Layers className="w-7 h-7" />}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-lg font-bold text-foreground">
                      {isConnected ? "HubSpot CRM Integration Active" : "Connect HubSpot CRM"}
                    </h2>
                    {isConnected ? (
                      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs px-2.5 py-0.5 font-semibold">
                        Connected &amp; Synchronized
                      </Badge>
                    ) : isConfigured ? (
                      <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20 text-xs px-2.5 py-0.5">
                        Credentials Saved &bull; Ready to Connect
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground text-xs px-2.5 py-0.5">
                        Setup Required
                      </Badge>
                    )}
                  </div>

                  {isConnected && connection ? (
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-background/80 border border-border/60 text-foreground font-medium shadow-2xs">
                        <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Portal ID: <strong className="font-mono">{connection.hub_id}</strong></span>
                        {connection.hub_domain && (
                          <span className="text-muted-foreground">({connection.hub_domain})</span>
                        )}
                      </div>

                      {connection.user_email && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-background/80 border border-border/60 text-foreground font-medium shadow-2xs">
                          <Users className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>Authorized by: <strong>{connection.user_email}</strong></span>
                        </div>
                      )}

                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-background/80 border border-border/60 text-xs shadow-2xs">
                        <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>
                          Token:{" "}
                          {connection.is_expired ? (
                            <span className="text-rose-600 font-semibold">Expired (auto-refreshes on next call)</span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                              Valid ({Math.round(connection.seconds_left / 60)} min remaining)
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                      Sync real-time HubSpot products, item prices, recurring billing frequencies, and company mappings directly into Quote &amp; Invoice autocomplete menus.
                    </p>
                  )}
                </div>
              </div>

              {/* Action buttons inside status hero */}
              <div className="flex items-center gap-2.5 flex-wrap shrink-0 lg:self-center">
                {isConnected ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleTestConnection}
                      disabled={isTesting}
                      className="text-xs h-9 gap-1.5"
                    >
                      {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-amber-500" />}
                      <span>Test Connection</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefreshToken}
                      disabled={isRefreshing}
                      className="text-xs h-9 gap-1.5"
                    >
                      {isRefreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      <span>Refresh Token</span>
                    </Button>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDisconnect}
                      disabled={isDisconnecting}
                      className="text-xs h-9 gap-1.5"
                    >
                      {isDisconnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                      <span>Disconnect</span>
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleConnectHubSpot}
                    disabled={isConnecting}
                    className="text-xs h-10 px-5 gap-2 bg-orange-600 hover:bg-orange-700 text-white shadow-sm font-semibold"
                  >
                    {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                    <span>Authorize with HubSpot</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Granted Scopes Badge List */}
            {isConnected && connection?.scopes && connection.scopes.length > 0 && (
              <div className="mt-5 pt-4 border-t border-border/50 flex items-center gap-2 flex-wrap text-xs">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Granted Scopes:
                </span>
                {connection.scopes.map((sc) => (
                  <Badge
                    key={sc}
                    variant="secondary"
                    className="text-[10.5px] font-mono px-2.5 py-0.5 bg-muted/60 text-foreground"
                  >
                    {sc}
                  </Badge>
                ))}
              </div>
            )}
          </div>
  );
}
