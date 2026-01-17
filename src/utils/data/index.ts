export type { Predicate, Refinement } from './predicate';
export {
	isString,
	isNumber,
	isBoolean,
	isNull,
	isUndefined,
	isNullish,
	isNotNull,
	isNotUndefined,
	isNotNullish,
	isRecord,
	isArray,
	isTagged,
	isFunction,
	isPromise,
	isDate,
	isRegExp,
	isError,
	isEmptyString,
	isNonEmptyString,
	isPositiveNumber,
	isNegativeNumber,
	isInteger,
	isFiniteNumber,
	isSafeInteger,
	isPlainObject,
	isEmptyArray,
	isNonEmptyArray,
	isEmptyObject,
	hasProperty,
	getProperty,
	not,
	and,
	or,
	all,
	any,
	tuple,
	collect,
	partition,
} from './predicate';

export type { TaggedEnum } from './tagged-enum';
export { taggedEnum } from './tagged-enum';

export { TaggedError } from './tagged-error';

export type { Option, Some, None } from './option';
export {
	none,
	some,
	isOption,
	isNone,
	isSome,
	fromNullable,
	getOrElse,
	getOrNull,
	getOrUndefined,
	match,
	map,
	flatMap,
	filter,
	tap,
	orElse,
} from './option';

export type { Either, Left, Right } from './either';
export {
	left,
	right,
	isEither,
	isLeft,
	isRight,
	tryCatch,
	tryCatchAsync,
	getOrThrow,
	ok,
	fail,
	toResult,
	toResultAsync,
	resultFromNullable,
	resultGetOrThrow,
	resultGetOrElse,
	resultMap,
	resultMapError,
	resultFlatMap,
} from './either';
export type { Result } from './either';
export {
	match as matchEither,
	map as mapEither,
	mapLeft,
	flatMap as flatMapEither,
	getOrElse as getOrElseEither,
	fromNullable as fromNullableEither,
} from './either';

export type { LazyArg } from './function';
export {
	identity,
	constant,
	constTrue,
	constFalse,
	constNull,
	constUndefined,
	constVoid,
	absurd,
	pipe,
	flow,
	dual,
	matchTag,
} from './function';
