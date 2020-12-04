type IncludesNever<T extends any[]> =
	T extends readonly [infer F, ...infer R] ? (F extends never ? true : IncludesNever<R>) : false;

declare global {
	namespace Fs {
		export { O, R, L, S, U, G, E, P, N, M, Z };
	}
}

declare namespace O {
	const SOME_SYMBOL: unique symbol;
	const NONE_SYMBOL: unique symbol;

	export type Option<T> = Some<T> | None;
	export interface Some<T> { [SOME_SYMBOL]: T; }
	export interface None { [NONE_SYMBOL]: never; }

	type Zip<A> = ZipRec<A, []>;
	type ZipRec<A, T extends any[]> = A extends readonly [Option<infer U>, ...infer Rest]
		? ZipRec<Rest, [...T, U]>
		: Option<T>;

	const some: <T>(value: T) => Some<T>;
	const none: () => None;
	const unwrap: <T>(option: Some<T>) => T;
	const isSome: <T>(option: Option<T>) => option is Some<T>;
	const isNone: (option: Option<unknown>) => option is None;
	const andThen: <T, U>(option: Option<T>, fn: (value: T) => Option<U>) => Option<U>;
	const orElse: <T>(option: Option<T>, fn: () => Option<T>) => Option<T>;
	const match: <T, P, Q>(option: Option<T>, onSome: (value: T) => P, onNone: () => Q) => P | Q;
	const expect: <T>(option: Option<T>, formatter: () => string) => T;
	const withDefault: <T>(option: Option<T>, value: T) => T;
	const map: <T, U>(option: Option<T>, fn: (value: T) => U) => Option<U>;
	const zip: <A extends readonly Option<any>[]>(options: readonly [...A]) => Zip<A>;

	export { some, none, unwrap, isSome, isNone, andThen, orElse, match, expect, withDefault, map, zip };
}

declare namespace R {
	const OK_SYMBOL: unique symbol;
	const ERR_SYMBOL: unique symbol;

	export type Result<T, E> = Ok<T> | Err<E>;
	export interface Ok<T> { [OK_SYMBOL]: T; }
	export interface Err<E> { [ERR_SYMBOL]: E; }

	type All<A> = AllRec<A, [], never>;
	type AllRec<A, T extends any[], E> = A extends readonly [Result<infer U, infer F>, ...infer Rest]
		? AllRec<Rest, [...T, U], E | F>
		: Result<T, E>;
	type Any<A> = AnyRec<A, never, []>;
	type AnyRec<A, T, E extends any[]> = A extends readonly [Result<infer U, infer F>, ...infer Rest]
		? AnyRec<Rest, T | U, [...E, F]>
		: Result<T, E>;

	const ok: <T>(value: T) => Ok<T>;
	const err: <E>(error: E) => Err<E>;
	const unwrap: <T>(result: Ok<T>) => T;
	const unwrapErr: <E>(result: Err<E>) => E;
	const isOk: <T>(result: Result<T, unknown>) => result is Ok<T>;
	const isErr: <E>(result: Result<unknown, E>) => result is Err<E>;
	const andThen: <T, U, E>(result: Result<T, E>, fn: (value: T) => Result<U, E>) => Result<U, E>;
	const orElse: <T, E, F>(result: Result<T, E>, fn: (error: E) => Result<T, F>) => Result<T, F>;
	const match: <T, E, P, Q>(result: Result<T, E>, onOk: (value: T) => P, onErr: (error: E) => Q) => P | Q;
	const expect: <T, E>(result: Result<T, E>, formatter: (error: E) => string) => T;
	const attempt: <T>(fn: () => T) => Result<T, unknown>;
	const map: <T, U, E>(result: Result<T, E>, fn: (value: T) => U) => Result<U, E>;
	const mapErr: <T, E, F>(result: Result<T, E>, fn: (error: E) => F) => Result<T, F>;
	const all: <A extends readonly Result<any, any>[]>(results: readonly [...A]) => All<A>;
	const any: <A extends readonly Result<any, any>[]>(results: readonly [...A]) => Any<A>;

	export { ok, err, unwrap, unwrapErr, isOk, isErr, andThen, orElse, match, expect, attempt, map, mapErr, all, any };
}

declare namespace L {
	const NIL_SYMBOL: unique symbol;
	const CONS_SYMBOL: unique symbol;

