import { describe, it, expect } from "vitest";
import { parseOfac } from "./ofac";
import { parseUn } from "./un";
import { parseEu } from "./eu";
import { parseUk, ukDate } from "./uk";
import { parseCanadaSema, parseCanadaTerrorist, splitAliases } from "./canada";

// Fixtures are trimmed copies of real records, in each publisher's own format.

const OFAC = `<?xml version="1.0" standalone="yes"?>
<sdnList xmlns="https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/XML">
  <publshInformation><Publish_Date>10/15/2026</Publish_Date><Record_Count>2</Record_Count></publshInformation>
  <sdnEntry>
    <uid>9640</uid><firstName>Mohammed</firstName><lastName>ABU TEIR</lastName><sdnType>Individual</sdnType>
    <programList><program>NS-PLC</program></programList>
    <akaList>
      <aka><uid>9152</uid><type>a.k.a.</type><category>strong</category><lastName>ABU TAIR</lastName><firstName>Mohammed Mahmud</firstName></aka>
      <aka><uid>9153</uid><type>a.k.a.</type><category>strong</category><lastName>ABOU TAYR</lastName><firstName>Mohammad Mahmoud</firstName></aka>
    </akaList>
    <dateOfBirthList><dateOfBirthItem><uid>4698</uid><dateOfBirth>1951</dateOfBirth><mainEntry>true</mainEntry></dateOfBirthItem></dateOfBirthList>
    <placeOfBirthList><placeOfBirthItem><uid>4699</uid><placeOfBirth>Umm Tuba</placeOfBirth><mainEntry>true</mainEntry></placeOfBirthItem></placeOfBirthList>
  </sdnEntry>
  <sdnEntry>
    <uid>36</uid><lastName>AEROCARIBBEAN AIRLINES</lastName><sdnType>Entity</sdnType>
    <programList><program>CUBA</program></programList>
    <addressList><address><uid>25</uid><city>Havana</city><country>Cuba</country></address></addressList>
    <idList><id><uid>1</uid><idType>SWIFT/BIC</idType><idNumber>0012ABCD</idNumber></id></idList>
  </sdnEntry>
</sdnList>`;

const UN = `<?xml version="1.0" encoding="UTF-8"?>
<CONSOLIDATED_LIST dateGenerated="2026-10-20T23:00:05.952Z">
  <INDIVIDUALS>
    <INDIVIDUAL>
      <DATAID>6907995</DATAID><VERSIONNUM>3</VERSIONNUM>
      <FIRST_NAME>GASTON</FIRST_NAME><SECOND_NAME>IYAMUREMYE</SECOND_NAME>
      <UN_LIST_TYPE>DRC</UN_LIST_TYPE><REFERENCE_NUMBER>CDi.003</REFERENCE_NUMBER><LISTED_ON>2010-12-01</LISTED_ON>
      <NATIONALITY><VALUE>Rwanda</VALUE></NATIONALITY>
      <INDIVIDUAL_ALIAS><QUALITY>Good</QUALITY><ALIAS_NAME>Victor Rumuri</ALIAS_NAME></INDIVIDUAL_ALIAS>
      <INDIVIDUAL_ALIAS><QUALITY/><ALIAS_NAME/></INDIVIDUAL_ALIAS>
      <INDIVIDUAL_DATE_OF_BIRTH><TYPE_OF_DATE>EXACT</TYPE_OF_DATE><YEAR>1948</YEAR></INDIVIDUAL_DATE_OF_BIRTH>
      <INDIVIDUAL_DATE_OF_BIRTH><TYPE_OF_DATE>BETWEEN</TYPE_OF_DATE><FROM_YEAR>1950</FROM_YEAR><TO_YEAR>1952</TO_YEAR></INDIVIDUAL_DATE_OF_BIRTH>
      <INDIVIDUAL_DOCUMENT><TYPE_OF_DOCUMENT>Passport</TYPE_OF_DOCUMENT><NUMBER>A123</NUMBER><ISSUING_COUNTRY>Rwanda</ISSUING_COUNTRY></INDIVIDUAL_DOCUMENT>
    </INDIVIDUAL>
  </INDIVIDUALS>
  <ENTITIES>
    <ENTITY>
      <DATAID>110404</DATAID><FIRST_NAME>AL-QAIDA</FIRST_NAME><UN_LIST_TYPE>Al-Qaida</UN_LIST_TYPE>
      <REFERENCE_NUMBER>QDe.004</REFERENCE_NUMBER><LISTED_ON>2001-10-06</LISTED_ON>
      <ENTITY_ALIAS><QUALITY>a.k.a.</QUALITY><ALIAS_NAME>The Base</ALIAS_NAME></ENTITY_ALIAS>
    </ENTITY>
  </ENTITIES>
</CONSOLIDATED_LIST>`;

