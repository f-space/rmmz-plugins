import "./JestExt";
import Fs from "./Fs";

const { O, M, N } = Fs;

const parse = <A extends Fs.M.Archetype>(meta: Fs.M.Data['meta'], parser: A) => M.make(parser)({ meta });

const notationError = (expected: 'flag' | 'attr', name: string, value: string | true) =>
	({ type: 'notation', expected, name, value });
const parseError = <C>(cause: C) => ({ type: 'parse', cause });

test("flag", () => {
	expect(parse({ foo: true }, M.flag("foo"))).toEqualOk(O.some(true));
	expect(parse({}, M.flag("foo"))).toEqualOk(O.some(false));
	expect(parse({ foo: "true" }, M.flag("foo"))).toMatchErr(notationError('flag', "foo", "true"));
});

test("attr", () => {
	expect(parse({ foo: "42" }, M.attr("foo", N.make(N.integer)))).toEqualOk(O.some(42));
	expect(parse({}, M.attr("foo", N.make(N.integer)))).toEqualOk(O.none());
	expect(parse({ foo: true }, M.attr("foo", N.make(N.integer)))).toMatchErr(notationError("attr", "foo", true));
	expect(parse({ foo: "42" }, M.attr("foo", N.make(N.fail("fail"))))).toMatchErr(parseError("fail"));
});

test("succeed", () => {
	expect(parse({}, M.succeed(42))).toEqualOk(O.some(42));
});

test("miss", () => {
	expect(parse({}, M.miss())).toEqualOk(O.none());
});

test("fail", () => {
	expect(parse({}, M.fail(42))).toMatchErr(42);
});

test("andThen", () => {
	expect(parse({ foo: true }, M.andThen(M.flag("foo"), x => M.succeed(x ? 1 : 0)))).toEqualOk(O.some(1));
	expect(parse({}, M.andThen(M.flag("foo"), x => M.succeed(x ? 1 : 0)))).toEqualOk(O.some(0));
	expect(parse({}, M.andThen(M.attr("foo", N.make(N.boolean)), x => M.succeed(x ? 1 : 0)))).toEqualOk(O.none());
});

test("orElse", () => {
	expect(parse({ foo: true }, M.orElse(M.flag("foo"), () => M.succeed(null)))).toEqualOk(O.some(true));
	expect(parse({}, M.orElse(M.flag("foo"), () => M.succeed(null)))).toEqualOk(O.some(false));
	expect(parse({}, M.orElse(M.attr("foo", N.make(N.boolean)), () => M.succeed(null)))).toEqualOk(O.some(null));
});

test("map", () => {
	expect(parse({ foo: true }, M.map(M.flag("foo"), x => !x))).toEqualOk(O.some(false));
	expect(parse({}, M.map(M.flag("foo"), x => !x))).toEqualOk(O.some(true));
	expect(parse({}, M.map(M.attr("foo", N.make(N.boolean)), x => !x))).toEqualOk(O.none());
});

test("mapError", () => {
	expect(parse({ foo: "true" }, M.mapError(M.flag("foo"), e => e.name))).toMatchErr("foo");
	expect(parse({}, M.mapError(M.flag("foo"), e => e.name))).toEqualOk(O.some(false));
	expect(parse({}, M.mapError(M.attr("foo", N.make(N.boolean)), e => e.name))).toEqualOk(O.none());
});

test("withDefault", () => {
	expect(parse({}, M.withDefault(M.attr("foo", N.make(N.integer)), 42))).toEqualOk(O.some(42));
});

test("oneOf", () => {
	const parser = M.oneOf([M.attr("foo", N.make(N.integer)), M.attr("bar", N.make(N.integer))]);
	expect(parse({ foo: "12", bar: "34" }, parser)).toEqualOk(O.some(12));
	expect(parse({ foo: "12" }, parser)).toEqualOk(O.some(12));
	expect(parse({ bar: "34" }, parser)).toEqualOk(O.some(34));
	expect(parse({}, parser)).toEqualOk(O.none());
	expect(parse({ foo: true, bar: "34" }, parser)).toMatchErr(notationError('attr', "foo", true));
});

test("parse", () => {
	expect(M.parse({ meta: { foo: true } }, M.flag("foo"))).toBe(true);
	expect(M.parse({ meta: {} }, M.attr("foo", N.make(N.boolean)))).toBeUndefined();
	expect(M.parse(
		{ meta: { foo: true, bar: "true" } },
		[M.flag("foo"), M.attr("bar", N.make(N.boolean))] as const
	)).toEqual([true, true]);
	expect(M.parse(
		{ meta: { foo: true, bar: "true" } },
		{ foo: M.flag("foo"), bar: M.attr("bar", N.make(N.boolean)) }
	)).toEqual({ foo: true, bar: true });
	expect(() => M.parse({ meta: { foo: "true" } }, M.flag("foo"), e => e.type))
		.toThrow(new Error(notationError('flag', "foo", "true").type));
});

test("meta", () => {
	const { parse, parseAll, get } = M.meta(M.attr("foo", N.make(N.integer)));
	const data = { meta: { foo: "42" } };
	const table = [null, { meta: { foo: "12" } }, null, { meta: { foo: "34" } }, null] as const;
	parse(data);
	parseAll(table);
	expect(get(data)).toBe(42);
	expect(get(table[1])).toBe(12);
	expect(get(table[3])).toBe(34);
});