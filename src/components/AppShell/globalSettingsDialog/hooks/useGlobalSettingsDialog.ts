import { useGlobalSettingsDialogActions } from "./useGlobalSettingsDialogActions";
import type { GlobalSettingsDialogProps } from "../types";

export function useGlobalSettingsDialog(props: GlobalSettingsDialogProps) {
  const { open, onOpenChange, inAppAlerts, setInAppAlerts, windowsNotifications, onToggleWindowsNotifications, onTestWindowsNotification } = props;
  const c1 = useGlobalSettingsDialogActions(props);
  return { ...c1, open, onOpenChange, inAppAlerts, setInAppAlerts, windowsNotifications, onToggleWindowsNotifications, onTestWindowsNotification };
}

export type GlobalSettingsDialogState = ReturnType<typeof useGlobalSettingsDialog>;
