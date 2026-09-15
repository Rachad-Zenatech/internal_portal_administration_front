import type { RecurringSchedule } from "@/types/purchasing";

export type FrequencyType =
  | "DAILY"
  | "WEEKLY"
  | "BI_WEEKLY"
  | "MONTHLY"
  | "QUARTERLY"
  | "SEMI_ANNUALLY"
  | "ANNUALLY";

export const FREQUENCY_LABELS: Record<FrequencyType, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  BI_WEEKLY: "Bi-Weekly (Every 2 Weeks)",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly (Every 3 Months)",
  SEMI_ANNUALLY: "Semi-Annually (Every 6 Months)",
  ANNUALLY: "Annually (Every Year)",
};

export const FREQUENCY_INTERVAL_MONTHS: Record<FrequencyType, number> = {
  DAILY: 0,
  WEEKLY: 0,
  BI_WEEKLY: 0,
  MONTHLY: 1,
  QUARTERLY: 3,
  SEMI_ANNUALLY: 6,
  ANNUALLY: 12,
};

/**
 * Adds one or more frequency intervals to a given date string or Date object.
 */
export function addFrequencyInterval(dateInput: string | Date, frequency: string, multiplier: number = 1): Date {
  const d = typeof dateInput === "string" ? new Date(dateInput + "T00:00:00") : new Date(dateInput);
  const freq = (frequency || "MONTHLY").toUpperCase();

  switch (freq) {
    case "DAILY":
      d.setDate(d.getDate() + 1 * multiplier);
      break;
    case "WEEKLY":
      d.setDate(d.getDate() + 7 * multiplier);
      break;
    case "BI_WEEKLY":
      d.setDate(d.getDate() + 14 * multiplier);
      break;
    case "MONTHLY": {
      const targetMonth = d.getMonth() + 1 * multiplier;
      d.setMonth(targetMonth);
      break;
    }
    case "QUARTERLY": {
      const targetMonth = d.getMonth() + 3 * multiplier;
      d.setMonth(targetMonth);
      break;
    }
    case "SEMI_ANNUALLY": {
      const targetMonth = d.getMonth() + 6 * multiplier;
      d.setMonth(targetMonth);
      break;
    }
    case "ANNUALLY": {
      d.setFullYear(d.getFullYear() + 1 * multiplier);
      break;
    }
    default:
      d.setMonth(d.getMonth() + 1 * multiplier);
      break;
  }
  return d;
}

