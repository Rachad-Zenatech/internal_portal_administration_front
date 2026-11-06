export interface QuickBooksExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export type DialogTab = "PREVIEW_SYNC" | "FILE_EXPORT";

export type ExportMode = "BUNDLE" | "XLSX" | "CSV" | "DOCUMENTS" | "RECONCILIATION";

export type FilterType = "TODAY" | "DATETIME_RANGE" | "MONTH_YEAR";
