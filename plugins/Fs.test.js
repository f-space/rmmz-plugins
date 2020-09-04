require("./Fs");

const { O, R, L, S, U, G, P, M, N, Z } = Fs;

describe("O", () => {
	test("basics", () => {
		expect(O.isSome(O.some(42))).toBe(true);
		expect(O.isSome(O.none())).toBe(false);
		expect(O.isSome(O.some(O.none()))).toBe(true);
		expect(O.isNone(O.none())).toBe(true);
		expect(O.isNone(O.some(42))).toBe(false);
		expect(O.isNone(O.some(O.none()))).toBe(false);
		expect(O.unwrap(O.some(42))).toBe(42);
		expect(O.unwrap(O.unwrap(O.some(O.some(42))))).toBe(42);
	});

	test("andThen", () => {
		expect(O.unwrap(O.andThen(O.some(42), x => O.some(x)))).toBe(42);
		expect(O.isNone(O.andThen(O.some(42), () => O.none()))).toBe(true);
		expect(O.isNone(O.andThen(O.none(), x => O.some(x)))).toBe(true);
		expect(O.unwrap(O.andThen(O.some(O.some(42)), x => x))).toBe(42);
	});

	test("orElse", () => {
		expect(O.unwrap(O.orElse(O.none(), () => O.some(42)))).toBe(42);
		expect(O.isNone(O.orElse(O.none(), () => O.none()))).toBe(true);
		expect(O.unwrap(O.orElse(O.some(42), () => O.none()))).toBe(42);
	});

	test("match", () => {
		expect(O.match(O.some(42), x => x, () => 0)).toBe(42);
		expect(O.match(O.none(), x => x, () => 0)).toBe(0);
	});

	test("map", () => {
		expect(O.unwrap(O.map(O.some(42), x => x * 10))).toBe(420);
		expect(O.isNone(O.map(O.none(), x => x * 10))).toBe(true);
	});

	test("withDefault", () => {
		expect(O.withDefault(O.some(42), 0)).toBe(42);
		expect(O.withDefault(O.none(), 0)).toBe(0);
	});
});

describe("R", () => {
	test("basics", () => {
		expect(R.isOk(R.ok(42))).toBe(true);
		expect(R.isOk(R.err(-1))).toBe(false);
		expect(R.isOk(R.ok(R.err(-1)))).toBe(true);
		expect(R.isOk(R.err(R.ok(42)))).toBe(false);
		expect(R.isErr(R.err(-1))).toBe(true);
		expect(R.isErr(R.ok(42))).toBe(false);
		expect(R.isErr(R.err(R.ok(42)))).toBe(true);
		expect(R.isErr(R.ok(R.err(-1)))).toBe(false);
		expect(R.unwrap(R.ok(42))).toBe(42);
		expect(R.unwrap(R.unwrap(R.ok(R.ok(42))))).toBe(42);
		expect(R.unwrapErr(R.err(-1))).toBe(-1);
		expect(R.unwrapErr(R.unwrapErr(R.err(R.err(-1))))).toBe(-1);
	});

	test("andThen", () => {
		expect(R.unwrap(R.andThen(R.ok(42), x => R.ok(x)))).toBe(42);
		expect(R.unwrapErr(R.andThen(R.ok(42), x => R.err(x)))).toBe(42);
		expect(R.unwrapErr(R.andThen(R.err(-1), x => R.ok(x)))).toBe(-1);
		expect(R.unwrap(R.andThen(R.ok(R.ok(42)), x => x))).toBe(42);
	});

	test("orElse", () => {
		expect(R.unwrapErr(R.orElse(R.err(-1), e => R.err(e)))).toBe(-1);
		expect(R.unwrap(R.orElse(R.err(-1), e => R.ok(e)))).toBe(-1);
		expect(R.unwrap(R.orElse(R.ok(42), e => R.err(e)))).toBe(42);
		expect(R.unwrapErr(R.orElse(R.err(R.err(-1)), e => e))).toBe(-1);
	});

	test("match", () => {
		expect(R.match(R.ok(42), x => x, e => -e)).toBe(42);
		expect(R.match(R.err(-1), x => x, e => -e)).toBe(1);
	});

	test("map", () => {
		expect(R.unwrap(R.map(R.ok(42), x => x * 10))).toBe(420);
		expect(R.unwrapErr(R.map(R.err(-1), x => x * 10))).toBe(-1);
	});

	test("mapErr", () => {
		expect(R.unwrapErr(R.mapErr(R.err(-1), e => e * 10))).toBe(-10);
		expect(R.unwrap(R.mapErr(R.ok(42), e => e * 10))).toBe(42);
	});
});

