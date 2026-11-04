export interface AuditLogItem {
  id: number | string;
  entity_type: string;
  entity_id: string;
  entity_title?: string | null;
  action: string;
  user_id?: string | null;
  actor_name?: string | null;
  actor_email?: string | null;
  actor_department?: string | null;
  actor_job_title?: string | null;
  changes?: any;
  old_value?: any;
  new_value?: any;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}
