import { useMutation } from "@tanstack/react-query";
import { arInvoiceService } from "../../../../services/arInvoiceService";
import type { CustomerInvoiceTemplate } from "../../../../services/arInvoiceService";
import type { useGenerateInvoiceActions } from "./useGenerateInvoiceActions";
import type { useGenerateInvoiceActions2 } from "./useGenerateInvoiceActions2";
import type { useGenerateInvoiceDerived } from "./useGenerateInvoiceDerived";
import type { useGenerateInvoiceActions3 } from "./useGenerateInvoiceActions3";
import type { useGenerateInvoiceActions4 } from "./useGenerateInvoiceActions4";

export function useGenerateInvoiceData(ctx: ReturnType<typeof useGenerateInvoiceActions> & ReturnType<typeof useGenerateInvoiceActions2> & ReturnType<typeof useGenerateInvoiceDerived> & ReturnType<typeof useGenerateInvoiceActions3> & ReturnType<typeof useGenerateInvoiceActions4>) {
  const { pdfPreviewRef, setLastPreviewedAt, formTopRef, setIsApplyTemplateModalOpen, setApplyNewPresetName, setApplySetAsDefault, setTargetTemplateIdToOverwrite, setApplyTemplateMode, sortedCustomerTemplates, selectedTemplateId, layoutStyle, setSaveSuccessMsg, currentInvoiceId, setTemplateName, setSelectedTemplateId, refetchCustomerTemplates, queryClient, currentPayload, templateName, selectedCustomer, newPresetName, setNewPresetName, setIsSavePresetDialogOpen, newPresetIsDefault, handleSelectCustomerOption, setIsRenamePresetDialogOpen, navigate, setCurrentInvoiceId, invoiceNumber, billToName, setIsSendEmailDialogOpen, setEmailCustomMessage, fromCompany, setEmailSubject, billToEmail, setEmailRecipient, emailCustomMessage, emailSubject, emailRecipient, emailSender } = ctx;
  // Preview & Scroll Action
  const handlePreviewAndScroll = () => {
    setLastPreviewedAt(new Date());
    setTimeout(() => {
      pdfPreviewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };
  const handleScrollToForm = () => {
    formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  // Open dialog for choosing whether to update existing template or create a new preset
  const handleOpenApplyTemplateDialog = () => {
    if (!layoutStyle) {
      alert("Please select an Invoice Template (Pace+ or interlinkONE) before saving.");
      return;
    }
    if (sortedCustomerTemplates.length > 0) {
      setApplyTemplateMode("existing");
      const currentOrFirst = selectedTemplateId || sortedCustomerTemplates[0]?.id || "";
      setTargetTemplateIdToOverwrite(currentOrFirst);
      const currTmpl = sortedCustomerTemplates.find((t) => t.id === currentOrFirst);
      setApplySetAsDefault(currTmpl ? !!currTmpl.is_default : false);
    } else {
      setApplyTemplateMode("new");
      setTargetTemplateIdToOverwrite("");
      setApplySetAsDefault(true);
    }
    setApplyNewPresetName("");
    setIsApplyTemplateModalOpen(true);
  };
  // Apply to Customer Template Mutation (Supports updating existing preset or creating new preset, plus updating invoice snapshot)
  const saveTemplateMutation = useMutation({
    mutationFn: async ({
      mode,
      templateId,
      newPresetName: customPresetName,
      isDefault,
    }: {
      mode: "existing" | "new";
      templateId?: string;
      newPresetName?: string;
      isDefault: boolean;
    }) => {
      const custId = selectedCustomer?.id || "CUST-CUSTOM";
      let targetPayload: CustomerInvoiceTemplate;

      if (mode === "existing") {
        const targetTmpl = sortedCustomerTemplates.find((t) => t.id === templateId);
        targetPayload = {
          ...currentPayload,
          template_id: templateId || selectedTemplateId || undefined,
          template_name: targetTmpl?.template_name || templateName || "Standard Template",
          is_default: isDefault,
          is_new_preset: false,
          layout_style: layoutStyle,
        };
      } else {
        targetPayload = {
          ...currentPayload,
          template_name: customPresetName?.trim() || "Custom Preset",
          is_default: isDefault,
          is_new_preset: true,
          layout_style: layoutStyle,
        };
      }

      const tmplRes = await arInvoiceService.saveCustomerTemplate(custId, targetPayload);
      let invRes: any = null;
      if (currentInvoiceId) {
        invRes = await arInvoiceService.generateInvoice({
          ...currentPayload,
          template_id: tmplRes.template_id || templateId || selectedTemplateId || undefined,
        });
      }
      return {
        tmpl: tmplRes,
        inv: invRes,
        mode,
        name: targetPayload.template_name,
        id: tmplRes.template_id || templateId || selectedTemplateId,
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ar-customers"] });
      if (currentInvoiceId) {
        queryClient.invalidateQueries({ queryKey: ["ar-invoices"] });
      }
      refetchCustomerTemplates();
      if (data.id) {
        setSelectedTemplateId(data.id);
      }
      if (data.name) {
        setTemplateName(data.name);
      }
      setIsApplyTemplateModalOpen(false);
      setApplyNewPresetName("");

      if (currentInvoiceId && data.inv) {
        setSaveSuccessMsg(
          data.mode === "new"
            ? `Created new preset "${data.name}" and updated invoice ${data.inv.invoice_number}!`
            : `Updated template preset "${data.name}" and updated invoice ${data.inv.invoice_number}!`
        );
      } else {
        setSaveSuccessMsg(
          data.mode === "new"
            ? `Created new preset "${data.name}" successfully!`
            : `Saved changes to template preset "${data.name}" successfully!`
        );
      }
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    },
    onError: (err: any) => {
      console.error("Failed to apply template changes:", err);
      alert(err?.response?.data?.detail || err?.message || "Failed to save template preset.");
    },
  });
  // Save as New Preset Mutation
  const saveNewPresetMutation = useMutation({
    mutationFn: async () => {
      const custId = selectedCustomer?.id || "CUST-CUSTOM";
      const payload: CustomerInvoiceTemplate = {
        ...currentPayload,
        template_name: newPresetName.trim() || "Custom Preset",
        is_default: newPresetIsDefault,
        is_new_preset: true,
        layout_style: layoutStyle,
      };
      return arInvoiceService.saveCustomerTemplate(custId, payload);
    },
    onSuccess: (data) => {
      refetchCustomerTemplates();
      queryClient.invalidateQueries({ queryKey: ["ar-customers"] });
      if (data.template_id) {
        setSelectedTemplateId(data.template_id);
      }
      setTemplateName(newPresetName.trim() || "Custom Preset");
      setIsSavePresetDialogOpen(false);
      setNewPresetName("");
      setSaveSuccessMsg(`Saved new preset "${data.template_name || newPresetName}" successfully!`);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    },
  });
  // Delete Template Preset Mutation
  const deletePresetMutation = useMutation({
    mutationFn: async (tmplId: string) => {
      return arInvoiceService.deleteTemplate(tmplId);
    },
    onSuccess: () => {
      refetchCustomerTemplates();
      queryClient.invalidateQueries({ queryKey: ["ar-customers"] });
      setSelectedTemplateId(null);
      setTemplateName("Standard Template");
      if (selectedCustomer) {
        handleSelectCustomerOption({
          id: selectedCustomer.id,
          display_name: selectedCustomer.display_name || selectedCustomer.name,
          full_name: selectedCustomer.contact_person,
          email: selectedCustomer.email,
          phone: selectedCustomer.phone,
          bill_address: selectedCustomer.billing_address,
        });
      }
      setSaveSuccessMsg("Preset deleted successfully.");
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    },
  });
  // Rename Template Preset Mutation
  const renamePresetMutation = useMutation({
    mutationFn: async ({ templateId, newName }: { templateId: string; newName: string }) => {
      return arInvoiceService.renameTemplate(templateId, newName);
    },
    onSuccess: (data) => {
      refetchCustomerTemplates();
      queryClient.invalidateQueries({ queryKey: ["ar-customers"] });
      setTemplateName(data.template_name);
      setIsRenamePresetDialogOpen(false);
      setSaveSuccessMsg(`Preset renamed to "${data.template_name}" successfully!`);
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    },
  });
  // Generate & Save (or Update) Invoice Snapshot Mutation (Does NOT touch customer template)
  const generateInvoiceMutation = useMutation({
    mutationFn: () => arInvoiceService.generateInvoice(currentPayload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ar-invoices"] });
      if (data.invoice_id) {
        queryClient.invalidateQueries({ queryKey: ["next-invoice-eligibility", data.invoice_id] });
        setCurrentInvoiceId(data.invoice_id);
        navigate(`/account-receivable/generate?invoiceId=${encodeURIComponent(data.invoice_id)}`, { replace: true });
      }
      setSaveSuccessMsg(`Invoice ${data.invoice_number} saved successfully!`);
      setTimeout(() => {
        setSaveSuccessMsg(null);
      }, 4000);
    },
  });
  // Delete Invoice Mutation
  const deleteInvoiceMutation = useMutation({
    mutationFn: async (invId: string) => {
      return arInvoiceService.deleteInvoice(invId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ar-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["ar-quote-summary"] });
      navigate("/account-receivable?tab=invoices");
    },
    onError: (err: any) => {
      alert("Failed to delete invoice: " + (err?.response?.data?.detail || err.message));
    },
  });
  const handleDeleteInvoice = () => {
    if (!currentInvoiceId) return;
    if (window.confirm(`Are you sure you want to delete invoice ${invoiceNumber}? This action cannot be undone.`)) {
      deleteInvoiceMutation.mutate(currentInvoiceId);
    }
  };
  // Generate & Save Invoice Handler with Validation
  const handleGenerateInvoice = () => {
    if (!layoutStyle) {
      alert("Please select an Invoice Template (Pace+ or interlinkONE) before generating the invoice.");
      return;
    }
    if (!selectedCustomer && !billToName.trim()) {
      alert("Please select an A/R Customer or provide a Bill-To Name before generating the invoice.");
      return;
    }
    generateInvoiceMutation.mutate();
  };
  // Send Email Modal Trigger
  const handleOpenSendEmail = () => {
    setEmailRecipient(billToEmail || selectedCustomer?.email || "");
    setEmailSubject(`Invoice ${invoiceNumber} from ${fromCompany || "ZenaTech Inc."}`);
    setEmailCustomMessage("");
    setIsSendEmailDialogOpen(true);
  };
  // Send Invoice Statement via SendGrid Mutation
  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      if (currentInvoiceId) {
        return arInvoiceService.sendInvoiceEmail(currentInvoiceId, {
          from_email: emailSender.trim() || "test-invoices@zenatech.com",
          to_email: emailRecipient.trim(),
          subject: emailSubject.trim() || undefined,
          custom_message: emailCustomMessage.trim() || undefined,
        });
      } else {
        return arInvoiceService.sendCustomInvoiceEmail({
          invoice_data: currentPayload,
          from_email: emailSender.trim() || "test-invoices@zenatech.com",
          to_email: emailRecipient.trim(),
          subject: emailSubject.trim() || undefined,
          custom_message: emailCustomMessage.trim() || undefined,
        });
      }
    },
    onSuccess: (data) => {
      setIsSendEmailDialogOpen(false);
      setSaveSuccessMsg(
        data.simulated
          ? `[SIMULATED] Email logged to console for ${data.to_email} from sender ${data.from_email}.`
          : `Email sent successfully to ${data.to_email}!`
      );
      setTimeout(() => setSaveSuccessMsg(null), 6000);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.detail || "Failed to send email. Please check your SendGrid configuration.");
    },
  });
  const handlePrint = () => {
    window.print();
  };
  return { handlePreviewAndScroll, handleScrollToForm, handleOpenApplyTemplateDialog, saveTemplateMutation, saveNewPresetMutation, deletePresetMutation, renamePresetMutation, generateInvoiceMutation, deleteInvoiceMutation, handleDeleteInvoice, handleGenerateInvoice, handleOpenSendEmail, sendEmailMutation, handlePrint };
}