describe("L", () => {
	test("basics", () => {
		expect(L.empty(L.nil())).toBe(true);
		expect(L.empty(L.cons(42, L.nil()))).toBe(false);
		expect(L.empty(L.singleton(42))).toBe(false);
		expect(L.head(L.singleton(42))).toBe(42);
		expect(L.empty(L.tail(L.singleton(42)))).toBe(true);
		expect(L.head(L.tail(L.tail(L.cons(1, L.cons(2, L.cons(3, L.nil()))))))).toBe(3);
	});

	test("match", () => {
		expect(L.match(L.nil(), () => -1, x => x)).toBe(-1);
		expect(L.match(L.cons(42, L.nil()), () => -1, x => x)).toBe(42);
		expect(L.empty(L.match(L.cons(42, L.nil()), () => -1, (_, xs) => xs))).toBe(true);
	});

	test("find", () => {
		const list = L.cons(1, L.cons(2, L.cons(3, L.nil())));
		expect(L.find(list, x => x % 2 === 0)).toBe(2);
		expect(L.find(list, () => true)).toBe(1);
		expect(L.find(list, () => false)).toBeUndefined();
		expect(L.find(L.nil(), () => true)).toBeUndefined();
	});

	test("some", () => {
		const list = L.cons(1, L.cons(2, L.cons(3, L.nil())));
		expect(L.some(list, x => x % 2 === 0)).toBe(true);
		expect(L.some(list, () => true)).toBe(true);
		expect(L.some(list, () => false)).toBe(false);
		expect(L.some(L.nil(), () => true)).toBe(false);
	});

	test("every", () => {
		const list = L.cons(1, L.cons(2, L.cons(3, L.nil())));
		expect(L.every(list, x => x % 2 === 0)).toBe(false);
		expect(L.every(list, () => true)).toBe(true);
		expect(L.every(list, () => false)).toBe(false);
		expect(L.every(L.nil(), () => false)).toBe(true);
	});

	test("reverse", () => {
		const list = L.cons(1, L.cons(2, L.cons(3, L.nil())));
		expect(L.head(L.reverse(list))).toBe(3);
		expect(L.head(L.tail(L.reverse(list)))).toBe(2);
		expect(L.head(L.tail(L.tail(L.reverse(list))))).toBe(1);
		expect(L.empty(L.tail(L.tail(L.tail(L.reverse(list)))))).toBe(true);
		expect(L.empty(L.reverse(L.nil()))).toBe(true);
	});

	test("reduce", () => {
		const list = L.cons("a", L.cons("b", L.cons("c", L.nil())));
		expect(L.reduce(list, (acc, x) => acc + x, "x")).toBe("xabc");
		expect(L.reduce(L.nil(), (acc, x) => acc + x, "x")).toBe("x");
		expect(L.reduce(L.singleton("foo"), (acc, x) => acc + x, "x")).toBe("xfoo");
	});

	test("reduceRight", () => {
		const list = L.cons("a", L.cons("b", L.cons("c", L.nil())));
		expect(L.reduceRight(list, (acc, x) => acc + x, "x")).toBe("xcba");
		expect(L.reduceRight(L.nil(), (acc, x) => acc + x, "x")).toBe("x");
		expect(L.reduceRight(L.singleton("foo"), (acc, x) => acc + x, "x")).toBe("xfoo");
	});

	test("map", () => {
		const list = L.cons(1, L.cons(2, L.cons(3, L.nil())));
		expect(L.head(L.map(list, x => x * 10))).toBe(10);
		expect(L.head(L.tail(L.map(list, x => x * 10)))).toBe(20);
		expect(L.head(L.tail(L.tail(L.map(list, x => x * 10))))).toBe(30);
		expect(L.empty(L.tail(L.tail(L.tail(L.map(list, x => x * 10)))))).toBe(true);
		expect(L.empty(L.map(L.nil(), x => x * 10))).toBe(true);
	});

	test("toArray", () => {
		const list = L.cons(1, L.cons(2, L.cons(3, L.nil())));
		expect(L.toArray(list)).toEqual([1, 2, 3]);
		expect(L.toArray(L.reverse(list))).toEqual([3, 2, 1]);
		expect(L.toArray(L.nil())).toEqual([]);
		expect(L.toArray(L.singleton(42))).toEqual([42]);
	});
});

