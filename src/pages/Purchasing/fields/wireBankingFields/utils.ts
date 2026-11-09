export function getLocalCountryDefaults(countryStr?: string) {
  const c = (countryStr || "").trim().toLowerCase();
  if (c.includes("united states") || c === "us" || c === "usa") {
    return {
      required: ["bank_name", "bank_country", "bank_account_number", "routing_wire"],
      bankFields: ["bank_country", "bank_name", "bank_account_number"],
      clearingFields: ["routing_wire", "routing_ach", "swift_code"],
    };
  }
  if (c.includes("canada") || c === "ca") {
    return {
      required: ["bank_name", "bank_country", "bank_account_number", "transit_code_ca", "institution_code"],
      bankFields: ["bank_country", "bank_name", "bank_account_number"],
      clearingFields: ["transit_code_ca", "transit_number_ca", "institution_code", "swift_code"],
    };
  }
  if (c.includes("united kingdom") || c === "gb" || c === "uk") {
    return {
      required: ["bank_name", "bank_country", "iban", "sort_code", "swift_code"],
      bankFields: ["bank_country", "bank_name", "bank_account_number"],
      clearingFields: ["iban", "sort_code", "swift_code"],
    };
  }
  if (c.includes("australia") || c === "au") {
    return {
      required: ["bank_name", "bank_country", "bank_account_number", "bsb_australia"],
      bankFields: ["bank_country", "bank_name", "bank_account_number"],
      clearingFields: ["bsb_australia", "swift_code"],
    };
  }
  if (c.includes("china") || c === "cn") {
    return {
      required: ["bank_name", "bank_country", "bank_account_number", "swift_code", "contact_name_china"],
      bankFields: ["bank_country", "bank_name", "bank_account_number"],
      clearingFields: ["swift_code", "contact_name_china", "bank_code"],
    };
  }
  const ibanCountries = [
    "germany", "de", "france", "fr", "ireland", "ie", "spain", "es", "italy", "it",
    "netherlands", "nl", "poland", "pl", "belgium", "be", "switzerland", "ch", "austria", "at",
    "portugal", "pt", "sweden", "se", "norway", "no", "denmark", "dk", "finland", "fi",
    "lithuania", "lt", "latvia", "lv", "estonia", "ee", "czech", "cz", "hungary", "hu",
    "greece", "gr", "luxembourg", "lu"
  ];
  if (ibanCountries.some(name => c === name || c.includes(name))) {
    return {
      required: ["bank_name", "bank_country", "iban", "swift_code"],
      bankFields: ["bank_country", "bank_name"],
      clearingFields: ["iban", "swift_code"],
    };
  }
  return {
    required: ["bank_name", "bank_country", "bank_account_number", "swift_code"],
    bankFields: ["bank_country", "bank_name", "bank_account_number"],
    clearingFields: ["swift_code", "clearing_code"],
  };
}
