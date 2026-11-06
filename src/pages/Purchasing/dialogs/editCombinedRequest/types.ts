import type { RequestDetail as RequestDetailType } from "@/types/purchasing";

export interface EditCombinedRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: RequestDetailType;
  refetch?: () => void;
  initialTab?: "request" | "po" | "invoice";
}
