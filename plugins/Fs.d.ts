declare const SOME_SYMBOL: unique symbol;
declare const NONE_SYMBOL: unique symbol;
declare const OK_SYMBOL: unique symbol;
declare const ERR_SYMBOL: unique symbol;
declare const NIL_SYMBOL: unique symbol;
declare const CONS_SYMBOL: unique symbol;

type Zero<T> = T extends never ? never : 0;

// type IncludesNever<T extends any[]> =
// 	T extends readonly [infer F, ...infer R] ? (F extends never ? true : IncludesNever<R>) : false;
type IncludesNever<T extends any[]> =
	T extends readonly [infer F, ...infer R] ? (F extends never ? true : { 0: IncludesNever<R>; }[Zero<T>]) : false;

type O = typeof O;
declare namespace O {
	type Option<T> = Some<T> | None;
	interface Some<T> { [SOME_SYMBOL]: T; }
	interface None { [NONE_SYMBOL]: never; }

	const some: <T>(value: T) => Some<T>;
	const none: () => None;
	const unwrap: <T>(option: Some<T>) => T;
	const isSome: <T>(option: Option<T>) => option is Some<T>;
	const isNone: (option: Option<unknown>) => option is None;
	const andThen: <T, U>(option: Option<T>, fn: (value: T) => Option<U>) => Option<U>;
	const orElse: <T>(option: Option<T>, fn: () => Option<T>) => Option<T>;
	const match: <T, P, Q>(option: Option<T>, onSome: (value: T) => P, onNone: () => Q) => P | Q;
	const map: <T, U>(option: Option<T>, fn: (value: T) => U) => Option<U>;
	const withDefault: <T>(option: Option<T>, value: T) => T;
}

type R = typeof R;
declare namespace R {
	type Result<T, E> = Ok<T> | Err<E>;
	interface Ok<T> { [OK_SYMBOL]: T; }
	interface Err<E> { [ERR_SYMBOL]: E; }

	const ok: <T>(value: T) => Ok<T>;
	const err: <E>(error: E) => Err<E>;
	const unwrap: <T>(result: Ok<T>) => T;
	const unwrapErr: <E>(result: Err<E>) => E;
	const isOk: <T>(result: Result<T, unknown>) => result is Ok<T>;
	const isErr: <E>(result: Result<unknown, E>) => result is Err<E>;
	const andThen: <T, U, E>(result: Result<T, E>, fn: (value: T) => Result<U, E>) => Result<U, E>;
	const orElse: <T, E, F>(result: Result<T, E>, fn: (error: E) => Result<T, F>) => Result<T, F>;
	const match: <T, E, P, Q>(result: Result<T, E>, onOk: (value: T) => P, onErr: (error: E) => Q) => P | Q;
	const map: <T, U, E>(result: Result<T, E>, fn: (value: T) => U) => Result<U, E>;
	const mapErr: <T, E, F>(result: Result<T, E>, fn: (error: E) => F) => Result<T, F>;
}

type L = typeof L;
declare namespace L {
	type List<T> = Nil | Cons<T>;
	interface Nil { [NIL_SYMBOL]: never; }
	interface Cons<T> { [CONS_SYMBOL]: T; }

	const nil: () => Nil;
	const cons: <T>(x: T, xs: List<T>) => Cons<T>;
	const singleton: <T>(x: T) => Cons<T>;
	const empty: (list: List<unknown>) => list is Nil;
	const head: <T>(list: Cons<T>) => T;
	const tail: <T>(list: Cons<T>) => List<T>;
	const match: <T, P, Q>(list: List<T>, onNil: () => P, onCons: (x: T, xs: List<T>) => Q) => P | Q;
	const find: <T>(list: List<T>, fn: (x: T) => boolean) => T | undefined;
	const some: <T>(list: List<T>, fn: (x: T) => boolean) => boolean;
	const every: <T>(list: List<T>, fn: (x: T) => boolean) => boolean;
	const reverse: <T>(list: List<T>) => List<T>;
	const reduce: <T, A>(list: List<T>, fn: (acc: A, x: T) => A, value: A) => A;
	const reduceRight: <T, A>(list: List<T>, fn: (acc: A, x: T) => A, value: A) => A;
	const map: <T, U>(list: List<T>, fn: (x: T) => U) => List<U>;
	const toArray: <T>(list: List<T>) => T[];
}

