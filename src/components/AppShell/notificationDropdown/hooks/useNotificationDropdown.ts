import { useNotificationDropdownDerived } from "./useNotificationDropdownDerived";
import type { NotificationDropdownProps } from "../types";

export function useNotificationDropdown(props: NotificationDropdownProps) {
  const { onClose } = props;
  const c1 = useNotificationDropdownDerived(props);
  return { ...c1, onClose };
}

export type NotificationDropdownState = ReturnType<typeof useNotificationDropdown>;
