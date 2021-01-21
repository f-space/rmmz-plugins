import "./JestExt";
import Fs from "./Fs";

const { R, G, E } = Fs;

describe("token", () => {
	type Symbol = Fs.E.Symbol;
	type Token<T> = Fs.E.Token<T>;
	type LexTokenType = Fs.E.LexTokenType;
	type Lexer<T> = Fs.G.PartialParser<string, Token<T>, T>;

	const whitespace = (source: string) => G.mk(E.Lexer.whitespace)(source);
	const symbol = <S extends Symbol>(symbol: S) => G.mk(E.Lexer[symbol] as Lexer<S>)(symbol);
	const number = (source: string) => G.mk(E.Lexer.number)(source);
	const identifier = (source: string) => G.mk(E.Lexer.identifier)(source);
	const unknown = (source: string) => G.mk(E.Lexer.unknown)(source);

	const token = <T extends LexTokenType>(type: T, text: string, position: number) => ({ type, text, position });

	test("whitespace", () => {
		expect(whitespace("")).toEqualOk(token('whitespace', "", 0));
		expect(whitespace("    ")).toEqualOk(token('whitespace', "    ", 0));
		expect(whitespace("\r\n")).toEqualOk(token('whitespace', "\r\n", 0));
	});

	test("symbol", () => {
		expect(symbol("!")).toEqualOk(token('!', "!", 0));
		expect(symbol("+")).toEqualOk(token('+', "+", 0));
		expect(symbol("-")).toEqualOk(token('-', "-", 0));
		expect(symbol("*")).toEqualOk(token('*', "*", 0));
		expect(symbol("/")).toEqualOk(token('/', "/", 0));
		expect(symbol("%")).toEqualOk(token('%', "%", 0));
		expect(symbol("**")).toEqualOk(token('**', "**", 0));
		expect(symbol("===")).toEqualOk(token('===', "===", 0));
		expect(symbol("!==")).toEqualOk(token('!==', "!==", 0));
		expect(symbol("<=")).toEqualOk(token('<=', "<=", 0));
		expect(symbol(">=")).toEqualOk(token('>=', ">=", 0));
		expect(symbol("<")).toEqualOk(token('<', "<", 0));
		expect(symbol(">")).toEqualOk(token('>', ">", 0));
		expect(symbol("&&")).toEqualOk(token('&&', "&&", 0));
		expect(symbol("||")).toEqualOk(token('||', "||", 0));
		expect(symbol("(")).toEqualOk(token('(', "(", 0));
		expect(symbol(")")).toEqualOk(token(')', ")", 0));
		expect(symbol("[")).toEqualOk(token('[', "[", 0));
		expect(symbol("]")).toEqualOk(token(']', "]", 0));
		expect(symbol(",")).toEqualOk(token(',', ",", 0));
		expect(symbol(".")).toEqualOk(token('.', ".", 0));
		expect(symbol("?")).toEqualOk(token('?', "?", 0));
		expect(symbol(":")).toEqualOk(token(':', ":", 0));
	});

	test("number", () => {
		expect(number("0")).toEqualOk(token('number', "0", 0));
		expect(number("1")).toEqualOk(token('number', "1", 0));
		expect(number("42")).toEqualOk(token('number', "42", 0));
		expect(number("4_2_42")).toEqualOk(token('number', "4_2_42", 0));
		expect(number("4.2")).toEqualOk(token('number', "4.2", 0));
		expect(number("0.42")).toEqualOk(token('number', "0.42", 0));
		expect(number("0.4_2_42")).toEqualOk(token('number', "0.4_2_42", 0));
		expect(number("0.420")).toEqualOk(token('number', "0.420", 0));
		expect(number(".42")).toEqualOk(token('number', ".42", 0));
		expect(number("42e42")).toEqualOk(token('number', "42e42", 0));
		expect(number("42.e42")).toEqualOk(token('number', "42.e42", 0));
		expect(number("4.2E+42")).toEqualOk(token('number', "4.2E+42", 0));
		expect(number(".42E-42")).toEqualOk(token('number', ".42E-42", 0));
		expect(number("42e4_2_42")).toEqualOk(token('number', "42e4_2_42", 0));
		expect(number("0b0")).toEqualOk(token('number', "0b0", 0));
		expect(number("0B1")).toEqualOk(token('number', "0B1", 0));
		expect(number("0b00101010")).toEqualOk(token('number', "0b00101010", 0));
		expect(number("0b00_10_10_10")).toEqualOk(token('number', "0b00_10_10_10", 0));
		expect(number("0o0")).toEqualOk(token('number', "0o0", 0));
		expect(number("0O7")).toEqualOk(token('number', "0O7", 0));
		expect(number("0o52")).toEqualOk(token('number', "0o52", 0));
		expect(number("0o0_0_5_2")).toEqualOk(token('number', "0o0_0_5_2", 0));
		expect(number("0x0")).toEqualOk(token('number', "0x0", 0));
		expect(number("0XF")).toEqualOk(token('number', "0XF", 0));
		expect(number("0x2a")).toEqualOk(token('number', "0x2a", 0));
		expect(number("0x0_0_2_a")).toEqualOk(token('number', "0x0_0_2_a", 0));

		expect(number("042")).not.toEqualOk(token('number', "042", 0));
		expect(number("+42")).not.toEqualOk(token('number', "+42", 0));
		expect(number("-42")).not.toEqualOk(token('number', "-42", 0));
		expect(number("_42")).not.toEqualOk(token('number', "_42", 0));
		expect(number("42_")).not.toEqualOk(token('number', "42_", 0));
		expect(number("4_.2")).not.toEqualOk(token('number', "4_.2", 0));
		expect(number("4._2")).not.toEqualOk(token('number', "4._2", 0));
		expect(number("42e")).not.toEqualOk(token('number', "42e", 0));
		expect(number("42e-")).not.toEqualOk(token('number', "42e-", 0));
		expect(number("e42")).not.toEqualOk(token('number', "e42", 0));
		expect(number(".e42")).not.toEqualOk(token('number', ".e42", 0));
		expect(number("42_e42")).not.toEqualOk(token('number', "42_e42", 0));
		expect(number("42e_42")).not.toEqualOk(token('number', "42e_42", 0));
		expect(number("42e+_42")).not.toEqualOk(token('number', "42e+_42", 0));
		expect(number("0b")).not.toEqualOk(token('number', "0b", 0));
		expect(number("0b2")).not.toEqualOk(token('number', "0b2", 0));
		expect(number("0b_0")).not.toEqualOk(token('number', "0b_0", 0));
		expect(number("0o")).not.toEqualOk(token('number', "0o", 0));
		expect(number("0o8")).not.toEqualOk(token('number', "0o8", 0));
		expect(number("0o_0")).not.toEqualOk(token('number', "0o_0", 0));
		expect(number("0x")).not.toEqualOk(token('number', "0x", 0));
		expect(number("0xG")).not.toEqualOk(token('number', "0xG", 0));
		expect(number("0x_0")).not.toEqualOk(token('number', "0x_0", 0));
	});

	test("identifier", () => {
		expect(identifier("foo")).toEqualOk(token('identifier', "foo", 0));
		expect(identifier("abc$123_XYZ")).toEqualOk(token('identifier', "abc$123_XYZ", 0));
		expect(identifier("foo$")).toEqualOk(token('identifier', "foo$", 0));
		expect(identifier("foo_")).toEqualOk(token('identifier', "foo_", 0));
		expect(identifier("foo1")).toEqualOk(token('identifier', "foo1", 0));
		expect(identifier("$foo")).toEqualOk(token('identifier', "$foo", 0));
		expect(identifier("_foo")).not.toEqualOk(token('identifier', "_foo", 0));
		expect(identifier("1foo")).not.toEqualOk(token('identifier', "1foo", 0));
	});

	test("unknown", () => {
		expect(unknown("__proto__")).toEqualOk(token('unknown', "__proto__", 0));
		expect(unknown("@_@")).toEqualOk(token('unknown', "@_@", 0));
		expect(unknown("🐛🐛🐛")).toEqualOk(token('unknown', "🐛🐛🐛", 0));
		expect(unknown("ひとつめ ふたつめ")).toEqualOk(token('unknown', "ひとつめ", 0));
		expect(unknown("ひとつめ。ふたつめ")).toEqualOk(token('unknown', "ひとつめ", 0));
	});
});

