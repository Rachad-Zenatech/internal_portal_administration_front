export interface TaskDetailPanelProps {
  task: any | null;
  onClose: () => void;
  onUpdate: () => void;
  readOnly?: boolean;
}
