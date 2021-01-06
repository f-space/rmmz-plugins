import "./JestExt";
import Fs from "./Fs";

const { R, N } = Fs;

type PartialParser<T, E> = Fs.N.PartialParser<T, E>;

const parse = <T, E>(source: string, parser: PartialParser<T, E>) => N.make(parser)(source);

const symbolError = (position: number, symbol: string) => ({ type: 'token' as const, context: { position }, cause: { symbol } });
const regexpError = (position: number, name: string) => ({ type: 'token' as const, context: { position }, cause: { name } });
const eoiError = (position: number) => ({ type: 'eoi' as const, context: { position } });

test("symbol", () => {
	expect(parse("foo", N.symbol("foo"))).toEqualOk("foo");
	expect(parse("", N.symbol("foo"))).toMatchErr(symbolError(0, "foo"));
});

test("regexp", () => {
	const parser = N.regexp("range", /^(\d+)\.\.(\d+)/, (_, fst, snd) => {
		return [fst, snd].map(x => Number.parseInt(x, 10));
	});
	expect(parse("24..42", parser)).toEqualOk([24, 42]);
	expect(parse("", parser)).toMatchErr(regexpError(0, "range"));
});

test("spacing", () => {
	expect(parse("  \r\n  ", N.spacing)).toEqualOk("  \r\n  ");
	expect(parse("", N.spacing)).toEqualOk("");
});

test("spaces", () => {
	expect(parse("  \r\n  ", N.spaces)).toEqualOk("  \r\n  ");
	expect(parse("", N.spaces)).toMatchErr(regexpError(0, "spaces"));
});

test("natural", () => {
	expect(parse("42", N.natural)).toEqualOk(42);
	expect(parse("+42", N.natural)).toMatchErr(regexpError(0, "natural"));
	expect(parse("", N.natural)).toMatchErr(regexpError(0, "natural"));
});

test("integer", () => {
	expect(parse("42", N.integer)).toEqualOk(42);
	expect(parse("+42", N.integer)).toEqualOk(42);
	expect(parse("-42", N.integer)).toEqualOk(-42);
	expect(parse("", N.integer)).toMatchErr(regexpError(0, "integer"));
});

test("number", () => {
	expect(parse("42", N.number)).toEqualOk(42);
	expect(parse("12.34", N.number)).toEqualOk(12.34);
	expect(parse("-12.34e+5", N.number)).toEqualOk(-12.34e+5);
	expect(parse("", N.number)).toMatchErr(regexpError(0, "number"));
});

test("boolean", () => {
	expect(parse("true", N.boolean)).toEqualOk(true);
	expect(parse("false", N.boolean)).toEqualOk(false);
	expect(parse("TRUE", N.boolean)).toMatchErr(regexpError(0, "boolean"));
	expect(parse("", N.boolean)).toMatchErr(regexpError(0, "boolean"));
});

test("text", () => {
	expect(parse('""', N.text)).toEqualOk("");
	expect(parse('"foo"', N.text)).toEqualOk("foo");
	expect(parse('"`"`````""', N.text)).toEqualOk('"``"');
	expect(parse('"`"foo`"\n`"bar`""', N.text)).toEqualOk('"foo"\n"bar"');
	expect(parse('', N.text)).toMatchErr(regexpError(0, "text"));
	expect(parse('"foo```"', N.text)).toMatchErr(regexpError(0, "text"));
	expect(parse('"`\n"', N.text)).toMatchErr(regexpError(0, "text"));
});

test("margin", () => {
	expect(parse("42", N.margin(N.integer))).toEqualOk(42);
	expect(parse("  42  ", N.margin(N.integer))).toEqualOk(42);
});

test("group", () => {
	const stars = N.symbol("***");
	const alpha = N.regexp('alpha', /^[a-z]+/i);
	expect(parse("***FOO***", N.group(alpha, stars, stars))).toEqualOk("FOO");
	expect(parse("*** foo ***", N.group(alpha, stars, stars))).toEqualOk("foo");
});

test("parens", () => {
	expect(parse("( 42 )", N.parens(N.integer))).toEqualOk(42);
	expect(parse("42", N.parens(N.integer))).toMatchErr(symbolError(0, "("));
});

test("braces", () => {
	expect(parse("{ 42 }", N.braces(N.integer))).toEqualOk(42);
	expect(parse("42", N.braces(N.integer))).toMatchErr(symbolError(0, "{"));
});

test("brackets", () => {
	expect(parse("[ 42 ]", N.brackets(N.integer))).toEqualOk(42);
	expect(parse("42", N.brackets(N.integer))).toMatchErr(symbolError(0, "["));
});

test("endWith", () => {
	expect(parse("42", N.endWith(N.integer))).toEqualOk(42);
	expect(parse("42;", N.endWith(N.integer))).toMatchErr(eoiError(2));
});

test("withDefault", () => {
	const command = N.join([N.integer, N.withDefault(N.map(N.symbol("--wait"), () => true), false)], N.spacing);
	expect(parse("42 --wait", command)).toEqualOk([42, true]);
	expect(parse("42", command)).toEqualOk([42, false]);
});

test("chain", () => {
	const numbers = N.chain(N.natural, N.symbol("-"));
	expect(parse("", numbers)).toEqualOk([]);
	expect(parse("12-34-56-78", numbers)).toEqualOk([12, 34, 56, 78]);
	expect(parse("12 - 34 - 56 - 78", numbers)).toEqualOk([12]);
});

test("chain1", () => {
	const numbers = N.chain1(N.natural, N.symbol("-"));
	expect(parse("12-34-56-78", numbers)).toEqualOk([12, 34, 56, 78]);
	expect(parse("12 - 34 - 56 - 78", numbers)).toEqualOk([12]);
	expect(parse("", numbers)).toMatchErr(regexpError(0, "natural"));
});

test("join", () => {
	const csv = N.join([N.natural, N.boolean, N.text], N.regexp('comma', /^ *, */));
	expect(parse("42, true, \"foo\"", csv)).toEqualOk([42, true, "foo"]);
	expect(parse("42,\ntrue,\n\"foo\"", csv)).toMatchErr(regexpError(3, "boolean"));
	expect(parse("", csv)).toMatchErr(regexpError(0, "natural"));
});

test("list", () => {
	const answers = N.list(N.oneOf([N.map(N.symbol("yes"), () => true), N.map(N.symbol("no"), () => false)]));
	expect(parse("yes no yes yes no no", answers)).toEqualOk([true, false, true, true, false, false]);
	expect(parse("yep", answers)).toEqualOk([]);
	expect(parse("", answers)).toEqualOk([]);
});

test("tuple", () => {
	const password = N.map(N.tuple([N.symbol("Open"), N.symbol("Sesame"), N.symbol("!!")]), () => true);
	expect(parse("Open Sesame !!", password)).toEqualOk(true);
	expect(parse("Open Barley !!", password)).toMatchErr(symbolError(5, "Sesame"));
	expect(parse("", password)).toMatchErr(symbolError(0, "Open"));
});

test("error-message", () => {
	const error = <T, E>(source: string, parser: PartialParser<T, E>) =>
		R.mapErr(N.make(parser)(source), N.defaultErrorFormatter);

	expect(error("foo", N.symbol("bar"))).toEqualErr(`'bar' expected, but "foo" found`);
	expect(error("foo", N.boolean)).toEqualErr(`'boolean' expected, but "foo" found`);
	expect(error("", N.symbol("bar"))).toEqualErr(`'bar' expected, but no more letters found`);
});