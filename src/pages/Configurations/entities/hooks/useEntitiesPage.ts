import { useEntitiesDerived } from "./useEntitiesDerived";

export function useEntitiesPage() {
  const c1 = useEntitiesDerived();
  return { ...c1 };
}

export type EntitiesState = ReturnType<typeof useEntitiesPage>;
