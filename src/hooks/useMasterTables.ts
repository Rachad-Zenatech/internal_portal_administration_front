import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { masterTablesService } from "@/services/masterTablesService";
import { toast } from "sonner";

export function useMasterLocations(search?: string) {
  return useQuery({
    queryKey: ["master-locations", search || ""],
    queryFn: () => masterTablesService.getLocations(search),
    staleTime: 60 * 1000,
  });
}

export function useCreateMasterLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: masterTablesService.createLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-locations"] });
      toast.success("Location added successfully");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || "Failed to create location");
    },
  });
}

export function useUpdateMasterLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: { name: string; description?: string; is_active?: boolean } }) =>
      masterTablesService.updateLocation(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-locations"] });
      toast.success("Location updated successfully");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || "Failed to update location");
    },
  });
}

export function useDeleteMasterLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: masterTablesService.deleteLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-locations"] });
      toast.success("Location deleted successfully");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || "Failed to delete location");
    },
  });
}

export function useImportMasterLocations() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: masterTablesService.importLocationsFile,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["master-locations"] });
      toast.success(`Imported ${data.imported_count} locations successfully!`);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || "Failed to import locations file");
    },
  });
}

// --- Classes ---

export function useMasterClasses(search?: string) {
  return useQuery({
    queryKey: ["master-classes", search || ""],
    queryFn: () => masterTablesService.getClasses(search),
    staleTime: 60 * 1000,
  });
}

export function useCreateMasterClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: masterTablesService.createClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-classes"] });
      toast.success("Class added successfully");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || "Failed to create class");
    },
  });
}

export function useUpdateMasterClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: { name: string; description?: string; is_active?: boolean } }) =>
      masterTablesService.updateClass(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-classes"] });
      toast.success("Class updated successfully");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || "Failed to update class");
    },
  });
}

export function useDeleteMasterClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: masterTablesService.deleteClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-classes"] });
      toast.success("Class deleted successfully");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || "Failed to delete class");
    },
  });
}

export function useImportMasterClasses() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: masterTablesService.importClassesFile,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["master-classes"] });
      toast.success(`Imported ${data.imported_count} classes successfully!`);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || "Failed to import classes file");
    },
  });
}

// --- Products & Services (HubSpot Integration) ---

export function useMasterProducts(search?: string, isActive?: boolean) {
  return useQuery({
    queryKey: ["master-products", search || "", isActive !== undefined ? String(isActive) : "all"],
    queryFn: () => masterTablesService.getProducts(search, isActive),
    staleTime: 60 * 1000,
  });
}

export function useCompanyBrands(companyRef?: string | null) {
  return useQuery({
    queryKey: ["company-brands", companyRef || ""],
    queryFn: () => masterTablesService.getCompanyBrands(companyRef as string),
    enabled: !!companyRef && companyRef.trim() !== "",
    staleTime: 60 * 1000,
  });
}

export function useCreateMasterProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: masterTablesService.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-products"] });
      toast.success("Product/Service created successfully");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || "Failed to create product/service");
    },
  });
}

export function useUpdateMasterProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof masterTablesService.updateProduct>[1] }) =>
      masterTablesService.updateProduct(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-products"] });
      toast.success("Product/Service updated successfully");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || "Failed to update product/service");
    },
  });
}

export function useDeleteMasterProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: masterTablesService.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-products"] });
      toast.success("Product/Service deleted successfully");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || "Failed to delete product/service");
    },
  });
}

export function useSyncHubSpotProducts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (apiKey?: string) => masterTablesService.syncHubSpotProducts(apiKey),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["master-products"] });
      toast.success(data.message || `Synced ${data.count} items from HubSpot!`);
    },
    onError: (err: any) => {
      const errData = err?.response?.data;
      if (errData?.error === "MISSING_SCOPES") {
        toast.error("HubSpot permission missing: 'crm.objects.products.read' scope required", {
          description: errData.message,
          duration: 8000,
        });
      } else {
        toast.error(errData?.detail || errData?.message || "Failed to sync from HubSpot");
      }
    },
  });
}

export function useImportMasterProducts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: masterTablesService.importProductsFile,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["master-products"] });
      toast.success(`Imported ${data.imported_count} products/services successfully!`);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || "Failed to import products file");
    },
  });
}
