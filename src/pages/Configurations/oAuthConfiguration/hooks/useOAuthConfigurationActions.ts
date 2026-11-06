import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { oauthService, type HubSpotOAuthStatus, type HubSpotDataResponse, type MicrosoftEntraOAuthStatus, type ReceivableEmailItem } from "@/services/oauthService";
import { AVAILABLE_HUBSPOT_SCOPES } from "../constants";

export function useOAuthConfigurationActions() {
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
  const [isSigningInEntra, setIsSigningInEntra] = useState(false);
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
  const handleSignInEntra = async () => {
    try {
      setIsSigningInEntra(true);
      const res = await oauthService.getMicrosoftEntraAuthUrl();
      if (!res.auth_url) throw new Error("No authorization URL returned.");

      const width = 560;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      const popup = window.open(
        res.auth_url,
        "Microsoft Entra Sign In",
        `width=${width},height=${height},top=${top},left=${left},status=yes,scrollbars=yes`
      );
      if (!popup) window.location.href = res.auth_url;
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err.message || "Failed to generate Microsoft sign-in URL");
    } finally {
      setIsSigningInEntra(false);
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
  return { activeTab, setActiveTab, status, isLoadingStatus, isConnecting, isTesting, isRefreshing, isDisconnecting, isSyncing, clientId, setClientId, clientSecret, setClientSecret, redirectUri, setRedirectUri, selectedScopes, setSelectedScopes, showSecret, setShowSecret, isSavingConfig, hasCopiedUri, showGuide, setShowGuide, activeDataType, setActiveDataType, liveData, isLoadingData, searchFilter, setSearchFilter, entraStatus, isLoadingEntraStatus, isTestingEntra, isDisconnectingEntra, isSigningInEntra, isSavingEntraConfig, entraClientId, setEntraClientId, entraClientSecret, setEntraClientSecret, entraTenantId, setEntraTenantId, entraTargetMailbox, setEntraTargetMailbox, showEntraSecret, setShowEntraSecret, showEntraSettings, setShowEntraSettings, receivableEmails, isLoadingEmails, emailSearch, setEmailSearch, emailFilterMode, setEmailFilterMode, lastEmailFetchTime, loadStatus, loadEntraStatus, handleConnectHubSpot, handleTestConnection, handleRefreshToken, handleDisconnect, handleSaveConfig, handleCopyUri, handleFetchLiveData, handleSyncProducts, handleTestEntraConnection, handleSignInEntra, handleDisconnectEntra, handleSaveEntraConfig, handleFetchReceivableEmails, isConnected, isConfigured, connection, isEntraConnected, entraConn, filteredLiveItems, filteredReceivableEmails };
}
