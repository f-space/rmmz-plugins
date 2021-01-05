import "./JestExt";
import Fs from "./Fs";

const { R, E } = Fs;

describe("tokenize", () => {
	type AnyToken = Fs.E.AnyToken;
	type TokenType = Fs.E.TokenType;

	const tokenize = E.tokenize;

	const token = <T extends TokenType>(type: T, start: number, end: number) => ({ type, start, end });
	const token1 = <T extends TokenType>(type: T) => [token(type, 0, type.length)];
	const tokens = <T extends TokenType[]>(...types: [...T]) => {
		const { tokens } = types.reduce(({ tokens, start }, type) => {
			const end = start + type.length;
			return { tokens: [...tokens, token(type, start, end)], start: end };
		}, { tokens: [] as AnyToken[], start: 0 });
		return tokens;
	};
	const num = (start: number, end: number) => token('number', start, end);
	const num1 = (s: string) => [num(0, s.length)];
	const id = (start: number, end: number) => token('identifier', start, end);
	const id1 = (s: string) => [id(0, s.length)];
	const unk = (start: number, end: number) => token('unknown', start, end);
	const unk1 = (s: string) => [unk(0, s.length)];

	test("spacing", () => {
		expect(tokenize("")).toEqual([]);
		expect(tokenize("    ")).toEqual([]);
		expect(tokenize("\r\n")).toEqual([]);
		expect(tokenize("a \r\nb\n\r c")).toMatchObject({ length: 3 });
	});

	test("symbol", () => {
		expect(tokenize("!")).toEqual(token1("!"));
		expect(tokenize("+")).toEqual(token1("+"));
		expect(tokenize("-")).toEqual(token1("-"));
		expect(tokenize("*")).toEqual(token1("*"));
		expect(tokenize("/")).toEqual(token1("/"));
		expect(tokenize("%")).toEqual(token1("%"));
		expect(tokenize("**")).toEqual(token1("**"));
		expect(tokenize("===")).toEqual(token1("==="));
		expect(tokenize("!==")).toEqual(token1("!=="));
		expect(tokenize("<=")).toEqual(token1("<="));
		expect(tokenize(">=")).toEqual(token1(">="));
		expect(tokenize("<")).toEqual(token1("<"));
		expect(tokenize(">")).toEqual(token1(">"));
		expect(tokenize("&&")).toEqual(token1("&&"));
		expect(tokenize("||")).toEqual(token1("||"));
		expect(tokenize("(")).toEqual(token1("("));
		expect(tokenize(")")).toEqual(token1(")"));
		expect(tokenize("[")).toEqual(token1("["));
		expect(tokenize("]")).toEqual(token1("]"));
		expect(tokenize(",")).toEqual(token1(","));
		expect(tokenize(".")).toEqual(token1("."));
		expect(tokenize("?")).toEqual(token1("?"));
		expect(tokenize(":")).toEqual(token1(":"));

		expect(tokenize("!!==!!")).toEqual(tokens("!", "!==", "!", "!"));
		expect(tokenize("*******")).toEqual(tokens("**", "**", "**", "*"));
		expect(tokenize("<====>")).toEqual(tokens("<=", "===", ">"));
	});

	test("number", () => {
		expect(tokenize("42")).toEqual(num1("42"));
		expect(tokenize("4.2")).toEqual(num1("4.2"));
		expect(tokenize("0.42")).toEqual(num1("0.42"));
		expect(tokenize("00.42")).toEqual(num1("00.42"));
		expect(tokenize(".42")).toEqual(num1(".42"));
		expect(tokenize("42e42")).toEqual(num1("42e42"));
		expect(tokenize("42e+42")).toEqual(num1("42e+42"));
		expect(tokenize("42e-42")).toEqual(num1("42e-42"));
		expect(tokenize("42E42")).toEqual(num1("42E42"));
		expect(tokenize("42E+42")).toEqual(num1("42E+42"));
		expect(tokenize("42E-42")).toEqual(num1("42E-42"));
		expect(tokenize("0123456789.9876543210")).toEqual(num1("0123456789.9876543210"));

		expect(tokenize("+42")).toEqual([token("+", 0, 1), num(1, 3)]);
		expect(tokenize("-42")).toEqual([token("-", 0, 1), num(1, 3)]);
		expect(tokenize(".e42")).not.toEqual(num1(".e42"));
	});

	test("identifier", () => {
		expect(tokenize("foo")).toEqual(id1("foo"));
		expect(tokenize("abc$123_XYZ")).toEqual(id1("abc$123_XYZ"));
		expect(tokenize("foo$")).toEqual(id1("foo$"));
		expect(tokenize("foo_")).toEqual(id1("foo_"));
		expect(tokenize("foo1")).toEqual(id1("foo1"));
		expect(tokenize("$foo")).toEqual(id1("$foo"));
		expect(tokenize("_foo")).not.toEqual(id1("_foo"));
		expect(tokenize("1foo")).not.toEqual(id1("1foo"));
	});

	test("unknown", () => {
		expect(tokenize("__proto__")).toEqual(unk1("__proto__"));
		expect(tokenize("@_@")).toEqual(unk1("@_@"));
		expect(tokenize("🐛🐛🐛")).toEqual(unk1("🐛🐛🐛"));
		expect(tokenize("ひとつめ ふたつめ")).toEqual([unk(0, 4), unk(5, 9)]);
		expect(tokenize("ひとつめ。ふたつめ")).toEqual([unk(0, 4), unk(4, 5), unk(5, 9)]);
	});
});