describe("S", () => {
	test("ellipsis", () => {
		expect(S.ellipsis("123456789-123456789.", 10)).toBe("1234567...");
		expect(S.ellipsis("12345", 10)).toBe("12345");
		expect(S.ellipsis("123456789-", 10)).toBe("123456789-");
		expect(S.ellipsis("x", 0)).toBe("...");
	});

	test("debug", () => {
		const apply = (x, fn) => fn(x);

		expect(S.debug(undefined)).toBe("undefined");
		expect(S.debug(null)).toBe("null");
		expect(S.debug(42)).toBe("42");
		expect(S.debug("foo")).toBe("\"foo\"");
		expect(S.debug(true)).toBe("true");
		expect(S.debug(Symbol("foo"))).toBe("Symbol(foo)");
		expect(S.debug(42n)).toBe("42n");
		expect(S.debug(function foo() { })).toBe("[Function: foo]");
		expect(S.debug(() => { })).toBe("[Function: (anonymous)]");

		expect(S.debug([])).toBe("[]");
		expect(S.debug([1, 2, 3])).toBe("[ 1, 2, 3 ]");
		expect(S.debug([[[], []], [], [[[]]]])).toBe("[ [ [], [] ], [], [ [ [] ] ] ]");
		expect(S.debug(apply([[]], xs => (xs.push(xs), xs)))).toBe("[ [], ... ]");

		expect(S.debug({})).toBe("{}");
		expect(S.debug({ foo: 42, "@bar": "baz" })).toBe("{ foo: 42, \"@bar\": \"baz\" }");
		expect(S.debug({ a: { b: { c: {}, d: {} } }, e: { f: {} } })).toBe("{ a: { b: { c: {}, d: {} } }, e: { f: {} } }");
		expect(S.debug(apply({ foo: {} }, x => Object.assign(x, { bar: x })))).toBe("{ foo: {}, bar: ... }");

		expect(S.debug(new class Foo { })).toBe("Foo {}");
		expect(S.debug(new class Foo { constructor() { this.bar = 42; } })).toBe("Foo { bar: 42 }");
		expect(S.debug(Object.assign(new class Foo { }, { bar: new class Bar { } }))).toBe("Foo { bar: Bar {} }");
		expect(S.debug(new class { })).toBe("(anonymous) {}");
		expect(S.debug(Object.assign(Object.create(null), { foo: 42 }))).toBe("(null) { foo: 42 }");

		expect(S.debug(/foo/mugi)).toBe("/foo/gimu");
		expect(S.debug(new Date(0))).toBe("1970-01-01T00:00:00.000Z");
		expect(S.debug(new Map([["foo", 42], [null, { bar: true }]]))).toBe("Map { \"foo\" => 42, null => { bar: true } }");
		expect(S.debug(new WeakMap([[{}, "foo"], [{}, "bar"]]))).toBe("WeakMap { <***> }");
		expect(S.debug(new Set(["foo", 42, true]))).toBe("Set { \"foo\", 42, true }");
		expect(S.debug(new WeakSet([{}, {}]))).toBe("WeakSet { <***> }");
	});
});

