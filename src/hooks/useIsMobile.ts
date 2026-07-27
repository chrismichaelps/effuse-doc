import type { ReadonlySignal } from '@effuse/core';
import { useMediaQuery } from '@effuse/use';

/**
 * Matches the viewport the mobile layout is written for.
 *
 * `767.98px` rather than `767px` so a fractional viewport width between 767
 * and 768 still counts as mobile, keeping this identical to the `width < 768`
 * comparison it replaces.
 */
const MOBILE_QUERY = '(max-width: 767.98px)';

/**
 * The server has no viewport, so it renders the desktop layout and the client
 * reconciles on hydration. Defaulting to mobile instead would make every
 * desktop visitor see a flash of the drawer layout.
 */
export const useIsMobile = (): ReadonlySignal<boolean> =>
  useMediaQuery({ query: MOBILE_QUERY, initialValue: false }).matches;
