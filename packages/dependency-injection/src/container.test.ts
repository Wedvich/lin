import assert from "node:assert/strict";
import test from "node:test";
import { Container, type IContainer, Inject, Lifestyle } from "./container.js";

let container: IContainer;
test.beforeEach(() => {
  container = new Container();
});

test.describe("get", () => {
  test("returns a valid instance", () => {
    class X {
      moo() {
        return "moo!";
      }
    }
    container.register(X, X, Lifestyle.Transient);

    const x = container.get(X);
    const result = x.moo();
    assert.equal(result, "moo!");
  });

  test("can be used with string token", () => {
    interface IThing {}

    class Thing implements IThing {}

    container.register<IThing>("IThing", Thing, Lifestyle.Transient);

    container.get<IThing>("IThing");
  });

  test("can be used with symbol token", () => {
    class Thing {}

    const IThing = Symbol.for("IThing");

    container.register(IThing, Thing, Lifestyle.Transient);

    container.get(IThing);
  });

  test("returns different instances for transient types", () => {
    class X {}
    container.register(X, X, Lifestyle.Transient);

    const x1 = container.get(X);
    const x2 = container.get(X);

    assert.notEqual(x1, x2);
  });

  test("returns same instance for singleton types", () => {
    class X {}
    container.register(X, X, Lifestyle.Singleton);

    const x1 = container.get(X);
    const x2 = container.get(X);

    assert.equal(x1, x2);
  });

  test("throws for unregistered types", () => {
    class X {}

    assert.throws(
      () => {
        container.get(X);
      },
      {
        message: "Token X is not registered",
      }
    );
  });

  test("throws for unregistered dependencies", () => {
    class X {}

    class Y {
      static readonly [Inject] = [X];
    }

    container.register(Y, Y, Lifestyle.Transient);

    assert.throws(
      () => {
        container.get(Y);
      },
      {
        message: "Token X is not registered",
      }
    );
  });

  test("resolves nested dependencies", () => {
    class X {
      moo() {
        return "moo";
      }
    }

    class Y {
      static readonly [Inject] = [X];

      constructor(public x: X) {}
    }

    class Z {
      static readonly [Inject] = [X, Y];

      constructor(public x: X, public y: Y) {}
    }

    container.register(X, X, Lifestyle.Transient);
    container.register(Y, Y, Lifestyle.Transient);
    container.register(Z, Z, Lifestyle.Transient);

    const z = container.get(Z);

    assert.equal(z.x.moo(), "moo");
    assert.equal(z.y.x.moo(), "moo");
  });

  test("resolves singleton with nested dependencies", () => {
    class X {
      moo() {
        return "moo";
      }
    }

    class Y {
      static readonly [Inject] = [X];

      constructor(public x: X) {}
    }

    container.register(X, X, Lifestyle.Transient);
    container.register(Y, Y, Lifestyle.Singleton);

    const y1 = container.get(Y);
    const y2 = container.get(Y);

    assert.equal(y1.x, y2.x);
  });
});

test.describe("register", () => {
  test("throws if token is already registered", () => {
    class X {}

    container.register(X, X, Lifestyle.Singleton);

    assert.throws(
      () => {
        container.register(X, X, Lifestyle.Singleton);
      },
      {
        message: "Token X is already registered",
      }
    );
  });

  test("can add dependencies that aren't registered yet", () => {
    class X {}

    class Y {
      static readonly [Inject] = [X];
    }

    container.register(Y, Y, Lifestyle.Transient);
    container.register(X, X, Lifestyle.Transient);
  });
});

test.describe("registerInstance", () => {
  test("registers an existing instance as a singleton", () => {
    class X {}

    const x = new X();

    container.registerInstance(X, x);

    const xd = container.get(X);

    assert.equal(x, xd);
  });

  test("throws if an instance already exists", () => {
    class X {}

    const x = new X();

    container.registerInstance(X, x);

    assert.throws(
      () => {
        container.registerInstance<X>(X, x);
      },
      {
        message: "Token X is already registered",
      }
    );
  });

  test("throws if token is already registered", () => {
    class X {}

    const x = new X();

    container.register(X, X, Lifestyle.Singleton);

    assert.throws(
      () => {
        container.registerInstance(X, x);
      },
      {
        message: "Token X is already registered",
      }
    );
  });
});

test.describe("verify", () => {
  test("throws if there are placeholder dependencies", () => {
    class X {}

    class A {}

    class Y {
      static readonly [Inject] = [X, A];
    }

    container.register(Y, Y, Lifestyle.Transient);
    container.register(X, X, Lifestyle.Transient);

    assert.throws(
      () => {
        container.verify();
      },
      {
        message: "Token A is not registered",
      }
    );
  });

  test("does not throw if everything can be resolved", () => {
    class X {}

    class Y {
      static readonly [Inject] = [X];
    }

    container.register(Y, Y, Lifestyle.Transient);
    container.register(X, X, Lifestyle.Transient);
  });
});