describe("U", () => {
	test("simpleEqual", () => {
		expect(U.simpleEqual(undefined, undefined)).toBe(true);
		expect(U.simpleEqual(null, null)).toBe(true);
		expect(U.simpleEqual(42, 42)).toBe(true);
		expect(U.simpleEqual(Number.NaN, Number.NaN)).toBe(true);
		expect(U.simpleEqual(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY)).toBe(true);
		expect(U.simpleEqual(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY)).toBe(true);
		expect(U.simpleEqual("foo", "foo")).toBe(true);
		expect(U.simpleEqual(false, false)).toBe(true);
		expect(U.simpleEqual(true, true)).toBe(true);
		expect(U.simpleEqual(Symbol.for("foo"), Symbol.for("foo")));
		expect(U.simpleEqual(42n, 42n)).toBe(true);
		expect(U.simpleEqual([1, 2, 3], [1, 2, 3])).toBe(true);
		expect(U.simpleEqual([[], [[[], []]]], [[], [[[], []]]])).toBe(true);
		expect(U.simpleEqual({ foo: 42 }, { foo: 42 })).toBe(true);
		expect(U.simpleEqual({ a: { b: {}, c: { d: {} } } }, { a: { b: {}, c: { d: {} } } })).toBe(true);

		expect(U.simpleEqual(undefined, null)).toBe(false);
		expect(U.simpleEqual(+0, -0)).toBe(false);
		expect(U.simpleEqual(0, 1e-256)).toBe(false);
		expect(U.simpleEqual(42, new Number(42))).toBe(false);
		expect(U.simpleEqual("foo", "foobar")).toBe(false);
		expect(U.simpleEqual(true, false)).toBe(false);
		expect(U.simpleEqual(Symbol("foo"), Symbol("foo"))).toBe(false);
		expect(U.simpleEqual([1, 2], [1, 2, 3])).toBe(false);
		expect(U.simpleEqual([1, 2, 3], [1, 2])).toBe(false);
		expect(U.simpleEqual([[], [[[], []]]], [[], []])).toBe(false);
		expect(U.simpleEqual({ foo: 42 }, { bar: 42 })).toBe(false);
		expect(U.simpleEqual({ foo: 42 }, { foo: 24 })).toBe(false);
		expect(U.simpleEqual({ foo: 42 }, { foo: 42, bar: true })).toBe(false);
		expect(U.simpleEqual({ foo: 42, bar: true }, { foo: 42 })).toBe(false);
		expect(U.simpleEqual({ a: { b: {}, c: { d: {} } } }, { a: { b: {}, c: { d: [] } } })).toBe(false);

		expect(U.simpleEqual({ foo: 42 }, { foo: 42, [Symbol.toStringTag]: "Foo" })).toBe(true);

		class Foo { };
		expect(U.simpleEqual(new Foo(), new Foo())).toBe(false);
		expect(U.simpleEqual({}, new Foo())).toBe(false);
		expect(U.simpleEqual(Object.create(null), Object.create(null))).toBe(false);
		expect(U.simpleEqual(/foo/, /foo/)).toBe(false);
		expect(U.simpleEqual(new Date(0), new Date(0))).toBe(false);
		expect(U.simpleEqual(new Map(), new Map())).toBe(false);
		expect(U.simpleEqual(new WeakMap(), new WeakMap())).toBe(false);
		expect(U.simpleEqual(new Set(), new Set())).toBe(false);
		expect(U.simpleEqual(new WeakSet(), new WeakSet())).toBe(false);
	});

	test("memo", () => {
		const counter = (() => { let value = 0; return () => value++; });
		const f = U.memo(counter(), 3);
		const input = [0, 1, 2, 3, 3, 0, 2, 4, 3, 4];
		const output = [0, 1, 2, 3, 3, 4, 2, 5, 6, 5];
		expect(input.map(x => f(x))).toEqual(output);
	});

	test("memo1", () => {
		const counter = (() => { let value = 0; return () => value++; });
		const f = U.memo1(counter());
		const input = [0, 1, 1, 1, 0, 0, 1, 0, 0, 1];
		const output = [0, 1, 1, 1, 2, 2, 3, 4, 4, 5];
		expect(input.map(x => f(x))).toEqual(output);
	});
});