describe("parse", () => {
	type ExtTokenType = Fs.E.ExtTokenType;
	type AnyToken = Fs.E.AnyToken;
	type AstNode = Fs.E.AstNode;
	type IdentifierNode = Fs.E.IdentifierNode;

	type ReplaceToken<T> = { [P in keyof T]: T[P] extends AnyToken ? string : ReplaceToken<T[P]> };
	type Node = ReplaceToken<AstNode>;
	type Identifier = ReplaceToken<IdentifierNode>;

	const parse = (s: string) => R.map(E.parse(s), node => replaceToken(node));

	const replaceToken = (node: AstNode) => {
		const rec = (node: AstNode): Node => {
			switch (node.type) {
				case 'number': return num(node.value.text);
				case 'identifier': return id(node.name.text);
				case 'member-access': return member(rec(node.object), id(node.property.name.text));
				case 'element-access': return elem(rec(node.array), rec(node.index));
				case 'function-call': return call(rec(node.callee), node.args.map(rec));
				case 'unary-operator': return unary(node.operator.text as any, rec(node.expr));
				case 'binary-operator': return binary(node.operator.text as any, rec(node.lhs), rec(node.rhs));
				case 'conditional-operator': return cond(rec(node.if), rec(node.then), rec(node.else));
				default: throw new Error("unknown node type");
			}
		};
		return rec(node);
	};

	const num = (value: string) => ({ type: 'number' as const, value });
	const id = (name: string) => ({ type: 'identifier' as const, name });
	const member = (object: Node, property: Identifier) => ({ type: 'member-access' as const, object, property });
	const elem = (array: Node, index: Node) => ({ type: 'element-access' as const, array, index });
	const call = (callee: Node, args: Node[]) => ({ type: 'function-call' as const, callee, args });
	const unary = (operator: Fs.E.UnaryOperator, expr: Node) => ({ type: 'unary-operator' as const, operator, expr });
	const binary = (operator: Fs.E.BinaryOperator, lhs: Node, rhs: Node) => ({ type: 'binary-operator' as const, operator, lhs, rhs });
	const cond = (if_: Node, then: Node, else_: Node) => ({ type: 'conditional-operator' as const, if: if_, then, else: else_ });

	const tokenError = (position: number, type: ExtTokenType) =>
		({ type: 'token' as const, context: { position }, cause: type });
	const eoiError = (position: number) => ({ type: 'eoi' as const, context: { position } });

	test("term", () => {
		expect(parse("42")).toEqualOk(num("42"));
		expect(parse("foo")).toEqualOk(id("foo"));
	});

	test("member-access", () => {
		expect(parse("foo.bar")).toEqualOk(member(id("foo"), id("bar")));
		expect(parse("foo.bar.baz")).toEqualOk(member(member(id("foo"), id("bar")), id("baz")));
		expect(parse("foo.")).toMatchErr(tokenError(4, "identifier"));
	});

	test("element-access", () => {
		expect(parse("foo[42]")).toEqualOk(elem(id("foo"), num("42")));
		expect(parse("foo[bar]")).toEqualOk(elem(id("foo"), id("bar")));
		expect(parse("foo[bar[baz]]")).toEqualOk(elem(id("foo"), elem(id("bar"), id("baz"))));
		expect(parse("foo[bar][baz]")).toEqualOk(elem(elem(id("foo"), id("bar")), id("baz")));
		expect(parse("foo[]")).toMatchErr(tokenError(4, "expression"));
		expect(parse("foo[bar")).toMatchErr(tokenError(7, "]"));
	});

	test("function-call", () => {
		expect(parse("foo()")).toEqualOk(call(id("foo"), []));
		expect(parse("foo(bar)")).toEqualOk(call(id("foo"), [id("bar")]));
		expect(parse("foo(bar, baz, qux)")).toEqualOk(call(id("foo"), [id("bar"), id("baz"), id("qux")]));
		expect(parse("foo(bar, baz, qux,)")).toEqualOk(call(id("foo"), [id("bar"), id("baz"), id("qux")]));
		expect(parse("foo(bar(baz))")).toEqualOk(call(id("foo"), [call(id("bar"), [id("baz")])]));
		expect(parse("foo(bar)(baz)")).toEqualOk(call(call(id("foo"), [id("bar")]), [id("baz")]));
		expect(parse("foo(")).toMatchErr(tokenError(4, ")"));
		expect(parse("foo(,)")).toMatchErr(tokenError(4, ")"));
		expect(parse("foo(bar,,)")).toMatchErr(tokenError(8, "expression"));
	});

	test("unary-operator", () => {
		expect(parse("!foo")).toEqualOk(unary("!", id("foo")));
		expect(parse("+42")).toEqualOk(unary("+", num("42")));
		expect(parse("-42")).toEqualOk(unary("-", num("42")));
		expect(parse("++42")).toEqualOk(unary("+", unary("+", num("42"))));
		expect(parse("+")).toMatchErr(tokenError(1, "expression"));
	});

	test("binary-operator", () => {
		expect(parse("12 + 34 + 56")).toEqualOk(binary("+", binary("+", num("12"), num("34")), num("56")));
		expect(parse("12 - 34 - 56")).toEqualOk(binary("-", binary("-", num("12"), num("34")), num("56")));
		expect(parse("12 * 34 * 56")).toEqualOk(binary("*", binary("*", num("12"), num("34")), num("56")));
		expect(parse("12 / 34 / 56")).toEqualOk(binary("/", binary("/", num("12"), num("34")), num("56")));
		expect(parse("12 % 34 % 56")).toEqualOk(binary("%", binary("%", num("12"), num("34")), num("56")));
		expect(parse("12 ** 34 ** 56")).toEqualOk(binary("**", num("12"), binary("**", num("34"), num("56"))));
		expect(parse("12 === 34 === 56")).toEqualOk(binary("===", binary("===", num("12"), num("34")), num("56")));
		expect(parse("12 !== 34 !== 56")).toEqualOk(binary("!==", binary("!==", num("12"), num("34")), num("56")));
		expect(parse("12 <= 34 <= 56")).toEqualOk(binary("<=", binary("<=", num("12"), num("34")), num("56")));
		expect(parse("12 >= 34 >= 56")).toEqualOk(binary(">=", binary(">=", num("12"), num("34")), num("56")));
		expect(parse("12 < 34 < 56")).toEqualOk(binary("<", binary("<", num("12"), num("34")), num("56")));
		expect(parse("12 > 34 > 56")).toEqualOk(binary(">", binary(">", num("12"), num("34")), num("56")));
		expect(parse("12 && 34 && 56")).toEqualOk(binary("&&", binary("&&", num("12"), num("34")), num("56")));
		expect(parse("12 || 34 || 56")).toEqualOk(binary("||", binary("||", num("12"), num("34")), num("56")));
		expect(parse("12 *")).toMatchErr(tokenError(4, "expression"));
		expect(parse("12 **")).toMatchErr(tokenError(5, "expression"));
	});

	test("conditional-operator", () => {
		expect(parse("12 ? 34 : 56")).toEqualOk(cond(num("12"), num("34"), num("56")));
		expect(parse("12 ? 34 : 56 ? 78 : 90")).toEqualOk(cond(num("12"), num("34"), cond(num("56"), num("78"), num("90"))));
		expect(parse("12 ? 34 ? 56 : 78 : 90")).toEqualOk(cond(num("12"), cond(num("34"), num("56"), num("78")), num("90")));
		expect(parse("12 ?")).toMatchErr(tokenError(4, "expression"));
		expect(parse("12 ? 34")).toMatchErr(tokenError(7, ":"));
		expect(parse("12 ? 34 :")).toMatchErr(tokenError(9, "expression"));
	});

	test("priority", () => {
		expect(parse("(foo).bar[baz]()")).toEqualOk(call(elem(member(id("foo"), id("bar")), id("baz")), []));
		expect(parse("!foo.bar")).toEqualOk(unary("!", member(id("foo"), id("bar"))));
		expect(parse("+42 ** -42")).toEqualOk(binary("**", unary("+", num("42")), unary("-", num("42"))));
		expect(parse("12 ** 34 * 56 ** 78")).toEqualOk(binary("*", binary("**", num("12"), num("34")), binary("**", num("56"), num("78"))));
		expect(parse("12 / 34 - 56 % 78")).toEqualOk(binary("-", binary("/", num("12"), num("34")), binary("%", num("56"), num("78"))));
		expect(parse("12 + 34 < 56 - 78")).toEqualOk(binary("<", binary("+", num("12"), num("34")), binary("-", num("56"), num("78"))));
		expect(parse("12 <= 34 === 56 >= 78")).toEqualOk(binary("===", binary("<=", num("12"), num("34")), binary(">=", num("56"), num("78"))));
		expect(parse("12 === 34 && 56 !== 78")).toEqualOk(binary("&&", binary("===", num("12"), num("34")), binary("!==", num("56"), num("78"))));
		expect(parse("12 && 34 || 56 && 78")).toEqualOk(binary("||", binary("&&", num("12"), num("34")), binary("&&", num("56"), num("78"))));
		expect(parse("12 || 34 ? 56 : 78")).toEqualOk(cond(binary("||", num("12"), num("34")), num("56"), num("78")));
	});

	test("eoi", () => {
		expect(parse("foo ")).toEqualOk(id("foo"));
		expect(parse("foo bar")).toMatchErr(eoiError(4));
	});

	test("parser", () => {
		expect(G.make(E.parser)("foo bar baz", 3)).toEqualOk([
			{ type: 'identifier', name: { type: 'identifier', text: "bar", position: 4 } },
			7,
		]);
	});
});

