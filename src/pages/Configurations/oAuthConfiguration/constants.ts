export const AVAILABLE_HUBSPOT_SCOPES = [
  { id: "crm.objects.products.read", label: "Products & Services", description: "Read catalog items & pricing", default: true },
  { id: "crm.schemas.products.read", label: "Product Schemas", description: "Read custom attributes & terms", default: true },
  { id: "crm.objects.contacts.read", label: "Contacts", description: "Read customer contact info", default: true },
  { id: "crm.objects.companies.read", label: "Companies", description: "Read linked company accounts", default: true },
  { id: "crm.objects.deals.read", label: "Deals & Orders", description: "Read deals and pipeline stages", default: true },
  { id: "oauth", label: "OAuth Identity", description: "Verify HubSpot portal ID", default: true },
];
