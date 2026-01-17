import { dual } from './function';

const TypeId = Symbol.for('app/Option');
type TypeId = typeof TypeId;

export interface None {
	readonly _tag: 'None';
	readonly [TypeId]: TypeId;
}

export interface Some<A> {
	readonly _tag: 'Some';
	readonly value: A;
	readonly [TypeId]: TypeId;
}

export type Option<A> = None | Some<A>;

const noneInstance: None = { _tag: 'None', [TypeId]: TypeId };

export const none = <A>(): Option<A> => noneInstance;

export const some = <A>(value: A): Option<A> => ({
	_tag: 'Some',
	value,
	[TypeId]: TypeId,
});

export const isOption = (u: unknown): u is Option<unknown> =>
	typeof u === 'object' && u !== null && TypeId in u;

export const isNone = <A>(option: Option<A>): option is None =>
	option._tag === 'None';

export const isSome = <A>(option: Option<A>): option is Some<A> =>
	option._tag === 'Some';

export const fromNullable = <A>(
	value: A | null | undefined
): Option<NonNullable<A>> =>
	value == null ? none() : some(value as NonNullable<A>);

export const getOrNull = <A>(option: Option<A>): A | null =>
	isNone(option) ? null : option.value;

export const getOrUndefined = <A>(option: Option<A>): A | undefined =>
	isNone(option) ? undefined : option.value;

export const getOrElse = dual<
	<A, B>(orElse: () => B) => (option: Option<A>) => A | B,
	<A, B>(option: Option<A>, orElse: () => B) => A | B
>(2, (option, orElse) => (isNone(option) ? orElse() : option.value));

export const orElse = dual<
	<A, B>(that: () => Option<B>) => (option: Option<A>) => Option<A | B>,
	<A, B>(option: Option<A>, that: () => Option<B>) => Option<A | B>
>(2, (option, that) => (isNone(option) ? that() : option));

export const match = dual<
	<A, B, C>(cases: {
		readonly onNone: () => B;
		readonly onSome: (a: A) => C;
	}) => (option: Option<A>) => B | C,
	<A, B, C>(
		option: Option<A>,
		cases: { readonly onNone: () => B; readonly onSome: (a: A) => C }
	) => B | C
>(2, (option, cases) =>
	isNone(option) ? cases.onNone() : cases.onSome(option.value)
);

export const map = dual<
	<A, B>(f: (a: A) => B) => (option: Option<A>) => Option<B>,
	<A, B>(option: Option<A>, f: (a: A) => B) => Option<B>
>(2, (option, f) => (isNone(option) ? none() : some(f(option.value))));

export const flatMap = dual<
	<A, B>(f: (a: A) => Option<B>) => (option: Option<A>) => Option<B>,
	<A, B>(option: Option<A>, f: (a: A) => Option<B>) => Option<B>
>(2, (option, f) => (isNone(option) ? none() : f(option.value)));

export const filter = dual<
	<A>(predicate: (a: A) => boolean) => (option: Option<A>) => Option<A>,
	<A>(option: Option<A>, predicate: (a: A) => boolean) => Option<A>
>(2, (option, predicate) =>
	isNone(option) ? none() : predicate(option.value) ? option : none()
);

export const tap = dual<
	<A>(f: (a: A) => void) => (option: Option<A>) => Option<A>,
	<A>(option: Option<A>, f: (a: A) => void) => Option<A>
>(2, (option, f) => {
	if (isSome(option)) {
		f(option.value);
	}
	return option;
});
