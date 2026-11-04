import { AlertCircle, ArrowRight, ArrowLeft, CheckCircle2, FileText, Building2, Landmark, Phone, Mail, MapPin, User } from "lucide-react";
import { FilePreviewModal } from "../../Purchasing/dialogs/FilePreviewModal";
import { Button } from "../../../components/ui/button";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import { ARCustomerAutocomplete } from "../fields/ARCustomerAutocomplete";
import { GLCodeAutocomplete } from "../../Purchasing/fields/GLCodeAutocomplete";
import type { NewWorkflowModalProps } from "./newWorkflow/types";
import { WORKFLOW_TYPE_CONFIGS } from "./newWorkflow/constants";
import { useNewWorkflow } from "./newWorkflow/hooks/useNewWorkflow";
import { BeneficiaryBankSettlementDetails } from "./newWorkflow/sections/BeneficiaryBankSettlementDetails";
import { AiRefineFeedbackNotification } from "./newWorkflow/sections/AiRefineFeedbackNotification";
import { DragAndDropDropzone } from "./newWorkflow/sections/DragAndDropDropzone";
import { BpmnHeaderBanner } from "./newWorkflow/sections/BpmnHeaderBanner";
import { BpmnHeaderBanner2 } from "./newWorkflow/sections/BpmnHeaderBanner2";
import { RecurringSubscriptionParameters } from "./newWorkflow/sections/RecurringSubscriptionParameters";
import { ContractRenewalTermsExtension } from "./newWorkflow/sections/ContractRenewalTermsExtension";

