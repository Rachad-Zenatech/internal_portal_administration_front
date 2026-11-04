import { useBatchApprovalData } from "./useBatchApprovalData";

export function useBatchApproval() {
  const c1 = useBatchApprovalData();
  return { ...c1 };
}

export type BatchApprovalState = ReturnType<typeof useBatchApproval>;
