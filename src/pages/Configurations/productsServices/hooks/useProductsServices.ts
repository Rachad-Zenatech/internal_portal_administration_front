import { useProductsServicesActions } from "./useProductsServicesActions";

export function useProductsServices() {
  const c1 = useProductsServicesActions();
  return { ...c1 };
}

export type ProductsServicesState = ReturnType<typeof useProductsServices>;
