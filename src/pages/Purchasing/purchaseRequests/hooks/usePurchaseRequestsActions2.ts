import { useMemo, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useVendorDirectory } from "@/hooks/usePurchasing";
import { type PurchaseRequestItem } from "@/types/purchasing";
import { detectTaxWithPriority } from "@/utils/taxRates";
import { formatMoney } from "../../utils/purchasingMeta";
import { extractProductInfoFromUrl } from "@/services/purchasingService";
import { parseExtractedPrice } from "../utils";
import type { usePurchaseRequestsActions } from "./usePurchaseRequestsActions";

export function usePurchaseRequestsActions2(ctx: ReturnType<typeof usePurchaseRequestsActions>) {
  const { setForm, setTaxFee, setShippingFee, setQuoteItems, setLineItemsCurrency, setQuoteExtraction, extractQuoteMutation, setQuoteFile, lastExtractedItemUrlsRef, quoteItems, itemUrlExtractionTimeoutsRef, form, itemMode, extractedProductInfo, quoteExtraction, apWireForm, taxFee, shippingFee, schedDates, isScheduled, isDialogOpen } = ctx;
  // Handle Quote PDF upload & extraction
  const handleQuoteFileUpload = async (file: File) => {
    setQuoteFile(file);
    try {
      toast.info("Extracting layout, OCR, and quote line items...");
      const result = await extractQuoteMutation.mutateAsync(file);
      setQuoteExtraction(result);

      const conv = result.extraction.conversion;
      const isForeign = Boolean(conv?.is_converted);
      const rate = conv?.exchange_rate || 1.0;
      const origCurr = conv?.original_currency || result.extraction.currency || "USD";
      setLineItemsCurrency(origCurr);

      // 1. Keep line items strictly in their extracted native quote currency (e.g. CAD) so inputs match the PDF quote
      const items: PurchaseRequestItem[] = (result.extraction.items || []).map((itm, idx) => {
        const origUnitPrice = Number(itm.original_unit_price ?? itm.unit_price ?? 0);
        const origTotal = Number(itm.original_total ?? itm.total ?? (Number(itm.quantity || 1) * origUnitPrice));
        const convertedUnitPrice = isForeign ? (itm.converted_unit_price ?? Math.round(origUnitPrice * rate * 100) / 100) : origUnitPrice;
        const convertedTotal = isForeign ? (itm.converted_total ?? Math.round(origTotal * rate * 100) / 100) : origTotal;

        return {
          item_order: idx,
          sku: itm.sku || "",
          description: itm.description || `Item #${idx + 1}`,
          quantity: Number(itm.quantity) || 1,
          unit_price: origUnitPrice,
          discount: Number(itm.discount) || 0,
          tax: Number(itm.tax) || 0,
          total: origTotal,
          converted_unit_price: convertedUnitPrice,
          converted_total: convertedTotal,
          original_unit_price: origUnitPrice,
          original_total: origTotal,
          original_currency: isForeign ? origCurr : undefined,
        };
      });
      setQuoteItems(items);

      // 2. Prefill shipping and tax in native quote currency (e.g. CAD)
      const vendorName = result.extraction.vendor?.name || "";
      const quoteNum = result.extraction.quote_number || "";
      const itemsCount = items.length;
      
      const rawShipping = Number(result.extraction.totals?.shipping) || 0;
      const rawTax = Number(result.extraction.totals?.tax) || 0;
      const rawDiscount = Number(result.extraction.totals?.discount) || 0;
      
      setShippingFee(rawShipping);
      setTaxFee(rawTax);
      
      const itemsSum = items.reduce((sum, itm) => sum + itm.total, 0);
      const hasDiscountInItems = items.some(i => Number(i.total || 0) < 0 || (i.description || "").toLowerCase().includes("discount"));
      const discountToApply = hasDiscountInItems ? 0 : rawDiscount;
      const totalAmountNative = itemsSum + rawShipping + rawTax - discountToApply;
      const totalAmountUsd = isForeign ? (conv?.converted_total ?? Math.round(totalAmountNative * rate * 100) / 100) : totalAmountNative;

      setForm((prev) => ({
        ...prev,
        title: prev.title || `${vendorName ? vendorName + " - " : ""}Quote ${quoteNum || "Order"} (${itemsCount} parts)`.trim(),
        request_type: "QUOTE",
        amount: Math.round(totalAmountUsd * 100) / 100,
        currency: "USD",
        quote_data: result.extraction,
        description: prev.description || result.extraction.notes || `Extracted quote from ${file.name}${isForeign ? ` (Original: ${origCurr} ${totalAmountNative.toLocaleString(undefined, { minimumFractionDigits: 2 })} @ Rate ${rate} → $${totalAmountUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD)` : ""}`,
      }));

      if (isForeign) {
        toast.success(`Quote extracted: Detected ${origCurr} (Editing in ${origCurr}, Converted to USD @ 1 ${origCurr} = $${rate} USD)`);
      } else {
        toast.success("Quote extracted successfully!");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to extract quote from PDF");
    }
  };
  const handleItemChange = (index: number, field: keyof PurchaseRequestItem, val: any) => {
    setQuoteItems((prev) => {
      const next = [...prev];
      const target = { ...next[index], [field]: val };
      if (field === "quantity" || field === "unit_price" || field === "discount" || field === "tax") {
        const q = Number(target.quantity) || 0;
        const p = Number(target.unit_price) || 0;
        const d = Number(target.discount) || 0;
        const t = Number(target.tax) || 0;
        target.total = Math.max(0, q * p - d + t);
      }
      next[index] = target;
      return next;
    });
  };
  const handleItemUrlExtraction = async (index: number, description: string) => {
    const urlMatch = description.match(
      /(?:https?:\/\/|www\.)[^\s<]+|(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}(?:\/[^\s<]*)?/i,
    );
    const url = urlMatch?.[0].replace(/[),.;!?]+$/, "");
    if (!url) return;

    const initialItem = quoteItems[index];
    if (!initialItem) return;
    const initialPrice = Number(initialItem.unit_price) || 0;
    const normalizedUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    if (lastExtractedItemUrlsRef.current.get(index) === normalizedUrl) return;

    lastExtractedItemUrlsRef.current.set(index, normalizedUrl);
    try {
      const product = await extractProductInfoFromUrl(normalizedUrl);
      const extractedPrice = parseExtractedPrice(product.price);
      if (extractedPrice === null) {
        lastExtractedItemUrlsRef.current.delete(index);
        toast.error("Could not extract a price from the item link.");
        return;
      }

      setQuoteItems((prev) => {
        const currentItem = prev[index];
        if (
          !currentItem ||
          currentItem.description !== description ||
          (Number(currentItem.unit_price) || 0) !== initialPrice
        ) {
          return prev;
        }

        const quantity = Number(currentItem.quantity) || 0;
        const discount = Number(currentItem.discount) || 0;
        const tax = Number(currentItem.tax) || 0;
        const next = [...prev];
        next[index] = {
          ...currentItem,
          unit_price: extractedPrice,
          total: Math.max(0, quantity * extractedPrice - discount + tax),
        };
        return next;
      });
      const extractedCurrency =
        product.currency && product.currency !== "N/A" ? product.currency : undefined;
      if (extractedCurrency) {
        setLineItemsCurrency(extractedCurrency);
        setForm((prev) => ({ ...prev, currency: extractedCurrency }));
      }
      toast.success(
        `Extracted ${product.name && product.name !== "N/A" ? `${product.name}: ` : ""}${formatMoney(extractedPrice, extractedCurrency || "USD")}`,
      );
    } catch (err) {
      lastExtractedItemUrlsRef.current.delete(index);
      toast.error(err instanceof Error ? err.message : "Failed to extract item price from link.");
    }
  };
  const scheduleItemUrlExtraction = (index: number, description: string) => {
    const existingTimeout = itemUrlExtractionTimeoutsRef.current.get(index);
    if (existingTimeout) clearTimeout(existingTimeout);

    const timeout = setTimeout(() => {
      itemUrlExtractionTimeoutsRef.current.delete(index);
      void handleItemUrlExtraction(index, description);
    }, 700);
    itemUrlExtractionTimeoutsRef.current.set(index, timeout);
  };
  const extractItemUrlOnBlur = (index: number, description: string) => {
    const existingTimeout = itemUrlExtractionTimeoutsRef.current.get(index);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      itemUrlExtractionTimeoutsRef.current.delete(index);
    }
    void handleItemUrlExtraction(index, description);
  };
  const handleAddItem = () => {
    setQuoteItems((prev) => [
      ...prev,
      {
        item_order: prev.length,
        sku: "",
        description: "",
        quantity: 1,
        unit_price: 0,
        discount: 0,
        tax: 0,
        total: 0,
      },
    ]);
  };
  const handleRemoveItem = (index: number) => {
    for (const timeout of itemUrlExtractionTimeoutsRef.current.values()) {
      clearTimeout(timeout);
    }
    itemUrlExtractionTimeoutsRef.current.clear();
    lastExtractedItemUrlsRef.current.clear();
    setQuoteItems((prev) => prev.filter((_, i) => i !== index));
  };
  const itemsSubtotal = useMemo(() => {
    return quoteItems.reduce((acc, itm) => acc + (Number(itm.total) || 0), 0);
  }, [quoteItems]);
  const currentSubtotal = useMemo(() => {
    if (itemMode === "MULTIPLE") return itemsSubtotal;
    return (Number(form.unit_price) || 0) * (Number(form.quantity) || 1) || (Number(form.amount) || 0);
  }, [itemMode, itemsSubtotal, form.unit_price, form.quantity, form.amount]);
  const { data: vendorDirectory = {} } = useVendorDirectory();
  const effectiveVendorName = useMemo(() => {
    if (form.request_type === "ACCOUNTS_PAYABLE") return apWireForm.vendor || "";
    if (quoteExtraction?.extraction?.vendor?.name) return quoteExtraction.extraction.vendor.name;
    if (typeof quoteExtraction?.extraction?.vendor === "string") return quoteExtraction.extraction.vendor;
    if (extractedProductInfo?.vendor && extractedProductInfo.vendor !== "N/A") return extractedProductInfo.vendor;
    if (form.title?.includes(" - ")) {
      const candidate = form.title.split(" - ")[0].trim();
      if (candidate.length > 1 && candidate.length < 50) return candidate;
    }
    return "";
  }, [form.request_type, apWireForm.vendor, quoteExtraction, extractedProductInfo, form.title]);
  const effectiveVendorAddress = useMemo(() => {
    if (form.request_type === "ACCOUNTS_PAYABLE") return apWireForm.vendor_address || "";
    if (quoteExtraction?.extraction?.vendor?.address) return quoteExtraction.extraction.vendor.address;
    return "";
  }, [form.request_type, apWireForm.vendor_address, quoteExtraction]);
  const taxEstimate = useMemo(() => {
    return detectTaxWithPriority({
      shippingAddress: form.shipping_address || "",
      vendorAddress: effectiveVendorAddress,
      vendorName: effectiveVendorName,
      knownVendorLocations: vendorDirectory,
      currency: form.currency || "USD",
    });
  }, [form.shipping_address, effectiveVendorAddress, effectiveVendorName, vendorDirectory, form.currency]);
  const estimatedTaxAmount = useMemo(() => {
    if (!taxEstimate || currentSubtotal <= 0) return 0;
    return Math.round(currentSubtotal * taxEstimate.rateDecimal * 100) / 100;
  }, [taxEstimate, currentSubtotal]);
  const prevEstimatedAddrRef = useRef<string>("");
  useEffect(() => {
    const locKey = `${form.shipping_address || ""}|${effectiveVendorAddress || ""}|${effectiveVendorName || ""}`;
    if (locKey && locKey !== prevEstimatedAddrRef.current) {
      prevEstimatedAddrRef.current = locKey;
      if (taxEstimate && currentSubtotal > 0 && taxFee === 0) {
        setTaxFee(estimatedTaxAmount);
      }
    }
  }, [form.shipping_address, effectiveVendorAddress, effectiveVendorName, taxEstimate, currentSubtotal, taxFee, estimatedTaxAmount]);
  const totalCalculatedAmount = useMemo(() => {
    if (itemMode === "MULTIPLE") {
      const hasDiscountInItems = quoteItems.some(i => Number(i.total || 0) < 0 || (i.description || "").toLowerCase().includes("discount"));
      const rawDiscount = Number(quoteExtraction?.extraction?.totals?.discount) || 0;
      const discountToApply = hasDiscountInItems ? 0 : rawDiscount;
      return Math.max(0, Math.round((itemsSubtotal + Number(shippingFee || 0) + Number(taxFee || 0) - discountToApply) * 100) / 100);
    }
    if (form.request_type === "RECURRING") {
      return Number(form.unit_price ?? form.amount ?? 0);
    }
    return form.amount || (Number(form.quantity || 1) * Number(form.unit_price || 0));
  }, [itemMode, itemsSubtotal, shippingFee, taxFee, quoteExtraction, form.amount, form.quantity, form.unit_price, form.request_type]);
  const isDirty = useMemo(() => {
    if (!isDialogOpen) return false;
    return Boolean(
      form.title ||
      form.description ||
      form.item_url ||
      form.unit_price ||
      (form.quantity && form.quantity !== 1) ||
      form.gl_code ||
      quoteItems.length > 0 ||
      quoteExtraction !== null ||
      shippingFee > 0 ||
      taxFee > 0 ||
      (form.request_type === "RECURRING" && (form.amount || isScheduled || schedDates.length > 0))
    );
  }, [isDialogOpen, form, quoteItems, quoteExtraction, shippingFee, taxFee, isScheduled, schedDates]);
  return { handleQuoteFileUpload, handleItemChange, scheduleItemUrlExtraction, extractItemUrlOnBlur, handleAddItem, handleRemoveItem, itemsSubtotal, currentSubtotal, vendorDirectory, effectiveVendorName, effectiveVendorAddress, taxEstimate, totalCalculatedAmount, isDirty };
}
