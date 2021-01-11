import "./JestExt";
import Fs from "./Fs";

const { O, R, U, G } = Fs;

type PartialParser<S, T, E> = Fs.G.PartialParser<S, T, E>;

const parse = <S, T, E>(source: S, parser: PartialParser<S, T, E>) => G.make(parser)(source);

const tokenError = <C>(position: number, cause: C) => ({ type: 'token' as const, context: { position }, cause });
const eoiError = (position: number) => ({ type: 'eoi' as const, context: { position } });
const andError = <E>(position: number, error: E) => ({ type: 'and' as const, context: { position }, error });
const notError = <T>(position: number, value: T) => ({ type: 'not' as const, context: { position }, value });
const validationError = <C>(position: number, cause: C) => ({ type: 'validation' as const, context: { position }, cause });

const char = (c: string) => G.token((s: string, i) => s[i] === c ? R.ok([c, i + 1]) : R.err(c));

const str = (str: string) => G.token((s: string, i) =>
	s.slice(i).startsWith(str) ? R.ok([s.slice(i, i + str.length), i + str.length]) : R.err(str)
);

const elem = <T>(x: T) => G.token((s: readonly T[], i) =>
	U.simpleEqual(s[i], x) ? R.ok([s[i], i + 1]) : R.err(x)
);

test("token", () => {
	expect(parse("foo", str("foo"))).toEqualOk("foo");
	expect(parse("bar", str("foo"))).toMatchErr(tokenError(0, "foo"));
	expect(parse([{ foo: 42 }], elem({ foo: 42 }))).toEqualOk({ foo: 42 });
	expect(parse([{ bar: 42 }], elem({ foo: 42 }) as any)).toMatchErr(tokenError(0, { foo: 42 }));
});

test("eoi", () => {
	expect(parse("", G.eoi())).toEqualOk(null);
	expect(parse(" ", G.eoi())).toMatchErr(eoiError(0));
	expect(parse([], G.eoi())).toEqualOk(null);
	expect(parse([,], G.eoi())).toMatchErr(eoiError(0));
});

test("succeed", () => {
	expect(parse("", G.succeed(42))).toEqualOk(42);
});

test("fail", () => {
	expect(parse("", G.fail(42))).toEqualErr(42);
});

test("andThen", () => {
	expect(parse("ab", G.andThen(char("a"), () => char("b")))).toEqualOk("b");
	expect(parse("bb", G.andThen(char("a"), () => char("b")))).toMatchErr(tokenError(0, "a"));
	expect(parse("aa", G.andThen(char("a"), () => char("b")))).toMatchErr(tokenError(1, "b"));
	expect(parse("a", G.andThen(char("a"), value => G.succeed(value)))).toEqualOk("a");
});

test("orElse", () => {
	expect(parse("a", G.orElse(char("a"), () => char("b")))).toEqualOk("a");
	expect(parse("b", G.orElse(char("a"), () => char("b")))).toEqualOk("b");
	expect(parse("c", G.orElse(char("a"), () => char("b")))).toMatchErr(tokenError(0, "b"));
	expect(parse("x", G.orElse(char("a"), error => G.fail(error)))).toMatchErr(tokenError(0, "a"));
});

test("if", () => {
	expect(parse("ab", G.if(char("a"), () => char("b"), () => char("c")))).toEqualOk("b");
	expect(parse("c", G.if(char("a"), () => char("b"), () => char("c")))).toEqualOk("c");
	expect(parse("aa", G.if(char("a"), c => char(c), () => char("c")))).toEqualOk("a");
});

test("map", () => {
	expect(parse("a", G.map(char("a"), c => c + "b"))).toEqualOk("ab");
});

test("mapError", () => {
	expect(parse("a", G.mapError(char("b"), () => "foo"))).toMatchErr("foo");
});

test("seqOf", () => {
	expect(parse("abc", G.seqOf([char("a"), char("b"), char("c")]))).toEqualOk(["a", "b", "c"]);
	expect(parse("abd", G.seqOf([char("a"), char("b"), char("c")]))).toMatchErr(tokenError(2, "c"));
});

