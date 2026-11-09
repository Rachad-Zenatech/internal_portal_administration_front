import { apiClient } from "@/services/apiClient";

export interface WorkflowActionField {
  id: string;
  label: string;
  type: "text" | "dropdown" | "number" | "checkbox";
  options?: string[];
  placeholder?: string;
  value?: any;
}

export interface WorkflowActionButton {
  id: string;
  label: string;
  variant?: "default" | "outline" | "secondary" | "destructive";
  description?: string;
  actionType: "NEXT_STEP" | "PREV_STEP" | "TRIGGER_API" | "CUSTOM";
  targetStep?: string;
  fields?: WorkflowActionField[];
}

export interface WorkflowStepNode {
  id: string;
  title: string;
  description: string;
  statusKey?: string;
  badgeColor?: string;
  actions: WorkflowActionButton[];
}

export interface WorkflowConfigResponse {
  id: string;
  domain: "purchasing" | "invoices";
  name: string;
  description?: string;
  nodes: WorkflowStepNode[];
  updated_at?: string;
}

export const experimentalWorkflowService = {
  async getWorkflowConfig(domain: "purchasing" | "invoices"): Promise<WorkflowConfigResponse> {
    return apiClient.get<WorkflowConfigResponse>(`/api/workflow-auto/${domain}`);
  },

  async saveWorkflowConfig(domain: "purchasing" | "invoices", payload: Partial<WorkflowConfigResponse>): Promise<WorkflowConfigResponse> {
    return apiClient.post<WorkflowConfigResponse>(`/api/workflow-auto/${domain}`, payload);
  },

  async resetWorkflowConfig(domain: "purchasing" | "invoices"): Promise<WorkflowConfigResponse> {
    return apiClient.post<WorkflowConfigResponse>(`/api/workflow-auto/${domain}/reset`, {});
  },
};

