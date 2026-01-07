import { t } from "../../i18n.js";
import { CARGO_COMPANIES } from "../../data/cargoCompanies.js";
import { IntentHandler } from "./types.js";

function formatCargoCompanyList() {
  const header = "Id | Code | Name | Tax Number";
  const separator = "--- | --- | --- | ---";
  const rows = CARGO_COMPANIES.map((item) => `${item.id} | ${item.code} | ${item.name} | ${item.taxNumber}`);
  return [header, separator, ...rows].join("\n");
}

export const cargoHandler: IntentHandler = async (parsed, context) => {
  const { locale } = context;

  return {
    reply: t(locale, "cargo_company_list", { list: formatCargoCompanyList() }),
    data: { items: CARGO_COMPANIES },
    success: true,
  };
};