type S = typeof S;
declare namespace S {
	const ellipsis: (s: string, length: number) => string;
	const debug: (value: unknown, replacer?: (value: unknown) => unknown) => string;
}

type U = typeof U;
declare namespace U {
	type ArgsSerializer<F extends (...args: any[]) => any> = (args: Parameters<F>) => string | number;
	type EqualFn<F extends (...args: any[]) => any> = (a: Parameters<F>, b: Parameters<F>) => boolean;

	const simpleEqual: <T>(a: T, b: T) => boolean;
	const memo: <F extends (...args: any[]) => any>(fn: F, size: number, serialize?: ArgsSerializer<F>) => F;
	const memo1: <F extends (...args: any[]) => any>(fn: F, eq?: EqualFn<F>) => F;
}

type G = typeof G;
declare namespace G {
	type Source = ArrayLike<unknown>;
	type Context<S> = {
		source: S;
		position: number;
		cache: Cache<S, unknown, unknown>;
	};
	type Cache<S, T, E> = L.List<CacheEntry<S, T, E>>[];
	type CacheEntry<S, T, E> = {
		parser: Parser<S, T, E>;
		result: ReturnType<Parser<S, T, E>>;
	};

	type Parser<S, T, E> = (context: Context<S>) => R.Result<Next<S, T>, E>;
	type BuiltParser<S, T, E> = (source: S) => R.Result<T, E>;
	type Next<S, T> = [T, Context<S>];

	type TokenError<S, C> = {
		type: 'token';
		context: Context<S>;
		name: string;
		cause: C;
	};
	type EofError<S> = {
		type: 'eof';
		context: Context<S>;
	};
	type PathError<S, E> = {
		type: 'path';
		context: Context<S>;
		errors: E[];
	};
	type AndError<S, E> = {
		type: 'and';
		context: Context<S>;
		error: E;
	};
	type NotError<S, T> = {
		type: 'not';
		context: Context<S>;
		value: T;
	};
	type ValidationError<S, V> = {
		type: 'validation';
		context: Context<S>;
		cause: V;
	};

	type AcceptToken<S, T, C> = (source: S, position: number) => R.Result<[T, number], C>;
	type SeqOf<P> = SeqOfRec<P, unknown, [], never>;
	// type SeqOfRec<P, S, T extends any[], E> = P extends readonly [Parser<infer R, infer U, infer F>, ...infer Rest]
	// 	? SeqOfRec<Rest, S & R, [...T, U], E | F>
	// 	: Parser<S, IncludesNever<T> extends true ? never : T, E>;
	type SeqOfRec<P, S, T extends any[], E> = P extends readonly [Parser<infer R, infer U, infer F>, ...infer Rest]
		? { 0: SeqOfRec<Rest, S & R, [...T, U], E | F>; }[Zero<P>]
		: Parser<S, IncludesNever<T> extends true ? never : T, E>;
	type OneOf<P> = OneOfRec<P, unknown, never, []>;
	// type OneOfRec<P, S, T, E extends any[]> = P extends readonly [Parser<infer R, infer U, infer F>, ...infer Rest]
	// 	? OneOfRec<Rest, S & R, T | U, [...E, F]>
	// 	: Parser<S, T, IncludesNever<E> extends true ? never : PathError<S, E>>;
	type OneOfRec<P, S, T, E extends any[]> = P extends readonly [Parser<infer R, infer U, infer F>, ...infer Rest]
		? { 0: OneOfRec<Rest, S & R, T | U, [...E, F]>; }[Zero<P>]
		: Parser<S, T, IncludesNever<E> extends true ? never : PathError<S, E>>;
	type Validator<T, U, V> = (value: T) => R.Result<U, V>;
	type ErrorFormatter<E> = (error: E) => string;

