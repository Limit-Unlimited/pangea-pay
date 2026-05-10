import { NextRequest } from "next/server";

const CH_BASE = "https://api.company-information.service.gov.uk";

function authHeader() {
  const key = process.env.COMPANIES_HOUSE_API_KEY ?? "";
  return "Basic " + Buffer.from(`${key}:`).toString("base64");
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) return Response.json({ items: [] });

  try {
    const res = await fetch(
      `${CH_BASE}/search/companies?q=${encodeURIComponent(q)}&items_per_page=8`,
      { headers: { Authorization: authHeader() }, next: { revalidate: 60 } },
    );
    if (!res.ok) return Response.json({ items: [] }, { status: res.status });

    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = (data.items ?? []).map((item: any) => ({
      companyNumber: item.company_number,
      title:         item.title,
      companyStatus: item.company_status,
      companyType:   item.company_type,
      dateOfCreation: item.date_of_creation ?? null,
      address: {
        addressLine1: item.registered_office_address?.address_line_1 ?? null,
        locality:     item.registered_office_address?.locality ?? null,
        postalCode:   item.registered_office_address?.postal_code ?? null,
      },
    }));
    return Response.json({ items });
  } catch {
    return Response.json({ items: [] }, { status: 500 });
  }
}
