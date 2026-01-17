import { isTagged, isRecord } from './predicate';
import type { Refinement } from './predicate';

export type TaggedEnum<A extends Record<string, Record<string, unknown>>> = {
	[Tag in keyof A]: { readonly _tag: Tag } & {
		readonly [K in keyof A[Tag]]: A[Tag][K];
	};
}[keyof A];

type MatchCases<A extends { readonly _tag: string }, R> = {
	[K in A['_tag']]: (args: Extract<A, { _tag: K }>) => R;
};

type TaggedEnumConstructor<A extends { readonly _tag: string }> = {
	[K in A['_tag']]: (
		args: Omit<Extract<A, { _tag: K }>, '_tag'>
	) => Extract<A, { _tag: K }>;
} & {
	readonly $is: <Tag extends A['_tag']>(
		tag: Tag
	) => Refinement<unknown, Extract<A, { _tag: Tag }>>;
	readonly $match: {
		<R>(cases: MatchCases<A, R>): (value: A) => R;
		<R>(value: A, cases: MatchCases<A, R>): R;
	};
};

function createTagConstructor<A extends { readonly _tag: string }>(
	tag: string
): (args: Record<string, unknown>) => A {
	return (args) => {
		const result = isRecord(args) ? { _tag: tag, ...args } : { _tag: tag };
		return result as A;
	};
}

function createIsRefinement<A extends { readonly _tag: string }>(
	tag: string
): Refinement<unknown, A> {
	const baseRefinement = isTagged(tag);
	return (value: unknown): value is A => baseRefinement(value);
}

export function taggedEnum<
	A extends { readonly _tag: string },
>(): TaggedEnumConstructor<A> {
	const cache = new Map<string | symbol, unknown>();

	return new Proxy({} as TaggedEnumConstructor<A>, {
		get(_target, prop) {
			if (cache.has(prop)) {
				return cache.get(prop);
			}

			if (prop === '$is') {
				const fn = <Tag extends A['_tag']>(
					tag: Tag
				): Refinement<unknown, Extract<A, { _tag: Tag }>> =>
					createIsRefinement<Extract<A, { _tag: Tag }>>(tag);
				cache.set(prop, fn);
				return fn;
			}

			if (prop === '$match') {
				const fn = <R>(
					valueOrCases: A | MatchCases<A, R>,
					maybeCases?: MatchCases<A, R>
				): R | ((value: A) => R) => {
					if (maybeCases === undefined) {
						const cases = valueOrCases as MatchCases<A, R>;
						return (value: A): R => {
							const handler = cases[value._tag as A['_tag']];
							return handler(value as Parameters<typeof handler>[0]);
						};
					}
					const value = valueOrCases as A;
					const handler = maybeCases[value._tag as A['_tag']];
					return handler(value as Parameters<typeof handler>[0]);
				};
				cache.set(prop, fn);
				return fn;
			}

			if (typeof prop === 'string') {
				const constructor = createTagConstructor<A>(prop);
				cache.set(prop, constructor);
				return constructor;
			}

			return undefined;
		},
	});
}