	const token: <S, T, C>(name: string, accept: AcceptToken<S, T, C>) => Parser<S, T, TokenError<S, C>>;
	const eof: <S>() => Parser<S, null, EofError<S>>;
	const succeed: <S, T>(value: T) => Parser<S, T, never>;
	const fail: <S, E>(error: E) => Parser<S, never, E>;
	const andThen: <S, T, U, E, F>(parser: Parser<S, T, E>, fn: (next: Next<S, T>) => Parser<S, U, F>) => Parser<S, U, E | F>;
	const orElse: <S, T, U, E, F>(parser: Parser<S, T, E>, fn: (error: E) => Parser<S, U, F>) => Parser<S, T | U, F>;
	const map: <S, T, U, E>(parser: Parser<S, T, E>, fn: (value: T) => U) => Parser<S, U, E>;
	const mapError: <S, T, E, F>(parser: Parser<S, T, E>, fn: (error: E) => F) => Parser<S, T, F>;
	const seqOf: <P extends readonly Parser<any, any, any>[]>(parsers: readonly [...P]) => SeqOf<P>;
	const oneOf: <P extends readonly Parser<any, any, any>[]>(parsers: readonly [...P]) => OneOf<P>;
	const optional: <S, P>(parser: Parser<S, P, unknown>) => Parser<S, O.Option<P>, never>;
	const many: <S, P>(parser: Parser<S, P, unknown>) => Parser<S, P[], never>;
	const many1: <S, P, E>(parser: Parser<S, P, E>) => Parser<S, P[], E>;
	const and: <S, E>(parser: Parser<S, unknown, E>) => Parser<S, null, E extends never ? never : AndError<S, E>>;
	const not: <S, T>(parser: Parser<S, T, unknown>) => Parser<S, null, T extends never ? never : NotError<S, T>>;
	const validate: <S, T, U, E, V>(parser: Parser<S, T, E>, validator: Validator<T, U, V>)
		=> Parser<S, U, E | ValidationError<S, V>>;
	const memo: <S, T, E>(parser: Parser<S, T, E>) => Parser<S, T, E>;
	const make: <S, T, E>(parser: Parser<S, T, E>) => BuiltParser<S, T, E>;
	const parse: <S extends Source, T, E>(source: S, parser: Parser<S, T, E>, errorFormatter?: ErrorFormatter<E>) => T;
	const defaultErrorFormatter: ErrorFormatter<unknown>;
}

type P = typeof P;
declare namespace P {
	type Parser<T, E> = (s: string) => R.Result<T, E>;
	type EntryParser<K extends string, T, E> = (object: object) => R.Result<[K, T], E>;

	type SyntaxError<K> = {
		type: 'syntax';
		source: string;
		context: K;
	};
	type JsonError = {
		type: 'json';
		source: string;
		inner: Error;
	};
	type ValidationError<V> = {
		type: 'validation';
		source: string;
		cause: V;
	};

	type Validator<T, U, V> = (value: T) => R.Result<U, V>;
	type Struct<P> = StructRec<P, {}, never>;
	// type StructRec<P, T, E> = P extends [EntryParser<infer K, infer U, infer F>, ...infer Rest]
	// 	? StructRec<Rest, T & Record<K, U>, E | F>
	// 	: Parser<T, E | JsonError | SyntaxError<"struct">>;
	type StructRec<P, T, E> = P extends [EntryParser<infer K, infer U, infer F>, ...infer Rest]
		? { 0: StructRec<Rest, T & Record<K, U>, E | F>; }[Zero<P>]
		: Parser<T, E | JsonError | SyntaxError<"struct">>;
	type Archetype = Parser<any, any> | readonly [Archetype] | { [key: string]: Archetype; };
	type Make<A> = Parser<MakeValue<A>, MakeError<A>>;
	type MakeValue<A> =
		A extends Parser<infer T, any> ? T :
		A extends readonly [Archetype] ? MakeValue<A[0]>[] :
		A extends { [key: string]: Archetype; } ? { [K in keyof A]: MakeValue<A[K]> } : never;
	// type MakeError<A> =
	// 	A extends Parser<any, infer E> ? E :
	// 	A extends readonly [Archetype] ? MakeError<A[0]> | JsonError | SyntaxError<"array"> :
	// 	A extends { [key: string]: Archetype; } ? MakeError<A[keyof A]> | JsonError | SyntaxError<"struct"> : never;
	type MakeError<A> =
		A extends Parser<any, infer E> ? E :
		A extends readonly [Archetype] ? { 0: MakeError<A[0]> | JsonError | SyntaxError<"array">; }[Zero<A>] :
		A extends { [key: string]: Archetype; } ? { 0: MakeError<A[keyof A]> | JsonError | SyntaxError<"struct">; }[Zero<A>] : never;
	type ErrorFormatter<E> = (error: E) => string;

