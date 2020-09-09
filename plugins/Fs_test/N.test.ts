import Fs from "./Fs";

const { R, G, N } = Fs;

test("symbol", () => {
	expect(G.parse("foo", N.symbol("foo"))).toBe("foo");
});

test("regexp", () => {
	const RE = /^(\d+)\.\.(\d+)/;
	const parser = (_: any, [, fst, snd]: string[]) => [fst, snd].map(x => Number.parseInt(x, 10));
	expect(G.parse("24..42", N.regexp('range', RE, parser))).toEqual([24, 42]);
});

test("spacing", () => {
	expect(G.parse("  \r\n  ", N.spacing)).toBe("  \r\n  ");
	expect(G.parse("", N.spacing)).toBe("");
});

test("spaces", () => {
	expect(G.parse("  \r\n  ", N.spaces)).toBe("  \r\n  ");
	expect(() => G.parse("", N.spaces)).toThrow();
});

test("natural", () => {
	expect(G.parse("42", N.natural)).toBe(42);
	expect(() => G.parse("+42", N.natural)).toThrow();
});

test("integer", () => {
	expect(G.parse("42", N.integer)).toBe(42);
	expect(G.parse("+42", N.integer)).toBe(42);
	expect(G.parse("-42", N.integer)).toBe(-42);
});

test("number", () => {
	expect(G.parse("42", N.number)).toBe(42);
	expect(G.parse("12.34", N.number)).toBe(12.34);
	expect(G.parse("-12.34e+5", N.number)).toBe(-12.34e+5);
});

test("boolean", () => {
	expect(G.parse("true", N.boolean)).toBe(true);
	expect(G.parse("false", N.boolean)).toBe(false);
	expect(() => G.parse("TRUE", N.boolean)).toThrow();
});

test("text", () => {
	expect(G.parse('""', N.text)).toBe("");
	expect(G.parse('"foo"', N.text)).toBe("foo");
	expect(G.parse('"`"`````""', N.text)).toBe('"``"');
	expect(G.parse('"`"foo`"\n`"bar`""', N.text)).toBe('"foo"\n"bar"');
	expect(() => G.parse('', N.text)).toThrow();
	expect(() => G.parse('"foo```"', N.text)).toThrow();
	expect(() => G.parse('"`\n"', N.text)).toThrow();
});

test("group", () => {
	const stars = N.symbol("***");
	const alpha = N.regexp('alpha', /^[a-z]+/i);
	expect(G.parse("***FOO***", N.group(stars, stars, alpha))).toBe("FOO");
	expect(G.parse("*** foo ***", N.group(stars, stars, alpha))).toBe("foo");
});

test("parens", () => {
	expect(G.parse("( 42 )", N.parens(N.integer))).toBe(42);
});

test("braces", () => {
	expect(G.parse("{ 42 }", N.braces(N.integer))).toBe(42);
});

test("brackets", () => {
	expect(G.parse("[ 42 ]", N.brackets(N.integer))).toBe(42);
});

test("chain", () => {
	const numbers = N.chain(N.natural, N.symbol("-"));
	expect(G.parse("12-34-56-78", numbers)).toEqual([12, 34, 56, 78]);
});

test("join", () => {
	const csv = N.join([N.natural, N.boolean, N.text], N.regexp('comma', /^ *, */));
	expect(G.parse("42, true, \"foo\"", csv)).toEqual([42, true, "foo"]);
});

test("list", () => {
	const answers = N.list(N.oneOf([N.map(N.symbol("yes"), () => true), N.map(N.symbol("no"), () => false)]));
	expect(G.parse("yes no yes yes no no", answers)).toEqual([true, false, true, true, false, false]);
});

test("tuple", () => {
	const password = N.map(N.tuple([N.symbol("Open"), N.symbol("Sesame"), N.symbol("!!")]), () => true);
	expect(G.parse("Open Sesame !!", password)).toBe(true);
	expect(() => G.parse("Open Barley !!", password)).toThrow();
});

test("withDefault", () => {
	const command = N.join([N.integer, N.withDefault(N.map(N.symbol("--wait"), () => true), false)], N.spacing);
	expect(G.parse("42 --wait", command)).toEqual([42, true]);
	expect(G.parse("42", command)).toEqual([42, false]);
});

test("make", () => {
	expect(N.make(N.integer)("  42  ")).toEqual(R.ok(42));
	expect(N.make(N.integer)("42;")).toMatchObject(R.err({ type: 'eof', context: { source: "42;", position: 2 } }));
});