	export type List<T> = Nil | Cons<T>;
	export interface Nil { [NIL_SYMBOL]: never; }
	export interface Cons<T> { [CONS_SYMBOL]: T; }

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

	export { nil, cons, singleton, empty, head, tail, match, find, some, every, reverse, reduce, reduceRight, map, toArray };
}

declare namespace S {
	const ellipsis: (s: string, length: number) => string;
	const debug: (value: unknown, replacer?: (value: unknown) => unknown) => string;

	export { ellipsis, debug };
}

declare namespace U {
	type ArgsSerializer<F extends (...args: any[]) => any> = (args: Parameters<F>) => string | number;
	type EqualFn<F extends (...args: any[]) => any> = (a: Parameters<F>, b: Parameters<F>) => boolean;

	const simpleEqual: <T>(a: T, b: T) => boolean;
	const memo: <F extends (...args: any[]) => any>(fn: F, size: number, serialize?: ArgsSerializer<F>) => F;
	const memo1: <F extends (...args: any[]) => any>(fn: F, eq?: EqualFn<F>) => F;
	const memoW: <F extends (obj: object) => any>(fn: F) => F;

	export { simpleEqual, memo, memo1, memoW };
}

declare namespace G {
	const PARSER_SYMBOL: unique symbol;

	export type Source = ArrayLike<unknown>;
	export type Context<S> = {
		source: S;
		position: number;
	};

	export type PartialParser<S, T, E> = { [PARSER_SYMBOL]: [S, T, E]; };
	export type Parser<S, T, E> = (source: S) => R.Result<T, E>;

	export type ParseOptions = {
		noCache?: boolean;
	};

	export type TokenError<S, C> = {
		type: 'token';
		context: Context<S>;
		name: string;
		cause: C;
	};
	export type EofError<S> = {
		type: 'eof';
		context: Context<S>;
	};
	export type PathError<S, E extends any[]> = {
		type: 'path';
		context: Context<S>;
		errors: E;
	};
	export type AndError<S, E> = {
		type: 'and';
		context: Context<S>;
		error: E;
	};
	export type NotError<S, T> = {
		type: 'not';
		context: Context<S>;
		value: T;
	};
	export type ValidationError<S, V> = {
		type: 'validation';
		context: Context<S>;
		cause: V;
	};

	export type AcceptToken<S, T, C> = (source: S, position: number) => R.Result<[T, number], C>;
	export type SeqOf<P> = SeqOfRec<P, unknown, [], never>;
	type SeqOfRec<P, S, T extends any[], E> =
		P extends readonly [PartialParser<infer R, infer U, infer F>, ...infer Rest]
		? SeqOfRec<Rest, S & R, [...T, U], E | F>
		: PartialParser<S, IncludesNever<T> extends true ? never : T, E>;
	export type OneOf<P> = OneOfRec<P, unknown, never, []>;
	type OneOfRec<P, S, T, E extends any[]> =
		P extends readonly [PartialParser<infer R, infer U, infer F>, ...infer Rest]
		? OneOfRec<Rest, S & R, T | U, [...E, F]>
		: PartialParser<S, T, IncludesNever<E> extends true ? never : PathError<S, E>>;
	export type Validator<T, U, V> = (value: T) => R.Result<U, V>;
	export type ErrorFormatter<E> = (error: E) => string;