	const succeed: <T>(value: T) => Parser<T, never>;
	const fail: <E>(error: E) => Parser<never, E>;
	const andThen: <T, U, E, F>(parser: Parser<T, E>, fn: (value: T) => Parser<U, F>) => Parser<U, E | F>;
	const orElse: <T, U, E, F>(parser: Parser<T, E>, fn: (error: E) => Parser<U, F>) => Parser<T | U, F>;
	const map: <T, U, E>(parser: Parser<T, E>, fn: (value: T) => U) => Parser<U, E>;
	const mapError: <T, E, F>(parser: Parser<T, E>, fn: (error: E) => F) => Parser<T, F>;
	const withDefault: <T, E>(parser: Parser<T, E>, value: T) => Parser<T, E>;
	const validate: <T, U, E, V>(parser: Parser<T, E>, validator: Validator<T, U, V>) => Parser<U, E | ValidationError<V>>;
	const empty: Parser<undefined, SyntaxError<"empty">>;
	const integer: Parser<number, SyntaxError<"integer">>;
	const number: Parser<number, SyntaxError<"number">>;
	const string: Parser<string, never>;
	const boolean: Parser<boolean, SyntaxError<"boolean">>;
	const custom: <T, K>(fn: (s: string) => R.Result<T, K>) => Parser<T, SyntaxError<K>>;
	const json: Parser<unknown, JsonError>;
	const array: <T, E>(parser: Parser<T, E>) => Parser<T[], E | JsonError | SyntaxError<"array">>;
	const struct: <P extends readonly EntryParser<any, any, any>[]>(parsers: readonly [...P]) => Struct<P>;
	const entry: <K extends string, T, E>(key: K, parser: Parser<T, E>) => EntryParser<K, T, E>;
	const make: <A extends Archetype>(archetype: A) => Make<A>;
	const parse: <A extends Archetype>(
		s: string,
		archetype: A,
		errorFormatter?: ErrorFormatter<MakeError<A>>
	) => MakeValue<A>;
	const parseAll: <A extends { [key: string]: Archetype; }>(
		args: { [K in keyof A]: string },
		archetypes: A,
		errorFormatter?: ErrorFormatter<MakeError<A[keyof A]>>
	) => { [K in keyof A]: MakeValue<A[K]> };
	const defaultErrorFormatter: ErrorFormatter<unknown>;
}

type M = typeof M;
declare namespace M {
	type Data = { meta: { [key: string]: string | true; }; };
	type Meta<T> = {
		parse(data: Data): void;
		parseAll(table: readonly (Data | null)[]): void;
		get(data: Data): T | undefined;
	};

	type Parser<T, E> = (data: Data) => R.Result<O.Option<T>, E>;

	type NotationError = {
		type: 'notation';
		expected: 'flag' | 'attr';
		name: string;
		value: string | true;
	};
	type ParseError<C> = {
		type: 'parse';
		name: string;
		source: string;
		cause: C;
	};

