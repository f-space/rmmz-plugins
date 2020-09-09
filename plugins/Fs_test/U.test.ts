import Fs from "./Fs";

const { U } = Fs;

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
	const counter = (() => { let value = 0; return (_: number) => value++; });
	const f = U.memo(counter(), 3);
	const input = [0, 1, 2, 3, 3, 0, 2, 4, 3, 4];
	const output = [0, 1, 2, 3, 3, 4, 2, 5, 6, 5];
	expect(input.map(x => f(x))).toEqual(output);
});

test("memo1", () => {
	const counter = (() => { let value = 0; return (_: number) => value++; });
	const f = U.memo1(counter());
	const input = [0, 1, 1, 1, 0, 0, 1, 0, 0, 1];
	const output = [0, 1, 1, 1, 2, 2, 3, 4, 4, 5];
	expect(input.map(x => f(x))).toEqual(output);
});