	const token: <S, T, C>(name: string, accept: AcceptToken<S, T, C>) => PartialParser<S, T, TokenError<S, C>>;
	const eof: <S>() => PartialParser<S, null, EofError<S>>;
	const succeed: <S, T>(value: T) => PartialParser<S, T, never>;
	const fail: <S, E>(error: E) => PartialParser<S, never, E>;
	const andThen: <S, T, U, E, F>(
		parser: PartialParser<S, T, E>,
		fn: (value: T) => PartialParser<S, U, F>,
	) => PartialParser<S, U, E | F>;
	const orElse: <S, T, U, E, F>(
		parser: PartialParser<S, T, E>,
		fn: (error: E) => PartialParser<S, U, F>,
	) => PartialParser<S, T | U, F>;
	const if_: <S, T, U, V, E, F, G>(
		cond: PartialParser<S, T, E>,
		then: (value: T) => PartialParser<S, U, F>,
		else_: (error: E) => PartialParser<S, V, G>,
	) => PartialParser<S, U, F> | PartialParser<S, V, G>;
	const map: <S, T, U, E>(parser: PartialParser<S, T, E>, fn: (value: T) => U) => PartialParser<S, U, E>;
	const mapError: <S, T, E, F>(parser: PartialParser<S, T, E>, fn: (error: E) => F) => PartialParser<S, T, F>;
	const seqOf: <P extends readonly PartialParser<any, any, any>[]>(parsers: readonly [...P]) => SeqOf<P>;
	const oneOf: <P extends readonly PartialParser<any, any, any>[]>(parsers: readonly [...P]) => OneOf<P>;
	const optional: <S, P>(parser: PartialParser<S, P, unknown>) => PartialParser<S, O.Option<P>, never>;
	const many: <S, P>(parser: PartialParser<S, P, unknown>) => PartialParser<S, P[], never>;
	const many1: <S, P, E>(parser: PartialParser<S, P, E>) => PartialParser<S, P[], E>;
	const and: <S, T, E, F>(
		pred: PartialParser<S, unknown, F>,
		parser: PartialParser<S, T, E>,
	) => PartialParser<S, T, E | AndError<S, F>>;
	const not: <S, T, U, E>(
		pred: PartialParser<S, U, unknown>,
		parser: PartialParser<S, T, E>,
	) => PartialParser<S, T, E | NotError<S, U>>;
	const ref: <S, T, U>(getter: () => PartialParser<S, T, U>) => PartialParser<S, T, U>;
	const validate: <S, T, U, E, V>(parser: PartialParser<S, T, E>, validator: Validator<T, U, V>)
		=> PartialParser<S, U, E | ValidationError<S, V>>;
	const memo: <S, T, E>(parser: PartialParser<S, T, E>) => PartialParser<S, T, E>;
	const make: <S, T, E>(parser: PartialParser<S, T, E>, options?: ParseOptions) => Parser<S, T, E>;
	const parse: <S extends Source, T, E>(source: S, parser: Parser<S, T, E>, errorFormatter?: ErrorFormatter<E>) => T;
	const makeDefaultErrorFormatter: (
		tokenErrorFormatter: ErrorFormatter<unknown>,
		validationErrorFormatter: ErrorFormatter<unknown>,
	) => ErrorFormatter<unknown>;
	const defaultErrorFormatter: ErrorFormatter<unknown>;

	export {
		token,
		eof,
		succeed,
		fail,
		andThen,
		orElse,
		if_ as if,
		map,
		mapError,
		seqOf,
		oneOf,
		optional,
		many,
		many1,
		and,
		not,
		ref,
		validate,
		memo,
		make,
		parse,
		makeDefaultErrorFormatter,
		defaultErrorFormatter,
	};
}

declare namespace E {
	export type Term = 'number' | 'identifier';
	export type UnaryOperator = '+' | '-' | '!';
	export type BinaryOperator = '+' | '-' | '*' | '/' | '%' | '**' | '===' | '!==' | '<=' | '>=' | '<' | '>' | '&&' | '||';
	export type OtherSymbol = '(' | ')' | '[' | ']' | ',' | '.' | '?' | ':';
	export type Unknown = 'unknown';

	export type TokenType = Term | UnaryOperator | BinaryOperator | OtherSymbol | Unknown;
	export type Token<T extends TokenType> = {
		type: T;
		start: number;
		end: number;
	};
	export type AnyToken = Token<TokenType>;
	export type NumberToken = Token<'number'>;
	export type IdentifierToken = Token<'identifier'>;
	export type UnknownToken = Token<'unknown'>;

	export type NumberNode = {
		type: 'number';
		value: NumberToken;
	};
	export type IdentifierNode = {
		type: 'identifier';
		name: IdentifierToken;
	};
	export type MemberAccessNode = {
		type: 'member-access';
		object: ExpressionNode;
		property: IdentifierNode;
	};
	export type ElementAccessNode = {
		type: 'element-access';
		array: ExpressionNode;
		index: ExpressionNode;
	};
	export type FunctionCallNode = {
		type: 'function-call';
		callee: ExpressionNode;
		args: ExpressionNode[];
	};
	export type UnaryOperatorNode = {
		type: 'unary-operator';
		operator: Token<UnaryOperator>;
		expr: ExpressionNode;
	};
	export type BinaryOperatorNode = {
		type: 'binary-operator';
		operator: Token<BinaryOperator>;
		lhs: ExpressionNode;
		rhs: ExpressionNode;
	};
	export type ConditionalOperatorNode = {
		type: 'conditional-operator';
		if: ExpressionNode;
		then: ExpressionNode;
		else: ExpressionNode;
	};
	export type ExpressionNode =
		| NumberNode
		| IdentifierNode
		| MemberAccessNode
		| ElementAccessNode
		| FunctionCallNode
		| UnaryOperatorNode
		| BinaryOperatorNode
		| ConditionalOperatorNode;

