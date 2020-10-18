import Fs from "./Fs";

const { Z } = Fs;

test("redef", () => {
	class A {
		x!: number;
		foo(..._: any[]) { return "A"; }
		bar(..._: any[]) { return "A"; }
		baz(..._: any[]) { return "A"; }
	};
	class B extends A {
		foo(...args: any[]) { return super.foo(...args) + "B"; }
	};
	class C extends B {
		bar(...args: any[]) { return super.bar(...args) + "C"; }
	};
	const c: any = Object.assign(new C(), { x: "X" });

	expect(c.foo()).toBe("AB");
	expect(c.bar()).toBe("AC");
	expect(c.baz()).toBe("A");

	Z.redef(C.prototype, base => ({
		foo(...args: any[]) { return base(this).foo(...args) + "D"; },
		bar(...args: any[]) { return base(this).bar(...args) + "D"; },
		baz(...args: any[]) { return base(this).baz(...args) + "D"; },
		qux() { return "D"; },
	}));

	expect(c.foo()).toBe("ABD");
	expect(c.bar()).toBe("ACD");
	expect(c.baz()).toBe("AD");
	expect(c.qux()).toBe("D");

	Z.redef(B.prototype, base => ({
		foo(...args: any[]) { return base(this).foo(...args) + "E"; },
		bar(...args: any[]) { return base(this).bar(...args) + "E"; },
		baz(...args: any[]) { return base(this).baz(...args) + "E"; },
		qux() { return "E"; },
	}));

	expect(c.foo()).toBe("ABED");
	expect(c.bar()).toBe("AECD");
	expect(c.baz()).toBe("AED");
	expect(c.qux()).toBe("D");

	Z.redef(A.prototype, base => ({
		foo(...args: any[]) { return args[0] + this.x + base(this).foo(...args); },
		bar(...args: any[]) { return args[0] + this.x + base(this).bar(...args); },
		baz(...args: any[]) { return args[0] + this.x + base(this).baz(...args); },
		qux(...args: any[]) { return args[0] + this.x; },
	}));

	expect(c.foo("Y")).toBe("YXABED");
	expect(c.bar("Y")).toBe("YXAECD");
	expect(c.baz("Y")).toBe("YXAED");
	expect(c.qux("Y")).toBe("D");
});

test("extProp", () => {
	const x = new class X { };

	const fooProp = Z.extProp("foo");
	expect(fooProp.get(x)).toBe("foo");
	fooProp.set(x, "abc");
	expect(fooProp.get(x)).toBe("abc");
	fooProp.delete(x);
	expect(fooProp.get(x)).toBe("foo");

	const barProp = Z.extProp("bar", true);
	expect(barProp.get(x)).toBe("bar");
	barProp.set(x, "123");
	expect(barProp.get(x)).toBe("123");
	barProp.delete(x);
	expect(barProp.get(x)).toBe("bar");
	barProp.set(x, "456");
	expect(barProp.get(x)).toBe("456");
	barProp.clear();
	expect(barProp.get(x)).toBe("bar");
});

test("extend", () => {
	class X { };
	const x: any = new X();

	Z.extend(X.prototype, "foo", Z.extProp("foo"));
	expect(x.foo).toBe("foo");
	x.foo = "abc";
	expect(x.foo).toBe("abc");
});

test("swapper", () => {
	class Counter {
		value: number;
		constructor() { this.value = 0; }
		inc() { return ++this.value; }
	}
	const counter = new Counter();

	const swapValue = Z.swapper("value");
	expect(counter.inc()).toBe(1);
	swapValue(counter, 41, () => {
		expect(counter.inc()).toBe(42);
	});
	expect(counter.inc()).toBe(2);
});

test("context", () => {
	class Counter {
		value: number;
		constructor() { this.value = 0; }
		inc() { return ++this.value; }
	}
	const counter = new Counter();

	const boostContext = Z.context<number | null>(null);
	Counter.prototype.inc = function () {
		return this.value += boostContext.exists(this) ? boostContext.value(this)! : 1;
	};

	expect(counter.inc()).toBe(1);
	boostContext.enter(counter, 10, () => {
		expect(counter.inc()).toBe(11);
		expect(counter.inc()).toBe(21);
	});
	expect(counter.inc()).toBe(22);
});