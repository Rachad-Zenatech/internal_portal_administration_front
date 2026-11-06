import { Dialog } from "../../../components/ui/dialog";
import type { AddSeatsAddonsModalProps } from "./addSeatsAddonsModal/types";
import { useAddSeatsAddonsModal } from "./addSeatsAddonsModal/hooks/useAddSeatsAddonsModal";
import { Row1CustomerSubscription } from "./addSeatsAddonsModal/sections/Row1CustomerSubscription";

export const AddSeatsAddonsModal: React.FC<AddSeatsAddonsModalProps> = (props) => {
  const s = useAddSeatsAddonsModal(props);
  const { onClose, isOpen } = s;
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Row1CustomerSubscription s={s} />
    </Dialog>
  );
};