	export type ParseError = G.TokenError<string, AnyToken | null> | G.EofError<string>;

	export type ReferenceError = {
		type: 'reference';
		name: string;
	};
	export type PropertyError = {
		type: 'property';
		property: string;
	};
	export type RangeError = {
		type: 'range';
		index: number;
	};
	export type TypeError = {
		type: 'type';
		expected: 'number' | 'boolean' | 'object' | 'function' | 'array';
		actual: unknown;
	};
	export type SecurityError = {
		type: 'security';
		target: string;
	};
	export type RuntimeError =
		| ReferenceError
		| PropertyError
		| RangeError
		| TypeError
		| SecurityError;

	export type CompilationError = { source: string, error: ParseError; };
	export type CompilationResult = R.Result<Evaluator, CompilationError>;
	export type Evaluator = (args: object) => R.Result<number, RuntimeError>;
	export type ParseErrorFormatter = (source: string, error: ParseError) => string;
	export type RuntimeErrorFormatter = (error: RuntimeErrorFormatter) => string;

	const tokenize: (source: string) => AnyToken[];
	const parse: (source: readonly AnyToken[]) => R.Result<ExpressionNode, ParseError>;
	const build: (source: string, node: ExpressionNode) => Evaluator;
	const compile: (source: string) => CompilationResult;
	const expect: (result: CompilationResult, errorFormatter?: ParseErrorFormatter) => Evaluator;
	const run: (evaluator: Evaluator, env: object, errorFormatter?: RuntimeErrorFormatter) => number;
	const interpret: (
		source: string,
		env: object,
		parseErrorFormatter?: ParseErrorFormatter,
		runtimeErrorFormatter?: RuntimeErrorFormatter,
	) => number;

	export { tokenize, parse, build, compile, expect, run, interpret };
}

declare namespace P {
	export type Parser<T, E> = (s: string) => R.Result<T, E>;
	export type EntryParser<K extends string, T, E> = (object: object) => R.Result<[K, T], E>;

	export type FormatError<K> = {
		type: 'format';
		source: string;
		expected: K;
	};
	export type JsonError = {
		type: 'json';
		source: string;
		inner: Error;
	};
	export type ValidationError<V> = {
		type: 'validation';
		source: string;
		cause: V;
	};

	export type Archetype = Parser<any, any> | readonly [Archetype] | { [key: string]: Archetype; };
	export type Validator<T, U, V> = (value: T) => R.Result<U, V>;
	export type ErrorFormatter<E> = (error: E) => string;

	type Struct<P> = StructRec<P, {}, never>;
	type StructRec<P, T, E> = P extends [EntryParser<infer K, infer U, infer F>, ...infer Rest]
		? StructRec<Rest, T & Record<K, U>, E | F>
		: Parser<T, E | JsonError | FormatError<"struct">>;
	type Make<A> = Parser<MakeValue<A>, MakeError<A>>;
	type MakeValue<A> =
		A extends Parser<infer T, any> ? T :
		A extends readonly [Archetype] ? MakeValue<A[0]>[] :
		A extends { [key: string]: Archetype; } ? { [K in keyof A]: MakeValue<A[K]> } : never;
	type MakeError<A> =
		A extends Parser<any, infer E> ? E :
		A extends readonly [Archetype] ? MakeError<A[0]> | JsonError | FormatError<"array"> :
		A extends { [key: string]: Archetype; } ? MakeError<A[keyof A]> | JsonError | FormatError<"struct"> : never;