	type AttrParser<T, C> = (source: string) => R.Result<T, C>;
	type OneOf<P> = OneOfRec<P, never, never>;
	// type OneOfRec<P, T, E> = P extends readonly [Parser<infer U, infer F>, ...infer Rest]
	// 	? OneOfRec<Rest, T | U, E | F>
	// 	: Parser<T, E>;
	type OneOfRec<P, T, E> = P extends readonly [Parser<infer U, infer F>, ...infer Rest]
		? { 0: OneOfRec<Rest, T | U, E | F>; }[Zero<P>]
		: Parser<T, E>;
	type Archetype = Parser<any, any> | readonly [Archetype, ...Archetype[]] | { [key: string]: Archetype; };
	type Make<A> = Parser<MakeValue<A>, MakeError<A>>;
	type MakeValue<A> =
		A extends Parser<infer T, any> ? T :
		A extends object ? { [K in keyof A]: MakeValue<A[K]> } : never;
	// type MakeError<A> =
	// 	A extends Parser<any, infer E> ? E :
	// 	A extends readonly [infer F, ...infer R] ? MakeError<F> | MakeError<R> :
	// 	A extends { [key: string]: Archetype; } ? MakeError<A[keyof A]> : never;
	type MakeError<A> =
		A extends Parser<any, infer E> ? E :
		A extends readonly [infer F, ...infer R] ? { 0: MakeError<F> | MakeError<R>; }[Zero<A>] :
		A extends { [key: string]: Archetype; } ? { 0: MakeError<A[keyof A]>; }[Zero<A>] : never;
	type ErrorFormatter<E> = (error: E) => string;

	const flag: (name: string) => Parser<boolean, NotationError>;
	const attr: <T, C>(name: string, parser: AttrParser<T, C>) => Parser<T, NotationError | ParseError<C>>;
	const succeed: <T>(value: T) => Parser<T, never>;
	const miss: () => Parser<never, never>;
	const fail: <E>(error: E) => Parser<never, E>;
	const andThen: <T, U, E, F>(parser: Parser<T, E>, fn: (value: T) => Parser<U, F>) => Parser<U, E | F>;
	const orElse: <T, U, E, F>(parser: Parser<T, E>, fn: () => Parser<U, F>) => Parser<U, E | F>;
	const map: <T, U, E>(parser: Parser<T, E>, fn: (value: T) => U) => Parser<U, E>;
	const mapError: <T, E, F>(parser: Parser<T, E>, fn: (error: E) => F) => Parser<T, F>;
	const withDefault: <T, E>(parser: Parser<T, E>, value: T) => Parser<T, E>;
	const oneOf: <P extends readonly Parser<any, any>[]>(parsers: readonly [...P]) => OneOf<P>;
	const make: <A extends Archetype>(archetype: A) => Make<A>;
	const parse: <A extends Archetype>(
		data: Data,
		archetype: A,
		errorFormatter?: ErrorFormatter<MakeError<A>>,
	) => MakeValue<A>;
	const meta: <A extends Archetype>(
		archetype: A,
		errorFormatter?: ErrorFormatter<MakeError<A>>,
	) => Meta<MakeValue<A>>;
	const defaultErrorFormatter: ErrorFormatter<unknown>;
}

type N = typeof N;
declare namespace N {
	type Source = string;
	type Parser<T, E> = G.Parser<Source, T, E>;
	type BuiltParser<T, E> = G.BuiltParser<Source, T, E>;
	type TokenError = G.TokenError<Source, string>;
	type EofError = G.EofError<Source>;
	type ValidationError<V> = G.ValidationError<Source, V>;
	type SeqOf<P> = G.SeqOf<P>;
	type OneOf<P> = G.OneOf<P>;
	type Validator<T, U, V> = G.Validator<T, U, V>;
	type ErrorFormatter<E> = G.ErrorFormatter<E>;

	type Join<P, F> = SeqOf<P> extends Parser<infer T, infer E> ? Parser<T, E | F> : never;