const EU = `<?xml version="1.0" encoding="UTF-8"?>
<export xmlns="http://eu.europa.ec/fpi/fsd/export" generationDate="2026-10-15T12:10:34.160+02:00">
  <sanctionEntity designationDetails="" unitedNationId="" euReferenceNumber="EU.27.28" logicalId="13" designationDate="2003-07-07">
    <remark>UNSC RESOLUTION 1483</remark>
    <regulation programme="IRQ" numberTitle="1210/2003"/>
    <subjectType code="person" classificationCode="P"/>
    <nameAlias firstName="Saddam" lastName="Hussein Al-Tikriti" wholeName="Saddam Hussein Al-Tikriti" gender="M" title="" function="" strong="true"/>
    <nameAlias firstName="" lastName="" wholeName="Abu Ali" function="" title="" strong="true"/>
    <birthdate birthdate="1937-04-28" city="al-Awja, near Tikrit" countryDescription="IRAQ" place="" region=""/>
    <citizenship countryDescription="IRAQ"/>
    <citizenship countryDescription="UNKNOWN"/>
  </sanctionEntity>
</export>`;

const UK = `<?xml version="1.0" encoding="utf-8"?>
<Designations>
  <DateGenerated>16/10/2026</DateGenerated>
  <Designation>
    <LastUpdated>04/08/2026</LastUpdated><DateDesignated>29/06/2012</DateDesignated>
    <UniqueID>BEL0174</UniqueID><RegimeName>The Republic of Belarus (Sanctions) (EU Exit) Regulations 2019</RegimeName>
    <IndividualEntityShip>Individual</IndividualEntityShip>
    <Names>
      <Name><NameType>Primary Name</NameType></Name>
      <Name><Name1>Pavel</Name1><Name2>Ivanovich</Name2><Name6>KAZAKOV</Name6><NameType>Primary Name</NameType></Name>
      <Name><Name1>Pavel</Name1><Name2>Ivanavich</Name2><Name6>KAZAKOU </Name6><NameType>Primary Name Variation</NameType></Name>
    </Names>
    <NonLatinNames><NonLatinName><NameNonLatinScript>Павел Іванавіч Казакоў</NameNonLatinScript></NonLatinName></NonLatinNames>
    <IndividualDetails><Individual>
      <DOBs><DOB>dd/mm/1945</DOB><DOB>12/05/1946</DOB></DOBs>
      <Nationalities><Nationality>Belarus</Nationality></Nationalities>
      <PassportDetails><Passport><PassportNumber>MP123</PassportNumber></Passport></PassportDetails>
    </Individual></IndividualDetails>
  </Designation>
  <Designation>
    <UniqueID>RUS1234</UniqueID><RegimeName>Russia</RegimeName><DateDesignated>01/01/2024</DateDesignated>
    <IndividualEntityShip>Ship</IndividualEntityShip>
    <Names><Name><Name6>SEA STAR</Name6><NameType>Primary Name</NameType></Name></Names>
    <ShipDetails><Ship><IMONumbers><IMONumber>9123456</IMONumber></IMONumbers></Ship></ShipDetails>
  </Designation>
</Designations>`;

