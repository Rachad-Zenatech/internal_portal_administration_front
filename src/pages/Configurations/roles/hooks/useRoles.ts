import { useRolesActions } from "./useRolesActions";

export function useRoles() {
  const c1 = useRolesActions();
  return { ...c1 };
}

export type RolesState = ReturnType<typeof useRoles>;
