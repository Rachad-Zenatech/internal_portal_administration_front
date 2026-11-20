import { Eye, EyeOff, Loader2, Lock, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OAuthConfigurationState } from "../hooks/useOAuthConfiguration";

interface SecretInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  hasExisting?: boolean;
  maskedValue?: string | null;
  placeholder: string;
  showValue: boolean;
  onToggleShow: () => void;
}

function MaskedCredentialField({
  id,
  label,
  value,
  onChange,
  hasExisting,
  maskedValue,
  placeholder,
  showValue,
  onToggleShow,
}: SecretInputProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id} className="text-xs font-semibold flex items-center gap-1">
          <Lock className="w-3 h-3 text-muted-foreground" />
          <span>{label}</span>
        </Label>
        {hasExisting && maskedValue && (
          <span className="text-[10.5px] text-emerald-600 dark:text-emerald-400 font-mono font-medium">
            Configured: {maskedValue}
          </span>
        )}
      </div>
      <div className="relative">
        <Input
          id={id}
          type={showValue ? "text" : "password"}
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={hasExisting ? "Leave blank to keep existing value" : placeholder}
          className="h-9 text-xs font-mono pr-8"
        />
        <button
          type="button"
          onClick={onToggleShow}
          aria-label={showValue ? "Hide value" : "Show value"}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          {showValue ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function ConnectionSettingsFooter({
  isDisconnectingEntra,
  handleDisconnectEntra,
  isSavingEntraConfig,
}: {
  isDisconnectingEntra: boolean;
  handleDisconnectEntra: () => void;
  isSavingEntraConfig: boolean;
}) {
  return (
    <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <span>
        Ensure <strong>Mail.Read</strong> or <strong>Group-Conversation.Read.All</strong> Application Permission has Admin Consent granted in Microsoft Entra.
      </span>
      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
        <Button type="button" variant="destructive" size="sm" onClick={handleDisconnectEntra} disabled={isDisconnectingEntra} className="h-8 text-xs">
          Disconnect
        </Button>
        <Button type="submit" size="sm" disabled={isSavingEntraConfig} className="h-8 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white">
          {isSavingEntraConfig ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
          Save Settings
        </Button>
      </div>
    </div>
  );
}

export function MailboxConnectionSettingsCard({ s }: { s: OAuthConfigurationState }) {
  const {
    entraStatus,
    entraTargetMailbox,
    setEntraTargetMailbox,
    entraTenantId,
    setEntraTenantId,
    entraClientId,
    setEntraClientId,
    entraClientSecret,
    setEntraClientSecret,
    entraGroupId,
    setEntraGroupId,
    showEntraSecret,
    setShowEntraSecret,
    isDisconnectingEntra,
    handleDisconnectEntra,
    isSavingEntraConfig,
    handleSaveEntraConfig,
  } = s;

  const cfg = entraStatus?.config;
  const toggleShow = () => setShowEntraSecret(!showEntraSecret);

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-foreground">Mailbox Connection Settings</h3>
        </div>
        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
          <Lock className="w-3 h-3" />
          All keys &amp; IDs are masked
        </span>
      </div>

      <form onSubmit={handleSaveEntraConfig} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="entra-target-mailbox" className="text-xs font-semibold">Target Mailbox / Group Email</Label>
            <Input
              id="entra-target-mailbox"
              type="email"
              value={entraTargetMailbox}
              onChange={(e) => setEntraTargetMailbox(e.target.value)}
              placeholder="accountsreceivable@zenatech.com"
              className="h-9 text-xs font-mono"
              required
            />
          </div>
          <MaskedCredentialField id="entra-tenant-id" label="Microsoft Entra Tenant ID" value={entraTenantId} onChange={setEntraTenantId} hasExisting={cfg?.has_tenant_id} maskedValue={cfg?.tenant_id_masked} placeholder="Paste Tenant ID..." showValue={showEntraSecret} onToggleShow={toggleShow} />
          <MaskedCredentialField id="entra-client-id" label="Application (Client) ID" value={entraClientId} onChange={setEntraClientId} hasExisting={cfg?.has_client_id} maskedValue={cfg?.client_id_masked} placeholder="Paste Application (Client) ID..." showValue={showEntraSecret} onToggleShow={toggleShow} />
          <MaskedCredentialField id="entra-client-secret" label="Client Secret" value={entraClientSecret} onChange={setEntraClientSecret} hasExisting={cfg?.has_client_secret} maskedValue={cfg?.client_secret_masked} placeholder="Paste Client Secret..." showValue={showEntraSecret} onToggleShow={toggleShow} />
          <MaskedCredentialField id="entra-group-id" label="M365 Group Object ID (Optional)" value={entraGroupId} onChange={setEntraGroupId} hasExisting={cfg?.has_group_id} maskedValue={cfg?.group_id_masked} placeholder="Paste Group Object ID (for M365 Groups)..." showValue={showEntraSecret} onToggleShow={toggleShow} />
        </div>
        <ConnectionSettingsFooter isDisconnectingEntra={isDisconnectingEntra} handleDisconnectEntra={handleDisconnectEntra} isSavingEntraConfig={isSavingEntraConfig} />
      </form>
    </div>
  );
}
