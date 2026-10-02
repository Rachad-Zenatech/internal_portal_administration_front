import { apiClient } from "./apiClient";

export interface ARCustomer {
  id: string;
  name: string;
  display_name?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  billing_address?: string;
  has_template?: boolean;
}

export interface InvoiceLineItem {
  id?: string;
  date?: string;
  activity?: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface CustomerInvoiceTemplate {
  id?: string;
  has_saved_template?: boolean;
  template_name?: string;
  layout_style?: 'pace_plus' | 'interlinkone' | 'modern' | 'classic' | string;
  is_default?: boolean;
  is_new_preset?: boolean;
  template_id?: string;
  customer_id: string;
  invoice_number: string;
  currency?: string;
  from_company: string;
  from_contact: string;
  from_phone: string;
  from_address: string;
  from_email: string;
  bill_to_name: string;
  bill_to_phone: string;
  bill_to_address: string;
  bill_to_email: string;
  po_number: string;
  date: string;
  due_date?: string;
  terms?: string;
  notes: string;
  bank_name: string;
  bank_account: string;
  bank_address?: string;
  ach_routing?: string;
  wire_routing?: string;
  bank_email: string;
  line_items: InvoiceLineItem[];
}

export interface GeneratedInvoiceSummary {
  id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  invoice_date: string;
  due_date?: string;
  terms?: string;
  po_number?: string;
  layout_style?: 'pace_plus' | 'interlinkone' | 'modern' | 'classic' | string;
  template_id?: string;
  currency?: string;
  subtotal: number;
  total_amount: number;
  status: string;
  created_at: string;
}

export const arInvoiceService = {
  async getCustomers(): Promise<ARCustomer[]> {
    try {
      const data = await apiClient.get<ARCustomer[]>("/api/ar/customers");
      if (Array.isArray(data) && data.length > 0) return data;
      return [];
    } catch {
      return [];
    }
  },

  async updateCustomer(customerId: string, data: Partial<ARCustomer>): Promise<ARCustomer> {
    return apiClient.put<ARCustomer>(`/api/ar/customers/${encodeURIComponent(customerId)}`, data, {
      actionLabel: "Updating Customer",
      actionSubtitle: `Saving profile details for ${data.display_name || data.name || customerId}...`,
    });
  },

  async getCustomerTemplates(customerId: string): Promise<CustomerInvoiceTemplate[]> {
    try {
      const res = await apiClient.get<CustomerInvoiceTemplate[]>(
        `/api/ar/customers/${encodeURIComponent(customerId)}/templates`
      );
      if (Array.isArray(res)) return res;
      return [];
    } catch {
      return [];
    }
  },

  async getCustomerTemplate(customerId: string, templateId?: string): Promise<CustomerInvoiceTemplate> {
    try {
      const url = templateId
        ? `/api/ar/customers/${encodeURIComponent(customerId)}/template?template_id=${encodeURIComponent(templateId)}`
        : `/api/ar/customers/${encodeURIComponent(customerId)}/template`;
      return await apiClient.get<CustomerInvoiceTemplate>(url);
    } catch {
      // Local fallback
      const local = localStorage.getItem(`ar_template_${customerId}`);
      if (local) {
        return JSON.parse(local);
      }
      return {
        has_saved_template: false,
        template_name: "Standard Template",
        layout_style: "modern",
        currency: "USD",
        is_default: true,
        customer_id: customerId,
        invoice_number: "INV-0001",
        from_company: "ZenaTech Inc.",
        from_contact: "",
        from_phone: "",
        from_address: "",
        from_email: "",
        bill_to_name: "",
        bill_to_phone: "",
        bill_to_address: "",
        bill_to_email: "",
        po_number: "",
        date: new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        notes: "",
        bank_name: "",
        bank_account: "",
        bank_email: "",
        line_items: [
          { description: "", quantity: 1, unit_price: 0, total: 0 },
        ],
      };
    }
  },

  async saveCustomerTemplate(
    customerId: string,
    payload: CustomerInvoiceTemplate
  ): Promise<{ success: boolean; template_id?: string; template_name?: string; layout_style?: string; message: string }> {
    try {
      localStorage.setItem(`ar_template_${customerId}`, JSON.stringify(payload));
      return await apiClient.post<{ success: boolean; template_id?: string; template_name?: string; layout_style?: string; message: string }>(
        `/api/ar/customers/${encodeURIComponent(customerId)}/template`,
        payload,
        {
          actionLabel: "Saving Customer Template",
          actionSubtitle: `Saving preset "${payload.template_name || 'Standard Template'}"...`,
        }
      );
    } catch {
      localStorage.setItem(`ar_template_${customerId}`, JSON.stringify(payload));
      return { success: true, message: "Template saved locally." };
    }
  },

  async deleteTemplate(templateId: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete<{ success: boolean; message: string }>(
      `/api/ar/templates/${encodeURIComponent(templateId)}`,
      {
        actionLabel: "Deleting Template",
        actionSubtitle: "Removing template preset...",
      }
    );
  },

  async renameTemplate(
    templateId: string,
    newName: string
  ): Promise<{ success: boolean; template_name: string; message: string }> {
    return apiClient.patch<{ success: boolean; template_name: string; message: string }>(
      `/api/ar/templates/${encodeURIComponent(templateId)}/rename`,
      { template_name: newName },
      {
        actionLabel: "Renaming Template",
        actionSubtitle: `Updating preset name to "${newName}"...`,
      }
    );
  },

  async getNextInvoiceNumber(): Promise<{ next_invoice_number: string }> {
    try {
      return await apiClient.get<{ next_invoice_number: string }>("/api/ar/invoices/next-number");
    } catch {
      return { next_invoice_number: "18067" };
    }
  },

  async generateInvoice(
    payload: CustomerInvoiceTemplate & { id?: string }
  ): Promise<{ success: boolean; invoice_id: string; invoice_number: string; message: string }> {
    return apiClient.post<{ success: boolean; invoice_id: string; invoice_number: string; message: string }>(
      "/api/ar/invoices",
      payload,
      {
        actionLabel: "Saving Invoice",
        actionSubtitle: "Snapshotting generated invoice record...",
      }
    );
  },

  async getInvoice(
    invoiceId: string
  ): Promise<CustomerInvoiceTemplate & { id: string; customer_name?: string; total_amount?: number; status?: string; created_at?: string }> {
    return apiClient.get<CustomerInvoiceTemplate & { id: string; customer_name?: string; total_amount?: number; status?: string; created_at?: string }>(
      `/api/ar/invoices/${encodeURIComponent(invoiceId)}`
    );
  },

  async listInvoices(): Promise<GeneratedInvoiceSummary[]> {
    try {
      const data = await apiClient.get<GeneratedInvoiceSummary[]>("/api/ar/invoices");
      if (Array.isArray(data)) return data;
      return [];
    } catch {
      return [];
    }
  },

  async deleteInvoice(invoiceId: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete<{ success: boolean; message: string }>(
      `/api/ar/invoices/${encodeURIComponent(invoiceId)}`,
      {
        actionLabel: "Deleting Invoice",
        actionSubtitle: "Removing invoice record...",
      }
    );
  },

  async sendInvoiceEmail(
    invoiceId: string,
    data: { from_email?: string; to_email?: string; subject?: string; custom_message?: string }
  ): Promise<{ success: boolean; message: string; simulated?: boolean; to_email?: string; from_email?: string; recipient?: string }> {
    return apiClient.post<{ success: boolean; message: string; simulated?: boolean; to_email?: string; from_email?: string; recipient?: string }>(
      `/api/ar/invoices/${encodeURIComponent(invoiceId)}/send-email`,
      data,
      {
        actionLabel: "Sending Invoice Email",
        actionSubtitle: `Sending invoice statement from ${data.from_email || 'test-invoices@zenatech.com'}...`,
      }
    );
  },

  async sendCustomInvoiceEmail(
    payload: { invoice_data: CustomerInvoiceTemplate & { id?: string }; from_email?: string; to_email?: string; subject?: string; custom_message?: string }
  ): Promise<{ success: boolean; message: string; simulated?: boolean; to_email?: string; from_email?: string; recipient?: string }> {
    return apiClient.post<{ success: boolean; message: string; simulated?: boolean; to_email?: string; from_email?: string; recipient?: string }>(
      "/api/ar/invoices/send-email",
      payload,
      {
        actionLabel: "Sending Invoice Email",
        actionSubtitle: `Sending invoice statement from ${payload.from_email || 'test-invoices@zenatech.com'}...`,
      }
    );
  },
};
