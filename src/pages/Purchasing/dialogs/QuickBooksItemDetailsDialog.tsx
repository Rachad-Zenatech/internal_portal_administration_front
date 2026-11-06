import type { QuickBooksItemDetailsDialogProps } from "./quickBooksItemDetailsDialog/types";
import { useQuickBooksItemDetailsDialog } from "./quickBooksItemDetailsDialog/hooks/useQuickBooksItemDetailsDialog";
import { QuickBooksItemDetailsDialogBody } from "./quickBooksItemDetailsDialog/QuickBooksItemDetailsDialogBody";
import type { QuickBooksItemDetailsDialogGuardedState } from "./quickBooksItemDetailsDialog/hooks/useQuickBooksItemDetailsDialog";

export function QuickBooksItemDetailsDialog(props: QuickBooksItemDetailsDialogProps) {
  const s = useQuickBooksItemDetailsDialog(props);
  const { item } = s;
  if (!item) return null;
  return <QuickBooksItemDetailsDialogBody s={s as QuickBooksItemDetailsDialogGuardedState} />;
}
