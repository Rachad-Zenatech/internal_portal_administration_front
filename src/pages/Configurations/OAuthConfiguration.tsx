import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Key,
  Globe,
  Database,
  Lock,
  Eye,
  EyeOff,
  Layers,
  Zap,
  DownloadCloud,
  Loader2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Search,
  Building2,
  Package,
  Users,
  DollarSign,
  Info,
  Mail,
  Paperclip,
  Inbox,
  Settings,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  oauthService,
  type HubSpotOAuthStatus,
  type HubSpotDataResponse,
  type MicrosoftEntraOAuthStatus,
  type ReceivableEmailItem,
} from "@/services/oauthService";

const AVAILABLE_HUBSPOT_SCOPES = [
  { id: "crm.objects.products.read", label: "Products & Services", description: "Read catalog items & pricing", default: true },
  { id: "crm.schemas.products.read", label: "Product Schemas", description: "Read custom attributes & terms", default: true },
  { id: "crm.objects.contacts.read", label: "Contacts", description: "Read customer contact info", default: true },
  { id: "crm.objects.companies.read", label: "Companies", description: "Read linked company accounts", default: true },
  { id: "crm.objects.deals.read", label: "Deals & Orders", description: "Read deals and pipeline stages", default: true },
  { id: "oauth", label: "OAuth Identity", description: "Verify HubSpot portal ID", default: true },
];