describe("build", () => {
	type Type = Fs.E.Type;

	const evalAs = (type: Type) => (source: string, env: object) =>
		R.andThen(E.parse(source), node => E.build(type, node)(env));
	const evalNumber = evalAs(E.NUMBER);
	const evalBoolean = evalAs(E.BOOLEAN);
	const evalAny = evalAs(E.ANY);

	const referenceError = (name: string) => ({ type: 'reference' as const, name });
	const propertyError = (property: string) => ({ type: 'property' as const, property });
	const rangeError = (index: number) => ({ type: 'range' as const, index });
	const typeError = <S>(expected: S, actual: unknown) => ({ type: 'type' as const, expected, actual });
	const securityError = (target: string) => ({ type: 'security' as const, target });

	test("number", () => {
		expect(evalAny("0", {})).toEqualOk(0);
		expect(evalAny("1", {})).toEqualOk(1);
		expect(evalAny("42", {})).toEqualOk(42);
		expect(evalAny("4_2_42", {})).toEqualOk(4_2_42);
		expect(evalAny("4.2", {})).toEqualOk(4.2);
		expect(evalAny("0.42", {})).toEqualOk(0.42);
		expect(evalAny("0.4_2_42", {})).toEqualOk(0.4_2_42);
		expect(evalAny("0.420", {})).toEqualOk(0.420);
		expect(evalAny(".42", {})).toEqualOk(.42);
		expect(evalAny("42e42", {})).toEqualOk(42e42);
		expect(evalAny("42.e42", {})).toEqualOk(42.e42);
		expect(evalAny("4.2E+42", {})).toEqualOk(4.2E+42);
		expect(evalAny(".42E-42", {})).toEqualOk(.42E-42);
		expect(evalAny("42e4_2_42", {})).toEqualOk(42e4_2_42);
		expect(evalAny("0b0", {})).toEqualOk(0b0);
		expect(evalAny("0B1", {})).toEqualOk(0B1);
		expect(evalAny("0b00101010", {})).toEqualOk(0b00101010);
		expect(evalAny("0b00_10_10_10", {})).toEqualOk(0b00_10_10_10);
		expect(evalAny("0o0", {})).toEqualOk(0o0);
		expect(evalAny("0O7", {})).toEqualOk(0O7);
		expect(evalAny("0o52", {})).toEqualOk(0o52);
		expect(evalAny("0o0_0_5_2", {})).toEqualOk(0o0_0_5_2);
		expect(evalAny("0x0", {})).toEqualOk(0x0);
		expect(evalAny("0XF", {})).toEqualOk(0XF);
		expect(evalAny("0x2a", {})).toEqualOk(0x2a);
		expect(evalAny("0x0_0_2_a", {})).toEqualOk(0x0_0_2_a);
	});

	test("identifier", () => {
		expect(evalAny("foo", { foo: 42 })).toEqualOk(42);
		expect(evalAny("foo", {})).toMatchErr(referenceError("foo"));
	});

	test("member-access", () => {
		expect(evalAny("foo.bar", { foo: { bar: 42 } })).toEqualOk(42);
		expect(evalAny("foo.length", { foo: [1, 2, 3] })).toEqualOk(3);
		expect(evalAny("foo.length", { foo(_1: any, _2: any, _3: any) { } })).toEqualOk(3);
		expect(evalAny("foo.bar", { foo: 42 })).toMatchErr(typeError('object', 42));
		expect(evalAny("foo.bar", { foo: {} })).toMatchErr(propertyError("bar"));
	});

	test("element-access", () => {
		expect(evalAny("foo[3]", { foo: [12, 34, 56, 78, 90] })).toEqualOk(78);
		expect(evalAny("foo[bar]", { foo: [12, 34, 56, 78, 90], bar: 3 })).toEqualOk(78);
		expect(evalAny("foo[0]", { foo: { "0": 42 } })).toMatchErr(typeError('array', { "0": 42 }));
		expect(evalAny("foo[3]", { foo: [0, 1, 2] })).toMatchErr(rangeError(3));
		expect(evalAny("foo[bar]", { foo: [], bar: "__proto__" })).toMatchErr(typeError('integer', "__proto__"));
		expect(evalAny("foo[bar]", { foo: [], bar: 3.14 })).toMatchErr(typeError('integer', 3.14));
	});

	test("function-call", () => {
		expect(evalAny("foo()", { foo: () => 42 })).toEqualOk(42);
		expect(evalAny("foo(bar, baz)", { foo: (a: number, b: number) => a + b, bar: 12, baz: 30 })).toEqualOk(42);
		expect(evalAny("foo()", { foo: 42 })).toMatchErr(typeError('function', 42));
	});

	test("unary-operator", () => {
		expect(evalAny("+42", {})).toEqualOk(+42);
		expect(evalAny("-42", {})).toEqualOk(-42);
		expect(evalAny("!foo", { foo: true })).toEqualOk(false);

		expect(evalAny("+foo", { foo: "foo" })).toMatchErr(typeError('number', "foo"));
		expect(evalAny("-foo", { foo: "foo" })).toMatchErr(typeError('number', "foo"));
		expect(evalAny("!42", {})).toMatchErr(typeError('boolean', 42));
	});

	test("binary-operator", () => {
		expect(evalAny("4 + 2", {})).toEqualOk(6);
		expect(evalAny("4 - 2", {})).toEqualOk(2);
		expect(evalAny("4 * 2", {})).toEqualOk(8);
		expect(evalAny("4 / 2", {})).toEqualOk(2);
		expect(evalAny("4 % 2", {})).toEqualOk(0);
		expect(evalAny("4 ** 2", {})).toEqualOk(16);
		expect(evalAny("4 === 2", {})).toEqualOk(false);
		expect(evalAny("4 !== 2", {})).toEqualOk(true);
		expect(evalAny("4 <= 2", {})).toEqualOk(false);
		expect(evalAny("4 >= 2", {})).toEqualOk(true);
		expect(evalAny("4 < 2", {})).toEqualOk(false);
		expect(evalAny("4 > 2", {})).toEqualOk(true);
		expect(evalAny("foo && bar", { foo: true, bar: true })).toEqualOk(true);
		expect(evalAny("foo && bar", { foo: false, bar: "bar" })).toEqualOk(false);
		expect(evalAny("foo || bar", { foo: false, bar: false })).toEqualOk(false);
		expect(evalAny("foo || bar", { foo: true, bar: "bar" })).toEqualOk(true);

		expect(evalAny("foo + 0", { foo: "foo" })).toMatchErr(typeError('number', "foo"));
		expect(evalAny("0 + foo", { foo: "foo" })).toMatchErr(typeError('number', "foo"));
		expect(evalAny("foo - 0", { foo: "foo" })).toMatchErr(typeError('number', "foo"));
		expect(evalAny("0 - foo", { foo: "foo" })).toMatchErr(typeError('number', "foo"));
		expect(evalAny("foo * 0", { foo: "foo" })).toMatchErr(typeError('number', "foo"));
		expect(evalAny("0 * foo", { foo: "foo" })).toMatchErr(typeError('number', "foo"));
		expect(evalAny("foo / 0", { foo: "foo" })).toMatchErr(typeError('number', "foo"));
		expect(evalAny("0 / foo", { foo: "foo" })).toMatchErr(typeError('number', "foo"));
		expect(evalAny("foo % 0", { foo: "foo" })).toMatchErr(typeError('number', "foo"));
		expect(evalAny("0 % foo", { foo: "foo" })).toMatchErr(typeError('number', "foo"));
		expect(evalAny("foo ** 0", { foo: "foo" })).toMatchErr(typeError('number', "foo"));
		expect(evalAny("0 ** foo", { foo: "foo" })).toMatchErr(typeError('number', "foo"));
		expect(evalAny("foo === 0", { foo: "foo" })).toMatchErr(typeError('number', "foo"));
		expect(evalAny("0 === foo", { foo: "foo" })).toMatchErr(typeError('number', "foo"));
		expect(evalAny("foo !== 0", { foo: "foo" })).toMatchErr(typeError('number', "foo"));
		expect(evalAny("0 !== foo", { foo: "foo" })).toMatchErr(typeError('number', "foo"));
		expect(evalAny("foo <= 0", { foo: "foo" })).toMatchErr(typeError('number', "foo"));
		expect(evalAny("0 <= foo", { foo: "foo" })).toMatchErr(typeError('number', "foo"));
		expect(evalAny("foo >= 0", { foo: "foo" })).toMatchErr(typeError('number', "foo"));
		expect(evalAny("0 >= foo", { foo: "foo" })).toMatchErr(typeError('number', "foo"));
		expect(evalAny("foo < 0", { foo: "foo" })).toMatchErr(typeError('number', "foo"));
		expect(evalAny("0 < foo", { foo: "foo" })).toMatchErr(typeError('number', "foo"));
		expect(evalAny("foo > 0", { foo: "foo" })).toMatchErr(typeError('number', "foo"));
		expect(evalAny("0 > foo", { foo: "foo" })).toMatchErr(typeError('number', "foo"));
		expect(evalAny("foo && bar", { foo: "foo", bar: true })).toMatchErr(typeError('boolean', "foo"));
		expect(evalAny("foo && bar", { foo: true, bar: "bar" })).toMatchErr(typeError('boolean', "bar"));
		expect(evalAny("foo || bar", { foo: "foo", bar: false })).toMatchErr(typeError('boolean', "foo"));
		expect(evalAny("foo || bar", { foo: false, bar: "bar" })).toMatchErr(typeError('boolean', "bar"));
	});

	test("conditional-operator", () => {
		expect(evalAny("foo ? 42 : 24", { foo: true })).toEqualOk(42);
		expect(evalAny("foo ? 42 : 24", { foo: false })).toEqualOk(24);
		expect(evalAny("foo ? 42 : bar", { foo: true, bar: "bar" })).toEqualOk(42);
		expect(evalAny("foo ? bar : 24", { foo: false, bar: "bar" })).toEqualOk(24);
		expect(evalAny("foo ? bar : baz", { foo: "foo", bar: 42, baz: 24 })).toMatchErr(typeError('boolean', "foo"));
	});

	test("security", () => {
		expect(evalAny("foo.prototype", { foo: { prototype: {} } })).toMatchErr(securityError("prototype property"));
		expect(evalAny("foo.constructor", { foo: { constructor() { } } })).toMatchErr(securityError("constructor property"));
		expect(evalAny("foo.bar", { foo: { bar: globalThis } })).toMatchErr(securityError("global object"));
		expect(evalAny("foo[0]", { foo: [Object] })).toMatchErr(securityError("Object"));
		expect(evalAny("foo[0]", { foo: [Object.prototype] })).toMatchErr(securityError("Object.prototype"));
		expect(evalAny("foo()", { foo: () => Function })).toMatchErr(securityError("Function"));
		expect(evalAny("foo()", { foo: () => Function.prototype })).toMatchErr(securityError("Function.prototype"));
	});

	test("builtin", () => {
		expect(evalAny("Infinity", {})).toEqualOk(Number.POSITIVE_INFINITY);
		expect(evalAny("-Infinity", {})).toEqualOk(Number.NEGATIVE_INFINITY);
		expect(evalAny("NaN", {})).toEqualOk(Number.NaN);
		expect(evalAny("Math.abs(-42)", {})).toEqualOk(42);
		expect(evalAny("Math.max(42, 24)", { max: () => 0 })).toEqualOk(42);
	});

	test("type", () => {
		expect(evalAny("foo", { foo: [] })).toMatchOk([]);
		expect(evalNumber("24 < 42", {})).toMatchErr(typeError('number', true));
		expect(evalBoolean("42", {})).toMatchErr(typeError('boolean', 42));
	});
});