	const succeed: <T>(value: T) => Parser<T, never>;
	const fail: <E>(error: E) => Parser<never, E>;
	const andThen: <T, U, E, F>(parser: Parser<T, E>, fn: (value: T) => Parser<U, F>) => Parser<U, E | F>;
	const orElse: <T, U, E, F>(parser: Parser<T, E>, fn: (error: E) => Parser<U, F>) => Parser<T | U, F>;
	const map: <T, U, E>(parser: Parser<T, E>, fn: (value: T) => U) => Parser<U, E>;
	const mapError: <T, E, F>(parser: Parser<T, E>, fn: (error: E) => F) => Parser<T, F>;
	const withDefault: <T, E>(parser: Parser<T, E>, value: T) => Parser<T, E>;
	const validate: <T, U, E, V>(parser: Parser<T, E>, validator: Validator<T, U, V>) => Parser<U, E | ValidationError<V>>;
	const empty: Parser<undefined, FormatError<"empty">>;
	const integer: Parser<number, FormatError<"integer">>;
	const number: Parser<number, FormatError<"number">>;
	const string: Parser<string, never>;
	const boolean: Parser<boolean, FormatError<"boolean">>;
	const custom: <T, K>(fn: (s: string) => R.Result<T, K>) => Parser<T, FormatError<K>>;
	const json: Parser<unknown, JsonError>;
	const array: <T, E>(parser: Parser<T, E>) => Parser<T[], E | JsonError | FormatError<"array">>;
	const struct: <P extends readonly EntryParser<any, any, any>[]>(parsers: readonly [...P]) => Struct<P>;
	const entry: <K extends string, T, E>(key: K, parser: Parser<T, E>) => EntryParser<K, T, E>;
	const make: <A extends Archetype>(archetype: A) => Make<A>;
	const parse: <T, E>(s: string, parser: Parser<T, E>, errorFormatter?: ErrorFormatter<E>) => T;
	const parseAll: <P extends { [key: string]: Parser<any, any>; }>(
		args: { [K in keyof P]: string },
		parsers: P,
		errorFormatter?: ErrorFormatter<P[keyof P] extends Parser<any, infer E> ? E : never>
	) => { [K in keyof P]: P[K] extends Parser<infer T, any> ? T : never };
	const makeDefaultErrorFormatter: (validationErrorFormatter: ErrorFormatter<unknown>) => ErrorFormatter<unknown>;
	const defaultErrorFormatter: ErrorFormatter<unknown>;

	export {
		succeed,
		fail,
		andThen,
		orElse,
		map,
		mapError,
		withDefault,
		validate,
		empty,
		integer,
		number,
		string,
		boolean,
		custom,
		json,
		array,
		struct,
		entry,
		make,
		parse,
		parseAll,
		makeDefaultErrorFormatter,
		defaultErrorFormatter,
	};
}

declare namespace N {
	type Source = string;

	export type PartialParser<T, E> = G.PartialParser<Source, T, E>;
	export type Parser<T, E> = G.Parser<Source, T, E>;

	export type TokenError<C> = G.TokenError<Source, C>;
	export type EofError = G.EofError<Source>;
	export type ValidationError<V> = G.ValidationError<Source, V>;

	export type SymbolError = {
		type: 'symbol';
		source: Source;
		start: number;
		symbol: string;
	};
	export type RegexpError = {
		type: 'regexp';
		source: Source;
		start: number;
		regexp: RegExp;
	};

	export type Validator<T, U, V> = G.Validator<T, U, V>;
	export type ErrorFormatter<E> = G.ErrorFormatter<E>;

	type SeqOf<P> = G.SeqOf<P>;
	type OneOf<P> = G.OneOf<P>;
	type Join<P, F> = SeqOf<P> extends PartialParser<infer T, infer E> ? PartialParser<T, E | F> : never;

