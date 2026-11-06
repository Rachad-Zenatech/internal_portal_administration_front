import { useUsersDerived } from "./useUsersDerived";

export function useUsers() {
  const c1 = useUsersDerived();
  return { ...c1 };
}

export type UsersState = ReturnType<typeof useUsers>;
