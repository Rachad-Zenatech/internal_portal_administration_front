import { Package, Plus, Search, RefreshCw, FileSpreadsheet, CheckCircle2, Clock, Upload, X, Tag, Layers, Sparkles, Info, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { useProductsServices } from "./productsServices/hooks/useProductsServices";
import { ProductsServicesTable } from "./productsServices/sections/ProductsServicesTable";
import { CreateEditDialog } from "./productsServices/sections/CreateEditDialog";

export default function ProductsServices() {
  const s = useProductsServices();
  const { handleDelete, deleteItem, setDeleteItem, importMutation, selectedFile, handleImportFile, setIsImportOpen, setSelectedFile, fileInputRef, isImportOpen, syncMutation, handleTriggerHubSpotSync, setIsSyncModalOpen, setCustomApiKey, customApiKey, isSyncModalOpen, setFilterActive, setFilterSource, setFilterBrand, setSearchTerm, filterActive, filterSource, filterBrand, searchTerm, uniqueBrands, lastImportedAt, lastFilename, hubspotCount, activeCount, totalCount, handleOpenAdd, isRefetching, refetch } = s;
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
              value={filterBrand}
              onValueChange={(val: string) => setFilterBrand(val)}
            >
              <SelectTrigger className="h-9 w-[160px] text-xs">
                <SelectValue placeholder="Brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Brands</SelectItem>
                <SelectItem value="NONE">No Brand</SelectItem>
                {uniqueBrands.map((c) => (
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

            {(searchTerm || filterBrand !== "ALL" || filterSource !== "ALL" || filterActive !== "ALL") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setFilterBrand("ALL");
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
      <ProductsServicesTable s={s} />

      {/* Create / Edit Dialog */}
      <CreateEditDialog s={s} />

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