	const succeed: <T>(value: T) => PartialParser<T, never>;
	const fail: <E>(error: E) => PartialParser<never, E>;
	const map: <T, U, E>(parser: PartialParser<T, E>, fn: (value: T) => U) => PartialParser<U, E>;
	const mapError: <T, E, F>(parser: PartialParser<T, E>, fn: (error: E) => F) => PartialParser<T, F>;
	const seqOf: <P extends readonly PartialParser<any, any>[]>(parsers: readonly [...P]) => SeqOf<P>;
	const oneOf: <P extends readonly PartialParser<any, any>[]>(parsers: readonly [...P]) => OneOf<P>;
	const validate: <T, U, E, V>(parser: PartialParser<T, E>, validator: Validator<T, U, V>)
		=> PartialParser<U, E | ValidationError<V>>;
	const symbol: <S extends string>(s: S) => PartialParser<S, TokenError<SymbolError>>;
	const regexp: <T = string>(name: string, re: RegExp, fn?: (...captures: string[]) => T)
		=> PartialParser<T, TokenError<RegexpError>>;
	const spacing: PartialParser<string, never>;
	const spaces: PartialParser<string, TokenError<RegexpError>>;
	const natural: PartialParser<number, TokenError<RegexpError>>;
	const integer: PartialParser<number, TokenError<RegexpError>>;
	const number: PartialParser<number, TokenError<RegexpError>>;
	const boolean: PartialParser<boolean, TokenError<RegexpError>>;
	const text: PartialParser<string, TokenError<RegexpError>>;
	const margin: <T, E>(parser: PartialParser<T, E>) => PartialParser<T, E>;
	const group: <T, E, F, G>(parser: PartialParser<T, E>, begin: PartialParser<unknown, F>, end: PartialParser<unknown, G>)
		=> PartialParser<T, E | F | G>;
	const parens: <T, E>(parser: PartialParser<T, E>) => PartialParser<T, E | TokenError<SymbolError | RegexpError>>;
	const braces: <T, E>(parser: PartialParser<T, E>) => PartialParser<T, E | TokenError<SymbolError | RegexpError>>;
	const brackets: <T, E>(parser: PartialParser<T, E>) => PartialParser<T, E | TokenError<SymbolError | RegexpError>>;
	const endWith: <T, E>(parser: PartialParser<T, E>) => PartialParser<T, E | EofError>;
	const withDefault: <T, E>(parser: PartialParser<T, E>, value: T) => PartialParser<T, E>;
	const chain: <T>(item: PartialParser<T, unknown>, delimiter: PartialParser<unknown, unknown>) => PartialParser<T[], never>;
	const chain1: <T, E>(item: PartialParser<T, E>, delimiter: PartialParser<unknown, unknown>) => PartialParser<T[], E>;
	const join: <P extends readonly PartialParser<any, any>[], F>(items: readonly [...P], delimiter: PartialParser<unknown, F>)
		=> Join<P, F>;
	const list: <T>(parser: PartialParser<T, unknown>) => PartialParser<T[], never>;
	const tuple: <P extends readonly PartialParser<any, any>[]>(parsers: readonly [...P]) => Join<P, TokenError<RegexpError>>;
	const make: <T, E>(parser: PartialParser<T, E>) => Parser<T, E>;
	const parse: <T, E>(source: Source, parser: Parser<T, E>, errorFormatter?: ErrorFormatter<E>) => T;
	const defaultTokenErrorFormatter: ErrorFormatter<unknown>;
	const makeDefaultErrorFormatter: (validationErrorFormatter: ErrorFormatter<unknown>) => ErrorFormatter<unknown>;
	const defaultErrorFormatter: ErrorFormatter<unknown>;

	export {
		succeed,
		fail,
		map,
		mapError,
		seqOf,
		oneOf,
		validate,
		symbol,
		regexp,
		spacing,
		spaces,
		natural,
		integer,
		number,
		boolean,
		text,
		margin,
		group,
		parens,
		braces,
		brackets,
		endWith,
		withDefault,
		chain,
		chain1,
		join,
		list,
		tuple,
		make,
		parse,
		defaultTokenErrorFormatter,
		makeDefaultErrorFormatter,
		defaultErrorFormatter,
	};
}

declare namespace M {
	export type Meta = { [key: string]: string | true; };

	export type Parser<T, E> = (meta: Meta) => R.Result<O.Option<T>, E>;
	export type MetaParser<T> = (meta: Meta) => T;
	export type AttrParser<T, C> = (source: string) => R.Result<T, C>;

	export type NotationError = {
		type: 'notation';
		expected: 'flag' | 'attr';
		name: string;
		value: string | true;
	};
	export type AttributeError<C> = {
		type: 'attribute';
		name: string;
		source: string;
		cause: C;
	};

	export type Archetype = Parser<any, any> | readonly [Archetype, ...Archetype[]] | { [key: string]: Archetype; };
	export type ErrorFormatter<E> = (error: E) => string;

