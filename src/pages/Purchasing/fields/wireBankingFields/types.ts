import type { WireTransferInput } from "@/types/purchasing";

export interface FieldDef {
  id: string;
  label: string;
  placeholder?: string;
  helperText?: string;
  isMono?: boolean;
  isUpper?: boolean;
}

export interface WireBankingFieldsProps {
  form: WireTransferInput;
  setForm: React.Dispatch<React.SetStateAction<WireTransferInput>>;
  validationErrors?: Record<string, boolean>;
  setValidationErrors?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}