describe("parse", () => {
	type AnyToken = Fs.E.AnyToken;
	type ExpressionNode = Fs.E.ExpressionNode;
	type IdentifierNode = Fs.E.IdentifierNode;

	type ReplaceToken<T> = { [P in keyof T]: T[P] extends AnyToken ? string : ReplaceToken<T[P]> };
	type Node = ReplaceToken<ExpressionNode>;
	type Identifier = ReplaceToken<IdentifierNode>;

	const parse = (s: string) => R.map(E.parse(E.tokenize(s)), node => replaceToken(s, node));

	const replaceToken = (source: string, node: ExpressionNode) => {
		const slice = ({ start, end }: { start: number, end: number; }) => source.slice(start, end);
		const rec = (node: ExpressionNode): Node => {
			switch (node.type) {
				case 'number': return num(slice(node.value));
				case 'identifier': return id(slice(node.name));
				case 'member-access': return member(rec(node.object), id(slice(node.property.name)));
				case 'element-access': return elem(rec(node.array), rec(node.index));
				case 'function-call': return call(rec(node.callee), node.args.map(rec));
				case 'unary-operator': return unary(slice(node.operator) as any, rec(node.expr));
				case 'binary-operator': return binary(slice(node.operator) as any, rec(node.lhs), rec(node.rhs));
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

	const tokenError = (position: number, name: string) => ({ type: 'token' as const, context: { position }, name });
	const eofError = (position: number) => ({ type: 'eof' as const, context: { position } });

	test("term", () => {
		expect(parse("42")).toEqualOk(num("42"));
		expect(parse("foo")).toEqualOk(id("foo"));
	});

	test("member-access", () => {
		expect(parse("foo.bar")).toEqualOk(member(id("foo"), id("bar")));
		expect(parse("foo.bar.baz")).toEqualOk(member(member(id("foo"), id("bar")), id("baz")));
		expect(parse("foo.")).toMatchErr(tokenError(2, "identifier"));
	});

	test("element-access", () => {
		expect(parse("foo[42]")).toEqualOk(elem(id("foo"), num("42")));
		expect(parse("foo[bar]")).toEqualOk(elem(id("foo"), id("bar")));
		expect(parse("foo[bar[baz]]")).toEqualOk(elem(id("foo"), elem(id("bar"), id("baz"))));
		expect(parse("foo[bar][baz]")).toEqualOk(elem(elem(id("foo"), id("bar")), id("baz")));
		expect(parse("foo[]")).toMatchErr(tokenError(2, "expression"));
		expect(parse("foo[bar")).toMatchErr(tokenError(3, "]"));
	});

	test("function-call", () => {
		expect(parse("foo()")).toEqualOk(call(id("foo"), []));
		expect(parse("foo(bar)")).toEqualOk(call(id("foo"), [id("bar")]));
		expect(parse("foo(bar, baz, qux)")).toEqualOk(call(id("foo"), [id("bar"), id("baz"), id("qux")]));
		expect(parse("foo(bar, baz, qux,)")).toEqualOk(call(id("foo"), [id("bar"), id("baz"), id("qux")]));
		expect(parse("foo(bar(baz))")).toEqualOk(call(id("foo"), [call(id("bar"), [id("baz")])]));
		expect(parse("foo(bar)(baz)")).toEqualOk(call(call(id("foo"), [id("bar")]), [id("baz")]));
		expect(parse("foo(")).toMatchErr(tokenError(2, ")"));
		expect(parse("foo(,)")).toMatchErr(tokenError(2, "expression"));
		expect(parse("foo(bar,,)")).toMatchErr(tokenError(4, "expression"));
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
		expect(parse("12 *")).toMatchErr(tokenError(2, "expression"));
		expect(parse("12 **")).toMatchErr(tokenError(2, "expression"));
	});

	test("conditional-operator", () => {
		expect(parse("12 ? 34 : 56")).toEqualOk(cond(num("12"), num("34"), num("56")));
		expect(parse("12 ? 34 : 56 ? 78 : 90")).toEqualOk(cond(num("12"), num("34"), cond(num("56"), num("78"), num("90"))));
		expect(parse("12 ? 34 ? 56 : 78 : 90")).toEqualOk(cond(num("12"), cond(num("34"), num("56"), num("78")), num("90")));
		expect(parse("12 ?")).toMatchErr(tokenError(2, "expression"));
		expect(parse("12 ? 34")).toMatchErr(tokenError(3, ":"));
		expect(parse("12 ? 34 :")).toMatchErr(tokenError(4, "expression"));
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

	test("eof", () => {
		expect(parse("foo bar")).toMatchErr(eofError(1));
	});
});

describe("build", () => {
	const eval_ = (source: string, env: object) => E.build(source, R.unwrap(E.parse(E.tokenize(source)) as any))(env);

	const referenceError = (name: string) => ({ type: 'reference' as const, name });
	const propertyError = (property: string) => ({ type: 'property' as const, property });
	const rangeError = (index: number) => ({ type: 'range' as const, index });
	const typeError = <S>(expected: S, actual: unknown) => ({ type: 'type' as const, expected, actual });
	const securityError = (target: string) => ({ type: 'security' as const, target });

	test("number", () => {
		expect(eval_("42", {})).toEqualOk(42);
		expect(eval_("4.2", {})).toEqualOk(4.2);
		expect(eval_("0.42", {})).toEqualOk(0.42);
		expect(eval_("00.42", {})).toEqualOk(0.42);
		expect(eval_(".42", {})).toEqualOk(.42);
		expect(eval_("42e42", {})).toEqualOk(42e42);
		expect(eval_("42e+42", {})).toEqualOk(42e+42);
		expect(eval_("42e-42", {})).toEqualOk(42e-42);
		expect(eval_("42E42", {})).toEqualOk(42E42);
		expect(eval_("42E+42", {})).toEqualOk(42E+42);
		expect(eval_("42E-42", {})).toEqualOk(42E-42);
	});

	test("identifier", () => {
		expect(eval_("foo", { foo: 42 })).toEqualOk(42);
		expect(eval_("foo", {})).toMatchErr(referenceError("foo"));
		expect(eval_("foo", { foo: "foo" })).toMatchErr(typeError('number', "foo"));
	});

	test("member-access", () => {
		expect(eval_("foo.bar", { foo: { bar: 42 } })).toEqualOk(42);
		expect(eval_("foo.length", { foo: [1, 2, 3] })).toEqualOk(3);
		expect(eval_("foo.length", { foo(_1: any, _2: any, _3: any) { } })).toEqualOk(3);
		expect(eval_("foo.bar", { foo: 42 })).toMatchErr(typeError('object', 42));
		expect(eval_("foo.bar", { foo: {} })).toMatchErr(propertyError("bar"));
	});

	test("element-access", () => {
		expect(eval_("foo[3]", { foo: [12, 34, 56, 78, 90] })).toEqualOk(78);
		expect(eval_("foo[bar]", { foo: [12, 34, 56, 78, 90], bar: 3 })).toEqualOk(78);
		expect(eval_("foo[0]", { foo: { "0": 42 } })).toMatchErr(typeError('array', { "0": 42 }));
		expect(eval_("foo[3]", { foo: [0, 1, 2] })).toMatchErr(rangeError(3));
		expect(eval_("foo[bar]", { foo: [], bar: "__proto__" })).toMatchErr(typeError('number', "__proto__"));
	});

	test("function-call", () => {
		expect(eval_("foo()", { foo: () => 42 })).toEqualOk(42);
		expect(eval_("foo(bar, baz)", { foo: (a: number, b: number) => a + b, bar: 12, baz: 30 })).toEqualOk(42);
		expect(eval_("foo()", { foo: 42 })).toMatchErr(typeError('function', 42));
	});

	test("unary-operator", () => {
		const bool = (b: boolean) => b ? 1 : 0;

		expect(eval_("+42", {})).toEqualOk(+42);
		expect(eval_("-42", {})).toEqualOk(-42);
		expect(eval_("bool(!foo)", { bool, foo: true })).toEqualOk(0);

		expect(eval_("+foo", { foo: "foo" })).toMatchErr(typeError('number', "foo"));
		expect(eval_("-foo", { foo: "foo" })).toMatchErr(typeError('number', "foo"));
		expect(eval_("!42", {})).toMatchErr(typeError('boolean', 42));
	});

	test("binary-operator", () => {
		const bool = (b: boolean) => b ? 1 : 0;

		expect(eval_("4 + 2", {})).toEqualOk(6);
		expect(eval_("4 - 2", {})).toEqualOk(2);
		expect(eval_("4 * 2", {})).toEqualOk(8);
		expect(eval_("4 / 2", {})).toEqualOk(2);
		expect(eval_("4 % 2", {})).toEqualOk(0);
		expect(eval_("4 ** 2", {})).toEqualOk(16);
		expect(eval_("bool(4 === 2)", { bool })).toEqualOk(0);
		expect(eval_("bool(4 !== 2)", { bool })).toEqualOk(1);
		expect(eval_("bool(4 <= 2)", { bool })).toEqualOk(0);
		expect(eval_("bool(4 >= 2)", { bool })).toEqualOk(1);
		expect(eval_("bool(4 < 2)", { bool })).toEqualOk(0);
		expect(eval_("bool(4 > 2)", { bool })).toEqualOk(1);
		expect(eval_("bool(foo && bar)", { bool, foo: true, bar: true })).toEqualOk(1);
		expect(eval_("bool(foo && bar)", { bool, foo: false, bar: "bar" })).toEqualOk(0);
		expect(eval_("bool(foo || bar)", { bool, foo: false, bar: false })).toEqualOk(0);
		expect(eval_("bool(foo || bar)", { bool, foo: true, bar: "bar" })).toEqualOk(1);

		expect(eval_("foo + 0", { foo: "foo" })).toMatchErr(typeError('number', "foo"));
		expect(eval_("0 + foo", { foo: "foo" })).toMatchErr(typeError('number', "foo"));
		expect(eval_("foo - 0", { foo: "foo" })).toMatchErr(typeError('number', "foo"));
		expect(eval_("0 - foo", { foo: "foo" })).toMatchErr(typeError('number', "foo"));
		expect(eval_("foo * 0", { foo: "foo" })).toMatchErr(typeError('number', "foo"));
		expect(eval_("0 * foo", { foo: "foo" })).toMatchErr(typeError('number', "foo"));
		expect(eval_("foo / 0", { foo: "foo" })).toMatchErr(typeError('number', "foo"));
		expect(eval_("0 / foo", { foo: "foo" })).toMatchErr(typeError('number', "foo"));
		expect(eval_("foo % 0", { foo: "foo" })).toMatchErr(typeError('number', "foo"));
		expect(eval_("0 % foo", { foo: "foo" })).toMatchErr(typeError('number', "foo"));
		expect(eval_("foo ** 0", { foo: "foo" })).toMatchErr(typeError('number', "foo"));
		expect(eval_("0 ** foo", { foo: "foo" })).toMatchErr(typeError('number', "foo"));
		expect(eval_("bool(foo === 0)", { bool, foo: "foo" })).toMatchErr(typeError('number', "foo"));
		expect(eval_("bool(0 === foo)", { bool, foo: "foo" })).toMatchErr(typeError('number', "foo"));
		expect(eval_("bool(foo !== 0)", { bool, foo: "foo" })).toMatchErr(typeError('number', "foo"));
		expect(eval_("bool(0 !== foo)", { bool, foo: "foo" })).toMatchErr(typeError('number', "foo"));
		expect(eval_("bool(foo <= 0)", { bool, foo: "foo" })).toMatchErr(typeError('number', "foo"));
		expect(eval_("bool(0 <= foo)", { bool, foo: "foo" })).toMatchErr(typeError('number', "foo"));
		expect(eval_("bool(foo >= 0)", { bool, foo: "foo" })).toMatchErr(typeError('number', "foo"));
		expect(eval_("bool(0 >= foo)", { bool, foo: "foo" })).toMatchErr(typeError('number', "foo"));
		expect(eval_("bool(foo < 0)", { bool, foo: "foo" })).toMatchErr(typeError('number', "foo"));
		expect(eval_("bool(0 < foo)", { bool, foo: "foo" })).toMatchErr(typeError('number', "foo"));
		expect(eval_("bool(foo > 0)", { bool, foo: "foo" })).toMatchErr(typeError('number', "foo"));
		expect(eval_("bool(0 > foo)", { bool, foo: "foo" })).toMatchErr(typeError('number', "foo"));
		expect(eval_("bool(foo && bar)", { bool, foo: "foo", bar: true })).toMatchErr(typeError('boolean', "foo"));
		expect(eval_("bool(foo && bar)", { bool, foo: true, bar: "bar" })).toMatchErr(typeError('boolean', "bar"));
		expect(eval_("bool(foo || bar)", { bool, foo: "foo", bar: false })).toMatchErr(typeError('boolean', "foo"));
		expect(eval_("bool(foo || bar)", { bool, foo: false, bar: "bar" })).toMatchErr(typeError('boolean', "bar"));
	});

	test("conditional-operator", () => {
		expect(eval_("foo ? 42 : 24", { foo: true })).toEqualOk(42);
		expect(eval_("foo ? 42 : 24", { foo: false })).toEqualOk(24);
		expect(eval_("foo ? 42 : bar", { foo: true, bar: "bar" })).toEqualOk(42);
		expect(eval_("foo ? bar : 24", { foo: false, bar: "bar" })).toEqualOk(24);
		expect(eval_("foo ? bar : baz", { foo: "foo", bar: 42, baz: 24 })).toMatchErr(typeError('boolean', "foo"));
	});

	test("security", () => {
		expect(eval_("foo.prototype", { foo: { prototype: {} } })).toMatchErr(securityError("prototype property"));
		expect(eval_("foo.constructor", { foo: { constructor() { } } })).toMatchErr(securityError("constructor property"));
		expect(eval_("foo.bar", { foo: { bar: globalThis } })).toMatchErr(securityError("global object"));
		expect(eval_("foo[0]", { foo: [Object] })).toMatchErr(securityError("Object"));
		expect(eval_("foo[0]", { foo: [Object.prototype] })).toMatchErr(securityError("Object.prototype"));
		expect(eval_("foo()", { foo: () => Function })).toMatchErr(securityError("Function"));
		expect(eval_("foo()", { foo: () => Function.prototype })).toMatchErr(securityError("Function.prototype"));
	});

	test("builtin", () => {
		expect(eval_("abs(-42)", {})).toEqualOk(42);
		expect(eval_("max(42, 24)", { max: () => 0 })).toEqualOk(42);
	});
});

describe("other", () => {
	const unwrap = <T>(result: Fs.R.Result<T, unknown>) => R.unwrap(result as Fs.R.Ok<T>);
	const unwrapErr = <E>(result: Fs.R.Result<unknown, E>) => R.unwrapErr(result as Fs.R.Err<E>);

	test("compile", () => {
		expect(unwrap(E.compile("foo"))({ foo: 42 })).toEqualOk(42);
		expect(unwrapErr(E.compile("")).source).toBe("");
		expect(unwrapErr(E.compile("")).error).toEqual(unwrapErr(E.parse([])));
	});

	test("expect", () => {
		expect(E.expect(E.compile("foo"))({ foo: 42 })).toEqualOk(42);
		expect(() => E.expect(E.compile(""), () => "foo")).toThrow(new Error("foo"));
	});

	test("run", () => {
		expect(E.run(E.expect(E.compile("foo")), { foo: 42 })).toBe(42);
		expect(() => E.run(E.expect(E.compile("foo")), {}, () => "bar")).toThrow(new Error("bar"));
	});

	test("interpret", () => {
		expect(E.interpret("foo", { foo: 42 })).toBe(42);
		expect(() => E.interpret("", {}, () => "bar")).toThrow(new Error("bar"));
		expect(() => E.interpret("foo", {}, undefined, () => "bar")).toThrow(new Error("bar"));
	});

	test("error-message", () => {
		const compileError = (source: string) => R.mapErr(E.compile(source), E.defaultCompileErrorFormatter);
		const runtimeError = (source: string, env: object) =>
			R.andThen(compileError(source), evaluator => R.mapErr(evaluator(env), E.defaultRuntimeErrorFormatter));

		expect(compileError("🐛")).toEqualErr(`'expression' expected, but "🐛" found`);
		expect(compileError("")).toEqualErr(`'expression' expected, but no more tokens found`);
		expect(compileError("foo bar")).toEqualErr(`unable to interpret "bar"`);

		expect(runtimeError("foo", {})).toEqualErr(`"foo" not found`);
		expect(runtimeError("foo.bar", { foo: {} })).toEqualErr(`"bar" property not exists`);
		expect(runtimeError("foo[0]", { foo: [] })).toEqualErr(`0 is out of range`);
		expect(runtimeError("foo", { foo: "foo" })).toEqualErr(`'number' expected, but "foo" found`);
		expect(runtimeError("foo.prototype", {})).toEqualErr(`<prototype property> is not allowed for security reasons`);
	});
});