	const succeed: <T>(value: T) => Parser<T, never>;
	const fail: <E>(error: E) => Parser<never, E>;
	const map: <T, U, E>(parser: Parser<T, E>, fn: (value: T) => U) => Parser<U, E>;
	const mapError: <T, E, F>(parser: Parser<T, E>, fn: (error: E) => F) => Parser<T, F>;
	const seqOf: <P extends readonly Parser<any, any>[]>(parsers: readonly [...P]) => SeqOf<P>;
	const oneOf: <P extends readonly Parser<any, any>[]>(parsers: readonly [...P]) => OneOf<P>;
	const validate: <T, U, E, V>(parser: Parser<T, E>, validator: Validator<T, U, V>)
		=> Parser<U, E | ValidationError<V>>;
	const symbol: <S extends string>(s: S) => Parser<S, TokenError>;
	const regexp: <T = string>(name: string, re: RegExp, fn?: (s: string, match: RegExpMatchArray) => T)
		=> Parser<T, TokenError>;
	const spacing: Parser<string, never>;
	const spaces: Parser<string, TokenError>;
	const natural: Parser<number, TokenError>;
	const integer: Parser<number, TokenError>;
	const number: Parser<number, TokenError>;
	const boolean: Parser<boolean, TokenError>;
	const text: Parser<string, TokenError>;
	const group: <T, E, F, G>(begin: Parser<unknown, F>, end: Parser<unknown, G>, inner: Parser<T, E>)
		=> Parser<T, E | F | G>;
	const parens: <T, E>(parser: Parser<T, E>) => Parser<T, E | TokenError>;
	const braces: <T, E>(parser: Parser<T, E>) => Parser<T, E | TokenError>;
	const brackets: <T, E>(parser: Parser<T, E>) => Parser<T, E | TokenError>;
	const chain: <T, E>(item: Parser<T, E>, delimiter: Parser<unknown, unknown>) => Parser<T[], E>;
	const join: <P extends readonly Parser<any, any>[], F>(items: readonly [...P], delimiter: Parser<unknown, F>)
		=> Join<P, F>;
	const list: <T, E>(parser: Parser<T, E>) => Parser<T[], E>;
	const tuple: <P extends readonly Parser<any, any>[]>(parsers: readonly [...P]) => Join<P, TokenError>;
	const withDefault: <T, E>(parser: Parser<T, E>, value: T) => Parser<T, E>;
	const make: <T, E>(parser: Parser<T, E>) => BuiltParser<T, E | EofError>;
	const parse: <T, E>(source: Source, parser: Parser<T, E>, errorFormatter?: ErrorFormatter<E | EofError>) => T;
}

type Z = typeof Z;
declare namespace Z {
	type Define<T, D extends Partial<T>> = (base: (this_: T) => T) => D & ThisType<T>;
	type Getter<T> = (owner: unknown) => T;
	type Setter<T> = (owner: unknown, value: T) => void;
	type Deleter = (owner: unknown) => void;
	type Clearer = () => void;
	type Swapper<K extends string> = <O extends { [P in K]: any }, R>(owner: O, value: O[K], block: () => R) => R;
	type Context<T> = {
		enter<R>(owner: unknown, value: T, block: () => R): R;
		value(owner: unknown): T;
		exists(owner: unknown): boolean;
	};

	const pluginName: () => string | undefined;
	const redef: <T, D>(target: T, define: Define<T, D>) => void;
	const extProp: (<T>(defaultValue: T, nonWeak?: false) => [Getter<T>, Setter<T>, Deleter])
		& (<T>(defaultValue: T, nonWeak: true) => [Getter<T>, Setter<T>, Deleter, Clearer]);
	const extend: <T>(target: unknown, name: string, prop: readonly [Getter<T>, Setter<T>, ...unknown[]]) => void;
	const swapper: <K extends string>(key: K) => Swapper<K>;
	const context: <T>(defaultValue: T) => Context<T>;
	const defer: (cleanup: () => void) => <R>(block: () => R) => R;
	const enclose: <R>(begin: () => void, end: () => void, block: () => R) => R;
}

declare global {
	type Fs = typeof Fs;
	namespace Fs {
		export { O, R, L, S, U, G, P, M, N, Z };
	}
}

export { };