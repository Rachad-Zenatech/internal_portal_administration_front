import { useMemo } from "react";
import { calculateInstallmentsCount } from "../../../utils/recurringScheduleUtils";
import { updateWireTransfer } from "@/services/purchasingService";
import type { ItemMode } from "@/types/purchasing";
import { RequestStatus } from "@/types/purchasing";
import { resolveTaxRate } from "../../../utils/purchasingMeta";
import { toast } from "sonner";
import type { EditCombinedRequestDialogProps } from "../types";
import type { useEditCombinedRequestActions } from "./useEditCombinedRequestActions";

export function useEditCombinedRequestActions2(props: EditCombinedRequestDialogProps, ctx: ReturnType<typeof useEditCombinedRequestActions>) {
  const { onOpenChange, refetch } = props;
  const { requestItems, reqGlCode, title, sku, setRequestItems, amount, unitPrice, quantity, setItemMode, setInvAmount, setPoAmount, isPricingSynced, poShippingFee, poUnitPrice, setPoQuantity, setAmount, setQuantity, poQuantity, setPoUnitPrice, setUnitPrice, reqCurrency, invVendor, poVendor, shippingAddress, poCurrency, setPoCurrency, setReqCurrency, setInvItems, invItems, setInvGlCode, setPoGlCode, setReqGlCode, setPoShippingFee, invAssetFlag, itemMode, apWireForm, request, wireTransfer, requestType, updateMutation, invGlCode, invDescription, poGlCode, invFromLocation, invDepartment, invDueDate, invDate, invAmount, hasInvoice, poDescription, poAmount, poGoodsReceived, poGoodsReceivedNote, poShippingNote, poTrackingNumber, poExpectedDeliveryDate, poShippedTo, poPaymentMethod, poItem, poQuoteNumber, hasPo, schedStartDate, dueDate, schedFrequency, isScheduled, projectName, description, itemUrl, priority, phoneNumber, department, requester, schedEndDate, schedDates, setActiveTab, isCompleted } = ctx;
  // Multi-parts calculations
  const itemsSubtotal = useMemo(() => {
    return requestItems.reduce(
      (acc, it) => acc + (Number(it.total) || (Number(it.quantity || 1) * Number(it.unit_price || 0))),
      0
    );
  }, [requestItems]);
  const calculatedGrandTotal = useMemo(() => {
    return Math.max(0, Math.round(itemsSubtotal * 100) / 100);
  }, [itemsSubtotal]);
  // Mode switch handler
  const handleItemModeSwitch = (mode: ItemMode) => {
    setItemMode(mode);
    if (mode === "MULTIPLE" && requestItems.length === 0) {
      // Seed with existing single item data
      const q = Math.max(1, parseInt(quantity, 10) || 1);
      const u = Math.max(0, parseFloat(unitPrice) || 0);
      const a = Math.max(0, parseFloat(amount) || q * u);
      setRequestItems([
        {
          id: String(Date.now()),
          sku: sku.trim() || "",
          description: title.trim() || "Item 1",
          quantity: q,
          unit_price: u,
          discount: 0,
          tax: 0,
          total: a,
          gl_code: reqGlCode || "",
        },
      ]);
    }
  };
  // Add Item / Part Row
  const handleAddPartItem = () => {
    const newItem = {
      id: String(Date.now()),
      sku: "",
      description: "",
      quantity: 1,
      unit_price: 0,
      discount: 0,
      tax: 0,
      total: 0,
      gl_code: reqGlCode || "",
    };
    const updated = [...requestItems, newItem];
    setRequestItems(updated);

    if (isPricingSynced) {
      const newSub = updated.reduce(
        (acc, it) => acc + (Number(it.total) || (Number(it.quantity || 1) * Number(it.unit_price || 0))),
        0
      );
      const newTotal = Math.round(newSub * 100) / 100;
      setPoAmount(newTotal);
      setInvAmount(newTotal);
    }
  };
  // Remove Item / Part Row
  const handleRemovePartItem = (index: number) => {
    const updated = requestItems.filter((_, idx) => idx !== index);
    setRequestItems(updated);

    if (isPricingSynced) {
      const newSub = updated.reduce(
        (acc, it) => acc + (Number(it.total) || (Number(it.quantity || 1) * Number(it.unit_price || 0))),
        0
      );
      const newTotal = Math.round(newSub * 100) / 100;
      setPoAmount(newTotal);
      setInvAmount(newTotal);
    }
  };
  // Update Item Row
  const handleUpdatePartItem = (index: number, field: string, value: any) => {
    const updated = [...requestItems];
    const it = { ...updated[index], [field]: value };

    const q = Number(it.quantity) || 1;
    const u = Number(it.unit_price) || 0;
    const disc = Number(it.discount) || 0;
    const tx = Number(it.tax) || 0;
    it.total = Math.round((q * u - disc + tx) * 100) / 100;

    updated[index] = it;
    setRequestItems(updated);

    if (isPricingSynced) {
      const newSub = updated.reduce(
        (acc, item) => acc + (Number(item.total) || (Number(item.quantity || 1) * Number(item.unit_price || 0))),
        0
      );
      const newTotal = Math.round(newSub * 100) / 100;
      setPoAmount(newTotal);
      setInvAmount(newTotal);
    }
  };
  // --- SINGLE ITEM PRICING HANDLERS ---
  const handleQuantityChange = (val: string) => {
    setQuantity(val);
    const numericQty = parseInt(val, 10) || 1;
    const numericUnitPrice = parseFloat(unitPrice) || 0;
    const calculatedAmt = Math.round(numericQty * numericUnitPrice * 100) / 100;
    setAmount(String(calculatedAmt));

    if (isPricingSynced) {
      setPoQuantity(numericQty);
      const newPoAmt = Math.round((numericQty * poUnitPrice + poShippingFee) * 100) / 100;
      setPoAmount(newPoAmt);
      setInvAmount(newPoAmt);
    }
  };
  const handleUnitPriceChange = (val: string) => {
    setUnitPrice(val);
    const q = parseFloat(quantity) || 0;
    const u = parseFloat(val) || 0;
    const calculatedAmt = Math.round(q * u * 100) / 100;
    setAmount(String(calculatedAmt));

    if (isPricingSynced) {
      setPoUnitPrice(u);
      const newPoAmt = Math.round((poQuantity * u + poShippingFee) * 100) / 100;
      setPoAmount(newPoAmt);
      setInvAmount(newPoAmt);
    }
  };
  const handleAmountChange = (val: string) => {
    setAmount(val);
    const a = parseFloat(val) || 0;
    const q = parseFloat(quantity) || 1;
    let u = 0;
    if (q > 0) {
      u = Math.round((a / q) * 100) / 100;
      setUnitPrice(String(u));
    }

    if (isPricingSynced) {
      setPoUnitPrice(u);
      const newPoAmt = Math.round((poQuantity * u + poShippingFee) * 100) / 100;
      setPoAmount(newPoAmt);
      setInvAmount(newPoAmt);
    }
  };
  const parsedAmount = parseFloat(amount) || 0;
  const reqTax = resolveTaxRate({ shippingAddress, vendorName: poVendor || invVendor, currency: reqCurrency });
  const poTax = resolveTaxRate({ shippingAddress, vendorName: poVendor || invVendor, currency: poCurrency });
  const afterTaxAmount = Math.round(parsedAmount * (1 + reqTax.rate) * 100) / 100;
  const handleAfterTaxChange = (val: string) => {
    const after = parseFloat(val) || 0;
    const pre = Math.round((after / (1 + reqTax.rate)) * 100) / 100;
    handleAmountChange(String(pre));
  };
  const handleCurrencyChange = (val: string) => {
    setReqCurrency(val);
    if (isPricingSynced) {
      setPoCurrency(val);
    }
  };
  const handleGlCodeChange = (val: string) => {
    setReqGlCode(val);
    if (isPricingSynced) {
      setPoGlCode(val);
      setInvGlCode(val);
      if (invItems.length > 0) {
        setInvItems((prev) => prev.map((item) => ({ ...item, gl_code: val })));
      }
    }
  };
  // --- PO CHANGED HANDLERS ---
  const handlePoQuantityChange = (val: number) => {
    const q = Math.max(1, val || 1);
    setPoQuantity(q);
    const itemsCost = Math.round(q * (poUnitPrice || 0) * 100) / 100;
    const newPoAmt = Math.round((itemsCost + poShippingFee) * 100) / 100;
    setPoAmount(newPoAmt);
    if (isPricingSynced) {
      setInvAmount(newPoAmt);
    }
  };
  const handlePoUnitPriceChange = (val: number) => {
    const p = Math.max(0, val || 0);
    setPoUnitPrice(p);
    const itemsCost = Math.round((poQuantity || 1) * p * 100) / 100;
    const newPoAmt = Math.round((itemsCost + poShippingFee) * 100) / 100;
    setPoAmount(newPoAmt);
    if (isPricingSynced) {
      setInvAmount(newPoAmt);
    }
  };
  const handlePoShippingChange = (val: number) => {
    const sf = Math.max(0, val || 0);
    setPoShippingFee(sf);
    const itemsCost = Math.round((poQuantity || 1) * (poUnitPrice || 0) * 100) / 100;
    const newPoAmt = Math.round((itemsCost + sf) * 100) / 100;
    setPoAmount(newPoAmt);
    if (isPricingSynced) {
      setInvAmount(newPoAmt);
    }
  };
  const handlePoAmountChange = (val: number) => {
    const amt = Math.max(0, val || 0);
    setPoAmount(amt);
    if (isPricingSynced) {
      setInvAmount(amt);
    }
  };
  const handlePoAfterTaxChange = (val: number) => {
    const after = Math.max(0, val || 0);
    const pre = Math.round((after / (1 + poTax.rate)) * 100) / 100;
    setPoAmount(pre);
    if (isPricingSynced) {
      setInvAmount(pre);
    }
  };
  // Force one-click sync action
  const handleForceSyncNow = () => {
    if (itemMode === "SINGLE") {
      const q = Math.max(1, parseInt(quantity, 10) || 1);
      const u = Math.max(0, parseFloat(unitPrice) || 0);
      const a = Math.max(0, parseFloat(amount) || 0);

      setPoQuantity(q);
      setPoUnitPrice(u);
      setPoCurrency(reqCurrency);
      const newPoAmt = Math.round((q * u + poShippingFee) * 100) / 100;
      setPoAmount(newPoAmt > 0 ? newPoAmt : a);
      setPoGlCode(reqGlCode);

      setInvAmount(newPoAmt > 0 ? newPoAmt : a);
      setInvGlCode(reqGlCode);
      if (invItems.length > 0 && reqGlCode) {
        setInvItems((prev) => prev.map((item) => ({ ...item, gl_code: reqGlCode })));
      }
    } else {
      setPoAmount(calculatedGrandTotal);
      setPoCurrency(reqCurrency);
      setPoGlCode(reqGlCode || requestItems[0]?.gl_code || "");
      setInvAmount(calculatedGrandTotal);
      setInvGlCode(reqGlCode || requestItems[0]?.gl_code || "");
      if (requestItems.length > 0) {
        setInvItems(
          requestItems.map((it) => ({
            id: it.id,
            description: it.description,
            sku: it.sku,
            quantity: it.quantity,
            unit_price: it.unit_price,
            amount: it.total,
            gl_code: it.gl_code || reqGlCode,
            asset_flag: invAssetFlag,
          }))
        );
      }
    }
    toast.success("Synchronized all prices, quantities, currency, and GL code from Request Details!");
  };
  // Submit Handler: Saves Request Details, PO (if exists), Invoice (if exists), and Wire Transfer (if AP)
  const handleSave = async () => {
    if (isCompleted) {
      toast.error("Completed requests cannot be modified.");
      return;
    }

    if (!title.trim()) {
      toast.error("Title / Product Name is required");
      setActiveTab("request");
      return;
    }
    if (!requester.trim()) {
      toast.error("Requester is required");
      setActiveTab("request");
      return;
    }

    if (itemMode === "MULTIPLE") {
      if (requestItems.length === 0) {
        toast.error("Please add at least one line item in Multiple Parts mode");
        setActiveTab("request");
        return;
      }
      for (let i = 0; i < requestItems.length; i++) {
        if (!requestItems[i].description?.trim()) {
          toast.error(`Description is required for Part / Item #${i + 1}`);
          setActiveTab("request");
          return;
        }
      }
    }

    if (hasPo) {
      const isPurchasedOrLater =
        request?.status === RequestStatus.Purchased ||
        request?.status === RequestStatus.Shipped ||
        request?.status === RequestStatus.GoodsReceived ||
        request?.status === RequestStatus.InvoiceReceived ||
        request?.status === RequestStatus.Completed;

      if (isPurchasedOrLater && !poQuoteNumber.trim()) {
        toast.error("Quote / PO # is required for Purchased / Ordered requests");
        setActiveTab("po");
        return;
      }
      if (!poVendor.trim()) {
        toast.error("Vendor is required in Purchase Order");
        setActiveTab("po");
        return;
      }
    }

    if (hasInvoice) {
      if (!invVendor.trim()) {
        toast.error("Vendor is required in Invoice");
        setActiveTab("invoice");
        return;
      }
      if (invItems.length > 1) {
        for (let i = 0; i < invItems.length; i++) {
          if (!invItems[i].gl_code || !invItems[i].gl_code.trim()) {
            toast.error(
              `GL Code is required for invoice line item #${i + 1} (${invItems[i].description || "Item"})`
            );
            setActiveTab("invoice");
            return;
          }
        }
      } else if (!invGlCode.trim() && !reqGlCode.trim() && !poGlCode.trim()) {
        toast.error("GL Code is required in Invoice");
        setActiveTab("invoice");
        return;
      }
    }

    const isCustom = schedFrequency === "CUSTOM";
    const customDates = isCustom ? schedDates : [];
    const isSched = Boolean(
      (isRecurring || isScheduled) &&
      (isCustom ? customDates.length > 0 : schedStartDate && schedEndDate)
    );

    let totalCycles: number | null = null;
    let totalAmt: number | null = null;

    if (isSched) {
      if (isCustom) {
        totalCycles = customDates.length;
        totalAmt = customDates.reduce((acc, itm) => acc + (itm.amount || calculatedGrandTotal), 0);
      } else {
        totalCycles = calculateInstallmentsCount(schedStartDate, schedEndDate, schedFrequency);
        totalAmt = totalCycles ? Math.round(calculatedGrandTotal * totalCycles * 100) / 100 : null;
      }
    }

    const effectiveStartDate = isCustom && customDates.length > 0 ? customDates[0].date : schedStartDate;
    const effectiveEndDate = isCustom && customDates.length > 0 ? customDates[customDates.length - 1].date : schedEndDate;

    const payload: any = {
      title: title.trim(),
      requester: requester.trim(),
      request_type: requestType,
      item_mode: itemMode,
      department: department.trim(),
      shipping_address: shippingAddress || null,
      phone_number: phoneNumber || null,
      priority,
      due_date: dueDate || (isSched ? effectiveStartDate : null),
      item_url: itemUrl.trim() || null,
      description: description.trim() || null,
      currency: reqCurrency,
      gl_code: reqGlCode.trim() || null,
      project_name: projectName?.trim() || null,
      recurring_schedule: (isRecurring || isScheduled)
        ? (isSched
            ? {
                is_scheduled: true,
                frequency: schedFrequency,
                start_date: effectiveStartDate,
                end_date: effectiveEndDate,
                total_installments: totalCycles,
                completed_installments: request?.recurring_schedule?.completed_installments || 0,
                amount_per_cycle: calculatedGrandTotal,
                total_amount: totalAmt,
                custom_dates: isCustom ? customDates.map((d) => d.date) : null,
                schedule_dates: isCustom ? customDates : null,
              }
            : {
                is_scheduled: false,
                frequency: schedFrequency || "MONTHLY",
                start_date: dueDate || schedStartDate || new Date().toISOString().split("T")[0],
                end_date: null,
                total_installments: null,
                completed_installments: request?.recurring_schedule?.completed_installments || 0,
                amount_per_cycle: calculatedGrandTotal,
                total_amount: null,
              })
        : undefined,
    };

    if (itemMode === "SINGLE") {
      payload.sku = sku.trim() || null;
      payload.quantity = Math.max(1, parseInt(quantity, 10) || 1);
      payload.unit_price = Math.max(0, parseFloat(unitPrice) || 0);
      payload.amount = Math.max(0, parseFloat(amount) || 0);
      payload.items = [];
    } else {
      payload.amount = calculatedGrandTotal;
      payload.unit_price = calculatedGrandTotal;
      payload.sku = requestItems[0]?.sku?.trim() || null;
      payload.quantity = requestItems.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);
      payload.items = requestItems.map((it, idx) => ({
        id: it.id && !it.id.startsWith("0.") ? it.id : undefined,
        item_order: idx,
        sku: it.sku?.trim() || null,
        description: it.description?.trim() || "",
        quantity: Math.max(1, Number(it.quantity) || 1),
        unit_price: Math.max(0, Number(it.unit_price) || 0),
        discount: Math.max(0, Number(it.discount) || 0),
        tax: Math.max(0, Number(it.tax) || 0),
        total: Math.max(0, Number(it.total) || 0),
        gl_code: it.gl_code?.trim() || reqGlCode.trim() || null,
      }));
    }

    // Attach Purchase Order updates if PO exists
    if (hasPo) {
      payload.purchase_order = {
        quote_number: poQuoteNumber.trim() || null,
        vendor: poVendor.trim(),
        item: poItem.trim() || title.trim(),
        payment_method: poPaymentMethod,
        shipped_to_location: poShippedTo.trim() || "Headquarters",
        expected_delivery_date: poExpectedDeliveryDate || null,
        tracking_number: poTrackingNumber.trim() || null,
        shipping_note: poShippingNote.trim() || null,
        goods_received_note: poGoodsReceivedNote.trim() || null,
        goods_received: poGoodsReceived,
        quantity: poQuantity,
        unit_price: poUnitPrice,
        amount: poAmount,
        currency: poCurrency,
        gl_code: poGlCode.trim() || reqGlCode.trim() || null,
        description: poDescription.trim() || null,
      };
    }

    // Attach Invoice updates if Invoice exists
    if (hasInvoice) {
      payload.invoice = {
        vendor: invVendor.trim(),
        amount: invAmount,
        invoice_date: invDate || new Date().toISOString().split("T")[0],
        due_date: invDueDate || null,
        department: invDepartment.trim() || null,
        from_location: invFromLocation.trim() || null,
        gl_code: invGlCode.trim() || poGlCode.trim() || reqGlCode.trim() || null,
        asset_flag: invAssetFlag,
        description: invDescription.trim() || null,
        items:
          invItems.length > 0
            ? invItems.map((itm) => ({
                request_item_id: itm.request_item_id,
                description: itm.description,
                sku: itm.sku,
                quantity: itm.quantity,
                unit_price: itm.unit_price,
                amount: itm.amount,
                gl_code: (itm.gl_code || invGlCode || "").trim(),
                asset_flag: Boolean(itm.asset_flag || invAssetFlag),
              }))
            : undefined,
      };
    }

    // Attach Wire Transfer if AP
    if (requestType === "ACCOUNTS_PAYABLE" || wireTransfer) {
      payload.wire_transfer = apWireForm;
    }

    try {
      await updateMutation.mutateAsync({
        id: String(request.id),
        data: payload,
      });

      // Also persist wire transfer if it's AP
      if (requestType === "ACCOUNTS_PAYABLE" || wireTransfer) {
        try {
          await updateWireTransfer(request.id, apWireForm);
        } catch {
          // Handled in update_request
        }
      }

      toast.success("Request and associated records updated successfully");
      onOpenChange(false);
      refetch?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || "Failed to update request");
    }
  };
  // Compute number of tabs for grid columns
  const tabCount = 1 + (hasPo ? 1 : 0) + (hasInvoice ? 1 : 0);
  const priceVariance = hasPo && hasInvoice ? Math.abs(invAmount - poAmount) : 0;
  const hasVariance = priceVariance > 0.01;
  const isRecurring = requestType === "RECURRING" || requestType === "SCHEDULED_PAYMENT";
  const isAccountsPayable = requestType === "ACCOUNTS_PAYABLE" || Boolean(wireTransfer);
  return { itemsSubtotal, calculatedGrandTotal, handleItemModeSwitch, handleAddPartItem, handleRemovePartItem, handleUpdatePartItem, handleQuantityChange, handleUnitPriceChange, handleAmountChange, reqTax, poTax, afterTaxAmount, handleAfterTaxChange, handleCurrencyChange, handleGlCodeChange, handlePoQuantityChange, handlePoUnitPriceChange, handlePoShippingChange, handlePoAmountChange, handlePoAfterTaxChange, handleForceSyncNow, handleSave, tabCount, priceVariance, hasVariance, isRecurring, isAccountsPayable };
}
