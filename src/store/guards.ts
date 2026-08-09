import { i18nStore } from './appI18n.js';
import { docsStore } from './docsUIStore.js';
import { searchStore } from './searchStore.js';
import { todosStore } from './todosStore.js';

const requireStore = <T>(value: unknown, expected: T, name: string): T => {
  if (value !== expected) {
    throw new TypeError(`Store "${name}" is not registered correctly`);
  }
  return expected;
};

export const requireI18nStore = (value: unknown): typeof i18nStore =>
  requireStore(value, i18nStore, 'i18n');

export const requireTodosStore = (value: unknown): typeof todosStore =>
  requireStore(value, todosStore, 'todosStore');

export const requireDocsStore = (value: unknown): typeof docsStore =>
  requireStore(value, docsStore, 'docsUI');

export const requireSearchStore = (value: unknown): typeof searchStore =>
  requireStore(value, searchStore, 'search');
