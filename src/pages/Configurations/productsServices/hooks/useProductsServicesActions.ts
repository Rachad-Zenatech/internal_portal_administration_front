import { useState, useMemo, useRef } from "react";
import { useMasterProducts, useCreateMasterProduct, useUpdateMasterProduct, useDeleteMasterProduct, useSyncHubSpotProducts, useImportMasterProducts } from "@/hooks/useMasterTables";
import type { MasterProductItem } from "@/services/masterTablesService";
import { toast } from "sonner";

export function useProductsServicesActions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBrand, setFilterBrand] = useState<string>("ALL");
  const [filterSource, setFilterSource] = useState<"ALL" | "hubspot" | "manual">("ALL");
  const [filterActive, setFilterActive] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const { data, isLoading, isRefetching, refetch } = useMasterProducts();
  const createMutation = useCreateMasterProduct();
  const updateMutation = useUpdateMasterProduct();
  const deleteMutation = useDeleteMasterProduct();
  const syncMutation = useSyncHubSpotProducts();
  const importMutation = useImportMasterProducts();
  const products = data?.items || [];
  const totalCount = data?.total || products.length;
  const lastImportedAt = data?.last_imported_at;
  const lastFilename = data?.last_filename;
  // Add/Edit Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterProductItem | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    currency: "USD",
    billing_frequency: "One-Time",
    term: 1,
    sku: "",
    tax_rate: 0,
    product_type: "Service",
    is_active: true,
    brands: "",
  });
  // Delete Dialog State
  const [deleteItem, setDeleteItem] = useState<MasterProductItem | null>(null);
  // File Import State
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // HubSpot Sync Modal State
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [customApiKey, setCustomApiKey] = useState("");
  const uniqueBrands = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.brands) set.add(p.brands);
    });
    return Array.from(set).sort();
  }, [products]);
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const matchSearch =
        searchTerm === "" ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.raw_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.brands && item.brands.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchBrand =
        filterBrand === "ALL" ||
        (filterBrand === "NONE" && !item.brands) ||
        item.brands === filterBrand;

      const matchSource =
        filterSource === "ALL" ||
        (filterSource === "hubspot" && item.source === "hubspot") ||
        (filterSource === "manual" && item.source !== "hubspot");

      const matchActive =
        filterActive === "ALL" ||
        (filterActive === "ACTIVE" && item.is_active) ||
        (filterActive === "INACTIVE" && !item.is_active);

      return matchSearch && matchBrand && matchSource && matchActive;
    });
  }, [products, searchTerm, filterBrand, filterSource, filterActive]);
  const hubspotCount = useMemo(() => products.filter((p) => p.source === "hubspot").length, [products]);
  const activeCount = useMemo(() => products.filter((p) => p.is_active).length, [products]);
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      description: "",
      price: 0,
      currency: "USD",
      billing_frequency: "One-Time",
      term: 1,
      sku: "",
      tax_rate: 0,
      product_type: "Service",
      is_active: true,
      brands: "",
    });
    setIsDialogOpen(true);
  };
  const handleOpenEdit = (item: MasterProductItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || "",
      price: item.price,
      currency: item.currency || "USD",
      billing_frequency: item.billing_frequency || "One-Time",
      term: item.term || 1,
      sku: item.sku || "",
      tax_rate: item.tax_rate || 0,
      product_type: item.product_type || "Service",
      is_active: item.is_active,
      brands: item.brands || "",
    });
    setIsDialogOpen(true);
  };
  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    try {
      if (editingItem) {
        await updateMutation.mutateAsync({
          id: editingItem.id,
          payload: formData,
        });
      } else {
        await createMutation.mutateAsync(formData);
      }
      setIsDialogOpen(false);
    } catch {
      // Error handled by mutation
    }
  };
  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await deleteMutation.mutateAsync(deleteItem.id);
      setDeleteItem(null);
    } catch {
      // Error handled by mutation
    }
  };
  const handleTriggerHubSpotSync = async () => {
    try {
      await syncMutation.mutateAsync(customApiKey.trim() || undefined);
      setIsSyncModalOpen(false);
    } catch {
      // Error toast is handled by mutation
    }
  };
  const handleImportFile = async () => {
    if (!selectedFile) return;
    try {
      await importMutation.mutateAsync(selectedFile);
      setSelectedFile(null);
      setIsImportOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      // Handled by mutation
    }
  };
  return { searchTerm, setSearchTerm, filterBrand, setFilterBrand, filterSource, setFilterSource, filterActive, setFilterActive, isLoading, isRefetching, refetch, createMutation, updateMutation, syncMutation, importMutation, totalCount, lastImportedAt, lastFilename, isDialogOpen, setIsDialogOpen, editingItem, formData, setFormData, deleteItem, setDeleteItem, isImportOpen, setIsImportOpen, selectedFile, setSelectedFile, fileInputRef, isSyncModalOpen, setIsSyncModalOpen, customApiKey, setCustomApiKey, uniqueBrands, filteredProducts, hubspotCount, activeCount, handleOpenAdd, handleOpenEdit, handleSave, handleDelete, handleTriggerHubSpotSync, handleImportFile };
}
