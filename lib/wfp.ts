import crypto from "crypto";

export function generateWfpSignature(
  params: string[],
  secret: string
): string {
  const str = params.join(";");
  return crypto.createHmac("md5", secret).update(str).digest("hex");
}

export function verifyWfpCallback(body: Record<string, unknown>, secret: string): boolean {
  const params = [
    body.merchantAccount,
    body.orderReference,
    body.amount,
    body.currency,
    body.authCode,
    body.cardPan,
    body.transactionStatus,
    body.reasonCode,
  ].map(String);

  const expected = generateWfpSignature(params, secret);
  return body.merchantSignature === expected;
}
