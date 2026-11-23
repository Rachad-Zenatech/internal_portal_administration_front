import { useGlobalSettingsDialogActions } from "./useGlobalSettingsDialogActions";
import { useBatchAndEodNotifications } from "./useBatchAndEodNotifications";
import { useEmailNotificationsSettings } from "./useEmailNotificationsSettings";
import type { GlobalSettingsDialogProps } from "../types";

export function useGlobalSettingsDialog(props: GlobalSettingsDialogProps) {
  const { open, onOpenChange, inAppAlerts, setInAppAlerts, windowsNotifications, onToggleWindowsNotifications, onTestWindowsNotification } = props;
  const c1 = useGlobalSettingsDialogActions(props);
  const c2 = useBatchAndEodNotifications(open, c1.canManageAdminSettings);
  const c3 = useEmailNotificationsSettings(open, c1.canManageAdminSettings);
  return { ...c1, ...c2, ...c3, open, onOpenChange, inAppAlerts, setInAppAlerts, windowsNotifications, onToggleWindowsNotifications, onTestWindowsNotification };
}

export type GlobalSettingsDialogState = ReturnType<typeof useGlobalSettingsDialog>;
