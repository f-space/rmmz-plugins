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