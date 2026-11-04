import { useSystemLogsPageActions } from "./useSystemLogsPageActions";

export function useSystemLogsPage() {
  const c1 = useSystemLogsPageActions();
  return { ...c1 };
}

export type SystemLogsPageState = ReturnType<typeof useSystemLogsPage>;
