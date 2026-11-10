import { apiClient } from "@/services/apiClient";

export interface WorkflowActionField {
  id: string;
  label: string;
  type: "text" | "dropdown" | "number" | "checkbox" | "date" | "textarea" | "file";
  options?: string[];
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
    controlText?: string;
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

