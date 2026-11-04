import type { ARWorkflow } from "../../../../types/ar";

export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
  flag?: string;
  country_code?: string;
  country_name?: string;
}

export interface BankFieldDef {
  id: string;
  label: string;
  placeholder?: string;
  helperText?: string;
  isMono?: boolean;
  isUpper?: boolean;
}

export interface NewWorkflowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (workflowId: string) => void;
  workflowToEdit?: ARWorkflow | null;
}
