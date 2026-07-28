import type { ReadonlySignal } from '@effuse/core';
import { useMediaQuery } from '@effuse/use';

/** `.98` so a fractional width below 768 still counts as mobile. */
const MOBILE_QUERY = '(max-width: 767.98px)';

/** Defaults to desktop: the server has no viewport to measure. */
export const useIsMobile = (): ReadonlySignal<boolean> =>
  useMediaQuery({ query: MOBILE_QUERY, initialValue: false }).matches;
