import { describe, expect, it } from 'vitest';
import {
  BACK_TO_TOP_THRESHOLD,
  resolveBackToTopBehavior,
  shouldShowBackToTop,
} from './documentScroll.js';

describe('BackToTop behavior', () => {
  it('appears only after the document passes the reveal threshold', () => {
    expect(shouldShowBackToTop(BACK_TO_TOP_THRESHOLD)).toBe(false);
    expect(shouldShowBackToTop(BACK_TO_TOP_THRESHOLD + 1)).toBe(true);
  });

  it('normalizes invalid negative thresholds to the top boundary', () => {
    expect(shouldShowBackToTop(0, -100)).toBe(false);
    expect(shouldShowBackToTop(1, -100)).toBe(true);
  });

  it('disables animated scrolling when reduced motion is requested', () => {
    expect(resolveBackToTopBehavior(true)).toBe('auto');
    expect(resolveBackToTopBehavior(false)).toBe('smooth');
  });
});
