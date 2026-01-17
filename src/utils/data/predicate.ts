export interface Predicate<A> {
	(a: A): boolean;
}

export interface Refinement<A, B extends A> {
	(a: A): a is B;
}

export const isString = (u: unknown): u is string => typeof u === 'string';

export const isNumber = (u: unknown): u is number => typeof u === 'number';

export const isBoolean = (u: unknown): u is boolean => typeof u === 'boolean';

export const isNull = (u: unknown): u is null => u === null;

export const isUndefined = (u: unknown): u is undefined => u === undefined;

export const isNullish = (u: unknown): u is null | undefined => u == null;

export const isNotNull = <A>(u: A | null): u is A => u !== null;

export const isNotUndefined = <A>(u: A | undefined): u is A => u !== undefined;

export const isNotNullish = <A>(u: A | null | undefined): u is A => u != null;

export const isRecord = (u: unknown): u is Record<string, unknown> =>
	typeof u === 'object' && u !== null && !Array.isArray(u);

export const isArray = (u: unknown): u is unknown[] => Array.isArray(u);

export const isTagged =
	<Tag extends string>(tag: Tag): Refinement<unknown, { readonly _tag: Tag }> =>
	(u: unknown): u is { readonly _tag: Tag } =>
		isRecord(u) && '_tag' in u && u._tag === tag;

export function not<A>(predicate: Predicate<A>): Predicate<A> {
	return (a) => !predicate(a);
}

export function and<A>(
	first: Predicate<A>,
	second: Predicate<A>
): Predicate<A> {
	return (a) => first(a) && second(a);
}

export function or<A>(first: Predicate<A>, second: Predicate<A>): Predicate<A> {
	return (a) => first(a) || second(a);
}

export function all<A>(predicates: readonly Predicate<A>[]): Predicate<A> {
	return (a) => predicates.every((p) => p(a));
}

export function any<A>(predicates: readonly Predicate<A>[]): Predicate<A> {
	return (a) => predicates.some((p) => p(a));
}
