import type { CalendarCell } from "../types";
import type { RecurringPaymentsGuardedState } from "./useRecurringPayments";

export function useRecurringPaymentsActions3(ctx: RecurringPaymentsGuardedState) {
  const { currentCalendarDate } = ctx;
  // Calendar calculations
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  const monthName = currentCalendarDate.toLocaleString("default", {
    month: "long",
  });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const prevMonthDays = new Date(year, month, 0).getDate();
  const calendarCells: CalendarCell[] = [];
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    calendarCells.push({
      day: prevMonthDays - i,
      isCurrentMonth: false,
      dateStr: "",
    });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const monthStr = String(month + 1).padStart(2, "0");
    const dayStr = String(d).padStart(2, "0");
    calendarCells.push({
      day: d,
      isCurrentMonth: true,
      dateStr: `${year}-${monthStr}-${dayStr}`,
    });
  }
  const remainingCells = 42 - calendarCells.length;
  for (let i = 1; i <= remainingCells; i++) {
    calendarCells.push({ day: i, isCurrentMonth: false, dateStr: "" });
  }
  return { year, month, monthName, calendarCells };
}
