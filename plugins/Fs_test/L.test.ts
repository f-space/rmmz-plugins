import Fs from "./Fs";

const { L } = Fs;

type Cons<T> = Fs.L.Cons<T>;

test("basics", () => {
	type C = Cons<number>;

	expect(L.empty(L.nil())).toBe(true);
	expect(L.empty(L.cons(42, L.nil()))).toBe(false);
	expect(L.empty(L.singleton(42))).toBe(false);
	expect(L.head(L.singleton(42))).toBe(42);
	expect(L.empty(L.tail(L.singleton(42)))).toBe(true);
	expect(L.head(L.tail(L.tail(L.cons(1, L.cons(2, L.cons(3, L.nil())))) as C) as C)).toBe(3);
});

test("match", () => {
	expect(L.match(L.nil(), () => -1, x => x)).toBe(-1);
	expect(L.match(L.cons(42, L.nil()), () => -1, x => x)).toBe(42);
	expect(L.empty(L.match(L.cons(42, L.nil()), () => L.cons(-1, L.nil()), (_, xs) => xs))).toBe(true);
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
	type C = Cons<number>;

	const list = L.cons(1, L.cons(2, L.cons(3, L.nil())));
	expect(L.head(L.reverse(list) as C)).toBe(3);
	expect(L.head(L.tail(L.reverse(list) as C) as C)).toBe(2);
	expect(L.head(L.tail(L.tail(L.reverse(list) as C) as C) as C)).toBe(1);
	expect(L.empty(L.tail(L.tail(L.tail(L.reverse(list) as C) as C) as C))).toBe(true);
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
	type C = Cons<number>;

	const list = L.cons(1, L.cons(2, L.cons(3, L.nil())));
	expect(L.head(L.map(list, (x: number) => x * 10) as C)).toBe(10);
	expect(L.head(L.tail(L.map(list, (x: number) => x * 10) as C) as C)).toBe(20);
	expect(L.head(L.tail(L.tail(L.map(list, (x: number) => x * 10) as C) as C) as C)).toBe(30);
	expect(L.empty(L.tail(L.tail(L.tail(L.map(list, (x: number) => x * 10) as C) as C) as C))).toBe(true);
	expect(L.empty(L.map(L.nil(), (x: number) => x * 10))).toBe(true);
});

test("toArray", () => {
	const list = L.cons(1, L.cons(2, L.cons(3, L.nil())));
	expect(L.toArray(list)).toEqual([1, 2, 3]);
	expect(L.toArray(L.reverse(list))).toEqual([3, 2, 1]);
	expect(L.toArray(L.nil())).toEqual([]);
	expect(L.toArray(L.singleton(42))).toEqual([42]);
});