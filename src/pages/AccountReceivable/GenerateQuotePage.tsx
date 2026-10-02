import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format, addDays } from "date-fns";
import {
  ArrowLeft,
  Building2,
  Check,
  CheckCircle2,
  Eye,
  FileSpreadsheet,
  FileText,
  Plus,
  Printer,
  Trash2,
  User,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  arInvoiceService,
} from "../../services/arInvoiceService";
import type {
  ARCustomer,
} from "../../services/arInvoiceService";
import { ARCustomerAutocomplete } from "./ARCustomerAutocomplete";
import type { ARCustomerOption } from "./ARCustomerAutocomplete";
import { CurrencyAutocomplete } from "../Purchasing/CurrencyAutocomplete";
import type { LineItemFormRow } from "./GenerateInvoicePage";

export default function GenerateQuotePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pdfPreviewRef = useRef<HTMLDivElement>(null);
  const formTopRef = useRef<HTMLDivElement>(null);

  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<ARCustomer | null>(null);

  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Quote State & Expiration Date
  const [quoteNumber, setQuoteNumber] = useState("QT-18067");
  const [currency, setCurrency] = useState("USD");
  const [quoteDate, setQuoteDate] = useState(
    format(new Date(), "MM/dd/yyyy")
  );

  const [validUntilDate, setValidUntilDate] = useState(
    format(addDays(new Date(), 30), "MM/dd/yyyy")
  );
  const [terms, setTerms] = useState("Valid for 30 days");
  const [referenceNumber, setReferenceNumber] = useState("");

  // From Details
  const [fromCompany, setFromCompany] = useState("Pace Plus Inc.");
  const [fromPhone, setFromPhone] = useState("(312) 614-1288 | ext 1098");
  const [fromAddress, setFromAddress] = useState("602B W 5th Ave\nNaperville, IL 60563 USA");
  const [fromEmail, setFromEmail] = useState("Sales@paceplus.com");

  // Prepared For Details
  const [preparedForName, setPreparedForName] = useState("");
  const [preparedForPhone, setPreparedForPhone] = useState("");
  const [preparedForAddress, setPreparedForAddress] = useState("");
  const [preparedForEmail, setPreparedForEmail] = useState("");

  // Line Items Form Rows
  const [lineItems, setLineItems] = useState<LineItemFormRow[]>([
    {
      date: "",
      activity: "Pace+ Cloud Solution",
      description: "Pace+ Cloud Solution & Enterprise Modules\nImplementation & Dedicated Onboarding",
      quantity: 1,
      unit_price: 3500.00,
      total: 3500.00,
    },
  ]);

  // Notes & Acceptance Information
  const [notes, setNotes] = useState("Thank you for considering our proposal! This quote is valid for 30 calendar days.");

  // Handle customer selection from A/R customer table autocomplete
  const handleSelectCustomerOption = async (custOption: ARCustomerOption) => {
    const cust: ARCustomer = {
      id: custOption.id,
      name: custOption.display_name || custOption.full_name || custOption.name || "",
      display_name: custOption.display_name,
      contact_person: custOption.full_name || undefined,
      email: custOption.email || undefined,
      phone: custOption.phone || undefined,
      billing_address: custOption.bill_address || undefined,
    };
    setSelectedCustomer(cust);
    setCustomerSearch(cust.name);

    setPreparedForName(custOption.full_name || custOption.display_name || "");
    if (custOption.phone) setPreparedForPhone(custOption.phone);
    if (custOption.bill_address) setPreparedForAddress(custOption.bill_address);
    if (custOption.email) setPreparedForEmail(custOption.email);
  };

  const initialUrlProcessedRef = useRef(false);

  useEffect(() => {
    if (initialUrlProcessedRef.current) return;
    const custId = searchParams.get("customerId");
    if (custId) {
      initialUrlProcessedRef.current = true;
      arInvoiceService.getCustomers().then((custs) => {
        const match = custs.find((c) => c.id === custId);
        if (match) {
          setSelectedCustomer(match);
          setCustomerSearch(match.display_name || match.name);
          setPreparedForName(match.contact_person || match.display_name || match.name);
          if (match.phone) setPreparedForPhone(match.phone);
          if (match.billing_address) setPreparedForAddress(match.billing_address);
          if (match.email) setPreparedForEmail(match.email);
        }
      });
    }
  }, [searchParams]);

  const handleAddLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        date: "",
        activity: "",
        description: "",
        quantity: 1,
        unit_price: "",
        total: 0,
      },
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLineItemChange = (
    index: number,
    field: keyof LineItemFormRow,
    value: any
  ) => {
    setLineItems((prev) => {
      const next = [...prev];
      const item = { ...next[index], [field]: value };

      if (field === "quantity" || field === "unit_price") {
        const q = item.quantity === "" ? 0 : Number(item.quantity) || 0;
        const p = item.unit_price === "" ? 0 : Number(item.unit_price) || 0;
        item.total = Math.round(q * p * 100) / 100;
      }
      next[index] = item;
      return next;
    });
  };

  const subtotal = lineItems.reduce((acc, itm) => acc + (Number(itm.total) || 0), 0);
  const totalAmount = subtotal;

  const handlePrintPdf = () => {
    window.print();
  };

  const handleSaveQuote = () => {
    setSaveSuccessMsg(`Quote ${quoteNumber} has been saved successfully!`);
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
      <div className="w-full space-y-6">
        {/* Top Notification */}
        {saveSuccessMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* Top Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/account-receivable")}
              className="gap-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Overview</span>
            </Button>
            <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-700 hidden sm:block" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Generate Quote / Estimate</span>
                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 font-mono">
                  {quoteNumber || "QT-NEW"}
                </Badge>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Draft, customize, and export professional price quotations &amp; estimates for your clients.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintPdf}
              className="gap-2 text-xs rounded-xl border-slate-200 dark:border-slate-800 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print / PDF</span>
            </Button>

            <Button
              onClick={handleSaveQuote}
              className="gap-2 text-xs bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-medium px-4 py-2 rounded-xl shadow-xs cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save &amp; Generate Quote</span>
            </Button>
          </div>
        </div>

        {/* Two-Column Editor & Live Preview Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form Controls */}
          <div ref={formTopRef} className="lg:col-span-6 space-y-5">
            {/* Customer Search & Header Info Card */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4 text-amber-600" />
                  <span>1. Client &amp; Quote Information</span>
                </span>
              </div>

              {/* Customer Autocomplete */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Select A/R Customer / Client
                </Label>
                <ARCustomerAutocomplete
                  customerId={selectedCustomer?.id || ""}
                  customerName={selectedCustomer?.name || customerSearch}
                  onSelect={handleSelectCustomerOption}
                  className="w-full"
                />
              </div>

              {/* Quote Meta Info (Quote #, Date, Valid Until, Currency) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-slate-500">Quote #</Label>
                  <Input
                    value={quoteNumber}
                    onChange={(e) => setQuoteNumber(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-slate-500">Quote Date</Label>
                  <Input
                    value={quoteDate}
                    onChange={(e) => setQuoteDate(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-slate-500">Valid Until</Label>
                  <Input
                    value={validUntilDate}
                    onChange={(e) => setValidUntilDate(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-slate-500">Currency</Label>
                  <CurrencyAutocomplete
                    value={currency}
                    onChange={(c) => setCurrency(c || "USD")}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-slate-500">Terms / Validity</Label>
                  <Input
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    placeholder="e.g. Valid for 30 days"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-slate-500">Project / Reference #</Label>
                  <Input
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="e.g. PRJ-2026-088"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Prepared By & Prepared For Card */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>2. Issuer &amp; Recipient Details</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* From / Issuer */}
                <div className="space-y-2 p-3 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">Prepared By</span>
                  <Input
                    value={fromCompany}
                    onChange={(e) => setFromCompany(e.target.value)}
                    placeholder="Company Name"
                    className="h-7 text-xs bg-white dark:bg-slate-900"
                  />
                  <Input
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                    placeholder="Company Email"
                    className="h-7 text-xs bg-white dark:bg-slate-900"
                  />
                  <Input
                    value={fromPhone}
                    onChange={(e) => setFromPhone(e.target.value)}
                    placeholder="Company Phone"
                    className="h-7 text-xs bg-white dark:bg-slate-900"
                  />
                  <Textarea
                    value={fromAddress}
                    onChange={(e) => setFromAddress(e.target.value)}
                    placeholder="Company Address"
                    rows={2}
                    className="text-xs bg-white dark:bg-slate-900 resize-none"
                  />
                </div>

                {/* Prepared For / Recipient */}
                <div className="space-y-2 p-3 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">Prepared For (Client)</span>
                  <Input
                    value={preparedForName}
                    onChange={(e) => setPreparedForName(e.target.value)}
                    placeholder="Client Contact / Name"
                    className="h-7 text-xs bg-white dark:bg-slate-900"
                  />
                  <Input
                    value={preparedForEmail}
                    onChange={(e) => setPreparedForEmail(e.target.value)}
                    placeholder="Client Email"
                    className="h-7 text-xs bg-white dark:bg-slate-900"
                  />
                  <Input
                    value={preparedForPhone}
                    onChange={(e) => setPreparedForPhone(e.target.value)}
                    placeholder="Client Phone"
                    className="h-7 text-xs bg-white dark:bg-slate-900"
                  />
                  <Textarea
                    value={preparedForAddress}
                    onChange={(e) => setPreparedForAddress(e.target.value)}
                    placeholder="Client Billing Address"
                    rows={2}
                    className="text-xs bg-white dark:bg-slate-900 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Line Items Card */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>3. Quote Line Items &amp; Pricing</span>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddLineItem}
                  className="h-7 px-2.5 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 gap-1 rounded-lg cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line Item</span>
                </Button>
              </div>

              <div className="space-y-3">
                {lineItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-slate-500">Item #{idx + 1}</span>
                      {lineItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLineItem(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-2 space-y-1">
                        <Label className="text-[10px] text-slate-500">Product / Activity</Label>
                        <Input
                          value={item.activity || ""}
                          onChange={(e) => handleLineItemChange(idx, "activity", e.target.value)}
                          placeholder="e.g. Solution Implementation"
                          className="h-7 text-xs bg-white dark:bg-slate-900"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] text-slate-500">Qty</Label>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleLineItemChange(idx, "quantity", e.target.value)}
                            className="h-7 text-xs bg-white dark:bg-slate-900 font-mono text-right"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-slate-500">Rate ({currency})</Label>
                          <Input
                            type="number"
                            value={item.unit_price}
                            onChange={(e) => handleLineItemChange(idx, "unit_price", e.target.value)}
                            className="h-7 text-xs bg-white dark:bg-slate-900 font-mono text-right"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[10px] text-slate-500">Description / Scope Details</Label>
                      <Textarea
                        value={item.description}
                        onChange={(e) => handleLineItemChange(idx, "description", e.target.value)}
                        placeholder="Detailed deliverables or item description..."
                        rows={2}
                        className="text-xs bg-white dark:bg-slate-900 resize-none"
                      />
                    </div>

                    <div className="flex justify-end text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      <span>Line Total: ${Number(item.total).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">Total Quote Amount:</span>
                <span className="text-base font-bold text-slate-900 dark:text-white font-mono">
                  ${totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                </span>
              </div>
            </div>

            {/* Notes & Terms */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>4. Scope Notes &amp; Acceptance Terms</span>
              </span>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Terms and acceptance notes..."
                rows={3}
                className="text-xs resize-none"
              />
            </div>
          </div>

          {/* Right Column: Live Document Preview */}
          <div className="lg:col-span-6 sticky top-6 space-y-4">
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-lg space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">Live Quote Preview</span>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono bg-slate-50 dark:bg-slate-800">
                  A4 Quotation Sheet
                </Badge>
              </div>

              {/* Visual Document Layout */}
              <div
                ref={pdfPreviewRef}
                className="p-6 sm:p-8 bg-white text-slate-900 border border-slate-200 rounded-xl shadow-xs font-sans text-xs space-y-6"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-5">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">{fromCompany}</h2>
                    <p className="text-[11px] text-slate-500 whitespace-pre-line mt-0.5">{fromAddress}</p>
                    <p className="text-[11px] text-slate-500">{fromEmail} {fromPhone ? `• ${fromPhone}` : ""}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-extrabold text-amber-600 uppercase tracking-wider block">QUOTE</span>
                    <span className="text-xs font-mono font-semibold text-slate-800">{quoteNumber}</span>
                  </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-4 py-2 border-b border-slate-100 text-[11px]">
                  <div>
                    <span className="font-bold text-slate-500 uppercase text-[9.5px] block mb-1">Prepared For</span>
                    <strong className="text-slate-900 text-xs block">{preparedForName || "Client Name"}</strong>
                    <p className="text-slate-600 whitespace-pre-line mt-0.5">{preparedForAddress || "Client Address"}</p>
                    <p className="text-slate-600">{preparedForEmail} {preparedForPhone ? `• ${preparedForPhone}` : ""}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <div>
                      <span className="text-slate-500 mr-2">Quote Date:</span>
                      <strong className="text-slate-800">{quoteDate}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 mr-2">Valid Until:</span>
                      <strong className="text-amber-700">{validUntilDate}</strong>
                    </div>
                    {terms && (
                      <div>
                        <span className="text-slate-500 mr-2">Terms:</span>
                        <span className="text-slate-800">{terms}</span>
                      </div>
                    )}
                    {referenceNumber && (
                      <div>
                        <span className="text-slate-500 mr-2">Reference:</span>
                        <span className="text-slate-800 font-mono">{referenceNumber}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="space-y-2">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-300 text-[10px] font-bold uppercase text-slate-600">
                        <th className="py-1.5">Activity / Scope</th>
                        <th className="py-1.5 text-right w-14">Qty</th>
                        <th className="py-1.5 text-right w-20">Rate</th>
                        <th className="py-1.5 text-right w-24">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      {lineItems.map((itm, i) => (
                        <tr key={i}>
                          <td className="py-2 pr-2">
                            <strong className="block text-slate-800">{itm.activity || "Item"}</strong>
                            <span className="text-[10px] text-slate-500 whitespace-pre-line">{itm.description}</span>
                          </td>
                          <td className="py-2 text-right font-mono">{itm.quantity}</td>
                          <td className="py-2 text-right font-mono">${Number(itm.unit_price || 0).toFixed(2)}</td>
                          <td className="py-2 text-right font-mono font-semibold">${Number(itm.total || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals & Signature */}
                <div className="pt-3 border-t border-slate-200 flex items-start justify-between gap-4">
                  <div className="max-w-[260px] text-[10px] text-slate-500 space-y-1">
                    <p className="font-semibold text-slate-700">Notes &amp; Validity:</p>
                    <p className="whitespace-pre-line">{notes}</p>
                  </div>
                  <div className="text-right space-y-1 min-w-[140px]">
                    <div className="flex justify-between text-[11px] text-slate-600">
                      <span>Subtotal:</span>
                      <span className="font-mono">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-slate-900 pt-1 border-t border-slate-200">
                      <span>Total Quote:</span>
                      <span className="font-mono text-amber-700">${totalAmount.toFixed(2)} {currency}</span>
                    </div>
                  </div>
                </div>

                {/* Acceptance Block */}
                <div className="pt-6 border-t border-dashed border-slate-200 grid grid-cols-2 gap-6 text-[10px] text-slate-500">
                  <div className="space-y-4">
                    <p className="font-semibold text-slate-700">Client Acceptance Signature:</p>
                    <div className="border-b border-slate-300 h-6 w-full" />
                    <div className="flex justify-between">
                      <span>Printed Name</span>
                      <span>Date</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <p className="font-semibold text-slate-700">Authorized Representative:</p>
                    <div className="border-b border-slate-300 h-6 w-full" />
                    <div className="flex justify-between">
                      <span>Signature</span>
                      <span>Date</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
