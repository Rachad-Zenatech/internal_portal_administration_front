import type { RequestDetailGuardedState } from "./useRequestDetail";
import { useRequestDetailActions2 } from "./useRequestDetailActions2";
import { useRequestDetailActions3 } from "./useRequestDetailActions3";

export function useRequestDetailTail(s: RequestDetailGuardedState) {
  const t1 = useRequestDetailActions2(s);
  const t2 = useRequestDetailActions3({ ...s, ...t1 });
  return { ...t1, ...t2 };
}

export type RequestDetailViewState = RequestDetailGuardedState & ReturnType<typeof useRequestDetailTail>;
