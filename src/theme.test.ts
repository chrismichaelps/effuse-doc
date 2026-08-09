import { describe, expect, it, vi } from 'vitest';
import {
  THEME_STORAGE_KEY,
  isTheme,
  persistTheme,
  readStoredTheme,
  resolveTheme,
  toggleTheme,
} from './theme.js';

describe('theme preferences', () => {
  it('prefers a valid saved theme over the default', () => {
    expect(resolveTheme('light')).toBe('light');
    expect(resolveTheme('dark')).toBe('dark');
  });

  it('defaults to dark for missing or invalid values', () => {
    expect(resolveTheme(null)).toBe('dark');
    expect(resolveTheme('sepia')).toBe('dark');
    expect(isTheme('sepia')).toBe(false);
  });

  it('reads and persists the explicit user selection safely', () => {
    const storage = {
      getItem: vi.fn(() => 'dark'),
      setItem: vi.fn(),
    };

    expect(readStoredTheme(storage)).toBe('dark');
    persistTheme('light', storage);
    expect(storage.setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, 'light');
    expect(toggleTheme('light')).toBe('dark');
  });

  it('survives unavailable browser storage', () => {
    const blockedStorage = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };

    expect(readStoredTheme(blockedStorage)).toBeNull();
    expect(() => persistTheme('dark', blockedStorage)).not.toThrow();
  });
});
