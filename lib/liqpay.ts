import crypto from "crypto";

export type LiqPayParams = {
  public_key: string;
  version: 3;
  action: "pay" | "hold" | "subscribe" | "paydonate" | "auth";
  amount: number;
  currency: "UAH" | "USD" | "EUR";
  description: string;
  order_id: string;
  result_url?: string;
  server_url?: string;
  language?: "uk" | "en";
  sandbox?: 0 | 1;
};

export function encodeData(params: LiqPayParams): string {
  return Buffer.from(JSON.stringify(params)).toString("base64");
}

export function makeSignature(data: string, privateKey: string): string {
  return crypto
    .createHash("sha1")
    .update(privateKey + data + privateKey)
    .digest("base64");
}

export function buildCheckout(params: LiqPayParams, privateKey: string) {
  const data = encodeData(params);
  const signature = makeSignature(data, privateKey);
  return { data, signature };
}

export function verifyCallback(data: string, signature: string, privateKey: string): boolean {
  const expected = makeSignature(data, privateKey);
  return expected === signature;
}

export function decodeCallback<T = Record<string, unknown>>(data: string): T {
  return JSON.parse(Buffer.from(data, "base64").toString("utf-8")) as T;
}

export type LiqPayStatusResponse = {
  status: string;
  order_id: string;
  payment_id?: number;
  amount?: number;
  currency?: string;
  err_code?: string;
  err_description?: string;
};

export async function fetchLiqPayStatus(
  orderId: string,
  publicKey: string,
  privateKey: string
): Promise<LiqPayStatusResponse> {
  const params = {
    action: "status",
    version: 3,
    public_key: publicKey,
    order_id: orderId,
  };
  const data = Buffer.from(JSON.stringify(params)).toString("base64");
  const signature = makeSignature(data, privateKey);

  const body = new URLSearchParams({ data, signature });

  const res = await fetch("https://www.liqpay.ua/api/request", {
    method: "POST",
    body,
    cache: "no-store",
  });

  return (await res.json()) as LiqPayStatusResponse;
}
