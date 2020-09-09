import Fs from "./Fs";

const { O, R, M, N } = Fs;

const meta = <T>(obj?: T) => ({ meta: obj ?? {} });

test("flag", () => {
	expect(M.parse(meta({ foo: true }), M.flag("foo"))).toBe(true);
	expect(M.parse(meta(), M.flag("foo"))).toBe(false);
	expect(() => M.parse(meta({ foo: "true" }), M.flag("foo"))).toThrow();
});

test("attr", () => {
	expect(M.parse(meta({ foo: "42" }), M.attr("foo", N.make(N.integer)))).toBe(42);
	expect(M.parse(meta(), M.attr("foo", N.make(N.integer)))).toBeUndefined();
	expect(() => M.parse(meta({ foo: true }), M.attr("foo", N.make(N.integer)))).toThrow();
});

test("succeed", () => {
	expect(M.parse(meta(), M.succeed(42))).toBe(42);
});

test("miss", () => {
	expect(M.parse(meta(), M.miss())).toBeUndefined();
});

test("fail", () => {
	expect(() => M.parse(meta(), M.fail(42))).toThrow();
});

test("andThen", () => {
	expect(M.parse(meta({ foo: true }), M.andThen(M.flag("foo"), x => M.succeed(x ? 1 : 0)))).toBe(1);
	expect(M.parse(meta(), M.andThen(M.flag("foo"), x => M.succeed(x ? 1 : 0)))).toBe(0);
	expect(M.parse(meta(), M.andThen(M.attr("foo", N.make(N.boolean)), x => M.succeed(x ? 1 : 0)))).toBeUndefined();
});

test("orElse", () => {
	expect(M.parse(meta({ foo: true }), M.orElse(M.flag("foo"), () => M.succeed(null)))).toBe(true);
	expect(M.parse(meta(), M.orElse(M.flag("foo"), () => M.succeed(null)))).toBe(false);
	expect(M.parse(meta(), M.orElse(M.attr("foo", N.make(N.boolean)), () => M.succeed(null)))).toBeNull();
});

test("map", () => {
	expect(M.parse(meta({ foo: true }), M.map(M.flag("foo"), x => !x))).toBe(false);
	expect(M.parse(meta(), M.map(M.flag("foo"), x => !x))).toBe(true);
	expect(M.parse(meta(), M.map(M.attr("foo", N.make(N.boolean)), x => !x))).toBeUndefined();
});

test("mapError", () => {
	expect(() => M.parse(meta({ foo: "true" }), M.mapError(M.flag("foo"), e => e.name), x => x)).toThrow("foo");
	expect(M.parse(meta(), M.mapError(M.flag("foo"), e => e.name))).toBe(false);
	expect(M.parse(meta(), M.mapError(M.attr("foo", N.make(N.boolean)), e => e.name))).toBeUndefined();
});

test("withDefault", () => {
	expect(M.parse(meta(), M.withDefault(M.attr("foo", N.make(N.integer)), 42))).toBe(42);
});

test("oneOf", () => {
	const parser = M.oneOf([M.attr("foo", N.make(N.integer)), M.attr("bar", N.make(N.integer))]);
	expect(M.parse(meta({ foo: "12", bar: "34" }), parser)).toBe(12);
	expect(M.parse(meta({ foo: "12" }), parser)).toBe(12);
	expect(M.parse(meta({ bar: "34" }), parser)).toBe(34);
	expect(M.parse(meta(), parser)).toBeUndefined();
	expect(() => M.parse(meta({ foo: true, bar: "34" }), parser)).toThrow();
});

test("make", () => {
	expect(M.make(M.flag("foo"))(meta({ foo: true }))).toEqual(R.ok(O.some(true)));
	expect(M.make(M.attr("foo", N.make(N.boolean)))(meta())).toEqual(R.ok(O.none()));
	expect(M.make(M.flag("foo"))(meta({ foo: "true" })))
		.toEqual(R.err({ type: 'notation', expected: 'flag', name: "foo", value: "true" }));
	expect(M.make([M.flag("foo"), M.attr("bar", N.make(N.boolean))] as const)(meta({ foo: true, bar: "true" })))
		.toEqual(R.ok(O.some([true, true])));
	expect(M.make({ foo: M.flag("foo"), bar: M.attr("bar", N.make(N.boolean)) })(meta({ foo: true, bar: "true" })))
		.toEqual(R.ok(O.some({ foo: true, bar: true })));
});

test("meta", () => {
	const { parse, parseAll, get } = M.meta(M.attr("foo", N.make(N.integer)));
	const data = meta({ foo: "42" });
	const table = [null, meta({ foo: "12" }), null, meta({ foo: "34" }), null] as const;
	parse(data);
	parseAll(table);
	expect(get(data)).toBe(42);
	expect(get(table[1])).toBe(12);
	expect(get(table[3])).toBe(34);
});