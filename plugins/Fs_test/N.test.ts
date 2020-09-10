import "./JestExt";
import Fs from "./Fs";

const { G, N } = Fs;

const parse = <T, E>(source: string, parser: Fs.N.Parser<T, E>) => G.make(parser)(source);

const tokenError = (position: number, name: string) => ({ type: 'token', context: { position }, name });
const eofError = (position: number) => ({ type: 'eof', context: { position } });
const pathError = <E>(position: number, errors: E[]) => ({ type: 'path', context: { position }, errors });

test("symbol", () => {
	expect(parse("foo", N.symbol("foo"))).toEqualOk("foo");
	expect(parse("", N.symbol("foo"))).toMatchErr(tokenError(0, "foo"));
});

test("regexp", () => {
	const parser = N.regexp("range", /^(\d+)\.\.(\d+)/, (_: any, [, fst, snd]: string[]) => {
		return [fst, snd].map(x => Number.parseInt(x, 10));
	});
	expect(parse("24..42", parser)).toEqualOk([24, 42]);
	expect(parse("", parser)).toMatchErr(tokenError(0, "range"));
});

test("spacing", () => {
	expect(parse("  \r\n  ", N.spacing)).toEqualOk("  \r\n  ");
	expect(parse("", N.spacing)).toEqualOk("");
});

test("spaces", () => {
	expect(parse("  \r\n  ", N.spaces)).toEqualOk("  \r\n  ");
	expect(parse("", N.spaces)).toMatchErr(tokenError(0, "spaces"));
});

test("natural", () => {
	expect(parse("42", N.natural)).toEqualOk(42);
	expect(parse("+42", N.natural)).toMatchErr(tokenError(0, "natural"));
	expect(parse("", N.natural)).toMatchErr(tokenError(0, "natural"));
});

test("integer", () => {
	expect(parse("42", N.integer)).toEqualOk(42);
	expect(parse("+42", N.integer)).toEqualOk(42);
	expect(parse("-42", N.integer)).toEqualOk(-42);
	expect(parse("", N.integer)).toMatchErr(tokenError(0, "integer"));
});

test("number", () => {
	expect(parse("42", N.number)).toEqualOk(42);
	expect(parse("12.34", N.number)).toEqualOk(12.34);
	expect(parse("-12.34e+5", N.number)).toEqualOk(-12.34e+5);
	expect(parse("", N.number)).toMatchErr(tokenError(0, "number"));
});

test("boolean", () => {
	expect(parse("true", N.boolean)).toEqualOk(true);
	expect(parse("false", N.boolean)).toEqualOk(false);
	expect(parse("TRUE", N.boolean)).toMatchErr(tokenError(0, "boolean"));
	expect(parse("", N.boolean)).toMatchErr(tokenError(0, "boolean"));
});

test("text", () => {
	expect(parse('""', N.text)).toEqualOk("");
	expect(parse('"foo"', N.text)).toEqualOk("foo");
	expect(parse('"`"`````""', N.text)).toEqualOk('"``"');
	expect(parse('"`"foo`"\n`"bar`""', N.text)).toEqualOk('"foo"\n"bar"');
	expect(parse('', N.text)).toMatchErr(tokenError(0, "text"));
	expect(parse('"foo```"', N.text)).toMatchErr(tokenError(0, "text"));
	expect(parse('"`\n"', N.text)).toMatchErr(tokenError(0, "text"));
});

test("group", () => {
	const stars = N.symbol("***");
	const alpha = N.regexp('alpha', /^[a-z]+/i);
	expect(parse("***FOO***", N.group(stars, stars, alpha))).toEqualOk("FOO");
	expect(parse("*** foo ***", N.group(stars, stars, alpha))).toEqualOk("foo");
});

test("parens", () => {
	expect(parse("( 42 )", N.parens(N.integer))).toEqualOk(42);
	expect(parse("42", N.parens(N.integer))).toMatchErr(tokenError(0, "("));
});

test("braces", () => {
	expect(parse("{ 42 }", N.braces(N.integer))).toEqualOk(42);
	expect(parse("42", N.braces(N.integer))).toMatchErr(tokenError(0, "{"));
});

test("brackets", () => {
	expect(parse("[ 42 ]", N.brackets(N.integer))).toEqualOk(42);
	expect(parse("42", N.brackets(N.integer))).toMatchErr(tokenError(0, "["));
});

test("chain", () => {
	const numbers = N.chain(N.natural, N.symbol("-"));
	expect(parse("12-34-56-78", numbers)).toEqualOk([12, 34, 56, 78]);
	expect(parse("12 - 34 - 56 - 78", numbers)).toEqualOk([12]);
	expect(parse("", numbers)).toMatchErr(tokenError(0, "natural"));
});

test("join", () => {
	const csv = N.join([N.natural, N.boolean, N.text], N.regexp('comma', /^ *, */));
	expect(parse("42, true, \"foo\"", csv)).toEqualOk([42, true, "foo"]);
	expect(parse("42,\ntrue,\n\"foo\"", csv)).toMatchErr(tokenError(3, "boolean"));
	expect(parse("", csv)).toMatchErr(tokenError(0, "natural"));
});

test("list", () => {
	const answers = N.list(N.oneOf([N.map(N.symbol("yes"), () => true), N.map(N.symbol("no"), () => false)]));
	expect(parse("yes no yes yes no no", answers)).toEqualOk([true, false, true, true, false, false]);
	expect(parse("", answers)).toMatchErr(pathError(0, [tokenError(0, "yes"), tokenError(0, "no")]));
});

test("tuple", () => {
	const password = N.map(N.tuple([N.symbol("Open"), N.symbol("Sesame"), N.symbol("!!")]), () => true);
	expect(parse("Open Sesame !!", password)).toEqualOk(true);
	expect(parse("Open Barley !!", password)).toMatchErr(tokenError(5, "Sesame"));
	expect(parse("", password)).toMatchErr(tokenError(0, "Open"));
});

test("withDefault", () => {
	const command = N.join([N.integer, N.withDefault(N.map(N.symbol("--wait"), () => true), false)], N.spacing);
	expect(parse("42 --wait", command)).toEqualOk([42, true]);
	expect(parse("42", command)).toEqualOk([42, false]);
});

test("parse", () => {
	expect(N.parse("  42  ", N.integer)).toEqual(42);
	expect(() => N.parse("42;", N.integer, e => e.type)).toThrow(new Error(eofError(2).type));
});