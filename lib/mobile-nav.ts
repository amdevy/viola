/**
 * Whether the phone's bottom bar (MobileBottomNav) is on this page.
 *
 * The header reads it too: where the bar is shown it carries the cart and the
 * menu, so the header drops its own copies on phones instead of showing every
 * control twice. `pathname` is the one next-intl gives — without the locale.
 */
export function showsBottomNav(pathname: string): boolean {
  // The order form is a place to finish, not to wander off from: no bar there.
  return pathname !== "/checkout";
}
