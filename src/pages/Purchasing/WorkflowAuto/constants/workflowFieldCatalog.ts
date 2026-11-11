export type CatalogFieldType = 'text' | 'dropdown' | 'number' | 'checkbox' | 'date' | 'textarea' | 'file';

export interface CatalogWorkflowField {
  label: string;
  type: CatalogFieldType;
  placeholder?: string;
  options?: string[];
  required?: boolean;
  category: string;
  sourceCategory?: string;
  exampleStage?: string | null;
}

export const WORKFLOW_FIELD_CATALOG: CatalogWorkflowField[] = [
  {
    "label": "Request Type",
    "type": "dropdown",
    "placeholder": "",
    "options": [
      "Spend Request",
      "Quote Request"
    ],
    "required": true,
    "sourceCategory": "Purchasing",
    "exampleStage": null,
    "category": "General & Requester Info"
  },
  {
    "label": "Item Configuration",
    "type": "dropdown",
    "placeholder": "",
    "options": [
      "Single Item (Direct entry)",
      "Multiple Parts (Quote PDF Upload)"
    ],
    "required": false,
    "sourceCategory": "Purchasing",
    "exampleStage": null,
    "category": "PO, Vendor & Items"
  },
  {
    "label": "Upload Quote / Quotation PDF (Multiple Parts only, auto-extracts line items)",
    "type": "file",
    "placeholder": "Drop quote PDF",
    "options": [],
    "required": false,
    "sourceCategory": "Purchasing",
    "exampleStage": null,
    "category": "PO, Vendor & Items"
  },
  {
    "label": "Product / Website Link (Auto-fills Title, Price & Details)",
    "type": "text",
    "placeholder": "https://www.amazon.ca/... (paste product link to auto-populate title & pricing)",
    "options": [],
    "required": false,
    "sourceCategory": "Purchasing",
    "exampleStage": null,
    "category": "PO, Vendor & Items"
  },
  {
    "label": "Request Title",
    "type": "text",
    "placeholder": "e.g. Dell laptop for new hire or Quote Q-10294",
    "options": [],
    "required": true,
    "sourceCategory": "Purchasing",
    "exampleStage": null,
    "category": "General & Requester Info"
  },
  {
    "label": "Requester",
    "type": "text",
    "placeholder": "Logged in user",
    "options": [],
    "required": true,
    "sourceCategory": "Purchasing",
    "exampleStage": null,
    "category": "General & Requester Info"
  },
  {
    "label": "Department",
    "type": "text",
    "placeholder": "e.g. Technology",
    "options": [],
    "required": true,
    "sourceCategory": "Purchasing",
    "exampleStage": null,
    "category": "PO, Vendor & Items"
  },
  {
    "label": "Priority",
    "type": "dropdown",
    "placeholder": "",
    "options": [
      "Low",
      "Medium",
      "High",
      "Urgent"
    ],
    "required": true,
    "sourceCategory": "Purchasing",
    "exampleStage": null,
    "category": "Approvals, Notes & Priority"
  },
  {
    "label": "Group Project / Project",
    "type": "text",
    "placeholder": "Select existing project or type project name (e.g. Drone Project)...",
    "options": [],
    "required": false,
    "sourceCategory": "Purchasing",
    "exampleStage": null,
    "category": "General & Requester Info"
  },
  {
    "label": "Street Address & Unit / Suite",
    "type": "text",
    "placeholder": "e.g. 100 Main Street, Suite 400",
    "options": [],
    "required": false,
    "sourceCategory": "Purchasing",
    "exampleStage": null,
    "category": "Shipping & Logistics"
  },
  {
    "label": "Postal / ZIP Code",
    "type": "text",
    "placeholder": "e.g. 90210 or M5V 2T6",
    "options": [],
    "required": false,
    "sourceCategory": "Purchasing",
    "exampleStage": null,
    "category": "Shipping & Logistics"
  },
  {
    "label": "Contact Phone",
    "type": "text",
    "placeholder": "e.g. +1 (555) 019-2834",
    "options": [],
    "required": false,
    "sourceCategory": "Purchasing",
    "exampleStage": null,
    "category": "Other Details"
  },
  {
    "label": "Country",
    "type": "text",
    "placeholder": "United States (US)",
    "options": [],
    "required": false,
    "sourceCategory": "Purchasing",
    "exampleStage": null,
    "category": "Shipping & Logistics"
  },
  {
    "label": "State / Province",
    "type": "text",
    "placeholder": "-- Select State/Province --",
    "options": [],
    "required": false,
    "sourceCategory": "Purchasing",
    "exampleStage": null,
    "category": "Shipping & Logistics"
  },
  {
    "label": "City",
    "type": "text",
    "placeholder": "Enter city name...",
    "options": [],
    "required": false,
    "sourceCategory": "Purchasing",
    "exampleStage": null,
    "category": "Shipping & Logistics"
  },
  {
    "label": "Quantity",
    "type": "number",
    "placeholder": "1",
    "options": [],
    "required": false,
    "sourceCategory": "Purchasing",
    "exampleStage": null,
    "category": "PO, Vendor & Items"
  },
  {
    "label": "Unit Price",
    "type": "number",
    "placeholder": "0.00",
    "options": [],
    "required": false,
    "sourceCategory": "Purchasing",
    "exampleStage": null,
    "category": "PO, Vendor & Items"
  },
  {
    "label": "Currency",
    "type": "dropdown",
    "placeholder": "",
    "options": [
      "USD",
      "CAD",
      "EUR",
      "GBP"
    ],
    "required": false,
    "sourceCategory": "Purchasing",
    "exampleStage": null,
    "category": "PO, Vendor & Items"
  },
  {
    "label": "Description / Justification",
    "type": "text",
    "placeholder": "What is being requested and why?",
    "options": [],
    "required": false,
    "sourceCategory": "Purchasing",
    "exampleStage": null,
    "category": "Other Details"
  },
  {
    "label": "Reviewer / Approver",
    "type": "text",
    "placeholder": "Logged in user (auto-filled)",
    "options": [],
    "required": false,
    "sourceCategory": "Purchasing",
    "exampleStage": null,
    "category": "Approvals, Notes & Priority"
  },
  {
    "label": "Rejection Reason / Comments",
    "type": "textarea",
    "placeholder": "Please provide a reason for rejecting this request...",
    "options": [],
    "required": false,
    "sourceCategory": "Purchasing",
    "exampleStage": null,
    "category": "Approvals, Notes & Priority"
  },
  {
    "label": "Hold Reason",
    "type": "textarea",
    "placeholder": "Why is this being put on hold?",
    "options": [],
    "required": true,
    "sourceCategory": "Purchasing",
    "exampleStage": null,
    "category": "Approvals, Notes & Priority"
  },
  {
    "label": "Vendor",
    "type": "text",
    "placeholder": "Search or enter vendor name...",
    "options": [],
    "required": true,
    "sourceCategory": "Purchasing",
    "exampleStage": null,
    "category": "PO, Vendor & Items"
  },
  {
    "label": "Item",
    "type": "text",
    "placeholder": "Product or Item name",
    "options": [],
    "required": true,
    "sourceCategory": "Purchasing",
    "exampleStage": null,
    "category": "PO, Vendor & Items"
  },
  {
    "label": "Shipping",
    "type": "number",
    "placeholder": "0.00",
    "options": [],
    "required": false,
    "sourceCategory": "Purchasing",
    "exampleStage": null,
    "category": "Shipping & Logistics"
  },
  {
    "label": "Tariffs / Customs Duty",
    "type": "number",
    "placeholder": "0.00",
    "options": [],
    "required": false,
    "sourceCategory": "Purchasing",
    "exampleStage": null,
    "category": "Shipping & Logistics"
  },
  {
    "label": "Total Pre-Tax",
    "type": "number",
    "placeholder": "0.00",
    "options": [],
    "required": false,
    "sourceCategory": "Purchasing",
    "exampleStage": null,
    "category": "PO, Vendor & Items"
  },
  {
    "label": "Total After-Tax",
    "type": "number",
    "placeholder": "0.00",
    "options": [],
    "required": false,
    "sourceCategory": "Purchasing",
    "exampleStage": null,
    "category": "PO, Vendor & Items"
  },
  {
    "label": "Item Currency",
    "type": "dropdown",
    "placeholder": "",
    "options": [
      "USD",
      "CAD",
      "EUR",
      "GBP"
    ],
    "required": false,
    "sourceCategory": "Purchasing",
    "exampleStage": null,
    "category": "PO, Vendor & Items"
  },
  {
    "label": "Shipped to Location",
    "type": "text",
    "placeholder": "Shipped to Location",
    "options": [],
    "required": true,
    "sourceCategory": "Purchasing",
    "exampleStage": null,
    "category": "Shipping & Logistics"
  },
  {
    "label": "Description",
    "type": "textarea",
    "placeholder": "Additional details about this purchase...",
    "options": [],
    "required": false,
    "sourceCategory": "Purchasing",
    "exampleStage": null,
    "category": "Other Details"
  },
  {
    "label": "Approver",
    "type": "text",
    "placeholder": "Logged in user (auto-filled)",
    "options": [],
    "required": false,
    "sourceCategory": "Purchasing",
    "exampleStage": null,
    "category": "Approvals, Notes & Priority"
  },
  {
    "label": "Pass to Level 2 Approver (Company Approver) - $10,000+ incl. tax",
    "type": "checkbox",
    "placeholder": "",
    "options": [],
    "required": false,
    "sourceCategory": "Purchasing",
    "exampleStage": null,
    "category": "Approvals, Notes & Priority"
  },
  {
    "label": "Comment",
    "type": "textarea",
    "placeholder": "Add an optional comment...",
    "options": [],
    "required": false,
    "sourceCategory": "Purchasing",
    "exampleStage": null,
    "category": "Approvals, Notes & Priority"
  },
  {
    "label": "PO #",
    "type": "text",
    "placeholder": "e.g. PO-2026-00452 or QT-88910",
    "options": [],
    "required": true,
    "sourceCategory": "Purchasing",
    "exampleStage": null,
    "category": "PO, Vendor & Items"
  },
  {
    "label": "Bill Date",
    "type": "date",
    "placeholder": "yyyy-mm-dd",
    "options": [],
    "required": true,
    "sourceCategory": "Purchasing",
    "exampleStage": null,
    "category": "Invoices & A/P"
  },
  {
    "label": "Date Arrived",
    "type": "date",
    "placeholder": "yyyy-mm-dd",
    "options": [],
    "required": false,
    "sourceCategory": "Purchasing",
    "exampleStage": null,
    "category": "Other Details"
  },
  {
    "label": "Class",
    "type": "text",
    "placeholder": "Select class *",
    "options": [],
    "required": true,
    "sourceCategory": "Purchasing",
    "exampleStage": null,
    "category": "Other Details"
  },
  {
    "label": "From Location",
    "type": "text",
    "placeholder": "Select or enter location *",
    "options": [],
    "required": true,
    "sourceCategory": "Purchasing",
    "exampleStage": null,
    "category": "Other Details"
  },
  {
    "label": "Bank Account",
    "type": "text",
    "placeholder": "Select Bank Account *",
    "options": [],
    "required": true,
    "sourceCategory": "Purchasing",
    "exampleStage": null,
    "category": "Banking & Wire Transfer"
  },
  {
    "label": "Category",
    "type": "text",
    "placeholder": "Select Category *",
    "options": [],
    "required": true,
    "sourceCategory": "Purchasing",
    "exampleStage": null,
    "category": "PO, Vendor & Items"
  },
  {
    "label": "Asset Flag",
    "type": "checkbox",
    "placeholder": "Mark as Asset",
    "options": [],
    "required": false,
    "sourceCategory": "Purchasing",
    "exampleStage": null,
    "category": "Other Details"
  },
  {
    "label": "Receipts & Invoices Attachments",
    "type": "file",
    "placeholder": "Drag & drop receipt/invoice files here, or click to browse",
    "options": [],
    "required": false,
    "sourceCategory": "Purchasing",
    "exampleStage": null,
    "category": "Invoices & A/P"
  },
  {
    "label": "Tracking Number",
    "type": "text",
    "placeholder": "Tracking Number",
    "options": [],
    "required": true,
    "sourceCategory": "Purchasing",
    "exampleStage": null,
    "category": "Shipping & Logistics"
  },
  {
    "label": "Note",
    "type": "textarea",
    "placeholder": "Add a note...",
    "options": [],
    "required": false,
    "sourceCategory": "Purchasing",
    "exampleStage": null,
    "category": "Approvals, Notes & Priority"
  },
  {
    "label": "Description / Notes",
    "type": "textarea",
    "placeholder": "Add optional notes (e.g. packages received, item condition, storage location)...",
    "options": [],
    "required": false,
    "sourceCategory": "Purchasing",
    "exampleStage": null,
    "category": "Approvals, Notes & Priority"
  },
  {
    "label": "Title",
    "type": "text",
    "placeholder": "Leave blank to use \"Payment for <vendor>\"",
    "options": [],
    "required": false,
    "sourceCategory": "Accounts Payable",
    "exampleStage": null,
    "category": "General & Requester Info"
  },
  {
    "label": "Entered By",
    "type": "text",
    "placeholder": "Search AP user (e.g. David Hernandez)...",
    "options": [],
    "required": true,
    "sourceCategory": "Accounts Payable",
    "exampleStage": null,
    "category": "Other Details"
  },
  {
    "label": "Entry Date",
    "type": "date",
    "placeholder": "yyyy-mm-dd",
    "options": [],
    "required": true,
    "sourceCategory": "Accounts Payable",
    "exampleStage": null,
    "category": "Other Details"
  },
  {
    "label": "Payment Type",
    "type": "dropdown",
    "placeholder": "",
    "options": [
      "Others",
      "Rent",
      "Note"
    ],
    "required": true,
    "sourceCategory": "Accounts Payable",
    "exampleStage": null,
    "category": "Invoices & A/P"
  },
  {
    "label": "Vendor / Beneficiary Name",
    "type": "text",
    "placeholder": "Search or enter vendor name (e.g. Acme Corp)",
    "options": [],
    "required": true,
    "sourceCategory": "Accounts Payable",
    "exampleStage": null,
    "category": "Banking & Wire Transfer"
  },
  {
    "label": "Pay From (Entity / Subsidiary)",
    "type": "text",
    "placeholder": "Select or enter paying entity (e.g. Weddle, Zenatech)",
    "options": [],
    "required": true,
    "sourceCategory": "Accounts Payable",
    "exampleStage": null,
    "category": "Other Details"
  },
  {
    "label": "Payment Amount",
    "type": "number",
    "placeholder": "0.00",
    "options": [],
    "required": true,
    "sourceCategory": "Accounts Payable",
    "exampleStage": null,
    "category": "Invoices & A/P"
  },
  {
    "label": "Conversion (USD / Rate)",
    "type": "text",
    "placeholder": "Conversion (USD / Rate)",
    "options": [],
    "required": false,
    "sourceCategory": "Accounts Payable",
    "exampleStage": null,
    "category": "Other Details"
  },
  {
    "label": "Invoice (no special characters)",
    "type": "text",
    "placeholder": "e.g. INV-1094",
    "options": [],
    "required": false,
    "sourceCategory": "Accounts Payable",
    "exampleStage": null,
    "category": "Invoices & A/P"
  },
  {
    "label": "Due Date",
    "type": "date",
    "placeholder": "yyyy-mm-dd",
    "options": [],
    "required": false,
    "sourceCategory": "Accounts Payable",
    "exampleStage": null,
    "category": "Invoices & A/P"
  },
  {
    "label": "Scheduled Payment Date",
    "type": "date",
    "placeholder": "yyyy-mm-dd",
    "options": [],
    "required": false,
    "sourceCategory": "Accounts Payable",
    "exampleStage": null,
    "category": "Invoices & A/P"
  },
  {
    "label": "Pay Date / Terms",
    "type": "text",
    "placeholder": "e.g. Same Day, Net 30",
    "options": [],
    "required": false,
    "sourceCategory": "Accounts Payable",
    "exampleStage": null,
    "category": "Other Details"
  },
  {
    "label": "Payment Memo / Comments",
    "type": "textarea",
    "placeholder": "e.g. August Software License, Office lease payment...",
    "options": [],
    "required": false,
    "sourceCategory": "Accounts Payable",
    "exampleStage": null,
    "category": "Invoices & A/P"
  },
  {
    "label": "Vendor Email",
    "type": "text",
    "placeholder": "billing@vendor.com",
    "options": [],
    "required": false,
    "sourceCategory": "Accounts Payable",
    "exampleStage": null,
    "category": "PO, Vendor & Items"
  },
  {
    "label": "Contact Person (China / Overseas)",
    "type": "text",
    "placeholder": "Contact Name",
    "options": [],
    "required": false,
    "sourceCategory": "Accounts Payable",
    "exampleStage": null,
    "category": "Other Details"
  },
  {
    "label": "Region / State",
    "type": "text",
    "placeholder": "e.g. California, Ontario, Guangdong",
    "options": [],
    "required": false,
    "sourceCategory": "Accounts Payable",
    "exampleStage": null,
    "category": "Shipping & Logistics"
  },
  {
    "label": "Vendor Street Address",
    "type": "text",
    "placeholder": "Street address, suite, city, state, postal code, country",
    "options": [],
    "required": false,
    "sourceCategory": "Accounts Payable",
    "exampleStage": null,
    "category": "Shipping & Logistics"
  },
  {
    "label": "Bank Country",
    "type": "text",
    "placeholder": "Beneficiary bank jurisdiction",
    "options": [],
    "required": false,
    "sourceCategory": "Accounts Payable",
    "exampleStage": null,
    "category": "Banking & Wire Transfer"
  },
  {
    "label": "Bank Name",
    "type": "text",
    "placeholder": "e.g. CIBC, JPMorgan Chase, HSBC",
    "options": [],
    "required": false,
    "sourceCategory": "Accounts Payable",
    "exampleStage": null,
    "category": "Banking & Wire Transfer"
  },
  {
    "label": "Bank Account #",
    "type": "text",
    "placeholder": "Beneficiary account number",
    "options": [],
    "required": false,
    "sourceCategory": "Accounts Payable",
    "exampleStage": null,
    "category": "Banking & Wire Transfer"
  },
  {
    "label": "Tax ID / EIN",
    "type": "text",
    "placeholder": "Tax ID or national business number",
    "options": [],
    "required": false,
    "sourceCategory": "Accounts Payable",
    "exampleStage": null,
    "category": "Other Details"
  },
  {
    "label": "Bank Address",
    "type": "text",
    "placeholder": "Bank branch street address, city, country",
    "options": [],
    "required": false,
    "sourceCategory": "Accounts Payable",
    "exampleStage": null,
    "category": "Banking & Wire Transfer"
  },
  {
    "label": "Region / Province / State",
    "type": "text",
    "placeholder": "e.g. California, Ontario, Bavaria",
    "options": [],
    "required": false,
    "sourceCategory": "Accounts Payable",
    "exampleStage": null,
    "category": "Shipping & Logistics"
  },
  {
    "label": "Routing (Wire)",
    "type": "text",
    "placeholder": "9-digit Wire Routing Number",
    "options": [],
    "required": false,
    "sourceCategory": "Accounts Payable",
    "exampleStage": null,
    "category": "Banking & Wire Transfer"
  },
  {
    "label": "Routing (ACH)",
    "type": "text",
    "placeholder": "9-digit ACH Routing Number",
    "options": [],
    "required": false,
    "sourceCategory": "Accounts Payable",
    "exampleStage": null,
    "category": "Banking & Wire Transfer"
  },
  {
    "label": "SWIFT/BIC Code",
    "type": "text",
    "placeholder": "8 or 11 character SWIFT/BIC",
    "options": [],
    "required": false,
    "sourceCategory": "Accounts Payable",
    "exampleStage": null,
    "category": "Banking & Wire Transfer"
  },
  {
    "label": "IBAN",
    "type": "text",
    "placeholder": "International Bank Account Number",
    "options": [],
    "required": false,
    "sourceCategory": "Accounts Payable",
    "exampleStage": null,
    "category": "Banking & Wire Transfer"
  },
  {
    "label": "Attach Wire Invoice / Payment Receipt",
    "type": "file",
    "placeholder": "PDF, image, Word or Excel file",
    "options": [],
    "required": false,
    "sourceCategory": "Accounts Payable",
    "exampleStage": null,
    "category": "Banking & Wire Transfer"
  }
];
