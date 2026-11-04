import { useState } from "react";

export function useQuickBooksItemDetailsDialogState() {
  const [viewMode, setViewMode] = useState<"form" | "mapping" | "json">("form");
  const [copied, setCopied] = useState(false);
  const [categoryDetailsOpen, setCategoryDetailsOpen] = useState(true);
  const [topFieldsCollapsed, setTopFieldsCollapsed] = useState(false);
  return { viewMode, setViewMode, copied, setCopied, categoryDetailsOpen, setCategoryDetailsOpen, topFieldsCollapsed, setTopFieldsCollapsed };
}
