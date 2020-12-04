import Fs from "./Fs";

const { L } = Fs;

test("basics", () => {
	expect(L.empty(L.nil())).toBe(true);
	expect(L.empty(L.cons(42, L.nil()))).toBe(false);
	expect(L.empty(L.singleton(42))).toBe(false);
	expect(L.head(L.singleton(42))).toBe(42);
	expect(L.empty(L.tail(L.singleton(42)))).toBe(true);
	expect(L.head(L.tail(L.tail(L.cons(1, L.cons(2, L.cons(3, L.nil()))) as any) as any) as any)).toBe(3);
});

test("match", () => {
	expect(L.match(L.nil(), () => -1, x => x)).toBe(-1);
	expect(L.match(L.cons(42, L.nil()), () => -1, x => x)).toBe(42);
	expect(L.match(L.cons(1, L.cons(2, L.nil())), () => L.nil(), (_, xs) => xs)).toEqual(L.cons(2, L.nil()));
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
	const input = L.cons(1, L.cons(2, L.cons(3, L.nil())));
	const output = L.cons(3, L.cons(2, L.cons(1, L.nil())));
	expect(L.reverse(input)).toEqual(output);
	expect(L.reverse(L.nil())).toEqual(L.nil());
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
	const input = L.cons(1, L.cons(2, L.cons(3, L.nil())));
	const output = L.cons("1", L.cons("2", L.cons("3", L.nil())));
	expect(L.map(input, String)).toEqual(output);
	expect(L.map(L.nil(), String)).toEqual(L.nil());
});

test("toArray", () => {
	const list = L.cons(1, L.cons(2, L.cons(3, L.nil())));
	expect(L.toArray(list)).toEqual([1, 2, 3]);
	expect(L.toArray(L.reverse(list))).toEqual([3, 2, 1]);
	expect(L.toArray(L.nil())).toEqual([]);
	expect(L.toArray(L.singleton(42))).toEqual([42]);
});