export default function NewWorkflowModal(props: NewWorkflowModalProps) {
  const s = useNewWorkflow(props);
  const { previewTarget, setIsPreviewOpen, isPreviewOpen, selectedConfig, workflowToEdit, createMutation, generateSaleMutation, updateMutation, onOpenChange, setStep, setNotes, notes, setAccountNumber, accountNumber, selectedType, selectedCustomer, handleCustomerSelected, customerName, customerId, handleSubmit, setSelectedType, step, errorMsg, resetForm, open } = s;
  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) resetForm();
        onOpenChange(val);
      }}
    >
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0 bg-background border border-border shadow-2xl">
        <DialogHeader className="p-6 pr-12 border-b border-border bg-muted/20">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-xl font-bold text-foreground truncate">
                  {workflowToEdit
                    ? `Edit ${selectedConfig.title} Details`
                    : step === 1
                    ? "Select Workflow Model"
                    : `Configure ${selectedConfig.title}`}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {workflowToEdit
                    ? `Modify ${selectedConfig.title} specifications, customer banking data, and form details.`
                    : step === 1
                    ? "Choose one of the 5 standard BPMN accounts receivable processes"
                    : selectedConfig.description}
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center shrink-0 whitespace-nowrap text-xs font-semibold text-muted-foreground bg-muted px-3 py-1 rounded-full border border-border/60 shadow-2xs">
              <span>{workflowToEdit ? "Edit Mode" : `Step ${step} of 2`}</span>
            </div>
          </div>
        </DialogHeader>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {step === 1 ? (
          <div className="p-6 space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Available Workflow Archetypes
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {WORKFLOW_TYPE_CONFIGS.map((cfg) => {
                const Icon = cfg.icon;
                const isSelected = selectedType === cfg.type;
                return (
                  <button
                    key={cfg.type}
                    type="button"
                    onClick={() => setSelectedType(cfg.type)}
                    className={`text-left p-4 rounded-xl border transition-all duration-150 flex flex-col justify-between ${
                      isSelected
                        ? `${cfg.bgColor} ring-2 ring-primary/40 shadow-sm`
                        : "border-border/60 hover:border-border hover:bg-muted/40"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-lg ${cfg.bgColor} ${cfg.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="font-semibold text-sm text-foreground">
                            {cfg.title}
                          </span>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                        )}
                      </div>
                      <span className="text-[11px] font-medium text-primary block mb-1">
                        {cfg.shortDesc}
                      </span>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {cfg.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <DialogFooter className="pt-4 border-t border-border mt-6">
              <Button
                variant="outline"
                type="button"
                onClick={() => onOpenChange(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs gap-1.5"
              >
                <span>Continue to Form</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* AR Customer & Contact Details Card */}
            <div className="p-4 rounded-xl bg-card border border-border/80 shadow-xs space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
                <div className="space-y-1 flex-1 min-w-0">
                  <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-primary" />
                    Select A/R Customer <span className="text-red-500 font-bold">*</span>
                  </Label>
                  <ARCustomerAutocomplete
                    customerId={customerId}
                    customerName={customerName}
                    onSelect={handleCustomerSelected}
                    required
                  />
                </div>
                {selectedCustomer && (
                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                    <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-muted text-foreground border border-border">
                      {selectedCustomer.id}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      GL 1100 (A/R)
                    </span>
                  </div>
                )}
              </div>

              {/* Customer Contact Details Display */}
              {selectedCustomer && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60 space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <User className="w-3 h-3 text-primary" />
                      Primary Contact
                    </span>
                    <p className="font-semibold text-foreground truncate">
                      {selectedCustomer.full_name || selectedCustomer.display_name}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60 space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Mail className="w-3 h-3 text-primary" />
                      Email Address
                    </span>
                    <p className="font-medium text-foreground truncate">
                      {selectedCustomer.email || "No email on file"}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60 space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3 text-primary" />
                      Phone Number
                    </span>
                    <p className="font-medium text-foreground truncate">
                      {selectedCustomer.phone || "No phone on file"}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60 space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-primary" />
                      Billing Address
                    </span>
                    <p className="font-medium text-foreground truncate" title={selectedCustomer.bill_address || ""}>
                      {selectedCustomer.bill_address || "No address on file"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Specialized Dynamic Fields */}
            {selectedType === "CASH" && (
              <div className="space-y-4 border border-emerald-500/20 bg-emerald-500/5 p-4 rounded-xl">
                {/* 1. Treasury Bank Confirmation */}
                <BeneficiaryBankSettlementDetails s={s} />

                {/* 2. Treasury Invoice Search & Multi-Matching */}
                <AiRefineFeedbackNotification s={s} />

                {/* 3. Invoice & Bank Documents Attachments with Drag & Drop */}
                <DragAndDropDropzone s={s} />
              </div>
            )}

            <BpmnHeaderBanner s={s} />

            <BpmnHeaderBanner2 s={s} />

            <RecurringSubscriptionParameters s={s} />

            <ContractRenewalTermsExtension s={s} />

            {/* Account # - Account Number (Required for Cash Reconciliation) */}
            {selectedType === "CASH" && (
              <div className="space-y-1.5 p-3.5 rounded-xl bg-card border border-border/80 shadow-xs">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Landmark className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Account # (Account Number)</span>
                    <span className="text-red-500 font-bold">*</span>
                  </Label>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    Required Chart of Accounts GL Mapping
                  </span>
                </div>
                <GLCodeAutocomplete
                  value={accountNumber}
                  onChange={(val) => setAccountNumber(val)}
                  placeholder="Select Account # - Account Name (e.g. 1010 - Cash / Operating Account) *"
                  showDetailCard={false}
                />
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">
                Workflow Notes / Internal Remarks
              </Label>
              <Textarea
                placeholder="Add any context, billing approval notes, or reconciliation comments..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-xs h-16 resize-none"
              />
            </div>

            <DialogFooter className="pt-4 border-t border-border flex items-center justify-between">
              {!workflowToEdit ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="text-xs gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </Button>
              ) : (
                <div />
              )}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending || generateSaleMutation.isPending}
                  className="text-xs gap-1.5"
                >
                  {updateMutation.isPending ? (
                    <span>Saving Changes...</span>
                  ) : generateSaleMutation.isPending ? (
                    <span>Generating Sale Invoice...</span>
                  ) : createMutation.isPending ? (
                    <span>Creating Workflow...</span>
                  ) : workflowToEdit ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Save Workflow Changes</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Create {selectedConfig.title}</span>
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        )}
      </DialogContent>

      <FilePreviewModal
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        target={previewTarget}
      />
    </Dialog>
  );
}

export type { CurrencyOption, BankFieldDef } from "./newWorkflow/types";
export { AR_CURRENCY_OPTIONS, BANK_DETAILS_CATALOG } from "./newWorkflow/constants";
