/*:
 * @target MZ
 * @plugindesc
 * 🚩 Basic function library for RPG Maker plugins.
 * Version: 0.1.2
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
			const processed = new Set();

			const rec = value => {
				const v = replacer !== undefined ? replacer(value) : value;
				switch (typeof v) {
					case 'undefined': return String(v);
					case 'number': return String(v);
					case 'string': return JSON.stringify(v);
					case 'boolean': return String(v);
					case 'symbol': return String(v);
					case 'bigint': return `${v}n`;
					case 'object': return v === null ? "null" : object(v);
					case 'function': return `[Function: ${name(value)}]`;
					default: return "<unknown>";
				}
			};

			const object = value => {
				if (processed.has(value)) {
					return "...";
				} else {
					processed.add(value);
					return objectCore(value);
				}
			};

			const objectCore = value => {
				if (Array.isArray(value)) {
					return value.length !== 0 ? `[ ${value.map(rec).join(", ")} ]` : "[]";
				} else if (value instanceof RegExp) {
					return String(value);
				} else if (value instanceof Date) {
					return value.toISOString();
				} else {
					const type = objectType(value);
					const entries = objectEntries(value);
					const label = type !== undefined ? `${type} ` : "";
					const contents = entries !== "" ? `{ ${entries} }` : "{}";
					return label + contents;
				}
			};

			const objectType = value => {
				const prototype = Object.getPrototypeOf(value);
				if (prototype === null) {
					return "(null)";
				} else if (prototype === Object.prototype) {
					return undefined;
				} else {
					return name(prototype.constructor);
				}
			};

			const objectEntries = value => {
				if (value instanceof Map) {
					return Array.from(value).map(entry => entry.map(rec).join(" => ")).join(", ");
				} else if (value instanceof Set) {
					return Array.from(value).map(rec).join(", ");
				} else if (value instanceof WeakMap || value instanceof WeakSet) {
					return "<***>";
				} else {
					return Object.entries(value).map(([k, v]) => {
						const label = /^[a-z_$][a-z0-9_$]*$/i.test(k) ? k : JSON.stringify(k);
						const value = rec(v);
						return `${label}: ${value}`;
					}).join(", ");
				}
			};

			const name = value => {
				const { name } = value;
				return typeof name === 'string' && name !== "" ? name : "(anonymous)";
			};

			return rec(value);
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

		return { simpleEqual, memo, memo1 };
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
		const map = (parser, fn) => andThen(parser, value => succeed(fn(value)));
		const mapError = (parser, fn) => orElse(parser, error => fail(fn(error)));

		const sequence = (a, b) => andThen(a, v1 => map(b, v2 => L.cons(v2, v1)));
		const choice = (a, b) => orElse(a, e1 => mapError(b, e2 => L.cons(e2, e1)));
		const loop = (pred, parser) => {
			const rec = acc => orElse(andThen(parser, value => rec(L.cons(value, acc))), () => succeed(acc));
			return rec(pred);
		};
		const toArray = list => L.toArray(L.reverse(list));
		const wrapError = (parser, fn) => context => mapError(parser, error => fn(context, error))(context);

		const seqOf = parsers => map(parsers.reduce(sequence, succeed(L.nil())), toArray);
		const oneOf = parsers => wrapError(mapError(parsers.reduce(choice, fail(L.nil())), toArray), pathError);
		const optional = parser => choice(map(parser, O.some), succeed(O.none()));
		const many = parser => map(loop(L.nil(), parser), toArray);
		const many1 = parser => map(andThen(parser, value => loop(L.singleton(value), parser)), toArray);
		const and = parser => context => R.match(parser(context), () => R.ok([null, context]), error => R.err(andError(context, error)));
		const not = parser => context => R.match(parser(context), ([value]) => R.err(notError(context, value)), () => R.ok([null, context]));
		const validate = (parser, validator) =>
			wrapError(andThen(parser, value => R.match(validator(value), succeed, fail)), validationError);

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
				make(parser)(source),
				value => value,
				error => { throw new Error(errorFormatter(error)); },
			);
		};

		const defaultErrorFormatter = error => {
			const dots = s => S.ellipsis(s, 32);
			const rest = ({ source: s, position: i }) => typeof s == 'string' ? dots(s.slice(i)) : S.debug(s[i]);
			const compare = (a, b) => a[0] < b[0] ? b : a;
			const max = (array, fn) => array.map(x => [fn(x), x]).reduce(compare, [-Infinity, undefined])[1];
			const select = ({ errors }) => max(errors.map(e => e.type === 'path' ? select(e) : e), e => e.context.position);
			const message = pathError => {
				const innerError = select(pathError);
				return innerError !== undefined ? defaultErrorFormatter(innerError) : "Dead end.";
			};
			const embody = cause => typeof cause === 'function' ? cause() : cause;
			switch (error?.type) {
				case 'token': return `Failed to parse '${error.name}' token: ${S.debug(embody(error.cause))}`;
				case 'eof': return `Excessive token exists: ${rest(error.context)}`;
				case 'path': return `No valid path exists. <<< ${message(error)}`;
				case 'and': return `And-predicate failed: ${rest(error.context)}`;
				case 'not': return `Not-predicate failed: ${rest(error.context)}`;
				case 'validation': return `Validation failed: ${S.debug(error.cause)}`;
				default: return `Unknown error: ${S.debug(error)}`;
			}
		};

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
			defaultErrorFormatter,
		};
	})();

	const P = (() => {
		const RE_INTEGER = /^[+\-]?\d+$/;
		const RE_NUMBER = /^[+\-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+\-]?\d+)?$/i;

		const syntaxError = (source, context) => ({ type: 'syntax', source, context });
		const jsonError = (source, inner) => ({ type: 'json', source, inner });
		const validationError = (source, cause) => ({ type: 'validation', source, cause });

		const integer = s => RE_INTEGER.test(s) ? R.ok(Number.parseInt(s, 10)) : R.err(syntaxError(s, "integer"));
		const number = s => RE_NUMBER.test(s) ? R.ok(Number.parseFloat(s)) : R.err(syntaxError(s, "number"));
		const string = s => R.ok(s);
		const boolean = s => s === 'true' ? R.ok(true) : s === 'false' ? R.ok(false) : R.err(syntaxError(s, "boolean"));
		const custom = fn => s => R.mapErr(fn(s), context => syntaxError(s, context));

		const withDefault = (parser, value) => s => s !== "" ? parser(s) : R.ok(value);
		const map = (parser, fn) => s => R.map(parser(s), fn);
		const mapError = (parser, fn) => s => R.mapErr(parser(s), fn);
		const validate = (parser, validator) =>
			s => R.andThen(parser(s), value => R.mapErr(validator(value), cause => validationError(s, cause)));

		const make = archetype => {
			const parseJSON = s => {
				try {
					return R.ok(JSON.parse(s));
				} catch (e) {
					return R.err(jsonError(s, e));
				}
			};
			const fromJSON = fn => s => R.andThen(parseJSON(s), value => fn(s, value));
			const arrayOf = parser => array => transpose(array.map(parser));
			const structOf = parsers => struct => R.map(parseEntries(struct, parsers), Object.fromEntries);
			const parseEntries = (struct, parsers) => transpose(parsers.map(entry => parseEntry(struct, entry)));
			const parseEntry = (struct, [key, parser]) => R.map(parser(ref(struct, key)), value => [key, value]);
			const ref = (struct, key) => struct[key] ?? "";
			const transpose = array => array.find(R.isErr) ?? R.ok(array.map(R.unwrap));
			const isObject = x => typeof x === 'object' && x !== null;

			if (typeof archetype === 'function') {
				return archetype;
			} else if (typeof archetype === 'object' && archetype !== null) {
				if (Array.isArray(archetype)) {
					if (archetype.length === 1) {
						const parser = arrayOf(make(archetype[0]));
						return fromJSON((s, v) => Array.isArray(v) ? parser(v) : R.err(syntaxError(s, "array")));
					} else {
						throw new Error(`Archetype array must be a singleton: ${S.debug(archetype)}`);
					}
				} else {
					const parser = structOf(Object.entries(archetype).map(([k, v]) => [k, make(v)]));
					return fromJSON((s, v) => isObject(v) ? parser(v) : R.err(syntaxError(s, "object")));
				}
			} else {
				throw new Error(`Invalid archetype item: ${S.debug(archetype)}`);
			}
		};

		const parse = (s, archetype, errorFormatter = defaultErrorFormatter) => {
			return R.match(
				make(archetype)(s),
				value => value,
				error => { throw new Error(errorFormatter(error)); },
			);
		};

		const parseAll = (args, archetypes, errorFormatter) => {
			return Object.fromEntries(Object.entries(archetypes).map(([key, value]) => {
				return [key, parse(args[key], value, errorFormatter)];
			}));
		};

		const defaultErrorFormatter = error => {
			const dots = s => S.ellipsis(s, 32);
			switch (error?.type) {
				case 'syntax': return `Failed to parse parameter as '${error.context}': ${dots(error.source)}`;
				case 'json': return `Failed to parse parameter as JSON: "${error.inner.message}"`;
				case 'validation': return `Validation failed: ${S.debug(error.cause)}`;
				default: return `Unknown error: ${S.debug(error)}`;
			}
		};

		return {
			integer,
			number,
			string,
			boolean,
			custom,
			withDefault,
			map,
			mapError,
			validate,
			make,
			parse,
			parseAll,
			defaultErrorFormatter,
		};
	})();

	const M = (() => {
		const notationError = (expected, name, value) => ({ type: 'notation', expected, name, value });
		const parseError = (name, source, cause) => ({ type: 'parse', name, source, cause });

		const flag = name => data => {
			const v = data.meta[name];
			switch (v) {
				case undefined: return R.ok(O.some(false));
				case true: return R.ok(O.some(true));
				default: return R.err(notationError('flag', name, v));
			}
		};

		const attr = (name, parser) => data => {
			const v = data.meta[name];
			if (typeof v === 'string') {
				return R.mapErr(R.map(parser(v), O.some), cause => parseError(name, v, cause));
			} else if (v === undefined) {
				return R.ok(O.none());
			} else {
				return R.err(notationError('attr', name, v));
			}
		};

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

		const parseWith = (data, parser, errorFormatter = defaultErrorFormatter) => {
			return R.match(
				parser(data),
				value => O.withDefault(value, undefined),
				error => { throw new Error(errorFormatter(error)); },
			);
		};

		const parse = (data, archetype, errorFormatter) => parseWith(data, make(archetype), errorFormatter);

		const meta = (archetype, errorFormatter) => {
			const store = new WeakMap();
			const parser = make(archetype);
			const parse = data => store.set(data, parseWith(data, parser, errorFormatter));
			const parseAll = table => table.forEach(data => { if (data !== null) parse(data); });
			const get = data => store.get(data);
			return { parse, parseAll, get };
		};

		const defaultErrorFormatter = error => {
			switch (error?.type) {
				case 'notation':
					switch (error.expected) {
						case 'flag': return `'${error.name}' metadata does not accept any arguments.`;
						case 'attr': return `'${error.name}' metadata is not a flag.`;
						default: return `Unknown metadata type: ${error.expected}`;
					}
				case 'parse':
					const message = G.defaultErrorFormatter(error.cause);
					return `Failed to parse '${error.name}' metadata arguments. <<< ${message}`;
				default: return `Unknown error: ${S.debug(error)}`;
			}
		};

		return {
			flag,
			attr,
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

		const memo = f => (...args) => G.memo(f(...args));
		const succeed = G.succeed;
		const fail = G.fail;
		const map = memo(G.map);
		const mapError = memo(G.mapError);
		const seqOf = memo(G.seqOf);
		const oneOf = memo(G.oneOf);
		const validate = memo(G.validate);

		const symbol = s => G.memo(G.token(s, (source, start) => {
			if (source.startsWith(s, start)) {
				return R.ok([s, start + s.length]);
			} else {
				return R.err(() => makeLexError(source.slice(start)));
			}
		}));
		const regexp = (name, re, fn = identity) => G.memo(G.token(name, (source, start) => {
			const slice = source.slice(start);
			const match = slice.match(re);
			if (match !== null && match.index === 0) {
				const token = match[0];
				const value = fn(token, match);
				return R.ok([value, start + token.length]);
			} else {
				return R.err(() => makeLexError(slice));
			}
		}));
		const identity = x => x;
		const makeLexError = s => s.length !== 0 ? `'${S.ellipsis(s, 16)}' is unexpected.` : "No more letters.";

		const spacing = regexp("spacing", RE_SPACING);
		const spaces = regexp("spaces", RE_SPACES);
		const natural = regexp("natural", RE_NATURAL, s => Number.parseInt(s, 10));
		const integer = regexp("integer", RE_INTEGER, s => Number.parseInt(s, 10));
		const number = regexp("number", RE_NUMBER, s => Number.parseFloat(s));
		const boolean = regexp("boolean", RE_BOOLEAN, s => s === 'true');
		const text = regexp("text", RE_TEXT, value => value.slice(1, -1).replace(/`(.)/gu, "$1"));

		const between = (begin, end, inner) => map(G.seqOf([begin, inner, end]), value => value[1]);
		const trim = parser => between(spacing, spacing, parser);
		const group = (begin, end, inner) => between(begin, end, trim(inner));
		const parens = parser => group(symbol("("), symbol(")"), parser);
		const braces = parser => group(symbol("{"), symbol("}"), parser);
		const brackets = parser => group(symbol("["), symbol("]"), parser);

		const flatten = parser => map(parser, ([first, rest]) => [first, ...rest.map(([, item]) => item)]);
		const chain = (item, delimiter) => flatten(G.seqOf([item, G.many(G.seqOf([delimiter, item]))]));
		const join = (items, delimiter) => items.length === 0 ? succeed([]) : flatten(join_(items, delimiter));
		const join_ = ([first, ...rest], delimiter) => G.seqOf([first, G.seqOf(rest.map(item => G.seqOf([delimiter, item])))]);
		const list = parser => chain(parser, spaces);
		const tuple = parsers => join(parsers, spaces);
		const withDefault = (parser, value) => map(G.optional(parser), option => O.withDefault(option, value));

		const make = parser => G.make(G.andThen(trim(parser), value => G.map(G.eof(), () => value)));

		const parse = (source, parser, errorFormatter = G.defaultErrorFormatter) => {
			const result = make(parser)(source);
			return R.match(
				result,
				value => value,
				error => { throw new Error(errorFormatter(error)); },
			);
		};

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
			group,
			parens,
			braces,
			brackets,
			chain,
			join,
			list,
			tuple,
			withDefault,
			make,
			parse,
		};
	})();

	const Z = (() => {
		const ID_SYMBOL = Symbol("id");

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

		const id = obj => obj[ID_SYMBOL] ?? Object.defineProperty(obj, ID_SYMBOL, { value: {} })[ID_SYMBOL];

		const extProp = (defaultValue, nonWeak = false) =>
			nonWeak ? propWithMap(defaultValue) : propWithWeakMap(defaultValue);

		const propWithMap = defaultValue => {
			const store = new Map();
			const getter = owner => (key => store.has(key) ? store.get(key) : defaultValue)(id(owner));
			const setter = (owner, value) => void store.set(id(owner), value);
			const deleter = owner => void store.delete(id(owner));
			const clearer = () => store.clear();
			return [getter, setter, deleter, clearer];
		};

		const propWithWeakMap = defaultValue => {
			const store = new WeakMap();
			const getter = owner => (key => store.has(key) ? store.get(key) : defaultValue)(id(owner));
			const setter = (owner, value) => void store.set(id(owner), value);
			const deleter = owner => void store.delete(id(owner));
			return [getter, setter, deleter];
		};

		const extend = (target, name, prop) => {
			const [getter, setter] = prop;
			Object.defineProperty(target, name, {
				get() { return getter(this); },
				set(value) { setter(this, value); },
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
			const [getContext, setContext] = propWithWeakMap(O.none());
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

	globalThis.Fs = { O, R, L, S, U, G, P, M, N, Z };
};