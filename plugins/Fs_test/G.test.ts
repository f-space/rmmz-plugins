import "./JestExt";
import Fs from "./Fs";

const { O, R, S, U, G } = Fs;

const parse = <S, T, E>(source: S, parser: Fs.G.Parser<S, T, E>) => G.make(parser)(source);

const tokenError = (position: number, name: string) => ({ type: 'token', context: { position }, name });
const eofError = (position: number) => ({ type: 'eof', context: { position } });
const pathError = <E>(position: number, errors: E[]) => ({ type: 'path', context: { position }, errors });
const andError = <E>(position: number, error: E) => ({ type: 'and', context: { position }, error });
const notError = <T>(position: number, value: T) => ({ type: 'not', context: { position }, value });
const validationError = <C>(position: number, cause: C) => ({ type: 'validation', context: { position }, cause });

const char = (c: string) => G.token(c, (s: string, i) =>
	s[i] === c ? R.ok([c, i + 1]) : R.err(() => `"${s[i]}" !== "${c}"`)
);

const str = (str: string) => G.token(str, (s: string, i) =>
	s.slice(i).startsWith(str)
		? R.ok([s.slice(i, i + str.length), i + str.length])
		: R.err(() => `"${S.ellipsis(s, 10)}" !== "${str}"`)
);

const elem = <T>(x: T) => G.token(S.debug(x), (s: readonly T[], i) =>
	U.simpleEqual(s[i], x)
		? R.ok([s[i], i + 1])
		: R.err(() => `${S.debug(s[i])} !== ${S.debug(x)}`)
);

test("token", () => {
	expect(parse("foo", str("foo"))).toEqualOk("foo");
	expect(parse("bar", str("foo"))).toMatchErr(tokenError(0, "foo"));
	expect(parse([{ foo: 42 }], elem({ foo: 42 }))).toEqualOk({ foo: 42 });
	expect(parse([{ bar: 42 }], elem({ foo: 42 }) as any)).toMatchErr(tokenError(0, "{ foo: 42 }"));
});

test("eof", () => {
	expect(parse("", G.eof())).toEqualOk(null);
	expect(parse(" ", G.eof())).toMatchErr(eofError(0));
	expect(parse([], G.eof())).toEqualOk(null);
	expect(parse([,], G.eof())).toMatchErr(eofError(0));
});

test("succeed", () => {
	expect(parse("", G.succeed(42))).toEqualOk(42);
});

test("fail", () => {
	expect(parse("", G.fail(42))).toMatchErr(42);
});

test("andThen", () => {
	expect(parse("ab", G.andThen(char("a"), () => char("b")))).toEqualOk("b");
});

test("orElse", () => {
	expect(parse("ab", G.orElse(char("b"), () => char("a")))).toEqualOk("a");
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
		pathError(0, [tokenError(0, "a"), tokenError(0, "b"), tokenError(0, "c")])
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
	expect(parse("a", G.and(char("a")))).toEqualOk(null);
	expect(parse("a", G.andThen(G.and(char("a")), () => char("a")))).toEqualOk("a");
	expect(parse("b", G.and(char("a")))).toMatchErr(andError(0, tokenError(0, "a")));
	expect(parse("b", G.andThen(G.and(char("a")), () => char("b")))).toMatchErr(andError(0, tokenError(0, "a")));
});

test("not", () => {
	expect(parse("b", G.not(char("a")))).toEqualOk(null);
	expect(parse("b", G.andThen(G.not(char("a")), () => char("b")))).toEqualOk("b");
	expect(parse("a", G.not(char("a")))).toMatchErr(notError(0, "a"));
	expect(parse("a", G.andThen(G.not(char("a")), () => char("a")))).toMatchErr(notError(0, "a"));
});

test("validate", () => {
	const validator = (c: string) => c === "a" ? R.ok(c) : R.err("not-a");
	expect(parse("a", G.validate(char("a"), validator))).toEqualOk("a");
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
	expect(G.parse("a", char("a"))).toEqual("a");
	expect(() => G.parse("b", char("a"), e => e.type)).toThrow(new Error(tokenError(0, "a").type));
});