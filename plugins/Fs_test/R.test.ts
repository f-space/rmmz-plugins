import Fs from "./Fs";

const { R } = Fs;

type Ok<T> = Fs.R.Ok<T>;
type Err<E> = Fs.R.Err<E>;

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
	expect(R.unwrap(R.andThen(R.ok(42), x => R.ok(x)) as Ok<number>)).toBe(42);
	expect(R.unwrapErr(R.andThen(R.ok(42), x => R.err(x)) as Err<number>)).toBe(42);
	expect(R.unwrapErr(R.andThen(R.err(-1), x => R.ok(x)) as Err<number>)).toBe(-1);
	expect(R.unwrap(R.andThen(R.ok(R.ok(42)), x => x) as Ok<number>)).toBe(42);
});

test("orElse", () => {
	expect(R.unwrapErr(R.orElse(R.err(-1), e => R.err(e)) as Err<number>)).toBe(-1);
	expect(R.unwrap(R.orElse(R.err(-1), e => R.ok(e)) as Ok<number>)).toBe(-1);
	expect(R.unwrap(R.orElse(R.ok(42), e => R.err(e)) as Ok<number>)).toBe(42);
	expect(R.unwrapErr(R.orElse(R.err(R.err(-1)), e => e) as Err<number>)).toBe(-1);
});

test("match", () => {
	expect(R.match(R.ok(42), x => x, (e: number) => -e)).toBe(42);
	expect(R.match(R.err(-1), x => x, (e: number) => -e)).toBe(1);
});

test("map", () => {
	expect(R.unwrap(R.map(R.ok(42), (x: number) => x * 10) as Ok<number>)).toBe(420);
	expect(R.unwrapErr(R.map(R.err(-1), (x: number) => x * 10) as Err<number>)).toBe(-1);
});

test("mapErr", () => {
	expect(R.unwrapErr(R.mapErr(R.err(-1), (e: number) => e * 10) as Err<number>)).toBe(-10);
	expect(R.unwrap(R.mapErr(R.ok(42), (e: number) => e * 10) as Ok<number>)).toBe(42);
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