describe("other", () => {
	test("compile", () => {
		expect(R.andThen(E.compile(E.NUMBER, "foo"), f => f({ foo: 42 }))).toEqualOk(42);
		expect(E.compile(E.NUMBER, "")).toEqual(E.parse(""));
	});

	test("expect", () => {
		expect(E.expect(E.compile(E.NUMBER, "foo"))({ foo: 42 })).toEqualOk(42);
		expect(() => E.expect(E.compile(E.NUMBER, ""), () => "foo")).toThrow(new Error("foo"));
	});

	test("run", () => {
		expect(E.run(E.expect(E.compile(E.NUMBER, "foo")), { foo: 42 })).toBe(42);
		expect(() => E.run(E.expect(E.compile(E.NUMBER, "foo")), {}, () => "bar")).toThrow(new Error("bar"));
	});

	test("interpret", () => {
		expect(E.interpret(E.NUMBER, "foo", { foo: 42 })).toBe(42);
		expect(() => E.interpret(E.NUMBER, "", {}, () => "bar")).toThrow(new Error("bar"));
		expect(() => E.interpret(E.NUMBER, "foo", {}, undefined, () => "bar")).toThrow(new Error("bar"));
	});

	test("error-message", () => {
		const compileError = (source: string) => R.mapErr(E.compile(E.NUMBER, source), E.defaultCompileErrorFormatter);
		const runtimeError = (source: string, env: object) =>
			R.andThen(compileError(source), evaluator => R.mapErr(evaluator(env), E.defaultRuntimeErrorFormatter));

		expect(compileError("🐛")).toEqualErr(`'expression' expected, but "🐛" found`);
		expect(compileError("")).toEqualErr(`'expression' expected, but no more tokens found`);
		expect(compileError("foo bar")).toEqualErr(`end-of-input expected, but "bar" found`);

		expect(runtimeError("foo", {})).toEqualErr(`"foo" not found`);
		expect(runtimeError("foo.bar", { foo: {} })).toEqualErr(`"bar" property not exists`);
		expect(runtimeError("foo[0]", { foo: [] })).toEqualErr(`0 is out of range`);
		expect(runtimeError("foo", { foo: "foo" })).toEqualErr(`'number' expected, but "foo" found`);
		expect(runtimeError("foo.prototype", {})).toEqualErr(`<prototype property> is not allowed for security reasons`);
	});
});