export const toError = (value: unknown): Error =>
  value instanceof Error ? value : new Error(String(value));

export const getErrorMessage = (value: unknown): string =>
  toError(value).message;
