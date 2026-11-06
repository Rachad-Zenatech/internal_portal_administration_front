import { Bookmark, Palette, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";
import type { InvoiceLayoutStyle } from "../types";
import type { GenerateInvoiceState } from "../hooks/useGenerateInvoice";

export function TemplatePresetSelectorVisual({ s }: { s: GenerateInvoiceState }) {
  const { handleSelectInvoiceTemplate, layoutStyle, deletePresetMutation, selectedTemplateId, templateName, setIsRenamePresetDialogOpen, setRenamePresetValue, selectedCustomer, setIsSavePresetDialogOpen, sortedCustomerTemplates, handleSelectPreset, currentInvoiceId } = s;
  return (
    <>
      {!currentInvoiceId && (
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3.5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              {/* Left: Template Preset Selection */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <Bookmark className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-foreground block">
                      Template Preset <span className="text-red-500">*</span>
                    </span>
                    <span className="text-[11px] text-muted-foreground">Saved item & layout preset for customer</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Select
                    value={selectedTemplateId || "default"}
                    onValueChange={(val) => {
                      if (val === "__new__") {
                        setIsSavePresetDialogOpen(true);
                      } else if (val === "default") {
                        if (sortedCustomerTemplates.length > 0) {
                          const def = sortedCustomerTemplates.find((t) => t.is_default) || sortedCustomerTemplates[0];
                          if (def && def.id) handleSelectPreset(def.id);
                        }
                      } else {
                        handleSelectPreset(val);
                      }
                    }}
                    disabled={!selectedCustomer}
                  >
                    <SelectTrigger className="h-8 text-xs min-w-[210px] bg-background">
                      <SelectValue placeholder={selectedCustomer ? "Select Template Preset" : "Select customer first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {sortedCustomerTemplates.length === 0 ? (
                        <SelectItem value="default" className="text-xs">
                          Standard Template (Default)
                        </SelectItem>
                      ) : (
                        sortedCustomerTemplates.map((t) => (
                          <SelectItem key={t.id || 'default'} value={t.id || 'default'} className="text-xs">
                            <div className="flex items-center gap-2">
                              <span>{t.template_name || "Standard Template"}</span>
                              {t.is_default && (
                                <Badge variant="secondary" className="text-[9px] px-1 py-0 font-normal">
                                  Default
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      )}
                      <SelectItem value="__new__" className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                        <div className="flex items-center gap-1.5">
                          <Plus className="w-3 h-3" />
                          <span>Save As New Preset...</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSavePresetDialogOpen(true)}
                    disabled={!selectedCustomer}
                    className="text-xs gap-1 h-8 px-2.5 bg-background hover:bg-muted text-foreground cursor-pointer"
                    title="Save current layout & items as a new named preset"
                  >
                    <Plus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span className="hidden sm:inline">New Preset</span>
                  </Button>

                  {selectedTemplateId && (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setRenamePresetValue(templateName);
                          setIsRenamePresetDialogOpen(true);
                        }}
                        className="text-xs h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
                        title="Rename this template preset"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete the template preset "${templateName}"?`)) {
                            deletePresetMutation.mutate(selectedTemplateId);
                          }
                        }}
                        disabled={deletePresetMutation.isPending}
                        className="text-xs h-8 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                        title="Delete this template preset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Right: Invoice Template Options (Pace+ and interlinkONE) - Required Dropdown */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                    <Palette className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-foreground block">
                      Invoice Template <span className="text-red-500">*</span>
                    </span>
                    <span className="text-[11px] text-muted-foreground">Select Pace+ or interlinkONE</span>
                  </div>
                </div>

                <Select
                  value={layoutStyle === "modern" ? "pace_plus" : layoutStyle === "classic" ? "interlinkone" : layoutStyle}
                  onValueChange={(val) => {
                    handleSelectInvoiceTemplate(val as InvoiceLayoutStyle);
                  }}
                >
                  <SelectTrigger className="h-8 text-xs min-w-[170px] bg-background">
                    <SelectValue placeholder="Select Invoice Template *" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pace_plus" className="text-xs font-medium">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#1B365D] inline-block shadow-2xs" />
                        <span className="font-semibold text-foreground">Pace+</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="interlinkone" className="text-xs font-medium">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#008b94] inline-block shadow-2xs" />
                        <span className="font-semibold text-foreground">interlinkONE</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
    </>
  );
}
