const NP_API_URL = "https://api.novaposhta.ua/v2.0/json/";

async function npRequest(body: Record<string, unknown>) {
  const res = await fetch(NP_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apiKey: process.env.NOVA_POSHTA_API_KEY,
      ...body,
    }),
    next: { revalidate: 3600 },
  });
  return res.json();
}

export async function searchCities(query: string) {
  const data = await npRequest({
    modelName: "Address",
    calledMethod: "getCities",
    methodProperties: {
      FindByString: query,
      Limit: 10,
    },
  });
  return data.data ?? [];
}

export async function getWarehouses(cityRef: string, query?: string) {
  const data = await npRequest({
    modelName: "AddressGeneral",
    calledMethod: "getWarehouses",
    methodProperties: {
      CityRef: cityRef,
      FindByString: query ?? "",
      Limit: 500,
    },
  });
  return data.data ?? [];
}
