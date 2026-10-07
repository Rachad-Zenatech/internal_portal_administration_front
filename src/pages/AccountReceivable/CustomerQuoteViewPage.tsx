import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import {
  Check,
  CheckCircle2,
  Clock,
  Download,
  MessageSquare,
  Paperclip,
  PenTool,
  QrCode,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  XCircle,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Checkbox } from "../../components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  arQuoteService,
} from "../../services/arQuoteService";
import type {
  ARQuote,
  PublicQuoteResponse,
} from "../../services/arQuoteService";
import { QRCodeDisplay } from "../../components/common/QRCodeDisplay";
import { QuoteNotesThread } from "./QuoteNotesThread";

export default function CustomerQuoteViewPage() {
  const { token } = useParams<{ token: string }>();
  const location = useLocation();
  const isMobileRoute = location.pathname.includes("/mobile/");

  const [loading, setLoading] = useState(true);
  const [quoteData, setQuoteData] = useState<PublicQuoteResponse | null>(null);
  const [errorReason, setErrorReason] = useState<string | null>(null);

  // Signing Modal State
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [signerFullName, setSignerFullName] = useState("");
  const [signerJobTitle, setSignerJobTitle] = useState("");
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [signSubmitting, setSignSubmitting] = useState(false);
  const [signError, setSignError] = useState<string | null>(null);
  const [signedSuccess, setSignedSuccess] = useState(false);

  // Canvas Signature
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Mobile QR Signing State
  const [isMobileQRModalOpen, setIsMobileQRModalOpen] = useState(false);
  const [mobileQRUrl, setMobileQRUrl] = useState<string | null>(null);
  const [mobileQRExpires, setMobileQRExpires] = useState<string | null>(null);

  // Request Changes State
  const [isChangesModalOpen, setIsChangesModalOpen] = useState(false);
  const [changeMessage, setChangeMessage] = useState("");
  const [changeSubmitting, setChangeSubmitting] = useState(false);
  const [changeSuccessMsg, setChangeSuccessMsg] = useState<string | null>(null);

  // Initial Load & Token Validation
  useEffect(() => {
    if (!token) {
      setErrorReason("No quotation access token provided.");
      setLoading(false);
      return;
    }

    arQuoteService
      .getPublicQuote(token)
      .then((res) => {
        if (res.valid && res.quote) {
          setQuoteData(res);
          setSignerFullName(res.recipient_name || res.quote.customer_contact_person || "");
          setSignerJobTitle(res.quote.customer_contact_title || "");
          // Send human page load beacon
          arQuoteService.sendPublicBeacon(token);
        } else {
          setErrorReason(res.reason || "Invalid or expired quotation link.");
        }
      })
      .catch((err) => {
        setErrorReason(err?.response?.data?.reason || err.message || "Failed to load quotation.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  // Real-time SSE listener for live signing updates (especially for Mobile QR sync)
  useEffect(() => {
    if (!quoteData?.quote?.id) return;
    const quoteId = quoteData.quote.id;

    // Connect to public/stream if available or use internal stream
    const eventSource = new EventSource("/api/notifications/stream");

    eventSource.onmessage = (e) => {
      try {
        const raw = JSON.parse(e.data);
        if (raw && raw.message) {
          const payload = JSON.parse(raw.message);
          if (payload.quote_id === quoteId) {
            if (payload.type === "quote.signed") {
              setSignedSuccess(true);
              setIsSignModalOpen(false);
              setIsMobileQRModalOpen(false);
              // Refetch quote to update display
              if (token) {
                arQuoteService.getPublicQuote(token).then((res) => {
                  if (res.valid) setQuoteData(res);
                });
              }
            } else if (payload.type === "quote.changes_requested") {
              if (token) {
                arQuoteService.getPublicQuote(token).then((res) => {
                  if (res.valid) setQuoteData(res);
                });
              }
            }
          }
        }
      } catch {
        // Ignored
      }
    };

    return () => {
      eventSource.close();
    };
  }, [quoteData?.quote?.id, token]);

  // Canvas Drawing Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0f172a";
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  // Open Sign Dialog Directly (No verification code required)
  const handleOpenSignDialog = () => {
    setIsSignModalOpen(true);
  };

  // Submit Handwritten Signature
  const handleSubmitSignature = async () => {
    if (!token) return;
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) {
      setSignError("Please provide your handwritten signature on the canvas.");
      return;
    }
    if (!signerFullName.trim()) {
      setSignError("Please enter your full legal name.");
      return;
    }
    if (!agreementChecked) {
      setSignError("You must acknowledge and accept the quote terms.");
      return;
    }

    setSignSubmitting(true);
    setSignError(null);
    try {
      const sigDataUrl = canvas.toDataURL("image/png");
      await arQuoteService.signQuote(token, {
        signer_name: signerFullName.trim(),
        signer_title: signerJobTitle.trim() || undefined,
        signature_data_url: sigDataUrl,
        agreement_accepted: true,
      });
      setSignedSuccess(true);
      setIsSignModalOpen(false);
      // Refetch
      const updated = await arQuoteService.getPublicQuote(token);
      if (updated.valid) setQuoteData(updated);
    } catch (err: any) {
      setSignError(err?.response?.data?.detail || err.message || "Failed to submit signature.");
    } finally {
      setSignSubmitting(false);
    }
  };

  // Create Mobile QR Session
  const handleOpenMobileQR = async () => {
    if (!token) return;
    try {
      const mob = await arQuoteService.createMobileSession(token);
      const fullMobileUrl = mob.raw_token
        ? `${window.location.origin}/q/mobile/${mob.raw_token}`
        : mob.full_url;
      setMobileQRUrl(fullMobileUrl);
      setMobileQRExpires(mob.expires_at);
      setIsMobileQRModalOpen(true);
    } catch (err: any) {
      alert("Failed to initiate mobile session: " + err.message);
    }
  };

  // Submit Change Request
  const handleSubmitChanges = async () => {
    if (!token || !changeMessage.trim()) return;
    setChangeSubmitting(true);
    try {
      const res = await arQuoteService.requestChanges(token, changeMessage.trim());
      setChangeSuccessMsg(res.message);
      setIsChangesModalOpen(false);
      const updated = await arQuoteService.getPublicQuote(token);
      if (updated.valid) setQuoteData(updated);
    } catch (err: any) {
      alert(err?.response?.data?.detail || err.message || "Failed to submit change request.");
    } finally {
      setChangeSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">Loading Quotation Proposal...</h2>
        <p className="text-xs text-slate-500 mt-1">Verifying cryptographic token security...</p>
      </div>
    );
  }

  if (errorReason || !quoteData?.quote) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 max-w-md space-y-3">
          <XCircle className="w-10 h-10 mx-auto text-rose-500" />
          <h2 className="text-lg font-bold text-slate-900">Quotation Link Inactive</h2>
          <p className="text-xs text-slate-600">{errorReason || "This quote is unavailable, expired, or has been revoked."}</p>
          <div className="pt-2 text-[11px] text-slate-400">
            If you believe this is in error, please contact your account representative.
          </div>
        </div>
      </div>
    );
  }

  const quote: ARQuote = quoteData.quote;
  const isAlreadySigned = quote.customer_response_state === "SIGNED" || signedSuccess;
  const isChangesPending = quote.customer_response_state === "CHANGES_REQUESTED";

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 py-6 px-4 sm:px-6 lg:px-8 font-sans print:min-h-0 print:p-0 print:m-0 print:bg-white print:w-full">
      <div className="max-w-4xl mx-auto space-y-6 print:max-w-none print:m-0 print:p-0 print:space-y-0 print:w-full">
        {/* Top Status & Security Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 lg:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm print:hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left: Quote Branding & Validity */}
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    {quote.company_name} Formal Quotation
                  </h1>
                  <Badge variant="outline" className="font-mono text-xs bg-amber-50 text-amber-700 border-amber-300">
                    {quote.quote_number} (v{quote.current_version})
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Valid until <strong>{new Date(quoteData.expires_at || "").toLocaleDateString()}</strong></span>
                  </span>
                  {quote.customer_name && (
                    <span className="text-slate-400 hidden sm:inline">• Prepared for {quote.customer_name}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Actions Toolbar */}
            <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t border-slate-100 dark:border-slate-800 lg:border-0 justify-start lg:justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="gap-1.5 text-xs rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-50 cursor-pointer h-9"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Download PDF</span>
              </Button>

              {!isAlreadySigned && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const el = document.getElementById("quote-documents-thread");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="gap-1.5 text-xs rounded-xl border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer h-9"
                  >
                    <Paperclip className="w-3.5 h-3.5 text-amber-600" />
                    <span>Documents &amp; Notes</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsChangesModalOpen(true)}
                    disabled={isChangesPending}
                    className="gap-1.5 text-xs rounded-xl border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer h-9"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                    <span>{isChangesPending ? "Changes Pending" : "Request Changes"}</span>
                  </Button>

                  {!isMobileRoute && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleOpenMobileQR}
                      className="gap-1.5 text-xs rounded-xl border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer h-9 hidden sm:inline-flex"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                      <span>Sign on Phone</span>
                    </Button>
                  )}

                  <Button
                    onClick={handleOpenSignDialog}
                    disabled={isChangesPending}
                    className="gap-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold px-4 h-9 rounded-xl shadow-sm cursor-pointer transition-all hover:shadow-md"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Accept &amp; Sign</span>
                  </Button>
                </>
              )}

              {isAlreadySigned && (
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 py-1.5 px-3 text-xs gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Signed &amp; Accepted</span>
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Change Request Notification Banner */}
        {isChangesPending && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-medium flex items-start gap-3 print:hidden">
            <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">A revision or document request is currently being reviewed by your account representative.</p>
              <p className="text-slate-600 dark:text-slate-400 mt-0.5">"{quote.change_request_message}"</p>
            </div>
          </div>
        )}

        {/* Signed Success Notification Banner (Screen only, signature displays on document below) */}
        {isAlreadySigned && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-start justify-between gap-3 print:hidden">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Thank you! This quotation has been officially signed &amp; accepted.</p>
                <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                  Signed by <strong>{quote.signer_name || signerFullName}</strong> ({quote.signer_title || "Authorized Representative"}) on{" "}
                  {new Date(quote.signed_at || "").toLocaleDateString()}
                </p>
              </div>
            </div>
            {quote.signature_data_url && (
              <div className="w-28 h-10 border border-slate-200 rounded-lg bg-white p-1 flex items-center justify-center">
                <img src={quote.signature_data_url} alt="Signature" className="max-h-full max-w-full object-contain" />
              </div>
            )}
          </div>
        )}

        {/* Visual Document Layout (Matches clean paper document format) */}
        <div className="p-8 sm:p-14 bg-white text-slate-900 border border-slate-200 rounded-2xl shadow-sm font-sans text-sm space-y-8 min-h-[750px] print:border-none print:shadow-none print:rounded-none print:p-0 print:m-0 print:space-y-6 print:min-h-0 print:w-full">
          {/* Brand Logo */}
          {quote.logo_url && (
            <div className="h-12 sm:h-14 max-w-[220px] flex items-center mb-6">
              <img
                src={quote.logo_url}
                alt="Company Logo"
                className="max-h-full max-w-full h-auto w-auto object-contain object-left"
              />
            </div>
          )}

          {/* 2-Column Header Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-start pt-1">
            {/* Left Column: Quotation for */}
            <div className="space-y-1 text-slate-900">
              <div className="font-bold text-base mb-1">Quotation for:</div>
              {quote.customer_name && <div className="text-[14px] leading-snug font-medium">{quote.customer_name}</div>}
              {quote.customer_phone && <div className="text-[14px] leading-snug text-slate-700">{quote.customer_phone}</div>}
              {quote.customer_contact_person && <div className="text-[14px] leading-snug">{quote.customer_contact_person}</div>}
              {quote.customer_contact_title && <div className="text-[14px] leading-snug">{quote.customer_contact_title}</div>}
              {quote.customer_email && <div className="text-[14px] leading-snug text-slate-700">{quote.customer_email}</div>}
              {!quote.customer_name && !quote.customer_contact_person && !quote.customer_email && (
                <div className="text-[14px] text-slate-400 italic font-light">—</div>
              )}
            </div>

            {/* Right Column: Date, Quotation No., Quote Validity, Prepared By */}
            <div className="space-y-1 text-slate-900">
              <div className="text-[14px] leading-snug">
                <span className="font-bold">Date</span>{" "}
                <span className="ml-1">{new Date(quote.quote_date).toLocaleDateString()}</span>
              </div>
              <div className="text-[14px] leading-snug">
                <span className="font-bold">Quotation No.:</span>{" "}
                <span className="ml-1 font-mono">{quote.quote_number}</span>
              </div>
              <div className="text-[14px] leading-snug">
                <span className="font-bold">Quote Validity:</span>{" "}
                <span className="ml-1 italic text-slate-700">{quote.terms || `${quote.validity_days} days`}</span>
              </div>

              {(quote.prepared_by_name || quote.prepared_by_email) && (
                <div className="pt-4 space-y-1">
                  {quote.prepared_by_name && (
                    <div className="text-[14px] leading-snug">
                      <span className="font-bold">Prepared By:</span>{" "}
                      <span className="ml-1">{quote.prepared_by_name}</span>
                    </div>
                  )}
                  {quote.prepared_by_email && (
                    <div className="text-[14px] leading-snug text-slate-700">
                      {quote.prepared_by_email}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="pt-2">
            <div className="overflow-hidden border-t border-b border-slate-200">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f8f9fa] border-b border-slate-200 text-slate-900 text-[13px] font-bold">
                    <th className="py-2.5 px-4 font-bold">Name</th>
                    <th className="py-2.5 px-4 text-right font-bold w-28">Price</th>
                    <th className="py-2.5 px-4 text-right font-bold w-20">QTY</th>
                    <th className="py-2.5 px-4 text-right font-bold w-28">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[13.5px]">
                  {quote.line_items.map((itm, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4">
                        <div className="text-slate-900 font-medium">{itm.name || "—"}</div>
                        {itm.description && (
                          <div className="text-slate-500 text-[12px] mt-0.5 whitespace-pre-line leading-relaxed">
                            {itm.description}
                          </div>
                        )}
                        {(itm.billing_frequency || itm.term || itm.billing_start_date) && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-slate-500">
                            {itm.billing_frequency && (
                              <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-medium text-slate-700 dark:text-zinc-300">
                                {itm.billing_frequency}
                              </span>
                            )}
                            {itm.term && (
                              <span className="text-slate-500">
                                • {itm.term} {Number(itm.term) === 1 ? "term" : "terms"}
                              </span>
                            )}
                            {itm.billing_start_date && (
                              <span className="text-slate-500">
                                • Start: {itm.billing_start_date}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-900 font-normal">
                        <div>${Number(itm.price || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        {Number(itm.unit_discount || 0) > 0 && (
                          <div className="text-[10.5px] text-emerald-600 font-normal">
                            -{itm.unit_discount}{itm.discount_type === "$" ? "$" : "%"} off
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-900 font-normal">
                        {itm.quantity}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-900 font-normal">
                        ${Number(itm.subtotal || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Section */}
          <div className="flex justify-end pt-1">
            <div className="w-64 space-y-2 text-[14px]">
              <div className="flex justify-between items-center text-slate-800">
                <span>Subtotal</span>
                <span className="font-normal">
                  ${Number(quote.subtotal).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-800">
                <span>Discount</span>
                <span className="font-normal">
                  ${Number(quote.discount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-800">
                <span>Tax</span>
                <span className="font-normal">
                  ${Number(quote.tax || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-900 font-bold pt-1 border-t border-slate-200">
                <span>Total</span>
                <span>
                  ${Number(quote.total_amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {quote.currency}
                </span>
              </div>
            </div>
          </div>

          {/* Closing Statement & Sign-off */}
          <div className="pt-6 space-y-6 text-[13.5px] leading-relaxed text-slate-900">
            {quote.closing_message && (
              <p className="whitespace-pre-line text-slate-800">
                {quote.closing_message}
              </p>
            )}

            <div className="space-y-2 pt-2">
              <div>Thank you,</div>
              <div className="pt-1 font-medium text-slate-900">{quote.prepared_by_name}</div>
            </div>

            {/* Official Signature on Document (Printed with document) */}
            {quote.signature_data_url && (
              <div className="pt-6 border-t border-slate-200/80 space-y-2">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Accepted &amp; Authorized Signature
                </div>
                <div className="flex items-center gap-4 pt-1">
                  <div className="h-12 w-36 border border-slate-200 bg-white rounded-md p-1 flex items-center justify-center shadow-2xs">
                    <img src={quote.signature_data_url} alt="Signature" className="max-h-full max-w-full object-contain" />
                  </div>
                  <div className="text-xs text-slate-700 space-y-0.5">
                    <div className="font-semibold text-slate-900">
                      {quote.signer_name || signerFullName} {quote.signer_title ? `(${quote.signer_title})` : ""}
                    </div>
                    {quote.signed_at && (
                      <div className="text-[11px] text-slate-500">
                        Date: {new Date(quote.signed_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Documents Required & Notes Thread for Customer */}
        <div id="quote-documents-thread" className="print:hidden">
          <QuoteNotesThread
            token={token}
            authorType="CUSTOMER"
            defaultAuthorName={
              quoteData.recipient_name ||
              quote.customer_contact_person ||
              quote.customer_name ||
              "Customer"
            }
          />
        </div>
      </div>

      {/* 2. Handwritten Signing Modal */}
      <Dialog open={isSignModalOpen} onOpenChange={setIsSignModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenTool className="w-5 h-5 text-amber-600" />
              <span>Accept &amp; Sign Quotation</span>
            </DialogTitle>
            <DialogDescription>
              Please review your details and provide your handwritten signature to execute this agreement.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {signError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-medium">
                {signError}
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Full Legal Name *</Label>
              <Input
                value={signerFullName}
                onChange={(e) => setSignerFullName(e.target.value)}
                placeholder="e.g. Jasper O. I"
                className="text-xs h-9"
              />
            </div>

            {/* Signature Canvas */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Handwritten Signature * (Mouse / Touch / Stylus)</Label>
                <button
                  type="button"
                  onClick={clearSignature}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              </div>

              <div className="border border-slate-300 rounded-xl overflow-hidden bg-slate-50 relative touch-none">
                <canvas
                  ref={canvasRef}
                  width={460}
                  height={150}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-[150px] bg-white cursor-crosshair block"
                />
                {!hasSignature && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-300 text-xs font-medium">
                    Sign here using mouse or touch...
                  </div>
                )}
              </div>
            </div>

            {/* Agreement Checkbox */}
            <div className="flex items-start gap-2 pt-2 border-t border-slate-100">
              <Checkbox
                id="quote-agreement-checkbox"
                checked={agreementChecked}
                onCheckedChange={(c) => setAgreementChecked(!!c)}
                className="mt-0.5"
              />
              <label htmlFor="quote-agreement-checkbox" className="text-xs text-slate-600 cursor-pointer leading-tight">
                I hereby accept and approve this quotation <strong>{quote.quote_number}</strong> for the total amount of <strong>${Number(quote.total_amount).toFixed(2)} {quote.currency}</strong> and agree to the specified terms.
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSignModalOpen(false)}
              className="text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitSignature}
              disabled={signSubmitting || !hasSignature || !signerFullName.trim() || !agreementChecked}
              className="text-xs rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{signSubmitting ? "Confirming..." : "Confirm & Sign"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. Mobile QR Code Modal */}
      <Dialog open={isMobileQRModalOpen} onOpenChange={setIsMobileQRModalOpen}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2">
              <QrCode className="w-5 h-5 text-amber-600" />
              <span>Sign on Smartphone</span>
            </DialogTitle>
            <DialogDescription>
              Scan this QR code with your mobile camera to open a secure signing canvas directly on your phone.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 flex flex-col items-center justify-center space-y-3">
            {mobileQRUrl && (
              <QRCodeDisplay value={mobileQRUrl} size={200} />
            )}
            {mobileQRExpires && (
              <span className="text-[11px] text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                Session expires at {new Date(mobileQRExpires).toLocaleTimeString()}
              </span>
            )}
            <p className="text-xs text-slate-500">
              Once completed on your mobile device, this page will automatically update in real-time.
            </p>
          </div>

          <DialogFooter className="sm:justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMobileQRModalOpen(false)}
              className="text-xs rounded-xl"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 4. Request Changes Modal */}
      <Dialog open={isChangesModalOpen} onOpenChange={setIsChangesModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-600" />
              <span>Request Changes</span>
            </DialogTitle>
            <DialogDescription>
              Specify any adjustments to items, quantities, pricing, or commercial terms you require prior to executing this agreement.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {changeSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs">
                {changeSuccessMsg}
              </div>
            )}
            <Textarea
              value={changeMessage}
              onChange={(e) => setChangeMessage(e.target.value)}
              placeholder="e.g. Please update line items, adjust billing frequency, or apply agreed discount before we sign..."
              rows={4}
              className="text-xs"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsChangesModalOpen(false)}
              className="text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitChanges}
              disabled={changeSubmitting || !changeMessage.trim()}
              className="text-xs rounded-xl bg-amber-600 hover:bg-amber-700 text-white"
            >
              {changeSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
