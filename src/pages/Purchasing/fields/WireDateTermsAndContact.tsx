import { Input } from "@/components/ui/input";
import { Calendar, Clock, MapPin } from "lucide-react";
import type { WireTransferInput } from "@/types/purchasing";
import { computeDueDateFromTerms } from "../utils/invoiceDateTerms";

interface DateTermsRowProps {
  form: WireTransferInput;
  setForm: React.Dispatch<React.SetStateAction<WireTransferInput>>;
  onDueDateChange?: (dueDate: string) => void;
}

/** Invoice Date, Due Date, and Terms row with automatic due-date calculation from vendor terms. */
export function WireInvoiceDateTermsRow({ form, setForm, onDueDateChange }: DateTermsRowProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
      <div className="space-y-1.5">
        <div className="h-5 flex items-center gap-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>Invoice Date</span>
          </label>
        </div>
        <Input
          type="date"
          value={form.payment_date || ""}
          onChange={(e) => {
            const nextInvoiceDate = e.target.value;
            setForm((prev) => {
              const computedDue = computeDueDateFromTerms(nextInvoiceDate, prev.pay_date);
              return {
                ...prev,
                payment_date: nextInvoiceDate,
                due_date: computedDue || prev.due_date,
              };
            });
          }}
          className="h-9 text-xs bg-slate-50/50 dark:bg-zinc-800/50"
        />
      </div>

      <div className="space-y-1.5">
        <div className="h-5 flex items-center gap-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>Due Date</span>
          </label>
        </div>
        <Input
          type="date"
          value={form.due_date || ""}
          onChange={(e) => {
            setForm((prev) => ({ ...prev, due_date: e.target.value }));
            onDueDateChange?.(e.target.value);
          }}
          className="h-9 text-xs bg-slate-50/50 dark:bg-zinc-800/50"
        />
      </div>

      <div className="space-y-1.5">
        <div className="h-5 flex items-center gap-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>Terms</span>
          </label>
        </div>
        <Input
          value={form.pay_date || ""}
          onChange={(e) => {
            const nextTerms = e.target.value;
            setForm((prev) => {
              const computedDue = computeDueDateFromTerms(prev.payment_date, nextTerms);
              return {
                ...prev,
                pay_date: nextTerms,
                due_date: computedDue || prev.due_date,
              };
            });
          }}
          placeholder="e.g. Net 30, Same Day, Due on Receipt"
          className="h-9 text-xs bg-slate-50/50 dark:bg-zinc-800/50"
        />
      </div>
    </div>
  );
}

/** Vendor Contact & Location Details card. */
export function WireVendorContactCard({
  form,
  setForm,
}: {
  form: WireTransferInput;
  setForm: React.Dispatch<React.SetStateAction<WireTransferInput>>;
}) {
  return (
    <div className="rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4 shadow-2xs space-y-3">
      <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-zinc-800">
        <div className="h-6 w-6 rounded-md bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-600 dark:text-zinc-400">
          <MapPin className="h-3.5 w-3.5" />
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-zinc-200">
            Vendor Contact &amp; Location Details
          </h4>
          <p className="text-[11px] text-slate-400 dark:text-zinc-500">
            Vendor email, contact person, region, and street address
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="space-y-1.5">
          <div className="h-5 flex items-center gap-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Vendor Email</label>
          </div>
          <Input
            type="email"
            value={form.vendor_email || ""}
            onChange={(e) => setForm((prev) => ({ ...prev, vendor_email: e.target.value }))}
            placeholder="billing@vendor.com"
            className="h-9 text-xs bg-slate-50/50 dark:bg-zinc-800/50"
          />
        </div>

        <div className="space-y-1.5">
          <div className="h-5 flex items-center gap-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Contact Person (China / Overseas)</label>
          </div>
          <Input
            value={form.contact_name_china || ""}
            onChange={(e) => setForm((prev) => ({ ...prev, contact_name_china: e.target.value }))}
            placeholder="Contact Name"
            className="h-9 text-xs bg-slate-50/50 dark:bg-zinc-800/50"
          />
        </div>

        <div className="space-y-1.5">
          <div className="h-5 flex items-center gap-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Region / State</label>
          </div>
          <Input
            value={form.region || ""}
            onChange={(e) => setForm((prev) => ({ ...prev, region: e.target.value }))}
            placeholder="e.g. California, Ontario, Guangdong"
            className="h-9 text-xs bg-slate-50/50 dark:bg-zinc-800/50"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="h-5 flex items-center gap-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Vendor Street Address</label>
        </div>
        <Input
          value={form.vendor_address || ""}
          onChange={(e) => setForm((prev) => ({ ...prev, vendor_address: e.target.value }))}
          placeholder="Street address, suite, city, state, postal code, country"
          className="h-9 text-xs bg-slate-50/50 dark:bg-zinc-800/50"
        />
      </div>
    </div>
  );
}
