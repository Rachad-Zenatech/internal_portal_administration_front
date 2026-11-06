import { useDashboardActions } from "./useDashboardActions";
import { useDashboardActions2 } from "./useDashboardActions2";

export function useDashboard() {
  const c1 = useDashboardActions();
  const c2 = useDashboardActions2(c1);
  return { ...c1, ...c2 };
}

export type DashboardState = ReturnType<typeof useDashboard>;
