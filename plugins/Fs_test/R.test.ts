import Fs from "./Fs";

const { R } = Fs;

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
	expect(R.andThen(R.ok(42), x => R.ok(x))).toEqual(R.ok(42));
	expect(R.andThen(R.ok(42), x => R.err(x))).toEqual(R.err(42));
	expect(R.andThen(R.err(-1), x => R.ok(x))).toEqual(R.err(-1));
	expect(R.andThen(R.ok(R.ok(42)), x => x)).toEqual(R.ok(42));
});

test("orElse", () => {
	expect(R.orElse(R.err(-1), e => R.err(e))).toEqual(R.err(-1));
	expect(R.orElse(R.err(-1), e => R.ok(e))).toEqual(R.ok(-1));
	expect(R.orElse(R.ok(42), e => R.err(e))).toEqual(R.ok(42));
	expect(R.orElse(R.err(R.err(-1)), e => e)).toEqual(R.err(-1));
});

test("match", () => {
	expect(R.match(R.ok(42), x => `ok(${x})`, e => `err(${e})`)).toBe("ok(42)");
	expect(R.match(R.err(-1), x => `ok(${x})`, e => `err(${e})`)).toBe("err(-1)");
});

test("expect", () => {
	expect(R.expect(R.ok("foo"), s => s + "bar")).toBe("foo");
	expect(() => R.expect(R.err("foo"), s => s + "bar")).toThrow(new Error("foobar"));
});

test("attempt", () => {
	expect(R.attempt(() => 42)).toEqual(R.ok(42));
	expect(R.attempt(() => { throw 42; })).toEqual(R.err(42));
});

test("mapBoth", () => {
	expect(R.mapBoth(R.ok(42), x => `ok(${x})`, e => `err(${e})`)).toEqual(R.ok("ok(42)"));
	expect(R.mapBoth(R.err(-1), x => `ok(${x})`, e => `err(${e})`)).toEqual(R.err("err(-1)"));
});

test("map", () => {
	expect(R.map(R.ok(42), String)).toEqual(R.ok("42"));
	expect(R.map(R.err(-1), String)).toEqual(R.err(-1));
});

test("mapErr", () => {
	expect(R.mapErr(R.err(-1), String)).toEqual(R.err("-1"));
	expect(R.mapErr(R.ok(42), String)).toEqual(R.ok(42));
});

test("all", () => {
	expect(R.all([])).toEqual(R.ok([]));
	expect(R.all([R.err(0)])).toEqual(R.err(0));
	expect(R.all([R.ok(0)])).toEqual(R.ok([0]));
	expect(R.all([R.err(0), R.err(1)])).toEqual(R.err(0));
	expect(R.all([R.err(0), R.ok(1)])).toEqual(R.err(0));
	expect(R.all([R.ok(0), R.err(1)])).toEqual(R.err(1));
	expect(R.all([R.ok(0), R.ok(1)])).toEqual(R.ok([0, 1]));
	expect(R.all([R.err(0), R.err(1), R.err(2)])).toEqual(R.err(0));
	expect(R.all([R.err(0), R.ok(1), R.err(2)])).toEqual(R.err(0));
	expect(R.all([R.ok(0), R.err(1), R.ok(2)])).toEqual(R.err(1));
	expect(R.all([R.ok(0), R.ok(1), R.ok(2)])).toEqual(R.ok([0, 1, 2]));
});

test("any", () => {
	expect(R.any([])).toEqual(R.err([]));
	expect(R.any([R.ok(0)])).toEqual(R.ok(0));
	expect(R.any([R.err(0)])).toEqual(R.err([0]));
	expect(R.any([R.ok(0), R.ok(1)])).toEqual(R.ok(0));
	expect(R.any([R.ok(0), R.err(1)])).toEqual(R.ok(0));
	expect(R.any([R.err(0), R.ok(1)])).toEqual(R.ok(1));
	expect(R.any([R.err(0), R.err(1)])).toEqual(R.err([0, 1]));
	expect(R.any([R.ok(0), R.ok(1), R.ok(2)])).toEqual(R.ok(0));
	expect(R.any([R.ok(0), R.err(1), R.ok(2)])).toEqual(R.ok(0));
	expect(R.any([R.err(0), R.ok(1), R.err(2)])).toEqual(R.ok(1));
	expect(R.any([R.err(0), R.err(1), R.err(2)])).toEqual(R.err([0, 1, 2]));
});

test("allL", () => {
	expect(R.allL([])).toEqual(R.ok([]));
	expect(R.allL([() => R.err(0)])).toEqual(R.err(0));
	expect(R.allL([() => R.ok(0)])).toEqual(R.ok([0]));
	expect(R.allL([() => R.err(0), () => R.err(1)])).toEqual(R.err(0));
	expect(R.allL([() => R.err(0), () => R.ok(1)])).toEqual(R.err(0));
	expect(R.allL([() => R.ok(0), () => R.err(1)])).toEqual(R.err(1));
	expect(R.allL([() => R.ok(0), () => R.ok(1)])).toEqual(R.ok([0, 1]));
	expect(R.allL([() => R.err(0), () => R.err(1), () => R.err(2)])).toEqual(R.err(0));
	expect(R.allL([() => R.err(0), () => R.ok(1), () => R.err(2)])).toEqual(R.err(0));
	expect(R.allL([() => R.ok(0), () => R.err(1), () => R.ok(2)])).toEqual(R.err(1));
	expect(R.allL([() => R.ok(0), () => R.ok(1), () => R.ok(2)])).toEqual(R.ok([0, 1, 2]));
});

test("anyL", () => {
	expect(R.anyL([])).toEqual(R.err([]));
	expect(R.anyL([() => R.ok(0)])).toEqual(R.ok(0));
	expect(R.anyL([() => R.err(0)])).toEqual(R.err([0]));
	expect(R.anyL([() => R.ok(0), () => R.ok(1)])).toEqual(R.ok(0));
	expect(R.anyL([() => R.ok(0), () => R.err(1)])).toEqual(R.ok(0));
	expect(R.anyL([() => R.err(0), () => R.ok(1)])).toEqual(R.ok(1));
	expect(R.anyL([() => R.err(0), () => R.err(1)])).toEqual(R.err([0, 1]));
	expect(R.anyL([() => R.ok(0), () => R.ok(1), () => R.ok(2)])).toEqual(R.ok(0));
	expect(R.anyL([() => R.ok(0), () => R.err(1), () => R.ok(2)])).toEqual(R.ok(0));
	expect(R.anyL([() => R.err(0), () => R.ok(1), () => R.err(2)])).toEqual(R.ok(1));
	expect(R.anyL([() => R.err(0), () => R.err(1), () => R.err(2)])).toEqual(R.err([0, 1, 2]));
});