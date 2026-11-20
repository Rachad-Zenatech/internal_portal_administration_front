export type MatchComponentState = "PRESENT" | "MISSING" | "MISMATCHED";

export interface ComponentDetails {
  title: string;
  subtitle: string;
  state: MatchComponentState;
  stateLabel: string;
  primaryInfo: string;
  secondaryInfo?: string;
  amount?: number;
  currency?: string;
  date?: string;
  dateLabel?: string;
  paymentTerms?: string;
  actor?: string;
  department?: string;
  notes?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
}

export interface ThreeWayMatchSummary {
  po: ComponentDetails;
  receipt: ComponentDetails;
  invoice: ComponentDetails;
  overallStatus: "FULLY_MATCHED" | "INCOMPLETE" | "MISMATCHED";
  readyCount: number;
  missingCount: number;
  mismatchedCount: number;
  statusText: string;
  isPaymentReadyQueue: boolean;
}
