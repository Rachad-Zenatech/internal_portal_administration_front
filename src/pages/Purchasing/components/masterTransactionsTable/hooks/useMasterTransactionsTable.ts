import { useMasterTransactionsTableDerived } from "./useMasterTransactionsTableDerived";

export function useMasterTransactionsTable(props) {
  const { isLoading = false, isAP = false, isSuperAdmin = false, onOpenBreakdownModal, onToggleReviewStatus, reviewMutationPending = false } = props;
  const c1 = useMasterTransactionsTableDerived(props);
  return { ...c1, isLoading, isAP, isSuperAdmin, onOpenBreakdownModal, onToggleReviewStatus, reviewMutationPending };
}

export type MasterTransactionsTableState = ReturnType<typeof useMasterTransactionsTable>;
