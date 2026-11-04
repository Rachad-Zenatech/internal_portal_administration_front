import { useMyApprovalsData } from "./useMyApprovalsData";

export function useMyApprovals() {
  const c1 = useMyApprovalsData();
  return { ...c1 };
}

export type MyApprovalsState = ReturnType<typeof useMyApprovals>;
