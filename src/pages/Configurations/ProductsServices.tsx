import { useState, useMemo, useRef } from "react";
import {
  Package,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Upload,
  X,
  Tag,
  Layers,
  Sparkles,
  Info,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useMasterProducts,
  useCreateMasterProduct,
  useUpdateMasterProduct,
  useDeleteMasterProduct,
  useSyncHubSpotProducts,
  useImportMasterProducts,
} from "@/hooks/useMasterTables";
import type { MasterProductItem } from "@/services/masterTablesService";
import { format } from "date-fns";
import { toast } from "sonner";

export default function ProductsServices() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCompany, setFilterCompany] = useState<string>("ALL");
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
    company_name: "",
    hubspot_company_id: "",
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

  const uniqueCompanies = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.company_name) set.add(p.company_name);
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
        (item.company_name && item.company_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchCompany =
        filterCompany === "ALL" ||
        (filterCompany === "NONE" && !item.company_name) ||
        item.company_name === filterCompany;

      const matchSource =
        filterSource === "ALL" ||
        (filterSource === "hubspot" && item.source === "hubspot") ||
        (filterSource === "manual" && item.source !== "hubspot");

      const matchActive =
        filterActive === "ALL" ||
        (filterActive === "ACTIVE" && item.is_active) ||
        (filterActive === "INACTIVE" && !item.is_active);

      return matchSearch && matchCompany && matchSource && matchActive;
    });
  }, [products, searchTerm, filterCompany, filterSource, filterActive]);

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
      company_name: "",
      hubspot_company_id: "",
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
      company_name: item.company_name || "",
      hubspot_company_id: item.hubspot_company_id || "",
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

  return (
    <div className="space-y-6">
      {/* Top Header & Stat Overview */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Products & Services
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Centralized catalog synced with HubSpot CRM and used in Quotes & Invoices autocomplete.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="h-9 gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSyncModalOpen(true)}
            className="h-9 gap-1.5 border-orange-200 bg-orange-50/50 hover:bg-orange-100/70 text-orange-700 dark:bg-orange-950/40 dark:border-orange-800 dark:text-orange-300"
          >
            <Sparkles className="w-3.5 h-3.5 text-orange-600" />
            Sync from HubSpot
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsImportOpen(true)}
            className="h-9 gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            Import File
          </Button>

          <Button
            size="sm"
            onClick={handleOpenAdd}
            className="h-9 gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Catalog
              </p>
              <h3 className="text-2xl font-bold mt-1 text-foreground">{totalCount}</h3>
            </div>
            <div className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <Layers className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Active Items
              </p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                {activeCount}
              </h3>
            </div>
            <div className="p-2.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                HubSpot Synced
              </p>
              <h3 className="text-2xl font-bold mt-1 text-orange-600 dark:text-orange-400">
                {hubspotCount}
              </h3>
            </div>
            <div className="p-2.5 rounded-full bg-orange-50 dark:bg-orange-950/50 text-orange-600">
              <Tag className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Last Synced / Source
              </p>
              <h3 className="text-sm font-semibold mt-1.5 truncate max-w-[170px] text-foreground">
                {lastFilename || "Direct Entry"}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {lastImportedAt ? format(new Date(lastImportedAt), "MMM d, yyyy h:mm a") : "No sync recorded"}
              </p>
            </div>
            <div className="p-2.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter Bar */}
      <Card className="border shadow-xs">
        <CardContent className="p-3.5 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products by name, SKU, or description..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <Select
              value={filterCompany}
              onValueChange={(val: string) => setFilterCompany(val)}
            >
              <SelectTrigger className="h-9 w-[160px] text-xs">
                <SelectValue placeholder="Company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Companies</SelectItem>
                <SelectItem value="NONE">General (No Company)</SelectItem>
                {uniqueCompanies.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterSource}
              onValueChange={(val: any) => setFilterSource(val)}
            >
              <SelectTrigger className="h-9 w-[140px] text-xs">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Sources</SelectItem>
                <SelectItem value="hubspot">HubSpot Only</SelectItem>
                <SelectItem value="manual">Manual / Files</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filterActive}
              onValueChange={(val: any) => setFilterActive(val)}
            >
              <SelectTrigger className="h-9 w-[130px] text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active Only</SelectItem>
                <SelectItem value="INACTIVE">Inactive Only</SelectItem>
              </SelectContent>
            </Select>

            {(searchTerm || filterCompany !== "ALL" || filterSource !== "ALL" || filterActive !== "ALL") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setFilterCompany("ALL");
                  setFilterSource("ALL");
                  setFilterActive("ALL");
                }}
                className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Products & Services Table */}
      <Card className="border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/70 dark:bg-slate-900/50">
              <TableRow>
                <TableHead className="w-[300px]">Item / Description</TableHead>
                <TableHead className="w-[170px]">Company</TableHead>
                <TableHead className="w-[100px]">Type</TableHead>
                <TableHead className="w-[110px]">SKU</TableHead>
                <TableHead className="w-[130px]">Standard Price</TableHead>
                <TableHead className="w-[140px]">Frequency & Term</TableHead>
                <TableHead className="w-[120px]">Source</TableHead>
                <TableHead className="w-[90px]">Status</TableHead>
                <TableHead className="w-[80px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-48" /><Skeleton className="h-3 w-32 mt-1.5" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-7 w-14 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-44 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground space-y-2">
                      <Package className="w-8 h-8 opacity-40 text-amber-500" />
                      <p className="text-sm font-medium">No products or services found</p>
                      <p className="text-xs max-w-sm">
                        {searchTerm
                          ? "Try adjusting your search criteria or clear filters."
                          : "Sync from HubSpot or add your first product to populate the catalog."}
                      </p>
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsSyncModalOpen(true)}
                          className="h-8 text-xs border-orange-200 text-orange-700 bg-orange-50"
                        >
                          <Sparkles className="w-3.5 h-3.5 mr-1 text-orange-600" />
                          Sync from HubSpot
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleOpenAdd}
                          className="h-8 text-xs bg-amber-600 text-white"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          Add Manually
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((item) => (
                  <TableRow key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                    <TableCell className="py-2.5">
                      <div className="font-semibold text-xs text-foreground">{item.name}</div>
                      {item.description ? (
                        <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5" title={item.description}>
                          {item.description}
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 italic mt-0.5">No description</div>
                      )}
                    </TableCell>

                    <TableCell className="py-2.5">
                      {item.company_name ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge
                            variant="outline"
                            className="text-[10px] px-2 py-0.5 font-medium border-blue-200 bg-blue-50/80 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800"
                          >
                            {item.company_name}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 text-xs italic">
                          General
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="py-2.5">
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0.5 font-medium ${
                          item.product_type === "Product"
                            ? "border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                            : "border-purple-200 bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300"
                        }`}
                      >
                        {item.product_type}
                      </Badge>
                    </TableCell>

                    <TableCell className="py-2.5 text-xs font-mono text-muted-foreground">
                      {item.sku || "—"}
                    </TableCell>

                    <TableCell className="py-2.5">
                      <div className="text-xs font-semibold text-foreground">
                        {item.currency} {Number(item.price).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      {item.tax_rate > 0 && (
                        <div className="text-[10px] text-muted-foreground">+{item.tax_rate}% tax</div>
                      )}
                    </TableCell>

                    <TableCell className="py-2.5">
                      <div className="text-xs font-medium text-foreground">{item.billing_frequency}</div>
                      {item.billing_frequency !== "One-Time" && item.term > 1 && (
                        <div className="text-[10.5px] text-muted-foreground font-light">Term: {item.term} mo</div>
                      )}
                    </TableCell>

                    <TableCell className="py-2.5">
                      {item.source === "hubspot" ? (
                        <Badge
                          variant="outline"
                          className="text-[10.5px] border-orange-200 bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300 font-semibold inline-flex items-center gap-1"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                          HubSpot
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-[10.5px] border-slate-200 bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400"
                        >
                          {item.source === "imported" ? "Imported File" : "Manual"}
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="py-2.5">
                      {item.is_active ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                          Inactive
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(item)}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          title="Edit Product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteItem(item)}
                          className="h-7 w-7 text-muted-foreground hover:text-rose-600"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Product / Service" : "Add Product / Service"}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? "Update pricing, billing terms, and details for this catalog item."
                : "Add a new product or recurring service to the master catalog."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-foreground">
                Item Name <span className="text-rose-500">*</span>
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Monthly Managed Cloud Service"
                className="mt-1 h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground">Type</label>
                <Select
                  value={formData.product_type}
                  onValueChange={(val) => setFormData({ ...formData, product_type: val })}
                >
                  <SelectTrigger className="mt-1 h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Service">Service</SelectItem>
                    <SelectItem value="Product">Product</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">SKU / Code</label>
                <Input
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="e.g. SRV-CLD-001"
                  className="mt-1 h-9 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Company</label>
              <Input
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="e.g. Zenatech Corporation, Acme Global Solutions... (optional)"
                className="mt-1 h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground">Standard Price</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className="mt-1 h-9 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Currency</label>
                <Select
                  value={formData.currency}
                  onValueChange={(val) => setFormData({ ...formData, currency: val })}
                >
                  <SelectTrigger className="mt-1 h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="CAD">CAD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Tax Rate (%)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.tax_rate}
                  onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                  className="mt-1 h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground">Billing Frequency</label>
                <Select
                  value={formData.billing_frequency}
                  onValueChange={(val) => setFormData({ ...formData, billing_frequency: val })}
                >
                  <SelectTrigger className="mt-1 h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="One-Time">One-Time</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Annual">Annual</SelectItem>
                    <SelectItem value="Quarterly">Quarterly</SelectItem>
                    <SelectItem value="Semi-Annual">Semi-Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Term (Months)</label>
                <Input
                  type="number"
                  min="1"
                  value={formData.term}
                  onChange={(e) => setFormData({ ...formData, term: parseInt(e.target.value) || 1 })}
                  className="mt-1 h-9 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Description</label>
              <Textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Product description and details for invoices..."
                className="mt-1 text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* HubSpot Live Sync Modal */}
      <Dialog open={isSyncModalOpen} onOpenChange={setIsSyncModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-orange-100 text-orange-600">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle>Sync from HubSpot</DialogTitle>
                <DialogDescription>
                  Pull all product and service catalog items directly from HubSpot CRM.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 border rounded-md space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Info className="w-4 h-4 text-blue-500" />
                Default Environment Key
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                By default, the server uses <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-[11px] font-mono font-bold">HUBSPOT_API_KEY</code> configured in backend <code className="text-[11px] font-mono">.env</code>.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">
                Custom HubSpot Token / Key (Optional override)
              </label>
              <Input
                type="password"
                placeholder="Leave blank to use .env key, or enter Private App Token (pat-...)"
                value={customApiKey}
                onChange={(e) => setCustomApiKey(e.target.value)}
                className="mt-1 h-9 text-xs"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Tip: HubSpot Private App tokens start with <code className="font-mono text-orange-600">pat-na1-...</code> and require scope <code className="font-mono font-medium text-slate-700 dark:text-slate-300">crm.objects.products.read</code>.
              </p>
            </div>

            {syncMutation.isError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-md text-xs text-rose-800 dark:text-rose-200 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  HubSpot Permission Required
                </div>
                <p className="text-[11px] leading-relaxed">
                  {(syncMutation.error as any)?.response?.data?.message ||
                    (syncMutation.error as any)?.response?.data?.detail ||
                    "This HubSpot key is missing the 'crm.objects.products.read' scope. In HubSpot, navigate to Settings ➔ Integrations ➔ Private Apps, edit your app to check 'crm.objects.products.read', and try again."}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSyncModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleTriggerHubSpotSync}
              disabled={syncMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700 text-white gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncMutation.isPending ? "animate-spin" : ""}`} />
              {syncMutation.isPending ? "Syncing from HubSpot..." : "Start Sync"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File Import Dialog */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Import Products File</DialogTitle>
            <DialogDescription>
              Upload an Excel (.xlsx) or CSV file with product name, price, description, and billing frequency.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.csv"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setSelectedFile(e.target.files[0]);
                }
              }}
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
            >
              <FileSpreadsheet className="w-10 h-10 mx-auto text-amber-500/80 mb-2" />
              <p className="text-xs font-semibold text-foreground">
                {selectedFile ? selectedFile.name : "Click to select a spreadsheet"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Supports .xlsx and .csv files
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedFile(null);
                setIsImportOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleImportFile}
              disabled={!selectedFile || importMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {importMutation.isPending ? "Importing..." : "Import Products"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product / Service?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <span className="font-semibold text-foreground">"{deleteItem?.name}"</span> from the catalog? This will not affect previously issued invoices or quotes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
