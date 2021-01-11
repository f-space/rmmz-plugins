import Fs from "./Fs";

const { O } = Fs;

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
	expect(O.andThen(O.some(42), x => O.some(x))).toEqual(O.some(42));
	expect(O.andThen(O.some(42), () => O.none())).toEqual(O.none());
	expect(O.andThen(O.none(), x => O.some(x))).toEqual(O.none());
	expect(O.andThen(O.some(O.some(42)), x => x)).toEqual(O.some(42));
});

test("orElse", () => {
	expect(O.orElse(O.none(), () => O.some(42))).toEqual(O.some(42));
	expect(O.orElse(O.none(), () => O.none())).toEqual(O.none());
	expect(O.orElse(O.some(42), () => O.none())).toEqual(O.some(42));
});

test("match", () => {
	expect(O.match(O.some(42), x => x, () => 0)).toBe(42);
	expect(O.match(O.none(), x => x, () => 0)).toBe(0);
});

test("expect", () => {
	expect(O.expect(O.some(42), () => "foo")).toBe(42);
	expect(() => O.expect(O.none(), () => "foo")).toThrow(new Error("foo"));
});

test("withDefault", () => {
	expect(O.withDefault(O.some(42), 0)).toBe(42);
	expect(O.withDefault(O.none(), 0)).toBe(0);
});

test("map", () => {
	expect(O.map(O.some(42), String)).toEqual(O.some("42"));
	expect(O.map(O.none(), String)).toEqual(O.none());
});

test("zip", () => {
	expect(O.zip([])).toEqual(O.some([]));
	expect(O.zip([O.none()])).toEqual(O.none());
	expect(O.zip([O.some(0)])).toEqual(O.some([0]));
	expect(O.zip([O.none(), O.none()])).toEqual(O.none());
	expect(O.zip([O.none(), O.some(1)])).toEqual(O.none());
	expect(O.zip([O.some(0), O.none()])).toEqual(O.none());
	expect(O.zip([O.some(0), O.some(1)])).toEqual(O.some([0, 1]));
	expect(O.zip([O.none(), O.none(), O.none()])).toEqual(O.none());
	expect(O.zip([O.none(), O.some(1), O.none()])).toEqual(O.none());
	expect(O.zip([O.some(0), O.none(), O.some(2)])).toEqual(O.none());
	expect(O.zip([O.some(0), O.some(1), O.some(2)])).toEqual(O.some([0, 1, 2]));
});

test("zipL", () => {
	expect(O.zipL([])).toEqual(O.some([]));
	expect(O.zipL([() => O.none()])).toEqual(O.none());
	expect(O.zipL([() => O.some(0)])).toEqual(O.some([0]));
	expect(O.zipL([() => O.none(), () => O.none()])).toEqual(O.none());
	expect(O.zipL([() => O.none(), () => O.some(1)])).toEqual(O.none());
	expect(O.zipL([() => O.some(0), () => O.none()])).toEqual(O.none());
	expect(O.zipL([() => O.some(0), () => O.some(1)])).toEqual(O.some([0, 1]));
	expect(O.zipL([() => O.none(), () => O.none(), () => O.none()])).toEqual(O.none());
	expect(O.zipL([() => O.none(), () => O.some(1), () => O.none()])).toEqual(O.none());
	expect(O.zipL([() => O.some(0), () => O.none(), () => O.some(2)])).toEqual(O.none());
	expect(O.zipL([() => O.some(0), () => O.some(1), () => O.some(2)])).toEqual(O.some([0, 1, 2]));
});