const CA_SEMA = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<data-set>
  <record>
    <Country-Pays>Belarus / Bélarus</Country-Pays><LastName-NomDeFamille>Balaba</LastName-NomDeFamille>
    <GivenName-Prenom>Dmitry Vladimirovich</GivenName-Prenom>
    <DateOfBirthOrShipBuildDate-DateDeNaissanceOuDateDeConstructionDuNavire>1972</DateOfBirthOrShipBuildDate-DateDeNaissanceOuDateDeConstructionDuNavire>
    <Schedule-Annexe>1, Part 1</Schedule-Annexe><Item-NumeroDarticle>2</Item-NumeroDarticle>
    <DateOfListing-DateDinscription>2020-09-28</DateOfListing-DateDinscription>
  </record>
  <record>
    <Country-Pays>Russia / Russie</Country-Pays><EntityOrShip-EntiteOuNavire>OCEAN TANKER</EntityOrShip-EntiteOuNavire>
    <ShipIMONumber-NumeroOMIDuNavire>9876543</ShipIMONumber-NumeroOMIDuNavire>
    <DateOfBirthOrShipBuildDate-DateDeNaissanceOuDateDeConstructionDuNavire>2004</DateOfBirthOrShipBuildDate-DateDeNaissanceOuDateDeConstructionDuNavire>
    <Schedule-Annexe>3</Schedule-Annexe><Item-NumeroDarticle>12</Item-NumeroDarticle>
  </record>
</data-set>`;

const CA_TERR = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Currently listed entities</title>
  <updated>2025-12-10</updated>
  <entry>
    <title>Abu Nidal Organization (ANO)</title><id>2</id>
    <summary>Fatah Revolutionary Council, Black June and Arab Revolutionary Brigades</summary>
    <content>Description of the group.</content>
  </entry>
</feed>`;

describe("parseOfac", () => {
  const { entries, sourcePublishedAt } = parseOfac(OFAC);

  it("reads every entry and the publish date", () => {
    expect(entries).toHaveLength(2);
    expect(sourcePublishedAt).toBe("2026-10-15");
  });

  it("builds names, aliases and personal details", () => {
    const e = entries.find((x) => x.sourceId === "9640")!;
    expect(e.entryType).toBe("individual");
    expect(e.primaryName).toBe("Mohammed ABU TEIR");
    expect(e.aliases).toEqual(["Mohammad Mahmoud ABOU TAYR", "Mohammed Mahmud ABU TAIR"]);
    expect(e.datesOfBirth).toEqual(["1951"]);
    expect(e.placesOfBirth).toEqual(["Umm Tuba"]);
    expect(e.programmes).toEqual(["NS-PLC"]);
  });

  it("keeps identifiers as text, leading zeros included", () => {
    const e = entries.find((x) => x.sourceId === "36")!;
    expect(e.entryType).toBe("entity");
    expect(e.identifiers).toEqual([{ type: "SWIFT/BIC", number: "0012ABCD" }]);
    expect(e.addresses).toEqual(["Havana, Cuba"]);
  });

  it("rejects a file that is not an OFAC list", () => {
    expect(() => parseOfac("<html><body>Service unavailable</body></html>")).toThrow(/sdnList/);
  });
});

describe("parseUn", () => {
  const { entries, sourcePublishedAt } = parseUn(UN);

  it("reads individuals and entities", () => {
    expect(entries.map((e) => e.entryType)).toEqual(["individual", "entity"]);
    expect(sourcePublishedAt).toBe("2026-10-20T23:00:05.952Z");
  });

  it("handles year ranges, empty aliases and documents", () => {
    const e = entries[0];
    expect(e.primaryName).toBe("GASTON IYAMUREMYE");
    expect(e.aliases).toEqual(["Victor Rumuri"]);
    expect(e.datesOfBirth).toEqual(["1948", "1950-1952"]);
    expect(e.identifiers).toEqual([{ type: "Passport", number: "A123", country: "Rwanda" }]);
    expect(e.reference).toBe("CDi.003");
  });
});

