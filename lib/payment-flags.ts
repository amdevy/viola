/**
 * Card payment (LiqPay) on/off switch, shared by the checkout form and the
 * signing route.
 *
 * Off since 2026-10-27: LiqPay monitoring blocked the merchant pending KYC
 * documents. Flip back to true once the account is reactivated.
 */
export const CARD_PAYMENT_ENABLED = false;
