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
  amount_paid?: number;
  balance_due?: number;
  status: string;
  is_supplemental?: boolean;
  parent_invoice_id?: string;
  quote_id?: string;
  bill_to_name?: string;
  created_at: string;
}

export interface AddonHierarchyParentRow {
  subscription_id: string;
  service_name: string;
  title: string;
  subtitle: string;
  invoice_badge: string;
  charge_amount: number;
  is_reference_only: boolean;
  reference_label: string;
  badge: string;
}

export interface AddonHierarchyChildRow {
  id: string;
  addition_type: string;
  product_name: string;
  title: string;
  badge: string;
  charge_type: string;
  quantity: number;
  unit_price: number;
  date_range: string;
  calculation: string;
  charge: number;
  full_recurring_value: number;
  full_recurring_label: string;
  is_current_invoice: boolean;
  is_reference_only: boolean;
  reference_label: string;
  quote_number?: string;
  is_manual_override: boolean;
  override_reason?: string;
  activation_status: string;
}

export interface NextRenewalProjection {
  currency: string;
  billing_frequency: string;
  frequency_label: string;
  frequency_short?: string;
  base_seats: number;
  added_seats: number;
  total_seats: number;
  seat_unit_price: number;
  seats_renewal_amount: number;
  recurring_addons: Array<{ name: string; quantity: number; unit_price: number; total: number }>;
  recurring_addons_total: number;
  total_renewal_amount: number;
  summary_text: string;
}

export interface InvoiceHierarchyResponse {
  invoice: {
    id: string;
    invoice_number: string;
    customer_id: string;
    customer_name: string;
    invoice_date: string;
    due_date?: string;
    status: string;
    currency: string;
    is_supplemental: boolean;
    parent_invoice_id?: string;
    parent_invoice_number?: string;
    from_details: Record<string, any>;
    bill_to_details: Record<string, any>;
  };
  hierarchy_tree: {
    parent_row: AddonHierarchyParentRow;
    child_rows: AddonHierarchyChildRow[];
  };
  totals: {
    new_charges_subtotal: number;
    reference_charges_subtotal: number;
    discount: number;
    tax: number;
    amount_paid: number;
    amount_due: number;
  };
  next_renewal: NextRenewalProjection;
  audit_logs: any[];
}

export interface AddonPreviewPayload {
  addition_type: string;
  charge_type: string;
  full_period_unit_price: number;
  quantity: number;
  effective_date: string;
  billing_period_start: string;
  billing_period_end: string;
  proration_method: string;
  manual_override_charge?: number | null;
  override_reason?: string | null;
  base_quantity?: number;
  billing_frequency?: string;
  currency?: string;
  quote_id?: string;
}

export interface AddonPreviewResponse {
  calculated_charge: number;
  actual_charge: number;
  full_recurring_value: number;
  total_period_days: number;
  remaining_days: number;
  formula_string: string;
  date_range_label: string;
  proration_badge: string;
  is_manual_override: boolean;
  override_reason?: string | null;
  resulting_total_seats: number;
  calculation_snapshot: Record<string, any>;
  quote_warnings: string[];
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

  async getInvoiceHierarchy(invoiceId: string): Promise<InvoiceHierarchyResponse> {
    return apiClient.get<InvoiceHierarchyResponse>(
      `/api/ar/invoices/${encodeURIComponent(invoiceId)}/hierarchy`
    );
  },

  async previewAddon(payload: AddonPreviewPayload): Promise<AddonPreviewResponse> {
    return apiClient.post<AddonPreviewResponse>(
      "/api/ar/invoices/preview-addon",
      payload
    );
  },

  async addSeatsOrAddons(invoiceId: string, payload: any): Promise<InvoiceHierarchyResponse> {
    return apiClient.post<InvoiceHierarchyResponse>(
      `/api/ar/invoices/${encodeURIComponent(invoiceId)}/add-seats-addons`,
      payload,
      {
        actionLabel: "Processing Addition",
        actionSubtitle: "Calculating proration and updating invoice records...",
      }
    );
  },

  async applyAddonOverride(addonId: string, payload: { override_charge: number; override_reason: string }): Promise<{ success: boolean; addon_id: string; actual_charge: number; override_reason: string }> {
    return apiClient.post<{ success: boolean; addon_id: string; actual_charge: number; override_reason: string }>(
      `/api/ar/addons/${encodeURIComponent(addonId)}/override`,
      payload,
      {
        actionLabel: "Applying Price Override",
        actionSubtitle: "Logging manual price adjustment...",
      }
    );
  },

  async activateSubscriptionAddons(addonIds: string[]): Promise<{ success: boolean; activated_count: number }> {
    return apiClient.post<{ success: boolean; activated_count: number }>(
      "/api/ar/subscriptions/activate-addons",
      { addon_ids: addonIds },
      {
        actionLabel: "Activating Add-ons",
        actionSubtitle: "Updating active subscription quantities...",
      }
    );
  },

  async getCustomerSubscriptions(customerId: string): Promise<any[]> {
    try {
      const data = await apiClient.get<any[]>(`/api/ar/customers/${encodeURIComponent(customerId)}/subscriptions`);
      if (Array.isArray(data)) return data;
      return [];
    } catch {
      return [];
    }
  },

  async recordInvoicePayment(invoiceId: string, payload: {
    amount: number;
    payment_method?: string;
    payment_date?: string;
    reference_number?: string;
    notes?: string;
    gl_code?: string;
    category?: string;
    class_name?: string;
    class?: string;
  }): Promise<any> {
    return apiClient.post(
      `/api/ar/invoices/${encodeURIComponent(invoiceId)}/payment`,
      payload,
      {
        actionLabel: "Recording Invoice Payment",
        actionSubtitle: `Processing settlement of $${Number(payload.amount).toFixed(2)}...`,
      }
    );
  },
};
