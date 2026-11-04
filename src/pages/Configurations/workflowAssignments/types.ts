export type Assignment = {
  id: number;
  role: string;
  user_id: string | null;
  user_ids?: string[];
  department?: string | null;
  team_id: string | null;
  request_type: string | null;
  active: boolean;
};

export type ApproverSummary = {
  id: string;
  full_name?: string | null;
  email?: string | null;
  job_title?: string | null;
  department?: string | null;
};

export type DepartmentApprover = {
  department: string;
  group_name?: string | null;
  approver_id: string | null;
  approver_name: string | null;
  approver_email: string | null;
  approver_title: string | null;
  approver_ids?: string[] | null;
  approvers?: ApproverSummary[] | null;
  source: "MANUAL" | "UNASSIGNED";
};

export type DepartmentGroup = {
  id: number;
  name: string;
  approver_ids?: string[] | null;
  approvers?: ApproverSummary[] | null;
  departments: string[];
};
