import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { arService } from "../../../../services/arService";
import { financeService } from "../../../../services/financeService";
import type { ARAttachment } from "../../../../types/ar";
import type { useWorkflowDetailActions } from "./useWorkflowDetailActions";

export function useWorkflowDetailActions2(ctx: ReturnType<typeof useWorkflowDetailActions>) {
  const { setIsPreviewOpen, generateDigitalInvoiceHtml, setPreviewTarget, attachmentMutation, refetch, queryClient, id, setIsDragging, workflow } = ctx;
  const handlePreviewAttachment = (att: ARAttachment) => {
    let url = att.file_url;
    const isStaleOrMissing = !url || url.startsWith("blob:");
    
    if (isStaleOrMissing) {
      const sampleContent = generateDigitalInvoiceHtml(att);
      const blob = new Blob([sampleContent], { type: "text/html" });
      url = URL.createObjectURL(blob);
    }

    setPreviewTarget({
      name: att.filename,
      url: url || "",
      size: att.file_size,
      contentType: isStaleOrMissing ? "text/html" : (att.file_type || "application/pdf"),
      onDownload: () => {
        if (att.file_url && !att.file_url.startsWith("blob:")) {
          window.open(att.file_url, "_blank");
        } else {
          const sampleContent = generateDigitalInvoiceHtml(att);
          const blob = new Blob([sampleContent], { type: "text/html" });
          const dlUrl = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = dlUrl;
          a.download = att.filename.endsWith(".pdf") ? att.filename.replace(/\.pdf$/i, ".html") : att.filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      }
    });
    setIsPreviewOpen(true);
  };
  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);

    try {
      const formData = new FormData();
      fileArray.forEach((f) => formData.append("files", f));
      await arService.uploadWorkflowAttachments(id!, formData);
      queryClient.invalidateQueries({ queryKey: ["ar-workflow", id] });
      queryClient.invalidateQueries({ queryKey: ["ar-workflows"] });
      refetch();
    } catch {
      fileArray.forEach((f) => {
        attachmentMutation.mutate({
          filename: f.name,
          file_size: f.size,
          file_type: f.type || "application/pdf",
          file_url: URL.createObjectURL(f),
          uploaded_at: new Date().toISOString(),
          uploaded_by: "Treasury Officer",
          note: "Uploaded document",
        });
      });
    }
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFilesSelected(e.dataTransfer.files);
  };
  const { data: contactsData } = useQuery({
    queryKey: ["payable-contacts"],
    queryFn: () => financeService.getPayableContacts({ limit: 500 }),
    staleTime: 1000 * 60 * 10,
  });
  // Dynamically resolve customer contact and bank settlement details
  const resolvedCustomer = useMemo(() => {
    if (!workflow) return null;
    const items = contactsData?.items || [];
    const custId = (workflow.customer_id || "").toLowerCase();
    const custName = (workflow.customer_name || "").toLowerCase();

    // 1. Search in finance contacts API
    const foundApi = items.find((c: any) => {
      const cId = String(c.id || "").toLowerCase();
      const cDisp = (c.display_name || "").toLowerCase();
      const cFull = (c.full_name || "").toLowerCase();
      return (
        (custId && (cId === custId || `cust-${cId}` === custId)) ||
        (custName &&
          (cDisp === custName ||
            cFull === custName ||
            cDisp.includes(custName) ||
            custName.includes(cDisp)))
      );
    });

    if (foundApi) {
      return {
        contact_person: foundApi.full_name || foundApi.display_name,
        name: foundApi.display_name,
        email: foundApi.email,
        phone: foundApi.phone_numbers,
        billing_address: foundApi.bill_address,
        tax_id: (foundApi as any).tax_id || null,
        banking_details: foundApi.banking_details || (foundApi as any).banking || null,
      };
    }

    return {
      contact_person: workflow.customer_name || "",
      name: workflow.customer_name || "",
      email: "",
      phone: "",
      billing_address: "",
      tax_id: null,
      banking_details: null,
    };
  }, [workflow, contactsData]);
  return { handlePreviewAttachment, handleFilesSelected, handleDragOver, handleDragLeave, handleDrop, resolvedCustomer };
}
