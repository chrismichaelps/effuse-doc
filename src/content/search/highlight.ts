const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const splitSearchHighlight = (
  text: string,
  query: string
): readonly string[] => {
  if (!query) return [text];
  return text.split(new RegExp(`(${escapeRegExp(query)})`, 'giu'));
};