describe("G", () => {
	const char = c => G.token(c, (s, i) => s[i] === c ? R.ok([c, i + 1]) : R.err(() => `"${s[i]}" !== "${c}"`));
	const str = str => G.token(str, (s, i) =>
		s.slice(i).startsWith(str)
			? R.ok([s.slice(i, i + str.length)])
			: R.err(() => `"${S.dots(s, 10)}" !== "${str}"`)
	);
	const elem = x => G.token(S.debug(x), (s, i) =>
		U.simpleEqual(s[i], x)
			? R.ok([s[i], i + 1])
			: R.err(() => `${S.debug(s[i])} !== ${S.debug(x)}`)
	);

	test("token", () => {
		expect(G.parse("foo", str("foo"))).toBe("foo");
		expect(() => G.parse("bar", str("foo"))).toThrow();
		expect(G.parse([{ foo: 42 }], elem({ foo: 42 }))).toEqual({ foo: 42 });
		expect(() => G.parse([{ bar: 42 }], elem({ foo: 42 }))).toThrow();
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
		const validator = c => c === "a" ? R.ok(c) : R.err("not-a");
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
});

describe("P", () => {
	test("integer", () => {
		expect(P.parse("42", P.integer)).toBe(42);
		expect(P.parse("-42", P.integer)).toBe(-42);
		expect(P.parse("0042", P.integer)).toBe(42);
	});

	test("number", () => {
		expect(P.parse("42", P.number)).toBe(42);
		expect(P.parse("0.42", P.number)).toBe(0.42);
		expect(P.parse("-4.2e-2", P.number)).toBe(-4.2e-2);
	});

	test("string", () => {
		expect(P.parse("test", P.string)).toBe("test");
		expect(P.parse("", P.string)).toBe("");
	});

	test("boolean", () => {
		expect(P.parse("true", P.boolean)).toBe(true);
		expect(P.parse("false", P.boolean)).toBe(false);
		expect(() => P.parse("", P.boolean)).toThrow();
	});

	test("custom", () => {
		expect(P.parse("24..42", P.custom(s => {
			const RE = /^\d+\.\.\d+$/;
			const parse = s => s.split("..").map(x => Number.parseInt(x, 10));
			return RE.test(s) ? R.ok(parse(s)) : R.err("range");
		}))).toEqual([24, 42]);
	});

	test("array", () => {
		expect(P.parse(`["1","2","3"]`, [P.integer])).toEqual([1, 2, 3]);
		expect(P.parse(`["[\\"42\\"]"]`, [[P.integer]])).toEqual([[42]]);
	});

	test("struct", () => {
		expect(P.parse(`{"foo":"42", "bar":"true"}`, { foo: P.integer, bar: P.boolean }))
			.toEqual({ foo: 42, bar: true });
		expect(P.parse(`{"a":"{\\"b\\":\\"c\\"}"}`, { a: { b: P.string } }))
			.toEqual({ a: { b: "c" } });
	});

	test("withDefault", () => {
		expect(P.parse("", P.withDefault(P.integer, 42))).toBe(42);
		expect(() => P.parse("foo", P.withDefault(P.integer, 42))).toThrow();
	});

	test("map", () => {
		expect(P.parse("42", P.map(P.integer, x => x * 10))).toBe(420);
		expect(() => P.parse("foo", P.map(P.integer, x => x * 10))).toThrow();
	});

	test("mapError", () => {
		expect(() => P.parse("foo", P.mapError(P.integer, e => e.source), x => x)).toThrow("foo");
		expect(P.parse("42", P.mapError(P.integer, e => e.source))).toBe(42);
	});

	test("validate", () => {
		const validator = x => x % 2 !== 0 ? R.ok(x) : R.err("even");
		expect(P.parse("1", P.validate(P.integer, validator))).toBe(1);
		expect(() => P.parse("42", P.validate(P.integer, validator))).toThrow("even");
	});

	test("make", () => {
		expect(P.make({ foo: P.integer })(`{"foo":"42"}`)).toEqual(R.ok({ foo: 42 }));
		expect(P.make({ foo: P.boolean })(`{"foo":"42"}`))
			.toEqual(R.err({ type: 'syntax', source: "42", context: "boolean" }));
	});

	test("other", () => {
		expect(P.parseAll({ foo: "42", bar: "42" }, { foo: P.integer, bar: P.string }))
			.toEqual({ foo: 42, bar: "42" });
	});
});

describe("M", () => {
	const meta = obj => ({ meta: obj ?? {} });

	test("flag", () => {
		expect(M.parse(meta({ foo: true }), M.flag("foo"))).toBe(true);
		expect(M.parse(meta(), M.flag("foo"))).toBe(false);
		expect(() => M.parse(meta({ foo: "true" }), M.flag("foo"))).toThrow();
	});

	test("attr", () => {
		expect(M.parse(meta({ foo: "42" }), M.attr("foo", N.make(N.integer)))).toBe(42);
		expect(M.parse(meta(), M.attr("foo", N.make(N.integer)))).toBeUndefined();
		expect(() => M.parse(meta({ foo: true }), M.attr("foo", N.make(N.integer)))).toThrow();
	});

	test("succeed", () => {
		expect(M.parse(meta(), M.succeed(42))).toBe(42);
	});

	test("miss", () => {
		expect(M.parse(meta(), M.miss())).toBeUndefined();
	});

	test("fail", () => {
		expect(() => M.parse(meta(), M.fail(42))).toThrow();
	});

	test("andThen", () => {
		expect(M.parse(meta({ foo: true }), M.andThen(M.flag("foo"), x => M.succeed(x ? 1 : 0)))).toBe(1);
		expect(M.parse(meta(), M.andThen(M.flag("foo"), x => M.succeed(x ? 1 : 0)))).toBe(0);
		expect(M.parse(meta(), M.andThen(M.attr("foo", N.make(N.boolean)), x => M.succeed(x ? 1 : 0)))).toBeUndefined();
	});

	test("orElse", () => {
		expect(M.parse(meta({ foo: true }), M.orElse(M.flag("foo"), () => M.succeed(null)))).toBe(true);
		expect(M.parse(meta(), M.orElse(M.flag("foo"), () => M.succeed(null)))).toBe(false);
		expect(M.parse(meta(), M.orElse(M.attr("foo", N.make(N.boolean)), () => M.succeed(null)))).toBeNull();
	});

	test("map", () => {
		expect(M.parse(meta({ foo: true }), M.map(M.flag("foo"), x => !x))).toBe(false);
		expect(M.parse(meta(), M.map(M.flag("foo"), x => !x))).toBe(true);
		expect(M.parse(meta(), M.map(M.attr("foo", N.make(N.boolean)), x => !x))).toBeUndefined();
	});

	test("mapError", () => {
		expect(() => M.parse(meta({ foo: "true" }), M.mapError(M.flag("foo"), e => e.name), x => x)).toThrow("foo");
		expect(M.parse(meta(), M.mapError(M.flag("foo"), e => e.name))).toBe(false);
		expect(M.parse(meta(), M.mapError(M.attr("foo", N.make(N.boolean)), e => e.name))).toBeUndefined();
	});

	test("withDefault", () => {
		expect(M.parse(meta(), M.withDefault(M.attr("foo", N.make(N.integer)), 42))).toBe(42);
	});

	test("oneOf", () => {
		const parser = M.oneOf([M.attr("foo", N.make(N.integer)), M.attr("bar", N.make(N.integer))]);
		expect(M.parse(meta({ foo: "12", bar: "34" }), parser)).toBe(12);
		expect(M.parse(meta({ foo: "12" }), parser)).toBe(12);
		expect(M.parse(meta({ bar: "34" }), parser)).toBe(34);
		expect(M.parse(meta(), parser)).toBeUndefined();
		expect(() => M.parse(meta({ foo: true, bar: "34" }))).toThrow();
	});

	test("make", () => {
		expect(M.make(M.flag("foo"))(meta({ foo: true }))).toEqual(R.ok(O.some(true)));
		expect(M.make(M.attr("foo", N.make(N.boolean)))(meta())).toEqual(R.ok(O.none()));
		expect(M.make(M.flag("foo"))(meta({ foo: "true" })))
			.toEqual(R.err({ type: 'notation', expected: 'flag', name: "foo", value: "true" }));
		expect(M.make([M.flag("foo"), M.attr("bar", N.make(N.boolean))])(meta({ foo: true, bar: "true" })))
			.toEqual(R.ok(O.some([true, true])));
		expect(M.make({ foo: M.flag("foo"), bar: M.attr("bar", N.make(N.boolean)) })(meta({ foo: true, bar: "true" })))
			.toEqual(R.ok(O.some({ foo: true, bar: true })));
	});

	test("meta", () => {
		const { parse, parseAll, get } = M.meta(M.attr("foo", N.make(N.integer)));
		const data = meta({ foo: "42" });
		const table = [null, meta({ foo: "12" }), null, meta({ foo: "34" }), null];
		parse(data);
		parseAll(table);
		expect(get(data)).toBe(42);
		expect(get(table[1])).toBe(12);
		expect(get(table[3])).toBe(34);
	});
});

describe("N", () => {
	test("symbol", () => {
		expect(G.parse("foo", N.symbol("foo"))).toBe("foo");
	});

	test("regexp", () => {
		const RE = /^(\d+)\.\.(\d+)/;
		const parser = (_, [, fst, snd]) => [fst, snd].map(x => Number.parseInt(x, 10));
		expect(G.parse("24..42", N.regexp('range', RE, parser))).toEqual([24, 42]);
	});

	test("spacing", () => {
		expect(G.parse("  \r\n  ", N.spacing)).toBe("  \r\n  ");
		expect(G.parse("", N.spacing)).toBe("");
	});

	test("spaces", () => {
		expect(G.parse("  \r\n  ", N.spaces)).toBe("  \r\n  ");
		expect(() => G.parse("", N.spaces)).toThrow();
	});

	test("natural", () => {
		expect(G.parse("42", N.natural)).toBe(42);
		expect(() => G.parse("+42", N.natural)).toThrow();
	});

	test("integer", () => {
		expect(G.parse("42", N.integer)).toBe(42);
		expect(G.parse("+42", N.integer)).toBe(42);
		expect(G.parse("-42", N.integer)).toBe(-42);
	});

	test("number", () => {
		expect(G.parse("42", N.number)).toBe(42);
		expect(G.parse("12.34", N.number)).toBe(12.34);
		expect(G.parse("-12.34e+5", N.number)).toBe(-12.34e+5);
	});

	test("boolean", () => {
		expect(G.parse("true", N.boolean)).toBe(true);
		expect(G.parse("false", N.boolean)).toBe(false);
		expect(() => G.parse("TRUE", N.boolean)).toThrow();
	});

	test("text", () => {
		expect(G.parse('""', N.text)).toBe("");
		expect(G.parse('"foo"', N.text)).toBe("foo");
		expect(G.parse('"`"`````""', N.text)).toBe('"``"');
		expect(G.parse('"`"foo`"\n`"bar`""', N.text)).toBe('"foo"\n"bar"');
		expect(() => G.parse('', N.text)).toThrow();
		expect(() => G.parse('"foo```"', N.text)).toThrow();
		expect(() => G.parse('"`\n"', N.text)).toThrow();
	});

	test("group", () => {
		const stars = N.symbol("***");
		const alpha = N.regexp('alpha', /^[a-z]+/i);
		expect(G.parse("***FOO***", N.group(stars, stars, alpha))).toBe("FOO");
		expect(G.parse("*** foo ***", N.group(stars, stars, alpha))).toBe("foo");
	});

	test("parens", () => {
		expect(G.parse("( 42 )", N.parens(N.integer))).toBe(42);
	});

	test("braces", () => {
		expect(G.parse("{ 42 }", N.braces(N.integer))).toBe(42);
	});

	test("brackets", () => {
		expect(G.parse("[ 42 ]", N.brackets(N.integer))).toBe(42);
	});

	test("chain", () => {
		const numbers = N.chain(N.natural, N.symbol("-"));
		expect(G.parse("12-34-56-78", numbers)).toEqual([12, 34, 56, 78]);
	});

	test("join", () => {
		const csv = N.join([N.natural, N.boolean, N.text], N.regexp('comma', /^ *, */));
		expect(G.parse("42, true, \"foo\"", csv)).toEqual([42, true, "foo"]);
	});

	test("list", () => {
		const answers = N.list(N.oneOf([N.map(N.symbol("yes"), () => true), N.map(N.symbol("no"), () => false)]));
		expect(G.parse("yes no yes yes no no", answers)).toEqual([true, false, true, true, false, false]);
	});

	test("tuple", () => {
		const password = N.map(N.tuple([N.symbol("Open"), N.symbol("Sesame"), N.symbol("!!")]), () => true);
		expect(G.parse("Open Sesame !!", password)).toBe(true);
		expect(() => G.parse("Open Barley !!", password)).toThrow();
	});

	test("withDefault", () => {
		const command = N.join([N.integer, N.withDefault(N.map(N.symbol("--wait"), () => true), false)], N.spacing);
		expect(G.parse("42 --wait", command)).toEqual([42, true]);
		expect(G.parse("42", command)).toEqual([42, false]);
	});

	test("make", () => {
		expect(N.make(N.integer)("  42  ")).toEqual(R.ok(42));
		expect(N.make(N.integer)("42;")).toMatchObject(R.err({ type: 'eof', context: { source: "42;", position: 2 } }));
	});
});

describe("Z", () => {
	test("redef", () => {
		class A { foo() { return "A"; }; bar() { return "A"; }; baz() { return "A"; } };
		class B extends A { foo(...args) { return super.foo(...args) + "B"; } };
		class C extends B { bar(...args) { return super.bar(...args) + "C"; } };
		const c = Object.assign(new C(), { x: "X" });

		expect(c.foo()).toBe("AB");
		expect(c.bar()).toBe("AC");
		expect(c.baz()).toBe("A");

		Z.redef(C.prototype, base => ({
			foo(...args) { return base(this).foo(...args) + "D"; },
			bar(...args) { return base(this).bar(...args) + "D"; },
			baz(...args) { return base(this).baz(...args) + "D"; },
			qux() { return "D"; },
		}));

		expect(c.foo()).toBe("ABD");
		expect(c.bar()).toBe("ACD");
		expect(c.baz()).toBe("AD");
		expect(c.qux()).toBe("D");

		Z.redef(B.prototype, base => ({
			foo(...args) { return base(this).foo(...args) + "E"; },
			bar(...args) { return base(this).bar(...args) + "E"; },
			baz(...args) { return base(this).baz(...args) + "E"; },
			qux() { return "E"; },
		}));

		expect(c.foo()).toBe("ABED");
		expect(c.bar()).toBe("AECD");
		expect(c.baz()).toBe("AED");
		expect(c.qux()).toBe("D");

		Z.redef(A.prototype, base => ({
			foo(...args) { return args[0] + this.x + base(this).foo(...args); },
			bar(...args) { return args[0] + this.x + base(this).bar(...args); },
			baz(...args) { return args[0] + this.x + base(this).baz(...args); },
			qux(...args) { return args[0] + this.x; },
		}));

		expect(c.foo("Y")).toBe("YXABED");
		expect(c.bar("Y")).toBe("YXAECD");
		expect(c.baz("Y")).toBe("YXAED");
		expect(c.qux("Y")).toBe("D");
	});

	test("extProp", () => {
		const x = new class X { };

		const [getFoo, setFoo, deleteFoo] = Z.extProp("foo");
		expect(getFoo(x)).toBe("foo");
		setFoo(x, "abc");
		expect(getFoo(x)).toBe("abc");
		deleteFoo(x);
		expect(getFoo(x)).toBe("foo");

		const [getBar, setBar, deleteBar, clearBar] = Z.extProp("bar", true);
		expect(getBar(x)).toBe("bar");
		setBar(x, "123");
		expect(getBar(x)).toBe("123");
		deleteBar(x);
		expect(getBar(x)).toBe("bar");
		setBar(x, "456");
		expect(getBar(x)).toBe("456");
		clearBar();
		expect(getBar(x)).toBe("bar");
	});

	test("extend", () => {
		class X { };
		const x = new X();

		Z.extend(X.prototype, "foo", Z.extProp("foo"));
		expect(x.foo).toBe("foo");
		x.foo = "abc";
		expect(x.foo).toBe("abc");
	});

	test("swapper", () => {
		class Counter {
			constructor() { this.value = 0; }
			inc() { return ++this.value; }
		}
		const counter = new Counter();

		const swapValue = Z.swapper("value");
		expect(counter.inc()).toBe(1);
		swapValue(counter, 41, () => {
			expect(counter.inc()).toBe(42);
		});
		expect(counter.inc()).toBe(2);
	});

	test("context", () => {
		class Counter {
			constructor() { this.value = 0; }
			inc() { return ++this.value; }
		}
		const counter = new Counter();

		const boostContext = Z.context(null);
		Counter.prototype.inc = function () {
			return this.value += boostContext.exists(this) ? boostContext.value(this) : 1;
		};

		expect(counter.inc()).toBe(1);
		boostContext.enter(counter, 10, () => {
			expect(counter.inc()).toBe(11);
			expect(counter.inc()).toBe(21);
		});
		expect(counter.inc()).toBe(22);
	});
});