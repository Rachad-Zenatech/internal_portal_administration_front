import { Package, Plus, Edit2, Trash2, CheckCircle2, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ProductsServicesState } from "../hooks/useProductsServices";

export function ProductsServicesTable({ s }: { s: ProductsServicesState }) {
  const { setDeleteItem, handleOpenEdit, filteredProducts, handleOpenAdd, setIsSyncModalOpen, searchTerm, isLoading } = s;
  return (
    <Card className="border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/70 dark:bg-slate-900/50">
              <TableRow>
                <TableHead className="w-[300px]">Item / Description</TableHead>
                <TableHead className="w-[170px]">Brands</TableHead>
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
                      {item.brands ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge
                            variant="outline"
                            className="text-[10px] px-2 py-0.5 font-medium border-blue-200 bg-blue-50/80 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800"
                          >
                            {item.brands}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 text-xs italic">
                          —
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
  );
}
