import { useGLCodes } from "@/hooks/usePurchasing";
import { formatGLCode as formatGLCodeUtil } from "@/utils/glAccountUtils";
import { useState } from "react";

export function useTaskDetailPanelState() {
  const { data: glCodes = [] } = useGLCodes();
  const [note, setNote] = useState("");
  const formatGLCode = (code: string | null | undefined) => {
    return formatGLCodeUtil(code, glCodes);
  };
  const [isDragging, setIsDragging] = useState(false);
  const [deleteNoteId, setDeleteNoteId] = useState<number | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editNoteText, setEditNoteText] = useState("");
  return { note, setNote, formatGLCode, isDragging, setIsDragging, deleteNoteId, setDeleteNoteId, editingNoteId, setEditingNoteId, editNoteText, setEditNoteText };
}
