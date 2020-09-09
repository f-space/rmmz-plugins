import Fs from "./Fs";

const { S } = Fs;

test("ellipsis", () => {
	expect(S.ellipsis("123456789-123456789.", 10)).toBe("1234567...");
	expect(S.ellipsis("12345", 10)).toBe("12345");
	expect(S.ellipsis("123456789-", 10)).toBe("123456789-");
	expect(S.ellipsis("x", 0)).toBe("...");
});

test("debug", () => {
	const apply = <T, U>(x: T, fn: (value: T) => U) => fn(x);

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
	expect(S.debug(apply([[]], xs => (xs.push(xs as any), xs)))).toBe("[ [], ... ]");

	expect(S.debug({})).toBe("{}");
	expect(S.debug({ foo: 42, "@bar": "baz" })).toBe("{ foo: 42, \"@bar\": \"baz\" }");
	expect(S.debug({ a: { b: { c: {}, d: {} } }, e: { f: {} } })).toBe("{ a: { b: { c: {}, d: {} } }, e: { f: {} } }");
	expect(S.debug(apply({ foo: {} }, x => Object.assign(x, { bar: x })))).toBe("{ foo: {}, bar: ... }");

	expect(S.debug(new class Foo { })).toBe("Foo {}");
	expect(S.debug(new class Foo { bar: number; constructor() { this.bar = 42; } })).toBe("Foo { bar: 42 }");
	expect(S.debug(Object.assign(new class Foo { }, { bar: new class Bar { } }))).toBe("Foo { bar: Bar {} }");
	expect(S.debug(new class { })).toBe("(anonymous) {}");
	expect(S.debug(Object.assign(Object.create(null), { foo: 42 }))).toBe("(null) { foo: 42 }");

	expect(S.debug(/foo/mugi)).toBe("/foo/gimu");
	expect(S.debug(new Date(0))).toBe("1970-01-01T00:00:00.000Z");
	expect(S.debug(new Map([["foo", 42], [null, { bar: true }]] as any))).toBe("Map { \"foo\" => 42, null => { bar: true } }");
	expect(S.debug(new WeakMap([[{}, "foo"], [{}, "bar"]]))).toBe("WeakMap { <***> }");
	expect(S.debug(new Set(["foo", 42, true]))).toBe("Set { \"foo\", 42, true }");
	expect(S.debug(new WeakSet([{}, {}]))).toBe("WeakSet { <***> }");
});