describe("parseEu", () => {
  const [e] = parseEu(EU).entries;

  it("uses the first name alias as the primary name", () => {
    expect(e.primaryName).toBe("Saddam Hussein Al-Tikriti");
    expect(e.aliases).toEqual(["Abu Ali"]);
    expect(e.entryType).toBe("individual");
  });

  it("drops the UNKNOWN country placeholder", () => {
    expect(e.nationalities).toEqual(["IRAQ"]);
    expect(e.datesOfBirth).toEqual(["1937-04-28"]);
    expect(e.programmes).toEqual(["IRQ"]);
  });
});

describe("parseUk", () => {
  const { entries } = parseUk(UK);

  it("skips the empty name element some records carry", () => {
    const e = entries.find((x) => x.sourceId === "BEL0174")!;
    expect(e.primaryName).toBe("Pavel Ivanovich KAZAKOV");
    expect(e.aliases).toContain("Pavel Ivanavich KAZAKOU");
    expect(e.aliases).toContain("Павел Іванавіч Казакоў");
  });

  it("normalises UK dates of birth", () => {
    const e = entries.find((x) => x.sourceId === "BEL0174")!;
    expect(e.datesOfBirth).toEqual(["1945", "1946-05-12"]);
    expect(e.identifiers).toEqual([{ type: "Passport", number: "MP123" }]);
  });

  it("reads ships with their IMO number", () => {
    const e = entries.find((x) => x.sourceId === "RUS1234")!;
    expect(e.entryType).toBe("vessel");
    expect(e.identifiers).toEqual([{ type: "IMO", number: "9123456" }]);
  });

  it("converts the generation date to ISO", () => {
    expect(parseUk(UK).sourcePublishedAt).toBe("2026-10-16");
  });

  it("ukDate handles partial and unexpected values", () => {
    expect(ukDate("dd/05/1945")).toBe("1945-05");
    expect(ukDate("15/08/19yy")).toBe("15/08/19yy");
  });
});

describe("parseCanadaSema", () => {
  const { entries } = parseCanadaSema(CA_SEMA);

  it("keys records on regime, schedule and item", () => {
    expect(entries[0].sourceId).toBe("Belarus / Bélarus|1, Part 1|2");
    expect(entries[0].primaryName).toBe("Dmitry Vladimirovich Balaba");
    expect(entries[0].datesOfBirth).toEqual(["1972"]);
  });

  it("does not treat a ship build date as a date of birth", () => {
    const ship = entries[1];
    expect(ship.entryType).toBe("vessel");
    expect(ship.datesOfBirth).toEqual([]);
    expect(ship.remarks).toBe("Build date: 2004");
    expect(ship.identifiers).toEqual([{ type: "IMO", number: "9876543" }]);
  });
});

describe("parseCanadaTerrorist", () => {
  const { entries, sourcePublishedAt } = parseCanadaTerrorist(CA_TERR);

  it("adds the acronym and the bare name as aliases", () => {
    expect(entries[0].primaryName).toBe("Abu Nidal Organization (ANO)");
    expect(entries[0].aliases).toEqual(expect.arrayContaining(["ANO", "Abu Nidal Organization", "Black June"]));
    expect(sourcePublishedAt).toBe("2025-12-10");
  });

  it("splitAliases separates the final 'and' but also keeps the unsplit item", () => {
    expect(splitAliases("A, B and C")).toEqual(["A", "B and C", "B", "C"]);
    expect(splitAliases("N/A")).toEqual([]);
    expect(splitAliases("Hamas and Something Else")).toEqual(["Hamas and Something Else"]);
  });
});
