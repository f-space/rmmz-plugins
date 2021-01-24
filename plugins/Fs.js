/*:
 * @target MZ
 * @plugindesc
 * 🚩 Basic function library for RPG Maker plugins.
 * Version: 0.3.0
 * @author F_
 * @url https://github.com/f-space/rmmz-plugins
 * 
 * @help
 * 
 * Basic function library for RPG Maker plugins.
 * 
 * ---
 * Copyright (c) 2020 F_
 * Released under the MIT license
 * https://github.com/f-space/rmmz-plugins/blob/master/LICENSE
 */

"use strict";

{
	const LinkedList = (() => {
		const make = () => node(null);

		const init = (node, value) => Object.assign(node, { value, prev: node, next: node });
		const node = value => init({}, value);
		const value = node => node.value;
		const first = list => list.next;
		const last = list => list.prev;

		const $set = (node, value) => { node.value = value; };

		const $insertBefore = (node, ref) => {
			const prev = ref.prev;
			node.prev = prev;
			node.next = ref;
			ref.prev = prev.next = node;
		};

		const $remove = node => {
			const { prev, next } = node;
			prev.next = next;
			next.prev = prev;
			node.prev = node.next = node;
		};

		return { make, node, value, first, last, $set, $insertBefore, $remove };
	})();

	const LruCache = (() => {
		const make = capacity => ({
			capacity: Math.max(capacity, 1),
			map: new Map(),
			list: LinkedList.make(),
		});

		const $get = (cache, key) => {
			const { map, list } = cache;
			const node = map.get(key);
			if (node !== undefined) {
				$touch(list, node);
				return LinkedList.value(node).value;
			} else {
				return undefined;
			}
		};

		const $set = (cache, key, value) => {
			const { capacity, map, list } = cache;
			const node = map.get(key);
			if (node !== undefined) {
				LinkedList.$set(node, value);
				$touch(cache, node);
			} else {
				while (map.size >= capacity) {
					$remove(map, LinkedList.last(list));
				}
				$add(map, list, LinkedList.node({ key, value }));
			}
		};

		const $touch = (list, node) => {
			LinkedList.$remove(node);
			LinkedList.$insertBefore(node, LinkedList.first(list));
		};

		const $add = (map, list, node) => {
			const { key } = LinkedList.value(node);
			map.set(key, node);
			LinkedList.$insertBefore(node, LinkedList.first(list));
		};

		const $remove = (map, node) => {
			const { key } = LinkedList.value(node);
			map.delete(key);
			LinkedList.$remove(node);
		};

		return { make, $get, $set };
	})();

	const Monad = (unit, bind) => {
		const map = (monad, fn) => bind(monad, value => unit(fn(value)));
		const zip = monads => zipRec(monads, []);
		const zipRec = (ms, xs) => ms.length !== 0 ? bind(ms[0], x => zipRec(ms.slice(1), [...xs, x])) : unit(xs);
		const zipL = monads => zipLRec(monads, []);
		const zipLRec = (ms, xs) => ms.length !== 0 ? bind(ms[0](), x => zipLRec(ms.slice(1), [...xs, x])) : unit(xs);

		return { map, zip, zipL };
	};

	const panic = message => { throw new Error(message); };
	const try_ = (fn, handler) => { try { return fn(); } catch (e) { return handler(e); } };

	const O = (() => {
		const some = value => ({ value });
		const none = () => undefined;
		const unwrap = option => option.value;
		const isSome = option => option !== undefined;
		const isNone = option => option === undefined;
		const andThen = (option, fn) => isSome(option) ? fn(unwrap(option)) : option;
		const orElse = (option, fn) => isSome(option) ? option : fn();
		const match = (option, onSome, onNone) => isSome(option) ? onSome(unwrap(option)) : onNone();
		const expect = (option, formatter) => isSome(option) ? unwrap(option) : panic(formatter());
		const withDefault = (option, value) => isSome(option) ? unwrap(option) : value;
		const { map, zip, zipL } = Monad(some, andThen);

		return { some, none, unwrap, isSome, isNone, andThen, orElse, match, expect, withDefault, map, zip, zipL };
	})();

	const R = (() => {
		const ok = value => ({ value });
		const err = error => ({ error });
		const unwrap = result => result.value;
		const unwrapErr = result => result.error;
		const isOk = result => result.hasOwnProperty("value");
		const isErr = result => !isOk(result);
		const andThen = (result, fn) => isOk(result) ? fn(unwrap(result)) : result;
		const orElse = (result, fn) => isOk(result) ? result : fn(unwrapErr(result));
		const match = (result, onOk, onErr) => isOk(result) ? onOk(unwrap(result)) : onErr(unwrapErr(result));
		const expect = (result, formatter) => isOk(result) ? unwrap(result) : panic(formatter(unwrapErr(result)));
		const attempt = fn => try_(() => ok(fn()), err);
		const mapBoth = (result, mapOk, mapErr) => match(result, value => ok(mapOk(value)), error => err(mapErr(error)));
		const { map: map, zip: all, zipL: allL } = Monad(ok, andThen);
		const { map: mapErr, zip: any, zipL: anyL } = Monad(err, orElse);

		return { ok, err, unwrap, unwrapErr, isOk, isErr, andThen, orElse, match, expect, attempt, mapBoth, map, mapErr, all, any, allL, anyL };
	})();

	const L = (() => {
		const nil = () => null;
		const cons = (x, xs) => [x, xs];
		const singleton = x => cons(x, nil());
		const empty = list => list === null;
		const head = list => list[0];
		const tail = list => list[1];
		const match = (list, onNil, onCons) => empty(list) ? onNil() : onCons(head(list), tail(list));
		const find = (list, fn) => empty(list) ? undefined : fn(head(list)) ? head(list) : find(tail(list), fn);
		const some = (list, fn) => empty(list) ? false : fn(head(list)) ? true : some(tail(list), fn);
		const every = (list, fn) => empty(list) ? true : fn(head(list)) ? every(tail(list), fn) : false;
		const reverse = list => reverseRec(list, nil());
		const reverseRec = (list, acc) => empty(list) ? acc : reverseRec(tail(list), cons(head(list), acc));
		const reduce = (list, fn, value) => empty(list) ? value : reduce(tail(list), fn, fn(value, head(list)));
		const reduceRight = (list, fn, value) => reduce(reverse(list), fn, value);
		const map = (list, fn) => reduceRight(list, (xs, x) => cons(fn(x), xs), nil());
		const toArray = list => reduce(list, (xs, x) => [...xs, x], []);

		return { nil, cons, singleton, empty, head, tail, match, find, some, every, reverse, reduce, reduceRight, map, toArray };
	})();

	const S = (() => {
		const ELLIPSIS = "...";
		const ellipsis = (s, length) => s.length > length ? s.slice(0, length - ELLIPSIS.length) + ELLIPSIS : s;

		const debug = (value, replacer) => {
			const rec = (value, context) => {
				const { replacer } = context;
				const v = replacer !== undefined ? replacer(value) : value;
				switch (typeof v) {
					case 'undefined': return String(v);
					case 'number': return String(v);
					case 'string': return JSON.stringify(v);
					case 'boolean': return String(v);
					case 'symbol': return String(v);
					case 'bigint': return `${v}n`;
					case 'object': return object(v, context);
					case 'function': return `[Function: ${name(v)}]`;
					default: return "<unknown>";
				}
			};

			const name = ({ name }) => typeof name === 'string' && name !== "" ? name : "(anonymous)";

			const object = (value, context) => {
				const { stack } = context;
				if (value === null) return "null";
				if (stack.includes(value)) return "...";
				return objectCore(value, { ...context, stack: [...stack, value] });
			};

			const objectCore = (value, context) => {
				const array = (value, step) => value.length !== 0 ? `[ ${value.map(step).join(", ")} ]` : "[]";

				const step = value => rec(value, context);
				if (Array.isArray(value)) return array(value, step);
				if (value instanceof RegExp) return String(value);
				if (value instanceof Date) return value.toISOString();
				return normalObject(value, step);
			};

			const normalObject = (value, step) => {
				const type = objectType(value);
				const entries = objectEntries(value, step);
				const label = type !== undefined ? `${type} ` : "";
				const contents = entries !== "" ? `{ ${entries} }` : "{}";
				return label + contents;
			};

			const objectType = value => {
				const prototype = Object.getPrototypeOf(value);
				if (prototype === null) return "(null)";
				if (prototype === Object.prototype) return undefined;
				return name(prototype.constructor);
			};

			const objectEntries = (value, step) => {
				const map = (value, step) => Array.from(value).map(entry => entry.map(step).join(" => ")).join(", ");
				const set = (value, step) => Array.from(value).map(step).join(", ");
				const other = (value, step) => Object.entries(value).map(([k, v]) => `${key(k)}: ${step(v)}`).join(", ");
				const key = s => /^[a-z_$][a-z0-9_$]*$/i.test(s) ? s : JSON.stringify(s);

				if (value instanceof Map) return map(value, step);
				if (value instanceof Set) return set(value, step);
				if (value instanceof WeakMap) return "<***>";
				if (value instanceof WeakSet) return "<***>";
				return other(value, step);
			};

			return rec(value, { replacer, stack: [] });
		};

		return { ellipsis, debug };
	})();

	const U = (() => {
		const simpleEqual = (a, b) => {
			const arrayEqual = (a, b, eq) => a.length === b.length && a.every((v, i) => eq(v, b[i]));
			const pojoEqual = (a, b, eq) => {
				const has = (obj, key) => obj.hasOwnProperty(key);
				const akeys = Object.keys(a);
				const bkeys = Object.keys(b);
				return akeys.length === bkeys.length && akeys.every(k => has(b, k) && eq(a[k], b[k]));
			};
			const isPojo = x => Object.getPrototypeOf(x) === Object.prototype;

			if (Object.is(a, b)) return true;
			if (typeof a !== typeof b) return false;
			if (typeof a !== 'object') return false;
			if (a === null || b === null) return false;
			if (Array.isArray(a)) return Array.isArray(b) && arrayEqual(a, b, simpleEqual);
			if (isPojo(a)) return isPojo(b) && pojoEqual(a, b, simpleEqual);
			return false;
		};

		const defaultSerialize = args => JSON.stringify(args);
		const memo = (fn, size, serialize = defaultSerialize) => {
			const cache = LruCache.make(size);
			return (...args) => {
				const key = serialize(args);
				const result = LruCache.$get(cache, key);
				if (result !== undefined) {
					return result.value;
				} else {
					const value = fn(...args);
					LruCache.$set(cache, key, { value });
					return value;
				}
			};
		};

		const defaultEq = (a, b) => a.every((v, i) => Object.is(v, b[i]));
		const memo1 = (fn, eq = defaultEq) => {
			let cache = null;
			return (...args) => {
				if (cache !== null && eq(cache.args, args)) {
					return cache.value;
				} else {
					const value = fn(...args);
					cache = { args, value };
					return value;
				}
			};
		};

		const memoW = fn => {
			const cache = new WeakMap();
			return obj => {
				if (cache.has(obj)) {
					return cache.get(obj);
				} else {
					const value = fn(obj);
					cache.set(obj, value);
					return value;
				}
			};
		};

		return { simpleEqual, memo, memo1, memoW };
	})();

	const G = (() => {
		const tokenError = ({ cache, ...context }, cause) => ({ type: 'token', context, cause });
		const eoiError = ({ cache, ...context }) => ({ type: 'eoi', context });
		const andError = ({ cache, ...context }, error) => ({ type: 'and', context, error });
		const notError = ({ cache, ...context }, value) => ({ type: 'not', context, value });
		const validationError = ({ cache, ...context }, cause) => ({ type: 'validation', context, cause });

		const token = accept => context => {
			const { source, position } = context;
			return R.match(
				accept(source, position),
				([value, position]) => R.ok([value, { ...context, position }]),
				cause => R.err(tokenError(context, cause)),
			);
		};

		const eoi = () => context => {
			const { source, position } = context;
			return position === source.length ? R.ok([null, context]) : R.err(eoiError(context));
		};

		const succeed = value => context => R.ok([value, context]);
		const fail = error => () => R.err(error);
		const andThen = (parser, fn) => context => R.andThen(parser(context), ([value, context]) => fn(value)(context));
		const orElse = (parser, fn) => context => R.orElse(parser(context), error => fn(error)(context));
		const if_ = (cond, then, else_) =>
			context => R.match(cond(context), ([value, context]) => then(value)(context), error => else_(error)(context));
		const map = (parser, fn) => context => R.map(parser(context), ([value, context]) => [fn(value), context]);
		const mapError = (parser, fn) => context => R.mapErr(parser(context), fn);
		const fromResult = result => R.match(result, succeed, fail);

		const sequence = (a, b) => andThen(a, v1 => map(b, v2 => L.cons(v2, v1)));
		const choice = (a, b) => orElse(a, e1 => mapError(b, e2 => L.cons(e2, e1)));
		const loop = (parser, acc) => if_(parser, value => loop(parser, L.cons(value, acc)), () => succeed(acc));
		const toArray = list => L.toArray(L.reverse(list));

		const seqOf = parsers => map(parsers.reduce(sequence, succeed(L.nil())), toArray);
		const oneOf = parsers => mapError(parsers.reduce(choice, fail(L.nil())), toArray);
		const optional = parser => choice(map(parser, O.some), succeed(O.none()));
		const many = parser => map(loop(parser, L.nil()), toArray);
		const many1 = parser => map(andThen(parser, value => loop(parser, L.singleton(value))), toArray);
		const and = (pred, parser) => context => R.match(pred(context), () => parser(context), error => R.err(andError(context, error)));
		const not = (pred, parser) => context => R.match(pred(context), ([value]) => R.err(notError(context, value)), () => parser(context));
		const ref = getter => context => getter()(context);
		const validate = (parser, validator) =>
			context => andThen(parser, value => fromResult(R.mapErr(validator(value), cause => validationError(context, cause))))(context);

		const memo = parser => context => {
			const { position, cache } = context;
			if (cache !== null && position < cache.length) {
				const list = cache[position];
				const entry = L.find(list, x => x.parser === parser);
				if (entry !== undefined) {
					return entry.result;
				} else {
					const result = parser(context);
					cache[position] = L.cons({ parser, result }, list);
					return result;
				}
			} else {
				return parser(context);
			}
		};

		const makeContext = (source, position, options = {}) => {
			const cache = options.noCache ? null : [...new Array(source.length).fill(L.nil())];
			return { source, position, cache };
		};

		const make = (parser, options) => (source, position = 0) =>
			R.map(parser(makeContext(source, position, options)), ([value, { position }]) => [value, position]);

		const mk = (parser, options) => source =>
			R.map(parser(makeContext(source, 0, options)), ([value]) => value);

		const parse = (source, parser, errorFormatter = defaultErrorFormatter) => R.expect(parser(source), errorFormatter);

		const makeDefaultErrorFormatter = (tokenErrorFormatter, validationErrorFormatter) => {
			const dots = s => S.ellipsis(s, 16);
			const rest = ({ source: s, position: i }) => typeof s == 'string' ? `"${dots(s.slice(i))}"` : S.debug(s[i]);
			const pick = error => {
				const reduce = errors => errors.reduce((acc, e) => choice(acc, pick(e)), undefined);
				const choice = (a, b) => priority(a) >= priority(b) ? a : b;
				const priority = e => e?.context.position ?? -Infinity;
				return Array.isArray(error) ? reduce(error) : error;
			};
			const message = error => {
				switch (error?.type) {
					case 'token': return tokenErrorFormatter(error.cause);
					case 'eoi': return `end-of-input expected, but ${rest(error.context)} found`;
					case 'and': return `and-predicate failed at ${rest(error.context)}`;
					case 'not': return `not-predicate failed at ${rest(error.context)}`;
					case 'validation': return validationErrorFormatter(error.cause);
					default: return `unknown error: ${S.debug(error)}`;
				}
			};
			return error => message(pick(error));
		};

		const simpleErrorFormatter = error => typeof error === 'string' ? error : S.debug(error);

		const defaultErrorFormatter = makeDefaultErrorFormatter(simpleErrorFormatter, simpleErrorFormatter);

		return {
			token,
			eoi,
			succeed,
			fail,
			andThen,
			orElse,
			if: if_,
			map,
			mapError,
			seqOf,
			oneOf,
			optional,
			many,
			many1,
			and,
			not,
			ref,
			validate,
			memo,
			make,
			mk,
			parse,
			makeDefaultErrorFormatter,
			defaultErrorFormatter,
		};
	})();

	const E = (() => {
		const NUMBER = 'number';
		const BOOLEAN = 'boolean';
		const ANY = 'any';

		const Lexer = (() => {
			const RE_WHITESPACE = /^[ \t\r\n]*/;
			const RE_DECIMAL_DIGITS = `(?:[0-9]+(?:_[0-9]+)*)`;
			const RE_DECIMAL_INTEGER_LITERAL = `(?:0(?![bBoOxX])|[1-9](?:_?${RE_DECIMAL_DIGITS})?)`;
			const RE_EXPORNENT_PART = `(?:[eE][+-]?${RE_DECIMAL_DIGITS})`;
			const RE_DECIMAL_LITERAL =
				`(?:(?:${RE_DECIMAL_INTEGER_LITERAL}(?:\\.${RE_DECIMAL_DIGITS}?)?|\\.${RE_DECIMAL_DIGITS})${RE_EXPORNENT_PART}?)`;
			const RE_BINARY_INTEGER_LITERAL = `(?:0[bB][0-1]+(?:_[0-1]+)*)`;
			const RE_OCTAL_INTEGER_LITERAL = `(?:0[oO][0-7]+(?:_[0-7]+)*)`;
			const RE_HEX_INTEGER_LITERAL = `(?:0[xX][0-9a-fA-F]+(?:_[0-9a-fA-F]+)*)`;
			const RE_NON_DECIMAL_INTEGER_LITERAL =
				`(?:${RE_BINARY_INTEGER_LITERAL}|${RE_OCTAL_INTEGER_LITERAL}|${RE_HEX_INTEGER_LITERAL})`;
			const RE_NUMERIC_LITERAL = `(?:${RE_DECIMAL_LITERAL}|${RE_NON_DECIMAL_INTEGER_LITERAL})`;
			const RE_NUMBER = new RegExp(`^${RE_NUMERIC_LITERAL}`);
			const RE_BOOLEAN = /^(?:true|false)\b/;
			const RE_IDENTIFIER = /^[a-z$][a-z0-9$_]*/i;
			const RE_UNKNOWN = /^(?:[a-z0-9$_]+|[\p{L}\p{N}\p{Pc}\p{M}\p{Cf}]+|[\p{P}\p{S}]+|[^ \t\r\n]+)/iu;

			const next = (type, text, position) => [{ type, text, position }, position + text.length];

			const symbol = symbol => G.token((source, position) => {
				return source.startsWith(symbol, position) ? R.ok(next(symbol, symbol, position)) : R.err(symbol);
			});

			const regexp = (type, re) => G.memo(G.token((source, position) => {
				const match = source.slice(position).match(re);
				return match !== null ? R.ok(next(type, match[0], position)) : R.err(type);
			}));

			return {
				"!": symbol("!"),
				"!==": symbol("!=="),
				"%": symbol("%"),
				"&&": symbol("&&"),
				"(": symbol("("),
				")": symbol(")"),
				"*": symbol("*"),
				"**": symbol("**"),
				"+": symbol("+"),
				",": symbol(","),
				"-": symbol("-"),
				".": symbol("."),
				"/": symbol("/"),
				":": symbol(":"),
				"<": symbol("<"),
				"<=": symbol("<="),
				"===": symbol("==="),
				">": symbol(">"),
				">=": symbol(">="),
				"?": symbol("?"),
				"[": symbol("["),
				"]": symbol("]"),
				"||": symbol("||"),
				"whitespace": regexp("whitespace", RE_WHITESPACE),
				"number": regexp("number", RE_NUMBER),
				"boolean": regexp("boolean", RE_BOOLEAN),
				"identifier": regexp("identifier", RE_IDENTIFIER),
				"unknown": regexp("unknown", RE_UNKNOWN),
			};
		})();

		const parser = (() => {
			const numberNode = value => ({ type: 'number', value });
			const booleanNode = value => ({ type: 'boolean', value });
			const identifierNode = name => ({ type: 'identifier', name });
			const memberAccessNode = (object, property) => ({ type: 'member-access', object, property });
			const elementAccessNode = (array, index) => ({ type: 'element-access', array, index });
			const functionCallNode = (callee, args) => ({ type: 'function-call', callee, args });
			const unaryOpNode = (operator, expr) => ({ type: 'unary-operator', operator, expr });
			const binaryOpNode = (operator, lhs, rhs) => ({ type: 'binary-operator', operator, lhs, rhs });
			const condOpNode = (if_, then, else_) => ({ type: 'conditional-operator', if: if_, then, else: else_ });

			const token = type => (parser => G.andThen(Lexer.whitespace, () => parser))(Lexer[type]);
			const fail = type => G.token(() => R.err(type));

			const number = G.map(token("number"), value => numberNode(value));
			const boolean = G.map(token("boolean"), value => booleanNode(value));
			const identifier = G.map(token("identifier"), name => identifierNode(name));

			const group = (term, expr) => {
				const succ = G.andThen(expr, node => G.map(token(")"), () => node));
				return G.if(token("("), () => succ, () => term);
			};

			const postfixOp = (term, expr) => {
				const cont = G.ref(() => rec);
				const cases = [
					memberAccess(cont),
					elementAccess(expr, cont),
					functionCall(expr, cont),
				];
				const rec = cases.reduceRight((next, case_) => case_(next), G.succeed(node => node));
				return G.andThen(term, node => G.map(rec, ctor => ctor(node)));
			};

			const memberAccess = cont => next => {
				const succ = G.map(
					G.seqOf([identifier, cont]),
					([property, ctor]) => object => ctor(memberAccessNode(object, property)),
				);
				return G.if(token("."), () => succ, () => next);
			};

			const elementAccess = (expr, cont) => next => {
				const succ = G.map(
					G.seqOf([expr, token("]"), cont]),
					([index, , ctor]) => array => ctor(elementAccessNode(array, index)),
				);
				return G.if(token("["), () => succ, () => next);
			};

			const functionCall = (expr, cont) => next => {
				const succ = G.map(
					G.seqOf([functionArgs(expr), token(")"), cont]),
					([args, , ctor]) => callee => ctor(functionCallNode(callee, args)),
				);
				return G.if(token("("), () => succ, () => next);
			};
			const functionArgs = expr => {
				const rec = G.andThen(expr, node => G.if(
					token(","),
					() => G.orElse(G.and(token(")"), G.succeed(L.singleton(node))), () => G.map(rec, rest => L.cons(node, rest))),
					() => G.succeed(L.singleton(node)),
				));
				return G.orElse(G.not(expr, G.succeed([])), () => G.map(rec, L.toArray));
			};

			const unaryOp = (term, op) => {
				const rec = G.if(
					op,
					operator => G.map(rec, expr => unaryOpNode(operator, expr)),
					() => term,
				);
				return rec;
			};

			const binaryOpL = (term, op) => G.map(binaryOpList(term, op), list => L.reduce(list, binaryOpReducerL, [])[0]);
			const binaryOpReducerL = (xs, x) => xs.length == 2 ? [binaryOpNode(xs[1], xs[0], x)] : [...xs, x];
			const binaryOpR = (term, op) => G.map(binaryOpList(term, op), list => L.reduceRight(list, binaryOpReducerR, [])[0]);
			const binaryOpReducerR = (xs, x) => xs.length == 2 ? [binaryOpNode(xs[1], x, xs[0])] : [...xs, x];
			const binaryOpList = (term, op) => {
				const rec = G.andThen(term, lhs => G.if(
					op,
					operator => G.map(rec, rhs => L.cons(lhs, L.cons(operator, rhs))),
					() => G.succeed(L.singleton(lhs)),
				));
				return rec;
			};

			const condOp = (term, expr) => {
				const succ = G.seqOf([expr, token(":"), G.ref(() => rec)]);
				const rec = G.andThen(term, if_ => G.if(
					token("?"),
					() => G.map(succ, ([then, , else_]) => condOpNode(if_, then, else_)),
					() => G.succeed(if_),
				));
				return rec;
			};

			const expression = G.ref(() => exprL0);
			const exprL11 = G.memo(G.orElse(G.oneOf([number, boolean, identifier]), () => fail('expression')));
			const exprL10 = G.memo(group(exprL11, expression));
			const exprL9 = G.memo(postfixOp(exprL10, expression));
			const exprL8 = G.memo(unaryOp(exprL9, G.oneOf(["+", "-", "!"].map(token))));
			const exprL7 = G.memo(binaryOpR(exprL8, token("**")));
			const exprL6 = G.memo(binaryOpL(exprL7, G.oneOf(["*", "/", "%"].map(token))));
			const exprL5 = G.memo(binaryOpL(exprL6, G.oneOf(["+", "-"].map(token))));
			const exprL4 = G.memo(binaryOpL(exprL5, G.oneOf(["<=", ">=", "<", ">"].map(token))));
			const exprL3 = G.memo(binaryOpL(exprL4, G.oneOf(["===", "!=="].map(token))));
			const exprL2 = G.memo(binaryOpL(exprL3, token("&&")));
			const exprL1 = G.memo(binaryOpL(exprL2, token("||")));
			const exprL0 = G.memo(condOp(exprL1, expression));

			return expression;
		})();

		const parse = (() => {
			const tail = G.andThen(Lexer.whitespace, () => G.eoi());
			const whole = G.andThen(parser, value => G.map(tail, () => value));
			return G.mk(whole);
		})();

		const build = (() => {
			const BUILTIN_VARS = { Infinity, NaN, Math };
			const MEMBER_BLOCK_LIST = ["prototype", "constructor"];
			const VALUE_BLOCK_LIST = new Map([
				[globalThis, "global object"],
				[Object, "Object"],
				[Object.prototype, "Object.prototype"],
				[Function, "Function"],
				[Function.prototype, "Function.prototype"],
			]);

			const referenceError = name => ({ type: 'reference', name });
			const propertyError = property => ({ type: 'property', property });
			const rangeError = index => ({ type: 'range', index });
			const typeError = (expected, actual) => ({ type: 'type', expected, actual });
			const securityError = target => ({ type: 'security', target });

			const builtinValue = name => BUILTIN_VARS.hasOwnProperty(name) ? O.some(BUILTIN_VARS[name]) : O.none();
			const blockedMember = name => MEMBER_BLOCK_LIST.includes(name) ? O.some(`${name} property`) : O.none();
			const blockedValue = value => VALUE_BLOCK_LIST.has(value) ? O.some(VALUE_BLOCK_LIST.get(value)) : O.none();

			const bind = fn => a => R.andThen(a, fn);
			const bindL2 = fn => (a, b) => R.andThen(a(), a => R.andThen(b(), b => fn(a, b)));
			const liftL1 = fn => a => R.map(a(), a => fn(a));
			const liftL2 = fn => (a, b) => R.andThen(a(), a => R.map(b(), b => fn(a, b)));
			const liftL3 = fn => (a, b, c) => R.andThen(a(), a => R.andThen(b(), b => R.map(c(), c => fn(a, b, c))));

			const type = (name, fn) => bind(value => fn(value) ? R.ok(value) : R.err(typeError(name, value)));
			const isNumber = type('number', value => typeof value === 'number');
			const isInteger = type('integer', value => typeof value === 'number' && Number.isSafeInteger(value));
			const isBoolean = type('boolean', value => typeof value === 'boolean');
			const isFunction = type('function', value => typeof value === 'function');
			const isObject = type('object', value => (typeof value === 'object' && value !== null) || typeof value === 'function');
			const isArray = type('array', value => Array.isArray(value));
			const secure = bind(value => O.match(blockedValue(value), target => R.err(securityError(target)), () => R.ok(value)));

			const member = bindL2((object, property) => property in object ? R.ok(object[property]) : R.err(propertyError(property)));
			const element = bindL2((array, index) => index >= 0 && index < array.length ? R.ok(array[index]) : R.err(rangeError(index)));
			const callStatic = liftL2((fn, args) => fn(...args));
			const callMember = liftL3((this_, fn, args) => fn.apply(this_, args));
			const unary = liftL1;
			const binary = liftL2;

			const build = (type, node) => {
				const ensureType = typeContract(type);
				const evalExpr = expression(node);
				return env => ensureType(evalExpr(env));
			};

			const typeContract = type => {
				switch (type) {
					case NUMBER: return isNumber;
					case BOOLEAN: return isBoolean;
					case ANY: return x => x;
					default: return panic(`unsupported expression type: ${type}`);
				}
			};

			const expression = node => {
				const { type } = node;
				switch (type) {
					case 'number': return number(node);
					case 'boolean': return boolean(node);
					case 'identifier': return identifier(node);
					case 'member-access': return memberAccess(node);
					case 'element-access': return elementAccess(node);
					case 'function-call': return functionCall(node);
					case 'unary-operator': return unaryOp(node);
					case 'binary-operator': return binaryOp(node);
					case 'conditional-operator': return condOp(node);
					default: return panic(`invalid AST node type: ${type}`);
				}
			};

			const number = node => {
				const value = Number(node.value.text.replace(/_/g, ""));
				return () => R.ok(value);
			};

			const boolean = node => {
				const value = node.value.text === 'true';
				return () => R.ok(value);
			};

			const identifier = node => {
				const name = node.name.text;
				return O.match(
					builtinValue(name),
					value => () => R.ok(value),
					() => env => env.hasOwnProperty(name) ? R.ok(env[name]) : R.err(referenceError(name)),
				);
			};

			const memberAccess = node => {
				const { evalThis, evalExpr } = memberAccessCore(node);
				return env => evalExpr(evalThis(env), env);
			};
			const memberAccessCore = node => {
				const evalObject = expression(node.object);
				const property = node.property.name.text;
				return {
					evalThis: evalObject,
					evalExpr: O.match(
						blockedMember(property),
						target => () => R.err(securityError(target)),
						() => this_ => secure(member(() => isObject(this_), () => R.ok(property))),
					),
				};
			};

			const elementAccess = node => {
				const { evalThis, evalExpr } = elementAccessCore(node);
				return env => evalExpr(evalThis(env), env);
			};
			const elementAccessCore = node => {
				const evalArray = expression(node.array);
				const evalIndex = expression(node.index);
				return {
					evalThis: evalArray,
					evalExpr: (this_, env) => secure(element(() => isArray(this_), () => isInteger(evalIndex(env)))),
				};
			};

			const functionCall = node => {
				const callee = functionCallee(node.callee);
				const evalArgs = functionArgs(node.args);
				return callee.isStatic
					? functionStaticCall(callee.eval, evalArgs)
					: functionMemberCall(callee.evalThis, callee.evalExpr, evalArgs);
			};
			const functionCallee = node => {
				switch (node.type) {
					case 'member-access': return { isStatic: false, ...memberAccessCore(node) };
					case 'element-access': return { isStatic: false, ...elementAccessCore(node) };
					default: return { isStatic: true, eval: expression(node) };
				}
			};
			const functionArgs = nodes => {
				const evalList = nodes.map(node => expression(node));
				return env => R.allL(evalList.map(evalArg => () => evalArg(env)));
			};
			const functionStaticCall = (evalCallee, evalArgs) => {
				return env => secure(callStatic(() => isFunction(evalCallee(env)), () => evalArgs(env)));
			};
			const functionMemberCall = (evalThis, evalExpr, evalArgs) => {
				return env => {
					const this_ = evalThis(env);
					return secure(callMember(() => this_, () => isFunction(evalExpr(this_, env)), () => evalArgs(env)));
				};
			};

			const unaryOp = node => {
				const operator = node.operator.text;
				const evalExpr = expression(node.expr);
				switch (operator) {
					case '+': return env => unary(a => +a)(() => isNumber(evalExpr(env)));
					case '-': return env => unary(a => -a)(() => isNumber(evalExpr(env)));
					case '!': return env => unary(a => !a)(() => isBoolean(evalExpr(env)));
					default: return panic(`unsupported unary operator: ${operator}`);
				}
			};

			const binaryOp = node => {
				const operator = node.operator.text;
				const evalL = expression(node.lhs);
				const evalR = expression(node.rhs);
				switch (operator) {
					case '+': return env => binary((a, b) => a + b)(() => isNumber(evalL(env)), () => isNumber(evalR(env)));
					case '-': return env => binary((a, b) => a - b)(() => isNumber(evalL(env)), () => isNumber(evalR(env)));
					case '*': return env => binary((a, b) => a * b)(() => isNumber(evalL(env)), () => isNumber(evalR(env)));
					case '/': return env => binary((a, b) => a / b)(() => isNumber(evalL(env)), () => isNumber(evalR(env)));
					case '%': return env => binary((a, b) => a % b)(() => isNumber(evalL(env)), () => isNumber(evalR(env)));
					case '**': return env => binary((a, b) => a ** b)(() => isNumber(evalL(env)), () => isNumber(evalR(env)));
					case '===': return env => binary((a, b) => a === b)(() => isNumber(evalL(env)), () => isNumber(evalR(env)));
					case '!==': return env => binary((a, b) => a !== b)(() => isNumber(evalL(env)), () => isNumber(evalR(env)));
					case '<=': return env => binary((a, b) => a <= b)(() => isNumber(evalL(env)), () => isNumber(evalR(env)));
					case '>=': return env => binary((a, b) => a >= b)(() => isNumber(evalL(env)), () => isNumber(evalR(env)));
					case '<': return env => binary((a, b) => a < b)(() => isNumber(evalL(env)), () => isNumber(evalR(env)));
					case '>': return env => binary((a, b) => a > b)(() => isNumber(evalL(env)), () => isNumber(evalR(env)));
					case '&&': return env => R.andThen(isBoolean(evalL(env)), value => value ? isBoolean(evalR(env)) : R.ok(false));
					case '||': return env => R.andThen(isBoolean(evalL(env)), value => value ? R.ok(true) : isBoolean(evalR(env)));
					default: return panic(`unsupported binary operator: ${operator}`);
				}
			};

			const condOp = node => {
				const { if: if_, then, else: else_ } = node;
				const evalIf = expression(if_);
				const evalThen = expression(then);
				const evalElse = expression(else_);
				return env => R.andThen(isBoolean(evalIf(env)), value => value ? evalThen(env) : evalElse(env));
			};

			return build;
		})();

		const compile = (type, source) => R.map(parse(source), node => build(type, node));

		const expect = (result, errorFormatter = defaultCompileErrorFormatter) =>
			R.expect(result, errorFormatter);

		const run = (evaluator, env, errorFormatter = defaultRuntimeErrorFormatter) =>
			R.expect(evaluator(env), errorFormatter);

		const interpret = (type, source, env, parseErrorFormatter, runtimeErrorFormatter) =>
			run(expect(compile(type, source), parseErrorFormatter), env, runtimeErrorFormatter);

		const defaultCompileErrorFormatter = error => {
			const tokenize = G.make(G.andThen(Lexer.whitespace, () => Lexer.unknown));
			const sample = (source, position) => R.match(tokenize(source, position), ([token]) => token, () => undefined);
			const formatTokenError = error => {
				const { context: { source, position }, cause: expected } = error;
				const token = sample(source, position);
				const found = token !== undefined ? `"${token.text}"` : "no more tokens";
				return `'${expected}' expected, but ${found} found`;
			};
			const formatEoiError = error => {
				const { context: { source, position } } = error;
				const token = sample(source, position);
				const found = `"${token.text}"`;
				return `end-of-input expected, but ${found} found`;
			};
			switch (error?.type) {
				case 'token': return formatTokenError(error);
				case 'eoi': return formatEoiError(error);
				default: return `unknown error: ${S.debug(error)}`;
			}
		};

		const defaultRuntimeErrorFormatter = error => {
			switch (error?.type) {
				case 'reference': return `"${error.name}" not found`;
				case 'property': return `"${error.property}" property not exists`;
				case 'range': return `${error.index} is out of range`;
				case 'type': return `'${error.expected}' expected, but ${S.debug(error.actual)} found`;
				case 'security': return `<${error.target}> is not allowed for security reasons`;
				default: return `unknown error: ${S.debug(error)}`;
			}
		};

		return {
			NUMBER,
			BOOLEAN,
			ANY,
			Lexer,
			parser,
			parse,
			build,
			compile,
			expect,
			run,
			interpret,
			defaultCompileErrorFormatter,
			defaultRuntimeErrorFormatter,
		};
	})();

	const P = (() => {
		const RE_INTEGER = /^[+\-]?\d+$/;
		const RE_NUMBER = /^[+\-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+\-]?\d+)?$/i;

		const formatError = (source, expected) => ({ type: 'format', source, expected });
		const jsonError = (source, inner) => ({ type: 'json', source, inner });
		const expressionError = (source, cause) => ({ type: 'expression', source, cause });
		const validationError = (source, cause) => ({ type: 'validation', source, cause });

		const succeed = value => () => R.ok(value);
		const fail = error => () => R.err(error);
		const andThen = (parser, fn) => s => R.andThen(parser(s), value => fn(value)(s));
		const orElse = (parser, fn) => s => R.orElse(parser(s), error => fn(error)(s));
		const map = (parser, fn) => s => R.map(parser(s), fn);
		const mapError = (parser, fn) => s => R.mapErr(parser(s), fn);
		const wrapError = (parser, fn) => s => mapError(parser, error => fn(s, error))(s);
		const fromResult = result => R.match(result, succeed, fail);

		const withDefault = (parser, value) => orElse(map(empty, () => value), () => parser);
		const validate = (parser, validator) => andThen(parser, value => wrapError(fromResult(validator(value)), validationError));

		const empty = s => s === "" ? R.ok(undefined) : R.err(formatError(s, "empty"));
		const integer = s => RE_INTEGER.test(s) ? R.ok(Number.parseInt(s, 10)) : R.err(formatError(s, "integer"));
		const number = s => RE_NUMBER.test(s) ? R.ok(Number.parseFloat(s)) : R.err(formatError(s, "number"));
		const string = s => R.ok(s);
		const boolean = s => s === 'true' ? R.ok(true) : s === 'false' ? R.ok(false) : R.err(formatError(s, "boolean"));
		const custom = fn => s => R.mapErr(fn(s), expected => formatError(s, expected));

		const json = s => R.mapErr(R.attempt(() => JSON.parse(s)), e => jsonError(s, e));
		const array = parser => andThen(json, value => s =>
			Array.isArray(value) ? R.allL(value.map(x => () => parser(x))) : R.err(formatError(s, "array"))
		);
		const struct = parsers => andThen(json, value => s =>
			typeof value === 'object' && value !== null && !Array.isArray(value)
				? R.map(entries(parsers)(value), Object.fromEntries)
				: R.err(formatError(s, "struct"))
		);
		const entries = parsers => object => R.allL(parsers.map(parser => () => parser(object)));
		const entry = (key, parser) => object => map(parser, value => [key, value])(object[key] ?? "");

		const expression = (type, errorFormatter) => s => R.match(
			E.compile(type, s),
			evaluator => R.ok(env => E.run(evaluator, env, errorFormatter)),
			cause => R.err(expressionError(s, cause)),
		);

		const make = archetype => {
			if (typeof archetype === 'function') {
				return archetype;
			} else if (typeof archetype === 'object' && archetype !== null) {
				if (Array.isArray(archetype)) {
					if (archetype.length === 1) {
						return array(make(archetype[0]));
					} else {
						return panic(`archetype array must be a singleton: ${S.debug(archetype)}`);
					}
				} else {
					return struct(Object.entries(archetype).map(([key, value]) => entry(key, make(value))));
				}
			} else {
				return panic(`invalid archetype item: ${S.debug(archetype)}`);
			}
		};

		const parse = (s, parser, errorFormatter = defaultErrorFormatter) => R.expect(parser(s), errorFormatter);

		const parseAll = (args, parsers, errorFormatter) => {
			return Object.fromEntries(Object.entries(parsers).map(([key, parser]) => {
				return [key, parse(args[key], parser, errorFormatter)];
			}));
		};

		const makeDefaultErrorFormatter = (validationErrorFormatter) => error => {
			const dots = s => S.ellipsis(s, 32);
			switch (error?.type) {
				case 'format': return `'${error.expected}' expected, but "${dots(error.source)}" found`;
				case 'json': return `failed to parse JSON; ${error.inner.message}`;
				case 'expression': return `failed to parse expression; ${E.defaultCompileErrorFormatter(error.cause)}`;
				case 'validation': return validationErrorFormatter(error.cause);
				default: return `unknown error: ${S.debug(error)}`;
			}
		};

		const simpleErrorFormatter = error => typeof error === 'string' ? error : S.debug(error);

		const defaultErrorFormatter = makeDefaultErrorFormatter(simpleErrorFormatter);

		return {
			succeed,
			fail,
			andThen,
			orElse,
			map,
			mapError,
			withDefault,
			validate,
			empty,
			integer,
			number,
			string,
			boolean,
			custom,
			json,
			array,
			struct,
			entry,
			expression,
			make,
			parse,
			parseAll,
			makeDefaultErrorFormatter,
			defaultErrorFormatter,
		};
	})();

	const N = (() => {
		const RE_SPACING = /^[ \r\n]*/;
		const RE_SPACES = /^[ \r\n]+/;
		const RE_NATURAL = /^\d+/;
		const RE_INTEGER = /^[+\-]?\d+/;
		const RE_NUMBER = /^[+\-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+\-]?\d+)?/i;
		const RE_BOOLEAN = /^(?:true|false)\b/;
		const RE_TEXT = /^(?:'(?:[^'`]|`.)*'|"(?:[^"`]|`.)*")/u;

		const symbolError = (source, position, symbol) => ({ type: 'symbol', source, position, symbol });
		const regexpError = (source, position, name, regexp) => ({ type: 'regexp', source, position, name, regexp });
		const expressionError = (source, position, cause) => ({ type: 'expression', source, position, cause });

		const { succeed, fail } = G;
		const map = (parser, fn) => G.memo(G.map(parser, fn));
		const mapError = (parser, fn) => G.memo(G.mapError(parser, fn));
		const seqOf = parsers => G.memo(G.seqOf(parsers));
		const oneOf = parsers => G.memo(G.oneOf(parsers));
		const validate = (parser, validator) => G.memo(G.validate(parser, validator));

		const symbol = symbol => G.memo(G.token((source, position) => {
			return source.startsWith(symbol, position)
				? R.ok([symbol, position + symbol.length])
				: R.err(symbolError(source, position, symbol));
		}));

		const regexp = (name, re, fn) => G.memo(G.token((source, position) => {
			const slice = source.slice(position);
			const match = slice.match(re);
			if (match !== null && match.index === 0) {
				const token = match[0];
				const value = fn !== undefined ? fn(...match) : token;
				return R.ok([value, position + token.length]);
			} else {
				return R.err(regexpError(source, position, name, re));
			}
		}));

		const expression = (type, errorFormatter) => {
			const pipe = (a, fn) => fn(a);
			const parse = G.make(E.parser);
			const build = node => E.build(type, node);
			const make = evaluator => env => E.run(evaluator, env, errorFormatter);
			return G.memo(G.token((source, position) =>
				R.mapBoth(
					parse(source, position),
					([node, next]) => [pipe(build(node), make), next],
					cause => expressionError(source, position, cause),
				)
			));
		};

		const spacing = regexp("spacing", RE_SPACING);
		const spaces = regexp("spaces", RE_SPACES);
		const natural = regexp("natural", RE_NATURAL, s => Number.parseInt(s, 10));
		const integer = regexp("integer", RE_INTEGER, s => Number.parseInt(s, 10));
		const number = regexp("number", RE_NUMBER, s => Number.parseFloat(s));
		const boolean = regexp("boolean", RE_BOOLEAN, s => s === 'true');
		const text = regexp("text", RE_TEXT, value => value.slice(1, -1).replace(/`(.)/gu, "$1"));

		const between = (parser, start, end) => map(G.seqOf([start, parser, end]), value => value[1]);
		const margin = parser => between(parser, spacing, spacing);
		const group = (parser, begin, end) => between(margin(parser), begin, end);
		const parens = parser => group(parser, symbol("("), symbol(")"));
		const braces = parser => group(parser, symbol("{"), symbol("}"));
		const brackets = parser => group(parser, symbol("["), symbol("]"));
		const endWith = parser => G.andThen(parser, value => G.map(G.eoi(), () => value));

		const withDefault = (parser, value) => map(G.optional(parser), option => O.withDefault(option, value));
		const chain = (item, delimiter) => withDefault(chain1(item, delimiter), []);
		const chain1 = (item, delimiter) => flatten(G.seqOf([item, G.many(G.seqOf([delimiter, item]))]));
		const flatten = parser => map(parser, ([first, rest]) => [first, ...rest.map(([, item]) => item)]);
		const join = (items, delimiter) => map(delimit(items, delimiter), array => array.filter((_, i) => i % 2 === 0));
		const delimit = (items, delimiter) => G.seqOf(items.flatMap((item, i) => i === 0 ? [item] : [delimiter, item]));
		const list = parser => chain(parser, spaces);
		const tuple = parsers => join(parsers, spaces);

		const make = parser => G.mk(parser);
		const parse = (source, parser, errorFormatter = defaultErrorFormatter) => G.parse(source, parser, errorFormatter);

		const defaultTokenErrorFormatter = error => {
			const dots = s => S.ellipsis(s, 16);
			const rest = ({ source: s, position: i }) => s.length === i ? "no more characters" : `"${dots(s.slice(i))}"`;
			switch (error?.type) {
				case 'symbol': return `'${error.symbol}' expected, but ${rest(error)} found`;
				case 'regexp': return `'${error.name}' expected, but ${rest(error)} found`;
				case 'expression': return E.defaultCompileErrorFormatter(error.cause);
				default: return `unknown error: ${S.debug(error)}`;
			}
		};

		const makeDefaultErrorFormatter = validationErrorFormatter =>
			G.makeDefaultErrorFormatter(defaultTokenErrorFormatter, validationErrorFormatter);

		const simpleErrorFormatter = error => typeof error === 'string' ? error : S.debug(error);

		const defaultErrorFormatter = makeDefaultErrorFormatter(simpleErrorFormatter);

		return {
			succeed,
			fail,
			map,
			mapError,
			seqOf,
			oneOf,
			validate,
			symbol,
			regexp,
			expression,
			spacing,
			spaces,
			natural,
			integer,
			number,
			boolean,
			text,
			margin,
			group,
			parens,
			braces,
			brackets,
			endWith,
			withDefault,
			chain,
			chain1,
			join,
			list,
			tuple,
			make,
			parse,
			defaultTokenErrorFormatter,
			makeDefaultErrorFormatter,
			defaultErrorFormatter,
		};
	})();

	const M = (() => {
		const notationError = (expected, name, value) => ({ type: 'notation', expected, name, value });
		const attributeError = (name, source, cause) => ({ type: 'attribute', name, source, cause });

		const flag = name => meta => {
			const v = meta[name];
			switch (v) {
				case undefined: return R.ok(O.some(false));
				case true: return R.ok(O.some(true));
				default: return R.err(notationError('flag', name, v));
			}
		};

		const attr = (name, parser) => meta => {
			const v = meta[name];
			if (typeof v === 'string') {
				return R.mapErr(R.map(parser(v), O.some), cause => attributeError(name, v, cause));
			} else if (v === undefined) {
				return R.ok(O.none());
			} else {
				return R.err(notationError('attr', name, v));
			}
		};
		const attrN = (name, parser) => attr(name, N.make(N.endWith(N.margin(parser))));

		const succeed = value => () => R.ok(O.some(value));
		const miss = () => () => R.ok(O.none());
		const fail = error => () => R.err(error);
		const andThen = (parser, fn) => data => R.andThen(parser(data), option => O.match(option, fn, miss)(data));
		const orElse = (parser, fn) => data => R.andThen(parser(data), option => O.match(option, succeed, fn)(data));
		const map = (parser, fn) => andThen(parser, value => succeed(fn(value)));
		const mapError = (parser, fn) => data => R.mapErr(parser(data), fn);
		const withDefault = (parser, value) => orElse(parser, () => succeed(value));
		const oneOf = parsers => parsers.reduceRight((acc, x) => orElse(x, () => acc), miss());

		const make = archetype => {
			const arrayOf = parsers => parsers.reduce((xs, x) => andThen(xs, xs => map(x, x => [...xs, x])), succeed([]));
			const structOf = parsers => map(arrayOf(parsers.map(entry)), Object.fromEntries);
			const entry = ([key, parser]) => map(parser, value => [key, value]);

			if (typeof archetype === 'function') {
				return archetype;
			} else if (typeof archetype === 'object' && archetype !== null) {
				if (Array.isArray(archetype)) {
					return arrayOf(archetype.map(make));
				} else {
					return structOf(Object.entries(archetype).map(([key, value]) => [key, make(value)]));
				}
			} else {
				return () => R.ok(R.some(archetype));
			}
		};

		const parse = (meta, parser, errorFormatter = defaultErrorFormatter) =>
			R.expect(R.map(parser(meta), value => O.withDefault(value, undefined)), errorFormatter);

		const meta = (parser, errorFormatter) => U.memoW(meta => parse(meta, parser, errorFormatter));

		const makeDefaultErrorFormatter = attributeErrorFormatter => error => {
			switch (error?.type) {
				case 'notation':
					switch (error.expected) {
						case 'flag': return `'${error.name}' metadata does not require value`;
						case 'attr': return `'${error.name}' metadata requires value`;
						default: return `unknown metadata type: ${error.expected}`;
					}
				case 'attribute':
					const message = attributeErrorFormatter(error.cause);
					return `failed to parse '${error.name}' metadata value; ${message}`;
				default: return `unknown error: ${S.debug(error)}`;
			}
		};

		const defaultErrorFormatter = makeDefaultErrorFormatter(N.defaultErrorFormatter);

		return {
			flag,
			attr,
			attrN,
			succeed,
			miss,
			fail,
			andThen,
			orElse,
			map,
			mapError,
			withDefault,
			oneOf,
			make,
			parse,
			meta,
			makeDefaultErrorFormatter,
			defaultErrorFormatter,
		};
	})();

	const Z = (() => {
		const pluginName = () => document.currentScript?.src.match(/\/([^\/]*)\.js$/)?.[1];

		const redef = (target, define) => {
			const table = {};
			const base = this_ => new Proxy(table, {
				get(target, p, receiver) {
					const value = Reflect.get(target, p, receiver);
					return typeof value !== 'function' ? value : value.bind(this_);
				},
			});

			const definitions = define(base);
			const proto = Object.getPrototypeOf(target);
			for (const [key, value] of Object.entries(definitions)) {
				if (typeof value === 'function') {
					if (target.hasOwnProperty(key)) {
						table[key] = target[key];
					} else if (key in proto) {
						table[key] = function () { return proto[key].apply(this, arguments); };
					}
				}
				target[key] = value;
			}
		};

		const extProp = (defaultValue, nonWeak = false) =>
			nonWeak ? propWithMap(defaultValue) : propWithWeakMap(defaultValue);

		const propWithMap = defaultValue => {
			const store = new Map();
			const get = key => store.has(key) ? store.get(key) : defaultValue;
			const set = (key, value) => void store.set(key, value);
			const delete_ = key => void store.delete(key);
			const clear = () => store.clear();
			return { get, set, delete: delete_, clear };
		};

		const propWithWeakMap = defaultValue => {
			const store = new WeakMap();
			const get = key => store.has(key) ? store.get(key) : defaultValue;
			const set = (key, value) => void store.set(key, value);
			const delete_ = key => void store.delete(key);
			return { get, set, delete: delete_ };
		};

		const extend = (target, name, prop) => {
			const { get, set } = prop;
			Object.defineProperty(target, name, {
				get() { return get(this); },
				set(value) { set(this, value); },
				configurable: true,
			});
		};

		const swapper = key => (owner, value, block) => {
			const current = owner[key];
			return enclose(
				() => owner[key] = value,
				() => owner[key] = current,
				block,
			);
		};

		const context = defaultValue => {
			const { get: getContext, set: setContext } = propWithWeakMap(O.none());
			const enter = (owner, value, block) => {
				const current = getContext(owner);
				return enclose(
					() => setContext(owner, O.some(value)),
					() => setContext(owner, current),
					block,
				);
			};
			const value = owner => O.withDefault(getContext(owner), defaultValue);
			const exists = owner => O.isSome(getContext(owner));
			return { enter, value, exists };
		};

		const defer = cleanup => block => {
			try { return block(); } finally { cleanup(); }
		};

		const enclose = (begin, end, block) => {
			begin();
			return defer(end)(block);
		};

		return { pluginName, redef, extProp, extend, swapper, context, defer, enclose };
	})();

	globalThis.Fs = { O, R, L, S, U, G, E, P, N, M, Z };
};