	type OneOf<P> = OneOfRec<P, never, never>;
	type OneOfRec<P, T, E> = P extends readonly [Parser<infer U, infer F>, ...infer Rest]
		? OneOfRec<Rest, T | U, E | F>
		: Parser<T, E>;
	type Make<A> = Parser<MakeValue<A>, MakeError<A>>;
	type MakeValue<A> =
		A extends Parser<infer T, any> ? T :
		A extends object ? { [K in keyof A]: MakeValue<A[K]> } : never;
	type MakeError<A> =
		A extends Parser<any, infer E> ? E :
		A extends readonly [infer F, ...infer R] ? MakeError<F> | MakeError<R> :
		A extends { [key: string]: Archetype; } ? MakeError<A[keyof A]> : never;

	const flag: (name: string) => Parser<boolean, NotationError>;
	const attr: <T, C>(name: string, parser: AttrParser<T, C>) => Parser<T, NotationError | AttributeError<C>>;
	const attrN: <T, C>(name: string, parser: N.PartialParser<T, C>) => Parser<T, NotationError | AttributeError<C>>;
	const succeed: <T>(value: T) => Parser<T, never>;
	const miss: () => Parser<never, never>;
	const fail: <E>(error: E) => Parser<never, E>;
	const andThen: <T, U, E, F>(parser: Parser<T, E>, fn: (value: T) => Parser<U, F>) => Parser<U, E | F>;
	const orElse: <T, U, E, F>(parser: Parser<T, E>, fn: () => Parser<U, F>) => Parser<T | U, E | F>;
	const map: <T, U, E>(parser: Parser<T, E>, fn: (value: T) => U) => Parser<U, E>;
	const mapError: <T, E, F>(parser: Parser<T, E>, fn: (error: E) => F) => Parser<T, F>;
	const withDefault: <T, E>(parser: Parser<T, E>, value: T) => Parser<T, E>;
	const oneOf: <P extends readonly Parser<any, any>[]>(parsers: readonly [...P]) => OneOf<P>;
	const make: <A extends Archetype>(archetype: A) => Make<A>;
	const parse: <T, E>(meta: Meta, parser: Parser<T, E>, errorFormatter?: ErrorFormatter<E>) => T;
	const meta: <T, E>(parser: Parser<T, E>, errorFormatter?: ErrorFormatter<E>) => MetaParser<T>;
	const makeDefaultErrorFormatter: (attributeErrorFormatter: ErrorFormatter<unknown>) => ErrorFormatter<unknown>;
	const defaultErrorFormatter: ErrorFormatter<unknown>;

	export {
		flag,
		attr,
		attrN,
		succeed,
		miss,
		fail,
		andThen,
		orElse,
		map,
		mapError,
		withDefault,
		oneOf,
		make,
		parse,
		meta,
		makeDefaultErrorFormatter,
		defaultErrorFormatter,
	};
}

declare namespace Z {
	export type Define<T, D extends Partial<T>> = (base: (this_: T) => T) => D & ThisType<T>;
	export type ExtProp<T> = {
		get: (owner: unknown) => T;
		set: (owner: unknown, value: T) => void;
	};
	export type WeakExtProp<T> = ExtProp<T> & { delete: (owner: unknown) => void; };
	export type FullExtProp<T> = WeakExtProp<T> & { clear: () => void; };
	export type Swapper<K extends string> = <O extends { [P in K]: any }, R>(owner: O, value: O[K], block: () => R) => R;
	export type Context<T> = {
		enter<R>(owner: unknown, value: T, block: () => R): R;
		value(owner: unknown): T;
		exists(owner: unknown): boolean;
	};

	const pluginName: () => string | undefined;
	const redef: <T, D>(target: T, define: Define<T, D>) => void;
	const extProp: (<T>(defaultValue: T, nonWeak?: false) => WeakExtProp<T>)
		& (<T>(defaultValue: T, nonWeak: true) => FullExtProp<T>);
	const extend: <T>(target: unknown, name: string, prop: ExtProp<T>) => void;
	const swapper: <K extends string>(key: K) => Swapper<K>;
	const context: <T>(defaultValue: T) => Context<T>;
	const defer: (cleanup: () => void) => <R>(block: () => R) => R;
	const enclose: <R>(begin: () => void, end: () => void, block: () => R) => R;

	export { pluginName, redef, extProp, extend, swapper, context, defer, enclose };
}

export { };