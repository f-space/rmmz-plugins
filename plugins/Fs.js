/*:
 * @target MZ
 * @plugindesc
 * 🚩 Basic function library for RPG Maker plugins.
 * Version: 0.2.0
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

	const O = (() => {
		const some = value => ({ value });
		const none = () => undefined;
		const unwrap = option => option.value;
		const isSome = option => option !== undefined;
		const isNone = option => option === undefined;
		const andThen = (option, fn) => isSome(option) ? fn(unwrap(option)) : option;
		const orElse = (option, fn) => isSome(option) ? option : fn();
		const match = (option, onSome, onNone) => isSome(option) ? onSome(unwrap(option)) : onNone();
		const map = (option, fn) => andThen(option, value => some(fn(value)));
		const withDefault = (option, value) => isSome(option) ? unwrap(option) : value;

		return { some, none, unwrap, isSome, isNone, andThen, orElse, match, map, withDefault };
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
		const map = (result, fn) => andThen(result, value => ok(fn(value)));
		const mapErr = (result, fn) => orElse(result, error => err(fn(error)));

		return { ok, err, unwrap, unwrapErr, isOk, isErr, andThen, orElse, match, map, mapErr };
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
		const tokenError = ({ cache, ...context }, name, cause) => ({ type: 'token', context, name, cause });
		const eofError = ({ cache, ...context }) => ({ type: 'eof', context });
		const pathError = ({ cache, ...context }, errors) => ({ type: 'path', context, errors });
		const andError = ({ cache, ...context }, error) => ({ type: 'and', context, error });
		const notError = ({ cache, ...context }, value) => ({ type: 'not', context, value });
		const validationError = ({ cache, ...context }, cause) => ({ type: 'validation', context, cause });

		const token = (name, accept) => context => {
			const { source, position } = context;
			return R.match(
				accept(source, position),
				([value, position]) => R.ok([value, { ...context, position }]),
				cause => R.err(tokenError(context, name, cause)),
			);
		};

		const eof = () => context => {
			const { source, position } = context;
			return position === source.length ? R.ok([null, context]) : R.err(eofError(context));
		};

		const succeed = value => context => R.ok([value, context]);
		const fail = error => () => R.err(error);
		const andThen = (parser, fn) => context => R.andThen(parser(context), ([value, context]) => fn(value)(context));
		const orElse = (parser, fn) => context => R.orElse(parser(context), error => fn(error)(context));
		const map = (parser, fn) => context => R.map(parser(context), ([value, context]) => [fn(value), context]);
		const mapError = (parser, fn) => context => R.mapErr(parser(context), fn);
		const wrapError = (parser, fn) => context => mapError(parser, error => fn(context, error))(context);
		const try_ = fn => (...args) => R.match(fn(...args), succeed, fail);

		const sequence = (a, b) => andThen(a, v1 => map(b, v2 => L.cons(v2, v1)));
		const choice = (a, b) => orElse(a, e1 => mapError(b, e2 => L.cons(e2, e1)));
		const loop = (parser, acc) => orElse(andThen(parser, value => loop(parser, L.cons(value, acc))), () => succeed(acc));
		const toArray = list => L.toArray(L.reverse(list));

		const seqOf = parsers => map(parsers.reduce(sequence, succeed(L.nil())), toArray);
		const oneOf = parsers => wrapError(mapError(parsers.reduce(choice, fail(L.nil())), toArray), pathError);
		const optional = parser => choice(map(parser, O.some), succeed(O.none()));
		const many = parser => map(loop(parser, L.nil()), toArray);
		const many1 = parser => map(andThen(parser, value => loop(parser, L.singleton(value))), toArray);
		const and = (pred, parser) => context => R.match(pred(context), () => parser(context), error => R.err(andError(context, error)));
		const not = (pred, parser) => context => R.match(pred(context), ([value]) => R.err(notError(context, value)), () => parser(context));
		const validate = (parser, validator) => wrapError(andThen(parser, try_(validator)), validationError);

		const memo = parser => context => {
			const { position, cache } = context;
			if (position < cache.length) {
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

		const make = parser => source => {
			const position = 0;
			const cache = Array(source.length).fill(L.nil());
			const context = { source, position, cache };
			return R.map(parser(context), ([value]) => value);
		};

		const parse = (source, parser, errorFormatter = defaultErrorFormatter) => {
			return R.match(
				parser(source),
				value => value,
				error => { throw new Error(errorFormatter(error)); },
			);
		};

		const makeDefaultErrorFormatter = (tokenErrorFormatter, validationErrorFormatter) => {
			const formatter = error => {
				const dots = s => S.ellipsis(s, 32);
				const rest = ({ source: s, position: i }) => typeof s == 'string' ? dots(s.slice(i)) : S.debug(s[i]);
				const pathErrorFormatter = error => {
					const pick = e => e.errors.length !== 0 ? select(e.errors) : e;
					const select = errors => longest(errors.map(e => e.type === 'path' ? pick(e) : e));
					const longest = errors => errors.reduce((a, b) => position(a) >= position(b) ? a : b);
					const position = error => error.context.position;
					const message = error => error.type !== 'path' ? formatter(error) : "Dead end.";
					return message(pick(error));
				};
				switch (error?.type) {
					case 'token': return `Failed to parse '${error.name}' token <<< ${tokenErrorFormatter(error.cause)}`;
					case 'eof': return `Excessive token exists: ${rest(error.context)}`;
					case 'path': return `No valid path exists. <<< ${pathErrorFormatter(error)}`;
					case 'and': return `And-predicate failed: ${rest(error.context)}`;
					case 'not': return `Not-predicate failed: ${rest(error.context)}`;
					case 'validation': return `Validation failed <<< ${validationErrorFormatter(error.cause)}`;
					default: return `Unknown error: ${S.debug(error)}`;
				}
			};
			return formatter;
		};

		const defaultErrorFormatter = makeDefaultErrorFormatter(S.debug, S.debug);

		return {
			token,
			eof,
			succeed,
			fail,
			andThen,
			orElse,
			map,
			mapError,
			seqOf,
			oneOf,
			optional,
			many,
			many1,
			and,
			not,
			validate,
			memo,
			make,
			parse,
			makeDefaultErrorFormatter,
			defaultErrorFormatter,
		};
	})();

	const P = (() => {
		const RE_INTEGER = /^[+\-]?\d+$/;
		const RE_NUMBER = /^[+\-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+\-]?\d+)?$/i;

		const formatError = (source, expected) => ({ type: 'format', source, expected });
		const jsonError = (source, inner) => ({ type: 'json', source, inner });
		const validationError = (source, cause) => ({ type: 'validation', source, cause });

		const succeed = value => () => R.ok(value);
		const fail = error => () => R.err(error);
		const andThen = (parser, fn) => s => R.andThen(parser(s), value => fn(value)(s));
		const orElse = (parser, fn) => s => R.orElse(parser(s), error => fn(error)(s));
		const map = (parser, fn) => s => R.map(parser(s), fn);
		const mapError = (parser, fn) => s => R.mapErr(parser(s), fn);
		const wrapError = (parser, fn) => s => mapError(parser, error => fn(s, error))(s);
		const try_ = fn => (...args) => R.match(fn(...args), succeed, fail);

		const withDefault = (parser, value) => orElse(map(empty, () => value), () => parser);
		const validate = (parser, validator) => wrapError(andThen(parser, try_(validator)), validationError);

		const empty = s => s === "" ? R.ok(undefined) : R.err(formatError(s, "empty"));
		const integer = s => RE_INTEGER.test(s) ? R.ok(Number.parseInt(s, 10)) : R.err(formatError(s, "integer"));
		const number = s => RE_NUMBER.test(s) ? R.ok(Number.parseFloat(s)) : R.err(formatError(s, "number"));
		const string = s => R.ok(s);
		const boolean = s => s === 'true' ? R.ok(true) : s === 'false' ? R.ok(false) : R.err(formatError(s, "boolean"));
		const custom = fn => s => R.mapErr(fn(s), expected => formatError(s, expected));

		const json = s => { try { return R.ok(JSON.parse(s)); } catch (e) { return R.err(jsonError(s, e)); } };
		const array = parser => andThen(json, value => s =>
			Array.isArray(value)
				? value.reduce((result, x) => R.andThen(result, xs => R.map(parser(x), x => [...xs, x])), R.ok([]))
				: R.err(formatError(s, "array"))
		);
		const struct = parsers => andThen(json, value => s =>
			typeof value === 'object' && value !== null && !Array.isArray(value)
				? R.map(entries(parsers)(value), Object.fromEntries)
				: R.err(formatError(s, "struct"))
		);
		const entries = parsers => object =>
			parsers.reduce((result, parser) => R.andThen(result, xs => R.map(parser(object), x => [...xs, x])), R.ok([]));
		const entry = (key, parser) => object => map(parser, value => [key, value])(object[key] ?? "");

		const make = archetype => {
			if (typeof archetype === 'function') {
				return archetype;
			} else if (typeof archetype === 'object' && archetype !== null) {
				if (Array.isArray(archetype)) {
					if (archetype.length === 1) {
						return array(make(archetype[0]));
					} else {
						throw new Error(`Archetype array must be a singleton: ${S.debug(archetype)}`);
					}
				} else {
					return struct(Object.entries(archetype).map(([key, value]) => entry(key, make(value))));
				}
			} else {
				throw new Error(`Invalid archetype item: ${S.debug(archetype)}`);
			}
		};

		const parse = (s, parser, errorFormatter = defaultErrorFormatter) => {
			return R.match(
				parser(s),
				value => value,
				error => { throw new Error(errorFormatter(error)); },
			);
		};

		const parseAll = (args, parsers, errorFormatter) => {
			return Object.fromEntries(Object.entries(parsers).map(([key, parser]) => {
				return [key, parse(args[key], parser, errorFormatter)];
			}));
		};

		const makeDefaultErrorFormatter = validationErrorFormatter => error => {
			const dots = s => S.ellipsis(s, 32);
			switch (error?.type) {
				case 'format': return `Failed to parse parameter as '${error.expected}': ${dots(error.source)}`;
				case 'json': return `Failed to parse parameter as JSON: "${error.inner.message}"`;
				case 'validation': return `Validation failed <<< ${validationErrorFormatter(error.cause)}`;
				default: return `Unknown error: ${S.debug(error)}`;
			}
		};

		const defaultErrorFormatter = makeDefaultErrorFormatter(S.debug);

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
		const regexpError = (source, position, regexp) => ({ type: 'regexp', source, position, regexp });

		const { succeed, fail, make } = G;
		const map = (parser, fn) => G.memo(G.map(parser, fn));
		const mapError = (parser, fn) => G.memo(G.mapError(parser, fn));
		const seqOf = parsers => G.memo(G.seqOf(parsers));
		const oneOf = parsers => G.memo(G.oneOf(parsers));
		const validate = (parser, validator) => G.memo(G.validate(parser, validator));

		const symbol = symbol => G.memo(G.token(symbol, (source, start) => {
			return source.startsWith(symbol, start)
				? R.ok([symbol, start + symbol.length])
				: R.err(symbolError(source, start, symbol));
		}));

		const regexp = (name, re, fn) => G.memo(G.token(name, (source, start) => {
			const slice = source.slice(start);
			const match = slice.match(re);
			if (match !== null && match.index === 0) {
				const token = match[0];
				const value = fn !== undefined ? fn(token, match) : token;
				return R.ok([value, start + token.length]);
			} else {
				return R.err(regexpError(source, start, re));
			}
		}));

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
		const iff = parser => G.andThen(parser, value => G.map(G.eof(), () => value));

		const flatten = parser => map(parser, ([first, rest]) => [first, ...rest.map(([, item]) => item)]);
		const chain = (item, delimiter) => withDefault(chain1(item, delimiter), []);
		const chain1 = (item, delimiter) => flatten(G.seqOf([item, G.many(G.seqOf([delimiter, item]))]));
		const join = (items, delimiter) => items.length === 0 ? succeed([]) : flatten(join_(items, delimiter));
		const join_ = ([first, ...rest], delimiter) => G.seqOf([first, G.seqOf(rest.map(item => G.seqOf([delimiter, item])))]);
		const list = parser => chain(parser, spaces);
		const tuple = parsers => join(parsers, spaces);
		const withDefault = (parser, value) => map(G.optional(parser), option => O.withDefault(option, value));

		const parse = (source, parser, errorFormatter = defaultErrorFormatter) => G.parse(source, parser, errorFormatter);

		const defaultTokenErrorFormatter = error => {
			const dots = s => S.ellipsis(s, 16);
			const rest = ({ source: s, start: i }) => s.length === i ? "no more letters" : `"${dots(s.slice(i))}"`;
			switch (error?.type) {
				case 'symbol': return `'${error.symbol}' expected, but ${rest(error)} found.`;
				case 'regexp': return `${S.debug(error.regexp)} expected, but ${rest(error)} found.`;
				default: return `Unknown error: ${S.debug(error)}`;
			}
		};

		const makeDefaultErrorFormatter = validationErrorFormatter =>
			G.makeDefaultErrorFormatter(defaultTokenErrorFormatter, validationErrorFormatter);

		const defaultErrorFormatter = makeDefaultErrorFormatter(S.debug);

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
			iff,
			chain,
			chain1,
			join,
			list,
			tuple,
			withDefault,
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
		const attrN = (name, parser) => attr(name, N.make(N.iff(N.margin(parser))));

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

		const parse = (meta, parser, errorFormatter = defaultErrorFormatter) => {
			return R.match(
				parser(meta),
				value => O.withDefault(value, undefined),
				error => { throw new Error(errorFormatter(error)); },
			);
		};

		const meta = (parser, errorFormatter) => U.memoW(meta => parse(meta, parser, errorFormatter));

		const makeDefaultErrorFormatter = attributeErrorFormatter => error => {
			switch (error?.type) {
				case 'notation':
					switch (error.expected) {
						case 'flag': return `'${error.name}' metadata does not accept any arguments.`;
						case 'attr': return `'${error.name}' metadata is not a flag.`;
						default: return `Unknown metadata type: ${error.expected}`;
					}
				case 'attribute':
					const message = attributeErrorFormatter(error.cause);
					return `Failed to parse '${error.name}' metadata arguments. <<< ${message}`;
				default: return `Unknown error: ${S.debug(error)}`;
			}
		};

		const defaultErrorFormatter = makeDefaultErrorFormatter(N.makeDefaultErrorFormatter(S.debug));

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

	globalThis.Fs = { O, R, L, S, U, G, P, N, M, Z };
};