export function formatDateToIso(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Calculates remaining duration from today (or fromDate) to endDate.
 * Returns human-friendly text like: "2 years 2 months left", "1 year left", "4 months left", "12 days left".
 */
export function formatRemainingDuration(
  endDateStr?: string | null,
  fromDateInput?: Date | string
): { text: string; isExpired: boolean; isNearEnd: boolean; totalDays: number } {
  if (!endDateStr) {
    return { text: "Indefinite", isExpired: false, isNearEnd: false, totalDays: Infinity };
  }

  const end = new Date(endDateStr + "T00:00:00");
  let from: Date;
  if (!fromDateInput) {
    from = new Date();
  } else if (typeof fromDateInput === "string") {
    from = new Date(fromDateInput + "T00:00:00");
  } else {
    from = new Date(fromDateInput);
  }

  // Normalize to midnight
  end.setHours(0, 0, 0, 0);
  from.setHours(0, 0, 0, 0);

  const diffMs = end.getTime() - from.getTime();
  const totalDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (totalDays < 0) {
    return { text: "Ended", isExpired: true, isNearEnd: false, totalDays };
  }
  if (totalDays === 0) {
    return { text: "Final day today", isExpired: false, isNearEnd: true, totalDays: 0 };
  }

  // Calculate year/month/day breakdown
  let years = end.getFullYear() - from.getFullYear();
  let months = end.getMonth() - from.getMonth();
  let days = end.getDate() - from.getDate();

  if (days < 0) {
    months -= 1;
    // Days in previous month
    const prevMonthLastDay = new Date(end.getFullYear(), end.getMonth(), 0).getDate();
    days += prevMonthLastDay;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const parts: string[] = [];
  if (years > 0) {
    parts.push(`${years} ${years === 1 ? "year" : "years"}`);
  }
  if (months > 0) {
    parts.push(`${months} ${months === 1 ? "month" : "months"}`);
  }
  if (years === 0 && months === 0 && days > 0) {
    parts.push(`${days} ${days === 1 ? "day" : "days"}`);
  }

  const text = parts.length > 0 ? `${parts.join(" ")} left` : "Ending soon";
  const isNearEnd = totalDays <= 60;

  return { text, isExpired: false, isNearEnd, totalDays };
}

/**
 * Calculates total installments count between start and end date based on frequency.
 */
export function calculateInstallmentsCount(
  startDateStr: string,
  endDateStr?: string | null,
  frequency: string = "MONTHLY"
): number {
  if (!startDateStr || !endDateStr) return 0;
  const start = new Date(startDateStr + "T00:00:00");
  const end = new Date(endDateStr + "T00:00:00");

  if (end < start) return 0;

  let count = 0;
  let curr = new Date(start);
  const maxSafeCycles = 600; // Safeguard against runaway loops (e.g. 50 years)

  while (curr <= end && count < maxSafeCycles) {
    count++;
    curr = addFrequencyInterval(curr, frequency, 1);
  }

  return count;
}

export interface ProjectedInstallment {
  installmentNumber: number;
  dueDate: string;
  amount: number;
  currency: string;
  status: "PAID" | "CURRENT" | "PROJECTED";
  cumulativeAmount: number;
}

/**
 * Generates the full projection schedule from start_date up to end_date (or total_installments).
 */
export function generatePaymentSchedule(
  schedule?: RecurringSchedule | null,
  defaultAmount: number = 0,
  defaultCurrency: string = "USD",
  statusOverride?: string
): ProjectedInstallment[] {
  if (!schedule || !schedule.start_date) {
    return [];
  }

  const startDate = new Date(schedule.start_date + "T00:00:00");
  const frequency = schedule.frequency || "MONTHLY";
  const amountPerCycle = schedule.amount_per_cycle != null && schedule.amount_per_cycle > 0
    ? schedule.amount_per_cycle
    : defaultAmount;
  const currency = defaultCurrency || "USD";

  let totalLimit = schedule.total_installments;
  const endDate = schedule.end_date ? new Date(schedule.end_date + "T00:00:00") : null;

  if (!totalLimit && endDate) {
    totalLimit = calculateInstallmentsCount(schedule.start_date, schedule.end_date, frequency);
  }
  if (!totalLimit || totalLimit <= 0) {
    totalLimit = 24; // Default to 2-year window if neither end_date nor total_installments provided
  }
  if (totalLimit > 240) {
    totalLimit = 240; // Hard clamp for UI performance
  }

  const completed = schedule.completed_installments || 0;
  const installments: ProjectedInstallment[] = [];
  let currDate = new Date(startDate);
  let cumulative = 0;

  for (let i = 1; i <= totalLimit; i++) {
    cumulative += amountPerCycle;
    const dateStr = formatDateToIso(currDate);

    let status: "PAID" | "CURRENT" | "PROJECTED" = "PROJECTED";
    if (i <= completed) {
      status = "PAID";
    } else if (i === completed + 1) {
      status = "CURRENT";
    } else {
      status = "PROJECTED";
    }

    if (statusOverride === "COMPLETED") {
      status = "PAID";
    }

    installments.push({
      installmentNumber: i,
      dueDate: dateStr,
      amount: amountPerCycle,
      currency,
      status,
      cumulativeAmount: Math.round(cumulative * 100) / 100,
    });

    currDate = addFrequencyInterval(currDate, frequency, 1);
  }

  return installments;
}