export default function OAuthConfiguration() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab
  const [activeTab, setActiveTab] = useState<"hubspot" | "microsoft" | "quickbooks">("hubspot");

  // ── HubSpot State ──
  const [status, setStatus] = useState<HubSpotOAuthStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // HubSpot Credentials Form State
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [redirectUri, setRedirectUri] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>(
    AVAILABLE_HUBSPOT_SCOPES.filter((s) => s.default).map((s) => s.id)
  );
  const [showSecret, setShowSecret] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [hasCopiedUri, setHasCopiedUri] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // HubSpot Live Data Explorer State
  const [activeDataType, setActiveDataType] = useState<"products" | "contacts" | "companies" | "deals">("products");
  const [liveData, setLiveData] = useState<HubSpotDataResponse | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");

  // ── Microsoft Entra (Receivable Mailbox) State ──
  const [entraStatus, setEntraStatus] = useState<MicrosoftEntraOAuthStatus | null>(null);
  const [isLoadingEntraStatus, setIsLoadingEntraStatus] = useState(true);
  const [isTestingEntra, setIsTestingEntra] = useState(false);
  const [isDisconnectingEntra, setIsDisconnectingEntra] = useState(false);
  const [isSavingEntraConfig, setIsSavingEntraConfig] = useState(false);

  // Microsoft Entra Form State
  const [entraClientId, setEntraClientId] = useState("");
  const [entraClientSecret, setEntraClientSecret] = useState("");
  const [entraTenantId, setEntraTenantId] = useState("793faa36-870a-465b-93be-d8d07da8a680");
  const [entraRedirectUri, setEntraRedirectUri] = useState("");
  const [entraTargetMailbox, setEntraTargetMailbox] = useState("receivables@zenatech.com");
  const [showEntraSecret, setShowEntraSecret] = useState(false);
  const [showEntraSettings, setShowEntraSettings] = useState(false);

  // Receivable Emails State
  const [receivableEmails, setReceivableEmails] = useState<ReceivableEmailItem[]>([]);
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  const [emailSearch, setEmailSearch] = useState("");
  const [emailFilterMode, setEmailFilterMode] = useState<"all" | "unread" | "attachments">("all");
  const [lastEmailFetchTime, setLastEmailFetchTime] = useState<string | null>(null);

  // Load HubSpot Status
  const loadStatus = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoadingStatus(true);
      const res = await oauthService.getHubSpotStatus();
      setStatus(res);
      if (res.config) {
        setClientId(res.config.client_id || "");
        setRedirectUri(res.config.redirect_uri || "");
        if (res.config.scopes) {
          setSelectedScopes(res.config.scopes.split(" ").filter(Boolean));
        }
      }
    } catch (err: any) {
      console.error("[OAuthConfiguration] Failed to fetch HubSpot OAuth status", err);
      if (!silent) {
        toast.error(err?.response?.data?.detail || "Failed to load HubSpot status");
      }
    } finally {
      if (!silent) setIsLoadingStatus(false);
    }
  }, []);

  // Load Microsoft Entra Status
  const loadEntraStatus = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoadingEntraStatus(true);
      const res = await oauthService.getMicrosoftEntraStatus();
      setEntraStatus(res);
      if (res.config) {
        setEntraClientId(res.config.client_id || "");
        setEntraTenantId(res.config.tenant_id || "793faa36-870a-465b-93be-d8d07da8a680");
        setEntraRedirectUri(res.config.redirect_uri || "");
        setEntraTargetMailbox(res.config.target_mailbox || "receivables@zenatech.com");
      }
    } catch (err: any) {
      console.error("[OAuthConfiguration] Failed to fetch Microsoft Entra OAuth status", err);
      if (!silent) {
        toast.error(err?.response?.data?.detail || "Failed to load Microsoft Entra status");
      }
    } finally {
      if (!silent) setIsLoadingEntraStatus(false);
    }
  }, []);

  // Handle URL params callback / postMessage from popup
  useEffect(() => {
    loadStatus();
    loadEntraStatus();

    const connectedParam = searchParams.get("connected");
    const providerParam = searchParams.get("provider");
    const hubIdParam = searchParams.get("hub_id");
    const emailParam = searchParams.get("email");
    const errorParam = searchParams.get("error");

    if (connectedParam === "true") {
      if (providerParam === "microsoft" || emailParam) {
        toast.success(`Microsoft Entra connected successfully! Mailbox: ${emailParam || ""}`);
        setActiveTab("microsoft");
        loadEntraStatus(true);
      } else {
        toast.success(`HubSpot connected successfully!${hubIdParam ? ` (Portal ID: ${hubIdParam})` : ""}`);
        loadStatus(true);
      }
      searchParams.delete("connected");
      searchParams.delete("provider");
      searchParams.delete("hub_id");
      searchParams.delete("email");
      setSearchParams(searchParams, { replace: true });
    } else if (errorParam) {
      toast.error(`Connection Error: ${errorParam}`);
      searchParams.delete("error");
      setSearchParams(searchParams, { replace: true });
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "HUBSPOT_OAUTH_SUCCESS") {
        toast.success(`HubSpot connected successfully! (Portal ID: ${event.data.hub_id || ""})`);
        loadStatus(true);
      } else if (event.data?.type === "HUBSPOT_OAUTH_ERROR") {
        toast.error(`HubSpot connection failed: ${event.data.error || "Unknown error"}`);
      } else if (event.data?.type === "MICROSOFT_ENTRA_OAUTH_SUCCESS") {
        toast.success(`Microsoft Entra connected successfully! Mailbox: ${event.data.email || ""}`);
        setActiveTab("microsoft");
        loadEntraStatus(true);
      } else if (event.data?.type === "MICROSOFT_ENTRA_OAUTH_ERROR") {
        toast.error(`Microsoft Entra connection failed: ${event.data.error || "Unknown error"}`);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [loadStatus, loadEntraStatus, searchParams, setSearchParams]);

  // ── HubSpot Action Handlers ──
  const handleConnectHubSpot = async () => {
    try {
      setIsConnecting(true);
      const res = await oauthService.getHubSpotAuthUrl();
      if (!res.auth_url) throw new Error("No authorization URL returned.");

      const width = 640;
      const height = 750;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      const popup = window.open(
        res.auth_url,
        "HubSpot OAuth Authorization",
        `width=${width},height=${height},top=${top},left=${left},status=yes,scrollbars=yes`
      );
      if (!popup) window.location.href = res.auth_url;
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err.message || "Failed to generate authorization URL");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setIsTesting(true);
      const res = await oauthService.testHubSpotConnection();
      if (res.success) {
        toast.success(res.message || `Connection healthy! Verified access to Portal ${res.portal_id || ""}.`);
      } else {
        toast.error(res.error || "Connection test failed.");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "HubSpot connection test failed");
    } finally {
      setIsTesting(false);
    }
  };

  const handleRefreshToken = async () => {
    try {
      setIsRefreshing(true);
      const res = await oauthService.refreshHubSpotToken();
      toast.success(res.message || "HubSpot access token refreshed successfully.");
      await loadStatus(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to refresh token");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm("Are you sure you want to disconnect HubSpot? Automated syncing will be paused.")) return;
    try {
      setIsDisconnecting(true);
      await oauthService.disconnectHubSpot();
      toast.success("HubSpot integration disconnected.");
      setLiveData(null);
      await loadStatus(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to disconnect HubSpot");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId.trim()) {
      toast.error("Client ID is required");
      return;
    }
    try {
      setIsSavingConfig(true);
      await oauthService.saveHubSpotConfig({
        client_id: clientId.trim(),
        client_secret: clientSecret.trim() || undefined,
        redirect_uri: redirectUri.trim() || undefined,
        scopes: selectedScopes.join(" "),
      });
      toast.success("HubSpot OAuth credentials saved successfully!");
      setClientSecret("");
      await loadStatus(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to save OAuth credentials");
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleCopyUri = () => {
    const uriToCopy = redirectUri || status?.config?.redirect_uri || "";
    if (uriToCopy) {
      navigator.clipboard.writeText(uriToCopy);
      setHasCopiedUri(true);
      toast.info("Redirect URI copied to clipboard!");
      setTimeout(() => setHasCopiedUri(false), 2000);
    }
  };

  const handleFetchLiveData = async (type = activeDataType) => {
    try {
      setIsLoadingData(true);
      const res = await oauthService.fetchHubSpotData(type, 30);
      setLiveData(res);
      toast.success(`Fetched ${res.total} ${type} directly from HubSpot API.`);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || `Failed to fetch ${type} from HubSpot`);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSyncProducts = async () => {
    try {
      setIsSyncing(true);
      const res = await oauthService.syncHubSpotProducts();
      toast.success(res.message || `Successfully synced ${res.count} products!`);
      if (activeDataType === "products") {
        handleFetchLiveData("products");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to sync products from HubSpot");
    } finally {
      setIsSyncing(false);
    }
  };

  // ── Microsoft Entra Action Handlers ──
  const handleTestEntraConnection = async () => {
    try {
      setIsTestingEntra(true);
      const res = await oauthService.testMicrosoftEntraConnection();
      if (res.success) {
        toast.success(res.message || "Successfully connected to Microsoft Entra!");
      } else {
        toast.error(res.error || "Microsoft Entra connection test failed.");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Microsoft Entra connection test failed");
    } finally {
      setIsTestingEntra(false);
    }
  };

  const handleDisconnectEntra = async () => {
    if (!window.confirm("Are you sure you want to disconnect Microsoft Entra? Email checking for receivable will be paused.")) return;
    try {
      setIsDisconnectingEntra(true);
      await oauthService.disconnectMicrosoftEntra();
      toast.success("Microsoft Entra disconnected.");
      setReceivableEmails([]);
      await loadEntraStatus(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to disconnect Microsoft Entra");
    } finally {
      setIsDisconnectingEntra(false);
    }
  };

  const handleSaveEntraConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!entraClientId.trim()) {
      toast.error("Application (Client) ID is required");
      return;
    }
    try {
      setIsSavingEntraConfig(true);
      await oauthService.saveMicrosoftEntraConfig({
        client_id: entraClientId.trim(),
        client_secret: entraClientSecret.trim() || undefined,
        tenant_id: entraTenantId.trim() || undefined,
        redirect_uri: entraRedirectUri.trim() || undefined,
        scopes: "https://graph.microsoft.com/.default",
        target_mailbox: entraTargetMailbox.trim() || "receivables@zenatech.com",
        auth_mode: "application",
      });
      toast.success("Microsoft Entra configuration saved successfully!");
      setEntraClientSecret("");
      await loadEntraStatus(true);

      const testRes = await oauthService.testMicrosoftEntraConnection();
      if (testRes.success) {
        toast.success(testRes.message || "Connection to mailbox verified!");
      } else {
        toast.warning(testRes.error || "Credentials saved, but verification failed. Check admin consent in Entra.", {
          duration: 8000,
        });
      }
      await loadEntraStatus(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to save Microsoft Entra configuration");
    } finally {
      setIsSavingEntraConfig(false);
    }
  };

  const handleFetchReceivableEmails = async () => {
    try {
      setIsLoadingEmails(true);
      const res = await oauthService.fetchReceivableEmails(35, emailSearch.trim() || undefined);
      setReceivableEmails(res.items || []);
      setLastEmailFetchTime(new Date().toLocaleTimeString());
      toast.success(`Retrieved ${res.total} recent emails from Accounts Receivable mailbox.`);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to fetch receivable emails");
    } finally {
      setIsLoadingEmails(false);
    }
  };

  const isConnected = !!status?.connected;
  const isConfigured = !!status?.is_configured;
  const connection = status?.connection;

  const isEntraConnected = !!entraStatus?.connected;
  const entraConn = entraStatus?.connection;

  // Filter live items based on search query
  const filteredLiveItems = useMemo(() => {
    if (!liveData?.items) return [];
    if (!searchFilter.trim()) return liveData.items;
    const q = searchFilter.toLowerCase();
    return liveData.items.filter((it) => {
      const p = it.properties || {};
      const name = (p.name || `${p.firstname || ""} ${p.lastname || ""}` || p.dealname || "").toLowerCase();
      const id = String(it.id || "").toLowerCase();
      const domain = String(p.domain || "").toLowerCase();
      const email = String(p.email || "").toLowerCase();
      return name.includes(q) || id.includes(q) || domain.includes(q) || email.includes(q);
    });
  }, [liveData, searchFilter]);

  // Filter receivable emails
  const filteredReceivableEmails = useMemo(() => {
    return receivableEmails.filter((em) => {
      if (emailFilterMode === "unread" && em.is_read) return false;
      if (emailFilterMode === "attachments" && !em.has_attachments) return false;
      return true;
    });
  }, [receivableEmails, emailFilterMode]);

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

            {/* Right Column: Sync Pipelines & Catalog Overview */}
            <div className="lg:col-span-7 space-y-6">
              <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-orange-500" />
                    <h3 className="text-sm font-bold text-foreground">Catalog &amp; Pipeline Status</h3>
                  </div>
                  <Badge variant="outline" className="text-[11px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                    Auto-Matched by Company
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-1">
                    <div className="flex items-center justify-between text-muted-foreground text-xs">
                      <span>Products Synced</span>
                      <Package className="w-3.5 h-3.5 text-orange-500" />
                    </div>
                    <div className="text-lg font-bold text-foreground">64 Live</div>
                    <div className="text-[10.5px] text-muted-foreground">HubSpot master catalog</div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-1">
                    <div className="flex items-center justify-between text-muted-foreground text-xs">
                      <span>Company Scope</span>
                      <Building2 className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                    <div className="text-lg font-bold text-foreground">4 Accounts</div>
                    <div className="text-[10.5px] text-muted-foreground">TechFlow, Zenatech, etc.</div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-1">
                    <div className="flex items-center justify-between text-muted-foreground text-xs">
                      <span>Pricing Auto-Apply</span>
                      <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <div className="text-lg font-bold text-foreground">Active</div>
                    <div className="text-[10.5px] text-muted-foreground">Frequency &amp; currency</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-muted-foreground flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    When you select a company in the Quote or Invoice generator, the product autocomplete automatically filters to show <strong>only</strong> items mapped to that company, complete with list price, frequency, and currency.
                  </div>
                </div>
              </div>

              {/* Live Data Explorer Card */}
              <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Search className="w-4 h-4 text-orange-500" />
                      <span>Live Data Preview &amp; Explorer</span>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Inspect live records directly from your HubSpot CRM portal in real-time.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center rounded-lg border border-border/70 p-0.5 bg-muted/40">
                      {(["products", "companies", "contacts", "deals"] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            setActiveDataType(t);
                            handleFetchLiveData(t);
                          }}
                          className={`px-2.5 py-1 text-xs font-medium rounded-md capitalize transition-all cursor-pointer ${
                            activeDataType === t
                              ? "bg-background text-foreground shadow-xs font-semibold"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFetchLiveData(activeDataType)}
                      disabled={isLoadingData || !isConnected}
                      className="h-7.5 text-xs gap-1.5"
                    >
                      {isLoadingData ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                      <span>Fetch</span>
                    </Button>
                  </div>
                </div>

                {liveData && liveData.items.length > 0 && (
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder={`Filter live ${activeDataType} by name or ID...`}
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="h-8 text-xs pl-8 font-sans"
                    />
                  </div>
                )}

                {isLoadingData ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground border border-border/60 rounded-xl bg-muted/10">
                    <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                    <span className="text-xs">Querying HubSpot API for live {activeDataType}...</span>
                  </div>
                ) : liveData && liveData.items.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                      <span>Showing {filteredLiveItems.length} of {liveData.total} {activeDataType}:</span>
                      <span className="font-mono text-[10px]">Fetched: {new Date(liveData.fetched_at).toLocaleTimeString()}</span>
                    </div>

                    <div className="overflow-x-auto border border-border/70 rounded-xl bg-background/50 max-h-[320px] overflow-y-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="sticky top-0 bg-muted/80 backdrop-blur-xs z-10">
                          <tr className="border-b border-border/60 text-muted-foreground text-[11px] font-semibold">
                            <th className="py-2 px-3">HubSpot ID</th>
                            <th className="py-2 px-3">Name / Title</th>
                            {activeDataType === "products" && (
                              <>
                                <th className="py-2 px-3">Price</th>
                                <th className="py-2 px-3">Frequency</th>
                                <th className="py-2 px-3">Currency</th>
                              </>
                            )}
                            {activeDataType === "companies" && (
                              <>
                                <th className="py-2 px-3">Domain</th>
                                <th className="py-2 px-3">Location</th>
                              </>
                            )}
                            {activeDataType === "contacts" && (
                              <>
                                <th className="py-2 px-3">Email</th>
                                <th className="py-2 px-3">Phone</th>
                              </>
                            )}
                            {activeDataType === "deals" && (
                              <>
                                <th className="py-2 px-3">Amount</th>
                                <th className="py-2 px-3">Stage</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40 font-sans">
                          {filteredLiveItems.map((it) => (
                            <tr key={it.id} className="hover:bg-muted/30 transition-colors">
                              <td className="py-2 px-3 font-mono text-[11px] text-muted-foreground">{it.id}</td>
                              <td className="py-2 px-3 font-medium text-foreground">
                                {it.properties.name ||
                                  `${it.properties.firstname || ""} ${it.properties.lastname || ""}`.trim() ||
                                  it.properties.dealname ||
                                  "Unnamed"}
                              </td>
                              {activeDataType === "products" && (
                                <>
                                  <td className="py-2 px-3 font-mono font-medium text-emerald-600 dark:text-emerald-400">
                                    ${Number(it.properties.price || 0).toFixed(2)}
                                  </td>
                                  <td className="py-2 px-3 text-muted-foreground">
                                    <Badge variant="outline" className="text-[10px] font-normal">
                                      {it.properties.recurringbillingfrequency || "One-Time"}
                                    </Badge>
                                  </td>
                                  <td className="py-2 px-3 text-muted-foreground">
                                    {it.properties.currency || "USD"}
                                  </td>
                                </>
                              )}
                              {activeDataType === "companies" && (
                                <>
                                  <td className="py-2 px-3 text-muted-foreground">{it.properties.domain || "—"}</td>
                                  <td className="py-2 px-3 text-muted-foreground">
                                    {[it.properties.city, it.properties.country].filter(Boolean).join(", ") || "—"}
                                  </td>
                                </>
                              )}
                              {activeDataType === "contacts" && (
                                <>
                                  <td className="py-2 px-3 text-muted-foreground">{it.properties.email || "—"}</td>
                                  <td className="py-2 px-3 text-muted-foreground">{it.properties.phone || "—"}</td>
                                </>
                              )}
                              {activeDataType === "deals" && (
                                <>
                                  <td className="py-2 px-3 font-mono font-medium text-emerald-600">
                                    ${Number(it.properties.amount || 0).toLocaleString()}
                                  </td>
                                  <td className="py-2 px-3 text-muted-foreground">{it.properties.dealstage || "—"}</td>
                                </>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border/70 rounded-xl bg-muted/10 space-y-2">
                    <Database className="w-6 h-6 mx-auto opacity-40 text-orange-500" />
                    <p>Click "Fetch" above to inspect live records directly from HubSpot CRM.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* 2. MICROSOFT ENTRA (RECEIVABLE MAILBOX) TAB VIEW                    */}
      {/* ════════════════════════════════════════════════════════════════════ */}
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
