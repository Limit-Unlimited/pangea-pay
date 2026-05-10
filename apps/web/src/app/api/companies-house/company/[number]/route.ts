import { NextRequest } from "next/server";

const CH_BASE = "https://api.company-information.service.gov.uk";

function authHeader() {
  const key = process.env.COMPANIES_HOUSE_API_KEY ?? "";
  return "Basic " + Buffer.from(`${key}:`).toString("base64");
}

function toTitleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseOfficerName(fullName: string): { firstName: string; lastName: string } {
  // CH format: "SURNAME, First Name Middle" or "SURNAME, First Name"
  const commaIdx = fullName.indexOf(", ");
  if (commaIdx === -1) return { firstName: "", lastName: toTitleCase(fullName) };
  const lastName  = toTitleCase(fullName.slice(0, commaIdx));
  const firstName = toTitleCase(fullName.slice(commaIdx + 2).split(" ")[0] ?? "");
  return { firstName, lastName };
}

type Params = { params: Promise<{ number: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { number } = await params;
  const companyNumber = number?.trim().toUpperCase();
  if (!companyNumber) return Response.json({ error: "Missing company number" }, { status: 400 });

  try {
    const [profileRes, officersRes] = await Promise.all([
      fetch(`${CH_BASE}/company/${encodeURIComponent(companyNumber)}`, {
        headers: { Authorization: authHeader() },
        next: { revalidate: 3600 },
      }),
      fetch(`${CH_BASE}/company/${encodeURIComponent(companyNumber)}/officers?items_per_page=50`, {
        headers: { Authorization: authHeader() },
        next: { revalidate: 3600 },
      }),
    ]);

    if (!profileRes.ok) {
      return Response.json({ error: "Company not found" }, { status: profileRes.status });
    }

    const [profile, officersData] = await Promise.all([
      profileRes.json(),
      officersRes.ok ? officersRes.json() : Promise.resolve({ items: [] }),
    ]);

    const addr = profile.registered_office_address ?? {};

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const directors = (officersData.items ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((o: any) => !o.resigned_on && ["director", "corporate-director"].includes(o.officer_role))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((o: any) => ({
        name: o.name,
        ...parseOfficerName(o.name as string),
        role:        o.officer_role,
        appointedOn: o.appointed_on ?? null,
      }));

    return Response.json({
      companyNumber:  profile.company_number,
      companyName:    profile.company_name,
      companyStatus:  profile.company_status,
      companyType:    profile.company_type,
      dateOfCreation: profile.date_of_creation ?? null,
      jurisdiction:   profile.jurisdiction ?? null,
      address: {
        addressLine1: addr.address_line_1 ?? null,
        addressLine2: addr.address_line_2 ?? null,
        locality:     addr.locality ?? null,
        region:       addr.region ?? null,
        postalCode:   addr.postal_code ?? null,
        country:      addr.country ?? null,
      },
      directors,
    });
  } catch {
    return Response.json({ error: "Failed to fetch company details" }, { status: 500 });
  }
}
