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
      },
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
      },
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

      constructor(
        public x: X,
        public y: Y,
      ) {}
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

  test("token cannot be null", () => {
    assert.throws(
      () => {
        container.get(null as any);
      },
      {
        message: "Token cannot be null or undefined",
      },
    );
  });

  test("token cannot be undefined", () => {
    assert.throws(
      () => {
        container.get(undefined as any);
      },
      {
        message: "Token cannot be null or undefined",
      },
    );
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
      },
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

  test("throws if the container is sealed", () => {
    class X {}

    container.verify();

    assert.throws(
      () => {
        container.register(X, X, Lifestyle.Transient);
      },
      {
        message: "Container has been sealed",
      },
    );
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
      },
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
      },
    );
  });

  test("registers with string tokens", () => {
    class X {}

    const x = new X();

    container.registerInstance("TokenX", x);

    const xd = container.get("TokenX");

    assert.equal(x, xd);
  });

  test("registers with symbol tokens", () => {
    class X {}

    const x = new X();

    const token = Symbol.for("TokenX");

    container.registerInstance(token, x);

    const xd = container.get(token);

    assert.equal(x, xd);
  });

  test("throws if the container is sealed", () => {
    class X {}

    container.verify();

    assert.throws(
      () => {
        container.registerInstance(X, new X());
      },
      {
        message: "Container has been sealed",
      },
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
      },
    );
  });

  test("does not throw if everything can be resolved", () => {
    class X {}

    class Y {
      static readonly [Inject] = [X];
    }

    container.register(Y, Y, Lifestyle.Transient);
    container.register(X, X, Lifestyle.Transient);

    container.verify();
  });

  test("throws if there are circular dependencies", () => {
    class X {
      static get [Inject]() {
        return [Y];
      }
    }

    class Y {
      static readonly [Inject] = [X];
    }

    container.register(Y, Y, Lifestyle.Transient);
    container.register(X, X, Lifestyle.Transient);

    assert.throws(
      () => {
        container.verify();
      },
      {
        message: "Circular dependencies detected: Y → X → Y",
      },
    );
  });

  test("seals the container", () => {
    class X {}

    container.verify();

    assert.throws(
      () => {
        container.register(X, X, Lifestyle.Transient);
      },
      {
        message: "Container has been sealed",
      },
    );
  });
});

test.describe("ChildContainer", () => {
  test("seals its parent parent container", () => {
    class X {}

    container.createChildContainer();

    assert.throws(
      () => {
        container.register(X, X, Lifestyle.Transient);
      },
      {
        message: "Container has been sealed",
      },
    );
  });

  test("can resolve dependencies from parent container", () => {
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

    const childContainer = container.createChildContainer();

    childContainer.register(Y, Y, Lifestyle.Transient);

    const y = childContainer.get(Y);

    assert.equal(y.x.moo(), "moo");
  });

  test("can recursively resolve dependencies from parent container", () => {
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

    const childContainer1 = container.createChildContainer();
    const childContainer2 = childContainer1.createChildContainer();

    childContainer2.register(Y, Y, Lifestyle.Transient);

    const y = childContainer2.get(Y);

    assert.equal(y.x.moo(), "moo");
  });

  test("does not affect parent container", () => {
    class X {}

    class Y {
      static readonly [Inject] = [X];
    }

    container.register(X, X, Lifestyle.Transient);

    const childContainer = container.createChildContainer();

    childContainer.register(Y, Y, Lifestyle.Transient);

    assert.throws(
      () => {
        container.get(Y);
      },
      {
        message: "Token Y is not registered",
      },
    );
  });

  test("returns same lazy singletons as parent container", () => {
    class X {}

    container.register(X, X, Lifestyle.Singleton);

    const childContainer = container.createChildContainer();

    const x1 = container.get(X);
    const x2 = childContainer.get(X);

    assert.equal(x1, x2);
  });

  test("returns same eager singletons as parent container", () => {
    class X {}

    const x = new X();

    container.registerInstance(X, x);

    const childContainer = container.createChildContainer();

    const x1 = container.get(X);
    const x2 = childContainer.get(X);

    assert.equal(x1, x2);
  });

  test("does not share lazy singletons with parent container", () => {
    class X {}

    container.register(X, X, Lifestyle.Singleton);

    const childContainer1 = container.createChildContainer();
    const childContainer2 = container.createChildContainer();

    const x1 = childContainer1.get(X);
    const x2 = childContainer2.get(X);

    assert.notEqual(x1, x2);
  });
});
