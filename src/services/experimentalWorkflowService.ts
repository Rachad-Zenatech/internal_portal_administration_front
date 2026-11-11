import { apiClient } from "@/services/apiClient";

/** Live directory a combobox field pulls its options from (same sources as the real request forms). */
export type WorkflowComboSource =
  | "vendor" | "department" | "user" | "ap_user" | "class" | "location"
  | "bank_account" | "gl_code" | "project" | "pay_from" | "bank_country" | "currency";

export interface WorkflowActionField {
  id: string;
  label: string;
  type: "text" | "dropdown" | "combobox" | "number" | "checkbox" | "date" | "textarea" | "file";
  options?: string[];
  /** For type "combobox": which directory supplies the options. */
  source?: WorkflowComboSource;
  placeholder?: string;
  value?: any;
  required?: boolean;
}

export interface WorkflowActionButton {
  id: string;
  label: string;
  variant?: "default" | "outline" | "secondary" | "destructive";
  description?: string;
  actionType: "NEXT_STEP" | "PREV_STEP" | "TRIGGER_API" | "UPDATE_DATABASE" | "CUSTOM";
  targetStep?: string;
  fields?: WorkflowActionField[];
}

export interface ReviewCheckItem {
  id: string;
  variable: string; // e.g. "gl_code", "amount", "vendor"
  label?: string; // Display label e.g. "Category / GL Code"
  reviewerRole?: string; // e.g. "Accounting / Controller"
  reviewerUser?: string; // e.g. "David Hernandez"
  instructions?: string; // e.g. "Verify GL code & Category are coded properly"
  passed?: boolean;
}

export interface WorkflowStepNode {
  id: string;
  title: string;
  description: string;
  statusKey?: string;
  badgeColor?: string;
  assignedRole?: string;
  assignedUser?: string;
  actions: WorkflowActionButton[];
  reviewControl?: {
    enabled: boolean;
    reviewerRole?: string;
    reviewerUser?: string;
    targetVariable?: string; // legacy single target variable
    controlText?: string;
    items?: ReviewCheckItem[]; // Multiple variables to check and by who
    passed?: boolean;
  };
}

export type WorkflowDomain = "purchasing" | "purchasing_quote" | "invoices" | "invoices_payable" | (string & {});

export interface WorkflowConfigResponse {
  id: string;
  domain: WorkflowDomain;
  name: string;
  description?: string;
  nodes: WorkflowStepNode[];
  updated_at?: string;
}

export const experimentalWorkflowService = {
  async getWorkflowConfig(domain: WorkflowDomain): Promise<WorkflowConfigResponse> {
    return apiClient.get<WorkflowConfigResponse>(`/workflow-auto/${domain}`);
  },

  async saveWorkflowConfig(domain: WorkflowDomain, payload: Partial<WorkflowConfigResponse>): Promise<WorkflowConfigResponse> {
    return apiClient.post<WorkflowConfigResponse>(`/workflow-auto/${domain}`, payload);
  },

  async resetWorkflowConfig(domain: WorkflowDomain): Promise<WorkflowConfigResponse> {
    return apiClient.post<WorkflowConfigResponse>(`/workflow-auto/${domain}/reset`, {});
  },

  /** Store these nodes as the domain's default workflow (what "Reset" restores), kept in the database. */
  async saveAsDefaultWorkflowConfig(domain: WorkflowDomain, payload: Partial<WorkflowConfigResponse>): Promise<WorkflowConfigResponse> {
    return apiClient.post<WorkflowConfigResponse>(`/workflow-auto/${domain}/save-as-default`, payload);
  },
};

