import "./JestExt";
import Fs from "./Fs";

const { O, R, N, M } = Fs;

type Meta = Fs.M.Meta;
type Archetype = Fs.M.Archetype;

const parse = <A extends Archetype>(meta: Meta, parser: A) => M.make(parser)(meta);

const notationError = (expected: 'flag' | 'attr', name: string, value: string | true) =>
	({ type: 'notation' as const, expected, name, value });
const attributeError = <C>(cause: C) => ({ type: 'attribute' as const, cause });

test("flag", () => {
	expect(parse({ foo: true }, M.flag("foo"))).toEqualOk(O.some(true));
	expect(parse({}, M.flag("foo"))).toEqualOk(O.some(false));
	expect(parse({ foo: "true" }, M.flag("foo"))).toMatchErr(notationError('flag', "foo", "true"));
});

test("attr", () => {
	const parse42 = (s: string) => s === "42" ? R.ok(42) : R.err("fail");
	expect(parse({ foo: "42" }, M.attr("foo", parse42))).toEqualOk(O.some(42));
	expect(parse({}, M.attr("foo", parse42))).toEqualOk(O.none());
	expect(parse({ foo: true }, M.attr("foo", parse42))).toMatchErr(notationError('attr', "foo", true));
	expect(parse({ foo: "0" }, M.attr("foo", parse42))).toMatchErr(attributeError("fail"));
});

test("attrN", () => {
	expect(parse({ foo: "42" }, M.attrN("foo", N.integer))).toEqualOk(O.some(42));
});

test("succeed", () => {
	expect(parse({}, M.succeed(42))).toEqualOk(O.some(42));
});

test("miss", () => {
	expect(parse({}, M.miss())).toEqualOk(O.none());
});

test("fail", () => {
	expect(parse({}, M.fail(42))).toEqualErr(42);
});

test("andThen", () => {
	expect(parse({ foo: true }, M.andThen(M.flag("foo"), x => M.succeed(x ? 1 : 0)))).toEqualOk(O.some(1));
	expect(parse({}, M.andThen(M.flag("foo"), x => M.succeed(x ? 1 : 0)))).toEqualOk(O.some(0));
	expect(parse({}, M.andThen(M.attrN("foo", N.boolean), x => M.succeed(x ? 1 : 0)))).toEqualOk(O.none());
});

test("orElse", () => {
	expect(parse({ foo: true }, M.orElse(M.flag("foo"), () => M.succeed(null)))).toEqualOk(O.some(true));
	expect(parse({}, M.orElse(M.flag("foo"), () => M.succeed(null)))).toEqualOk(O.some(false));
	expect(parse({}, M.orElse(M.attrN("foo", N.boolean), () => M.succeed(null)))).toEqualOk(O.some(null));
});

test("map", () => {
	expect(parse({ foo: true }, M.map(M.flag("foo"), x => !x))).toEqualOk(O.some(false));
	expect(parse({}, M.map(M.flag("foo"), x => !x))).toEqualOk(O.some(true));
	expect(parse({}, M.map(M.attrN("foo", N.boolean), x => !x))).toEqualOk(O.none());
});

test("mapError", () => {
	expect(parse({ foo: "true" }, M.mapError(M.flag("foo"), e => e.name))).toMatchErr("foo");
	expect(parse({}, M.mapError(M.flag("foo"), e => e.name))).toEqualOk(O.some(false));
	expect(parse({}, M.mapError(M.attrN("foo", N.boolean), e => e.name))).toEqualOk(O.none());
});

test("withDefault", () => {
	expect(parse({}, M.withDefault(M.attrN("foo", N.integer), 42))).toEqualOk(O.some(42));
});

test("oneOf", () => {
	const parser = M.oneOf([M.attrN("foo", N.integer), M.attrN("bar", N.integer)]);
	expect(parse({ foo: "12", bar: "34" }, parser)).toEqualOk(O.some(12));
	expect(parse({ foo: "12" }, parser)).toEqualOk(O.some(12));
	expect(parse({ bar: "34" }, parser)).toEqualOk(O.some(34));
	expect(parse({}, parser)).toEqualOk(O.none());
	expect(parse({ foo: true, bar: "34" }, parser)).toMatchErr(notationError('attr', "foo", true));
});

test("parse", () => {
	expect(M.parse({ foo: true }, M.flag("foo"))).toBe(true);
	expect(M.parse({}, M.attrN("foo", N.boolean))).toBeUndefined();
	expect(M.parse(
		{ foo: true, bar: "true" },
		M.make([M.flag("foo"), M.attrN("bar", N.boolean)])
	)).toEqual([true, true]);
	expect(M.parse(
		{ foo: true, bar: "true" },
		M.make({ foo: M.flag("foo"), bar: M.attrN("bar", N.boolean) })
	)).toEqual({ foo: true, bar: true });
	expect(() => M.parse({ foo: "true" }, M.flag("foo"), e => e.type))
		.toThrow(new Error(notationError('flag', "foo", "true").type));
});

test("meta", () => {
	const foo = M.meta(M.attrN("foo", N.brackets(N.list(N.integer))));
	const data = { foo: "[42]" };
	expect(foo(data) === foo(data)).toBe(true);
	expect(foo(data)).toEqual([42]);
});

test("error-message", () => {
	const error = <A extends Archetype>(meta: Meta, parser: A) =>
		R.mapErr(M.make(parser)(meta), M.makeDefaultErrorFormatter(attributeErrorFormatter));
	const attributeErrorFormatter = (error: string) => `failed to parse "${error}"`;

	expect(error({ foo: "" }, M.flag("foo"))).toEqualErr(`'foo' metadata does not require value`);
	expect(error({ foo: true }, M.attrN("foo", N.integer))).toEqualErr(`'foo' metadata requires value`);
	expect(error({ foo: "foo" }, M.attr("foo", s => R.err(s))))
		.toEqualErr(`failed to parse 'foo' metadata value; failed to parse "foo"`);
	expect(error({ foo: "foo" }, M.fail("bar"))).toEqualErr(`unknown error: "bar"`);
});