import "./JestExt";
import Fs from "./Fs";

const { R, P } = Fs;

type Parser<T, E> = Fs.P.Parser<T, E>;

const parse = <T, E>(s: string, parser: Parser<T, E>) => parser(s);

const formatError = <K extends string>(expected: K) => ({ type: 'format' as const, expected });
const jsonError = () => ({ type: 'json' as const });
const validationError = <V>(cause: V) => ({ type: 'validation' as const, cause });

test("succeed", () => {
	expect(parse("", P.succeed(42))).toEqualOk(42);
});

test("fail", () => {
	expect(parse("", P.fail(42))).toEqualErr(42);
});

test("andThen", () => {
	expect(parse("42", P.andThen(P.integer, () => P.string))).toEqualOk("42");
	expect(parse("foo", P.andThen(P.integer, () => P.string))).toMatchErr(formatError("integer"));
});

test("orElse", () => {
	expect(parse("42", P.orElse(P.integer, () => P.string))).toEqualOk(42);
	expect(parse("foo", P.orElse(P.integer, () => P.string))).toEqualOk("foo");
});

test("map", () => {
	expect(parse("42", P.map(P.integer, x => x * 10))).toEqualOk(420);
	expect(parse("foo", P.map(P.integer, x => x * 10))).toMatchErr(formatError("integer"));
});

test("mapError", () => {
	expect(parse("42", P.mapError(P.integer, e => e.type))).toEqualOk(42);
	expect(parse("foo", P.mapError(P.integer, e => e.type))).toMatchErr(formatError("integer").type);
});

test("withDefault", () => {
	expect(parse("", P.withDefault(P.integer, 42))).toEqualOk(42);
	expect(parse("foo", P.withDefault(P.integer, 42))).toMatchErr(formatError("integer"));
});

test("validate", () => {
	const validator = (x: number) => x % 2 !== 0 ? R.ok(x) : R.err("even");
	expect(parse("1", P.validate(P.integer, validator))).toEqualOk(1);
	expect(parse("foo", P.validate(P.integer, validator))).toMatchErr(formatError("integer"));
	expect(parse("42", P.validate(P.integer, validator))).toMatchErr(validationError("even"));
});

test("empty", () => {
	expect(parse("", P.empty)).toEqualOk(undefined);
	expect(parse(" ", P.empty)).toMatchErr(formatError("empty"));
});

test("integer", () => {
	expect(parse("42", P.integer)).toEqualOk(42);
	expect(parse("-42", P.integer)).toEqualOk(-42);
	expect(parse("0042", P.integer)).toEqualOk(42);
	expect(parse("", P.integer)).toMatchErr(formatError("integer"));
});

test("number", () => {
	expect(parse("42", P.number)).toEqualOk(42);
	expect(parse("0.42", P.number)).toEqualOk(0.42);
	expect(parse("-4.2e-2", P.number)).toEqualOk(-4.2e-2);
	expect(parse("", P.number)).toMatchErr(formatError("number"));
});

test("string", () => {
	expect(parse("test", P.string)).toEqualOk("test");
	expect(parse("", P.string)).toEqualOk("");
});

test("boolean", () => {
	expect(parse("true", P.boolean)).toEqualOk(true);
	expect(parse("false", P.boolean)).toEqualOk(false);
	expect(parse("", P.boolean)).toMatchErr(formatError("boolean"));
});

test("custom", () => {
	const parser = P.custom(s => {
		const RE = /^\d+\.\.\d+$/;
		const parse = (s: string) => s.split("..").map(x => Number.parseInt(x, 10));
		return RE.test(s) ? R.ok(parse(s)) : R.err("range");
	});
	expect(parse("24..42", parser)).toEqualOk([24, 42]);
	expect(parse("", parser)).toMatchErr(formatError("range"));
});

