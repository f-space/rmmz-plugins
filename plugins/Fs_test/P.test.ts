import Fs from "./Fs";

const { R, P } = Fs;

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
		const parse = (s: string) => s.split("..").map(x => Number.parseInt(x, 10));
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
	const validator = (x: number) => x % 2 !== 0 ? R.ok(x) : R.err("even");
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