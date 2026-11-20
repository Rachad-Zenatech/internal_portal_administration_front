import { useGlobalSettingsDialogActions } from "./useGlobalSettingsDialogActions";
import { useBatchAndEodNotifications } from "./useBatchAndEodNotifications";
import type { GlobalSettingsDialogProps } from "../types";

export function useGlobalSettingsDialog(props: GlobalSettingsDialogProps) {
  const { open, onOpenChange, inAppAlerts, setInAppAlerts, windowsNotifications, onToggleWindowsNotifications, onTestWindowsNotification } = props;
  const c1 = useGlobalSettingsDialogActions(props);
  const c2 = useBatchAndEodNotifications(open, c1.canManageAdminSettings);
  return { ...c1, ...c2, open, onOpenChange, inAppAlerts, setInAppAlerts, windowsNotifications, onToggleWindowsNotifications, onTestWindowsNotification };
}

export type GlobalSettingsDialogState = ReturnType<typeof useGlobalSettingsDialog>;
