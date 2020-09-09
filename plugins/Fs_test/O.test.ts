import Fs from "./Fs";

const { O } = Fs;

type Some<T> = Fs.O.Some<T>;

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
	expect(O.unwrap(O.andThen(O.some(42), x => O.some(x)) as Some<number>)).toBe(42);
	expect(O.isNone(O.andThen(O.some(42), () => O.none()))).toBe(true);
	expect(O.isNone(O.andThen(O.none(), x => O.some(x)))).toBe(true);
	expect(O.unwrap(O.andThen(O.some(O.some(42)), x => x) as Some<number>)).toBe(42);
});

test("orElse", () => {
	expect(O.unwrap(O.orElse(O.none(), () => O.some(42)) as Some<number>)).toBe(42);
	expect(O.isNone(O.orElse(O.none(), () => O.none()))).toBe(true);
	expect(O.unwrap(O.orElse(O.some(42), () => O.none()) as Some<number>)).toBe(42);
});

test("match", () => {
	expect(O.match(O.some(42), x => x, () => 0)).toBe(42);
	expect(O.match(O.none(), x => x, () => 0)).toBe(0);
});

test("map", () => {
	expect(O.unwrap(O.map(O.some(42), (x: number) => x * 10) as Some<number>)).toBe(420);
	expect(O.isNone(O.map(O.none(), (x: number) => x * 10))).toBe(true);
});

test("withDefault", () => {
	expect(O.withDefault(O.some(42), 0)).toBe(42);
	expect(O.withDefault(O.none(), 0)).toBe(0);
});