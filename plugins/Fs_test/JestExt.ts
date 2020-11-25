import Fs from "./Fs";

type PartialRec<T> =
	T extends readonly any[] ? ArrayLike<PartialRec<T[number]>> :
	T extends object ? { [P in keyof T]?: PartialRec<T[P]> } : T;

declare global {
	module jest {
		interface Matchers<R, T> {
			toEqualOk(value: T extends Fs.R.Ok<infer V> ? V : never): R;
			toEqualErr(error: T extends Fs.R.Err<infer E> ? E : never): R;
			toMatchOk(value: T extends Fs.R.Ok<infer V> ? PartialRec<V> : never): R;
			toMatchErr(error: T extends Fs.R.Err<infer E> ? PartialRec<E> : never): R;
		}
	}
}

const { R } = Fs;

expect.extend({
	toEqualOk<T>(received: unknown, value: T) {
		if (this.isNot) {
			expect(received).not.toEqual(R.ok(value));
		} else {
			expect(received).toEqual(R.ok(value));
		}

		return { pass: !this.isNot, message: () => "" };
	},
	toEqualErr<E>(received: unknown, error: E) {
		if (this.isNot) {
			expect(received).not.toEqual(R.err(error));
		} else {
			expect(received).toEqual(R.err(error));
		}

		return { pass: !this.isNot, message: () => "" };
	},
	toMatchOk<T>(received: unknown, value: T) {
		if (this.isNot) {
			expect(received).not.toMatchObject(R.ok(value));
		} else {
			expect(received).toMatchObject(R.ok(value));
		}

		return { pass: !this.isNot, message: () => "" };
	},
	toMatchErr<E>(received: unknown, error: E) {
		if (this.isNot) {
			expect(received).not.toMatchObject(R.err(error));
		} else {
			expect(received).toMatchObject(R.err(error));
		}

		return { pass: !this.isNot, message: () => "" };
	}
});