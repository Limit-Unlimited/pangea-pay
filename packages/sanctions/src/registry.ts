import { parseOfac } from "./parsers/ofac";
import { parseUn } from "./parsers/un";
import { parseEu } from "./parsers/eu";
import { parseUk } from "./parsers/uk";
import { parseCanadaSema, parseCanadaTerrorist } from "./parsers/canada";
import type { ListDefinition } from "./types";

/**
 * The official lists Pangea screens against. Every URL is the publisher's
 * own free download; no third-party aggregator sits in between.
 *
 * Adding a list: add a parser under ./parsers, add an entry here. The row in
 * `sanction_lists` is created automatically on the next update run.
 */
export const LISTS: ListDefinition[] = [
  {
    code:         "us_ofac_sdn",
    name:         "OFAC Specially Designated Nationals (SDN) List",
    publisher:    "US Department of the Treasury, Office of Foreign Assets Control",
    jurisdiction: "US",
    sourceUrl:    "https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/SDN.XML",
    infoUrl:      "https://sanctionslist.ofac.treas.gov/Home/SdnList",
    parse:        parseOfac,
  },
  {
    code:         "us_ofac_consolidated",
    name:         "OFAC Consolidated (non-SDN) Sanctions List",
    publisher:    "US Department of the Treasury, Office of Foreign Assets Control",
    jurisdiction: "US",
    sourceUrl:    "https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/CONSOLIDATED.XML",
    infoUrl:      "https://sanctionslist.ofac.treas.gov/Home/ConsolidatedList",
    parse:        parseOfac,
  },
  {
    code:         "un_sc_consolidated",
    name:         "UN Security Council Consolidated List",
    publisher:    "United Nations Security Council",
    jurisdiction: "UN",
    sourceUrl:    "https://scsanctions.un.org/resources/xml/en/consolidated.xml",
    infoUrl:      "https://main.un.org/securitycouncil/en/content/un-sc-consolidated-list",
    parse:        parseUn,
  },
  {
    code:         "eu_fsf",
    name:         "EU Financial Sanctions Files (FSF)",
    publisher:    "European Commission",
    jurisdiction: "EU",
    // The token is the Commission's published public-access token, not a credential.
    sourceUrl:    "https://webgate.ec.europa.eu/fsd/fsf/public/files/xmlFullSanctionsList_1_1/content?token=dG9rZW4tMjAxNw",
    infoUrl:      "https://data.europa.eu/data/datasets/consolidated-list-of-persons-groups-and-entities-subject-to-eu-financial-sanctions",
    parse:        parseEu,
  },
  {
    code:         "uk_sanctions_list",
    name:         "UK Sanctions List",
    publisher:    "UK Foreign, Commonwealth & Development Office",
    jurisdiction: "UK",
    sourceUrl:    "https://sanctionslist.fcdo.gov.uk/docs/UK-Sanctions-List.xml",
    infoUrl:      "https://www.gov.uk/government/publications/the-uk-sanctions-list",
    parse:        parseUk,
  },
  {
    code:         "ca_sema",
    name:         "Consolidated Canadian Autonomous Sanctions List",
    publisher:    "Global Affairs Canada",
    jurisdiction: "CA",
    sourceUrl:    "https://www.international.gc.ca/world-monde/assets/office_docs/international_relations-relations_internationales/sanctions/sema-lmes.xml",
    infoUrl:      "https://www.international.gc.ca/world-monde/international_relations-relations_internationales/sanctions/consolidated-consolide.aspx?lang=eng",
    parse:        parseCanadaSema,
  },
  {
    code:         "ca_listed_terrorist_entities",
    name:         "Listed Terrorist Entities (Criminal Code)",
    publisher:    "Public Safety Canada",
    jurisdiction: "CA",
    sourceUrl:    "https://www.publicsafety.gc.ca/cnt/_xml/lstd-ntts-eng.xml",
    infoUrl:      "https://www.publicsafety.gc.ca/cnt/ntnl-scrt/cntr-trrrsm/lstd-ntts/crrnt-lstd-ntts-en.aspx",
    parse:        parseCanadaTerrorist,
  },
];

export function getListDefinition(code: string): ListDefinition | undefined {
  return LISTS.find((l) => l.code === code);
}
