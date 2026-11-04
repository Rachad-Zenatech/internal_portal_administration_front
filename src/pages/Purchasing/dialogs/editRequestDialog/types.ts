import { type WireTransferInput } from "@/types/purchasing";

export type EditRequestDialogProps = {
  request: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wireTransfer?: WireTransferInput | null;
};