test("oneOf", () => {
	expect(parse("c", G.oneOf([char("a"), char("b"), char("c")]))).toEqualOk("c");
	expect(parse("d", G.oneOf([char("a"), char("b"), char("c")]))).toMatchErr(
		[tokenError(0, "a"), tokenError(0, "b"), tokenError(0, "c")]
	);
});

test("optional", () => {
	expect(parse("", G.optional(char("a")))).toEqualOk(O.none());
	expect(parse("a", G.optional(char("a")))).toEqualOk(O.some("a"));
});

test("many", () => {
	expect(parse("", G.many(char("a")))).toEqualOk([]);
	expect(parse("a", G.many(char("a")))).toEqualOk(["a"]);
	expect(parse("aaa", G.many(char("a")))).toEqualOk(["a", "a", "a"]);
});

test("many1", () => {
	expect(parse("a", G.many1(char("a")))).toEqualOk(["a"]);
	expect(parse("aaa", G.many1(char("a")))).toEqualOk(["a", "a", "a"]);
	expect(parse("", G.many1(char("a")))).toMatchErr(tokenError(0, "a"));
});

test("and", () => {
	expect(parse("a", G.and(char("a"), char("a")))).toEqualOk("a");
	expect(parse("a", G.and(char("b"), char("a")))).toMatchErr(andError(0, tokenError(0, "b")));
});

test("not", () => {
	expect(parse("a", G.not(char("b"), char("a")))).toEqualOk("a");
	expect(parse("a", G.not(char("a"), char("a")))).toMatchErr(notError(0, "a"));
});

test("ref", () => {
	expect(parse("a", G.ref(() => char("a")))).toEqualOk("a");
	expect(parse("b", G.ref(() => char("a")))).toMatchErr(tokenError(0, "a"));
});

test("validate", () => {
	const validator = (c: string) => c === "a" ? R.ok(c) : R.err("not-a");
	expect(parse("a", G.validate(char("a"), validator))).toEqualOk("a");
	expect(parse("a", G.validate(char("b"), validator))).toMatchErr(tokenError(0, "b"));
	expect(parse("b", G.validate(char("b"), validator))).toMatchErr(validationError(0, "not-a"));
});

test("memo", () => {
	const p = G.memo(char("a"));
	expect(parse("a", G.memo(char("a")))).toEqualOk("a");
	expect(parse("ab", G.memo(G.seqOf([G.memo(char("a")), G.memo(char("b"))])))).toEqualOk(["a", "b"]);
	expect(parse("b", G.memo(G.oneOf([G.memo(char("a")), G.memo(char("b"))])))).toEqualOk("b");
	expect(parse("ba", G.oneOf([p, G.seqOf([char("b"), p])]))).toEqualOk(["b", "a"]);
});

test("parse", () => {
	expect(G.parse("a", G.make(char("a")))).toEqual("a");
	expect(() => G.parse("b", G.make(char("a")), e => e.type)).toThrow(new Error(tokenError(0, "a").type));
});

test("error-message", () => {
	const error = <T, E>(source: string, parser: PartialParser<string, T, E>) =>
		R.mapErr(G.make(parser)(source), G.makeDefaultErrorFormatter(tokenErrorFormatter, validationErrorFormatter));
	const tokenErrorFormatter = (error: string) => `failed to parse '${error}' token`;
	const validationErrorFormatter = (error: string) => `validation to "${error}" failed`;

	expect(error("foo", str("bar"))).toEqualErr(`failed to parse 'bar' token`);
	expect(error("foo", G.eoi())).toEqualErr(`end-of-input expected, but "foo" found`);
	expect(error("foo", G.and(str("bar"), G.succeed(0)))).toEqualErr(`and-predicate failed at "foo"`);
	expect(error("foo", G.not(str("foo"), G.succeed(0)))).toEqualErr(`not-predicate failed at "foo"`);
	expect(error("foo", G.validate(str("foo"), s => R.err(s)))).toEqualErr(`validation to "foo" failed`);
	expect(error("foo", G.fail("bar"))).toEqualErr(`unknown error: "bar"`);

	expect(error("foo", G.oneOf([str("bar"), str("baz")]))).toEqualErr(`failed to parse 'bar' token`);
	expect(error("foo", G.oneOf([str("bar"), G.seqOf([char("f"), char("s")])]))).toEqualErr(`failed to parse 's' token`);
});