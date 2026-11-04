import { ExternalLink, Copy, Check, Key, Lock, Eye, EyeOff, Loader2, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AVAILABLE_HUBSPOT_SCOPES } from "../constants";
import type { OAuthConfigurationState } from "../hooks/useOAuthConfiguration";

export function LeftColumnAppCredentials({ s }: { s: OAuthConfigurationState }) {
  const { isSavingConfig, status, selectedScopes, setSelectedScopes, hasCopiedUri, handleCopyUri, setRedirectUri, redirectUri, showSecret, setShowSecret, setClientSecret, clientSecret, setClientId, clientId, handleSaveConfig, showGuide, setShowGuide } = s;
  return (
    <div className="lg:col-span-5 rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-orange-500" />
                  <h3 className="text-sm font-bold text-foreground">App Credentials</h3>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowGuide(!showGuide)}
                  className="text-xs gap-1 text-muted-foreground hover:text-foreground h-7 px-2"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-orange-500" />
                  <span>{showGuide ? "Hide Guide" : "Setup Guide"}</span>
                  {showGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </Button>
              </div>

              {/* Expandable Setup Instructions */}
              {showGuide && (
                <div className="p-3.5 rounded-xl bg-orange-500/5 border border-orange-500/20 text-xs space-y-2 text-muted-foreground">
                  <p className="font-semibold text-foreground flex items-center gap-1.5">
                    <span>How to get credentials:</span>
                  </p>
                  <ol className="list-decimal list-inside space-y-1.5 pl-0.5 text-[11.5px] leading-relaxed">
                    <li>
                      Visit{" "}
                      <a
                        href="https://developers.hubspot.com"
                        target="_blank"
                        rel="noreferrer"
                        className="text-orange-600 underline font-medium inline-flex items-center gap-0.5"
                      >
                        <span>developers.hubspot.com</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </li>
                    <li>Open <strong>Apps</strong> &rarr; Select or create an App.</li>
                    <li>Under <strong>Auth &rarr; Redirect URLs</strong>, paste the Redirect URI below.</li>
                    <li>Under <strong>Scopes</strong>, ensure products and companies read scopes are checked.</li>
                    <li>Copy your <strong>Client ID</strong> &amp; <strong>Client Secret</strong> into the form below.</li>
                  </ol>
                </div>
              )}

              <form onSubmit={handleSaveConfig} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="hubspot-client-id" className="text-xs font-semibold">
                    Client ID <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="hubspot-client-id"
                    type="text"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder="e.g. 2381e9fa-xxxx-xxxx-xxxx"
                    className="h-8.5 text-xs font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="hubspot-client-secret" className="text-xs font-semibold">
                      Client Secret <span className="text-rose-500">*</span>
                    </Label>
                    {status?.config?.has_client_secret && (
                      <span className="text-[10.5px] text-emerald-600 dark:text-emerald-400 font-medium">
                        Configured: {status.config.client_secret_masked}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      id="hubspot-client-secret"
                      type={showSecret ? "text" : "password"}
                      value={clientSecret}
                      onChange={(e) => setClientSecret(e.target.value)}
                      placeholder={
                        status?.config?.has_client_secret
                          ? "Leave blank to keep existing secret"
                          : "Paste client secret here..."
                      }
                      className="h-8.5 text-xs font-mono pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="hubspot-redirect-uri" className="text-xs font-semibold">
                      OAuth Redirect URI
                    </Label>
                    <button
                      type="button"
                      onClick={handleCopyUri}
                      className="text-[11px] text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                    >
                      {hasCopiedUri ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>{hasCopiedUri ? "Copied!" : "Copy URI"}</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      id="hubspot-redirect-uri"
                      type="text"
                      value={redirectUri}
                      onChange={(e) => setRedirectUri(e.target.value)}
                      placeholder="http://localhost:8002/api/oauth/hubspot/callback"
                      className="h-8.5 text-xs font-mono bg-muted/20"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCopyUri}
                      className="h-8.5 px-3 shrink-0 text-xs"
                    >
                      {hasCopiedUri ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <Label className="text-xs font-semibold">Permission Scopes</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {AVAILABLE_HUBSPOT_SCOPES.map((sc) => {
                      const isChecked = selectedScopes.includes(sc.id);
                      return (
                        <label
                          key={sc.id}
                          className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                            isChecked
                              ? "border-orange-500/40 bg-orange-500/5 text-foreground"
                              : "border-border/60 hover:bg-muted/40 text-muted-foreground"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedScopes([...selectedScopes, sc.id]);
                              } else {
                                setSelectedScopes(selectedScopes.filter((id) => id !== sc.id));
                              }
                            }}
                            className="mt-0.5 rounded text-orange-600 focus:ring-orange-500"
                          />
                          <div className="min-w-0">
                            <div className="font-medium truncate">{sc.label}</div>
                            <div className="text-[10px] text-muted-foreground truncate">{sc.description}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-border/40">
                  <span className="text-[11px] text-muted-foreground">
                    Source: <strong className="font-medium text-foreground">{status?.config?.source || "None"}</strong>
                  </span>

                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSavingConfig}
                    className="h-8.5 text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white gap-1.5"
                  >
                    {isSavingConfig ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                    <span>Save Credentials</span>
                  </Button>
                </div>
              </form>
            </div>
  );
}