test("json", () => {
	const data = {
		foo: { bar: 42 },
		baz: [1, 2, 3],
	};
	expect(parse(JSON.stringify(data), P.json)).toEqualOk(data);
});

test("array", () => {
	expect(parse(`[]`, P.array(P.integer))).toEqualOk([]);
	expect(parse(`["1","2","3"]`, P.array(P.integer))).toEqualOk([1, 2, 3]);
	expect(parse(`["[\\"42\\"]"]`, P.array(P.array(P.integer)))).toEqualOk([[42]]);
	expect(parse(`["foo"]`, P.array(P.integer))).toMatchErr(formatError("integer"));
	expect(parse(`{}`, P.array(P.integer))).toMatchErr(formatError("array"));
	expect(parse("", P.array(P.integer))).toMatchErr(jsonError());
});

test("struct", () => {
	expect(parse(`{}`, P.struct([]))).toEqualOk({});
	expect(parse(`{"foo":"42", "bar":"true"}`, P.struct([
		P.entry("foo", P.integer),
		P.entry("bar", P.boolean),
	]))).toEqualOk({ foo: 42, bar: true });
	expect(parse(`{"a":"{\\"b\\":\\"c\\"}"}`, P.struct([
		P.entry("a", P.struct([
			P.entry("b", P.string),
		])),
	]))).toEqualOk({ a: { b: "c" } });
	expect(parse(`{"foo":"bar"}`, P.struct([P.entry("foo", P.integer)]))).toMatchErr(formatError("integer"));
	expect(parse(`[]`, P.struct([]))).toMatchErr(formatError("struct"));
	expect(parse("", P.struct([P.entry("foo", P.integer)]))).toMatchErr(jsonError());
});

test("make", () => {
	const data = JSON.stringify({
		foo: JSON.stringify([
			JSON.stringify({ bar: JSON.stringify(["1", "2", "3"]) }),
			JSON.stringify({ bar: JSON.stringify(["42"]) }),
		]),
		baz: JSON.stringify({
			qux: "true",
			quux: JSON.stringify(["", "3.14", "2.72"]),
		}),
	});
	expect(parse(data, P.make({
		foo: [{ bar: [P.integer] }],
		baz: {
			qux: P.boolean,
			quux: [P.withDefault(P.number, 42)],
		},
	}))).toEqualOk({
		foo: [
			{ bar: [1, 2, 3] },
			{ bar: [42] },
		],
		baz: {
			qux: true,
			quux: [42, 3.14, 2.72],
		},
	});
});

test("parse", () => {
	expect(P.parse(`{"foo":"42"}`, P.make({ foo: P.integer }))).toEqual({ foo: 42 });
	expect(() => P.parse(`{"foo":"42"}`, P.make({ foo: P.boolean }), (e: any) => e.type))
		.toThrow(new Error(formatError("boolean").type));
});

test("parseAll", () => {
	expect(P.parseAll({ foo: "42", bar: "42" }, { foo: P.integer, bar: P.string }))
		.toEqual({ foo: 42, bar: "42" });
});

test("error-message", () => {
	const error = <T, E>(source: string, parser: Parser<T, E>) =>
		R.mapErr(parser(source), P.makeDefaultErrorFormatter(validationErrorFormatter));
	const validationErrorFormatter = (error: string) => `validation to "${error}" failed`;
	const jsonErrorMessage = (source: string) => { try { JSON.parse(source); } catch (e) { return e.message; } };

	expect(error("truee", P.boolean)).toEqualErr(`failed to parse parameter as 'boolean': truee`);
	expect(error("[1, 2,", P.array(P.integer)))
		.toEqualErr(`failed to parse parameter as JSON: "${jsonErrorMessage("[1, 2,")}"`);
	expect(error("foo", P.validate(P.string, s => R.err(s)))).toEqualErr(`validation to "foo" failed`);
	expect(error("foo", P.fail("bar"))).toEqualErr(`unknown error: "bar"`);
});