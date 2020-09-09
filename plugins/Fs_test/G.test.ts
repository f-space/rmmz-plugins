import Fs from "./Fs";

const { O, R, S, U, G } = Fs;

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
	expect(G.parse("foo", str("foo"))).toBe("foo");
	expect(() => G.parse("bar", str("foo"))).toThrow();
	expect(G.parse([{ foo: 42 }], elem({ foo: 42 }))).toEqual({ foo: 42 });
	expect(() => G.parse([{ bar: 42 }], elem({ foo: 42 }) as any)).toThrow();
});

test("eof", () => {
	expect(G.parse("", G.eof())).toBe(null);
	expect(() => G.parse(" ", G.eof())).toThrow();
	expect(G.parse([], G.eof())).toBe(null);
	expect(() => G.parse([,], G.eof())).toThrow();
});

test("succeed", () => {
	expect(G.parse("", G.succeed(42))).toBe(42);
});

test("fail", () => {
	expect(() => G.parse("", G.fail(42))).toThrow();
});

test("andThen", () => {
	expect(G.parse("ab", G.andThen(char("a"), () => char("b")))).toBe("b");
});

test("orElse", () => {
	expect(G.parse("ab", G.orElse(char("b"), () => char("a")))).toBe("a");
});

test("map", () => {
	expect(G.parse("a", G.map(char("a"), c => c + "b"))).toBe("ab");
});

test("mapError", () => {
	expect(() => G.parse("a", G.mapError(char("b"), () => "foo"))).toThrow("foo");
});

test("seqOf", () => {
	expect(G.parse("abc", G.seqOf([char("a"), char("b"), char("c")]))).toEqual(["a", "b", "c"]);
	expect(() => G.parse("abd", G.seqOf([char("a"), char("b"), char("c")]))).toThrow();
});

test("oneOf", () => {
	expect(G.parse("c", G.oneOf([char("a"), char("b"), char("c")]))).toBe("c");
	expect(() => G.parse("d", G.oneOf([char("a"), char("b"), char("c")]))).toThrow();
});

test("optional", () => {
	expect(G.parse("", G.optional(char("a")))).toEqual(O.none());
	expect(G.parse("a", G.optional(char("a")))).toEqual(O.some("a"));
});

test("many", () => {
	expect(G.parse("", G.many(char("a")))).toEqual([]);
	expect(G.parse("a", G.many(char("a")))).toEqual(["a"]);
	expect(G.parse("aaa", G.many(char("a")))).toEqual(["a", "a", "a"]);
});

test("many1", () => {
	expect(G.parse("a", G.many1(char("a")))).toEqual(["a"]);
	expect(G.parse("aaa", G.many1(char("a")))).toEqual(["a", "a", "a"]);
	expect(() => G.parse("", G.many1(char("a")))).toThrow();
});

test("and", () => {
	expect(G.parse("a", G.and(char("a")))).toBe(null);
	expect(G.parse("a", G.andThen(G.and(char("a")), () => char("a")))).toBe("a");
	expect(() => G.parse("b", G.and(char("a")))).toThrow();
	expect(() => G.parse("b", G.andThen(G.and(char("a")), () => char("b")))).toThrow();
});

test("not", () => {
	expect(G.parse("b", G.not(char("a")))).toBe(null);
	expect(G.parse("b", G.andThen(G.not(char("a")), () => char("b")))).toBe("b");
	expect(() => G.parse("a", G.not(char("a")))).toThrow();
	expect(() => G.parse("a", G.andThen(G.not(char("a")), () => char("a")))).toThrow();
});

test("validate", () => {
	const validator = (c: string) => c === "a" ? R.ok(c) : R.err("not-a");
	expect(G.parse("a", G.validate(char("a"), validator))).toBe("a");
	expect(() => G.parse("b", G.validate(char("b"), validator))).toThrow("not-a");
});

test("memo", () => {
	const p = G.memo(char("a"));
	expect(G.parse("a", G.memo(char("a")))).toBe("a");
	expect(G.parse("ab", G.memo(G.seqOf([G.memo(char("a")), G.memo(char("b"))])))).toEqual(["a", "b"]);
	expect(G.parse("b", G.memo(G.oneOf([G.memo(char("a")), G.memo(char("b"))])))).toBe("b");
	expect(G.parse("ba", G.oneOf([p, G.seqOf([char("b"), p])]))).toEqual(["b", "a"]);
});

test("make", () => {
	expect(G.make(char("a"))("a")).toEqual(R.ok("a"));
	expect(G.make(G.mapError(char("a"), e => ({ ...e, cause: e.cause() })))("b"))
		.toMatchObject(R.err({ type: 'token', name: "a", cause: '"b" !== "a"' }));
});