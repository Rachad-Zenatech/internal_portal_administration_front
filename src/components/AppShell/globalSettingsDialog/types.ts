export interface GlobalSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inAppAlerts: boolean;
  setInAppAlerts: (val: boolean) => void;
  windowsNotifications: boolean;
  onToggleWindowsNotifications: () => void;
  onTestWindowsNotification: () => void;
}
