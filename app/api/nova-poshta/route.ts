import { NextRequest, NextResponse } from "next/server";
import { searchCities, getWarehouses } from "@/lib/nova-poshta";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const type = searchParams.get("type");
  const query = searchParams.get("query") ?? "";
  const cityRef = searchParams.get("cityRef") ?? "";

  try {
    if (type === "cities") {
      const data = await searchCities(query);
      return NextResponse.json({ data });
    }

    if (type === "warehouses") {
      const data = await getWarehouses(cityRef, query);
      return NextResponse.json({ data });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: "Nova Poshta API error" }, { status: 500 });
  }
}
