import { DiGraph, type VertexDefinition } from "digraph-js";
import {
  AlreadyRegisteredError,
  CircularDependenciesError,
  ContainerSealedError,
  NotRegisteredError,
} from "./errors";

export const Inject = Symbol.for("Inject");

export enum Lifestyle {
  Transient = "transient",
  Singleton = "singleton",
}

interface Class {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  constructor: Function;
}

interface InjectableClass<T> extends Class {
  [Inject]?: ResolveToken<unknown>[];
  new (...arguments_: any[]): T;
}

export type ResolveToken<T = never> = InjectableClass<T> | string | symbol;

export interface IContainer {
  createChildContainer(): IContainer;

  get<T>(token: ResolveToken<T>): T;

  register<T>(
    token: ResolveToken<T>,
    type: InjectableClass<T>,
    lifestyle: Lifestyle,
  ): void;

  registerInstance<T extends Class>(token: ResolveToken<T>, instance: T): void;

  verify(): void;
}

interface FactoryFn<T> {
  (container: Container): T;
}

interface RegistrationDescriptor<T> extends Record<string, unknown> {
  placeholder?: boolean;
  factory?: FactoryFn<T>;
  lifestyle?: Lifestyle;
}

type Registration<T> = VertexDefinition<RegistrationDescriptor<T>>;

export class Container implements IContainer {
  protected _sealed = false;
  protected _graph = new DiGraph<Registration<any>>();
  protected _singletons = new Map<string, any>();

  createChildContainer(): IContainer {
    return new ChildContainer(this);
  }

  get<T>(token: ResolveToken<T>): T {
    const internalToken = this.extractInternalToken(token);
    if (!this._graph.hasVertex(internalToken)) {
      throw new NotRegisteredError(`Token ${internalToken} is not registered`);
    }

    const registration = this._graph
      .traverse({ rootVertexId: internalToken })
      .next();

    const descriptor = (registration.value as Registration<T>).body;
    if (descriptor.placeholder) {
      throw new NotRegisteredError(`Token ${internalToken} is not registered`);
    }

    return descriptor.factory!(this);
  }

  register<T>(
    token: ResolveToken<T>,
    type: InjectableClass<T>,
    lifestyle: Lifestyle,
  ): void {
    if (this._sealed) {
      throw new ContainerSealedError("Container has been sealed");
    }

    const internalToken = this.extractInternalToken(token);
    const dependencyTokens = type[Inject] ?? [];

    if (this._graph.hasVertex(internalToken)) {
      this._graph.mergeVertexBody(internalToken, (body) => {
        if (!body.placeholder) {
          throw new AlreadyRegisteredError(
            `Token ${internalToken} is already registered`,
          );
        }

        delete body.placeholder;
        body.factory = this.makeFactory(
          type,
          dependencyTokens,
          lifestyle,
          internalToken,
        );
        body.lifestyle = lifestyle;
      });
    } else {
      this._graph.addVertex({
        id: internalToken,
        adjacentTo: [],
        body: {
          factory: this.makeFactory(
            type,
            dependencyTokens,
            lifestyle,
            internalToken,
          ),
          lifestyle,
        },
      });
    }

    for (const dependency of dependencyTokens) {
      const dependencyToken = this.extractInternalToken(dependency);
      if (!this._graph.hasVertex(dependencyToken)) {
        this._graph.addVertex({
          id: dependencyToken,
          adjacentTo: [],
          body: { placeholder: true },
        });
      }

      this._graph.addEdge({
        from: internalToken,
        to: dependencyToken,
      });
    }
  }

  registerInstance<T extends Class>(token: ResolveToken<T>, instance: T): void {
    if (this._sealed) {
      throw new ContainerSealedError("Container has been sealed");
    }

    const internalToken = this.extractInternalToken(token);
    if (this._singletons.has(internalToken)) {
      throw new AlreadyRegisteredError(
        `Token ${internalToken} is already registered`,
      );
    }

    this.register(
      internalToken,
      instance.constructor as unknown as InjectableClass<T>,
      Lifestyle.Singleton,
    );
    this._singletons.set(internalToken, instance);
  }

  verify(): void {
    if (this._sealed) return;

    this._sealed = true;

    if (!this._graph.isAcyclic) {
      const [cycle] = this._graph.findCycles();
      const message =
        "Circular dependencies detected: " +
        cycle.join(" → ") +
        " → " +
        cycle[0];
      throw new CircularDependenciesError(message);
    }

    for (const registration of this._graph.traverse()) {
      if (registration.body.placeholder) {
        throw new NotRegisteredError(
          `Token ${registration.id} is not registered`,
        );
      }
    }
  }

  protected extractInternalToken<T>(token: ResolveToken<T>): string {
    if (token == null) {
      throw new TypeError("Token cannot be null or undefined");
    }

    if (typeof token === "string") return token;
    if (typeof token === "symbol") return token.toString();

    return token.prototype.constructor.name;
  }

  private makeFactory<T>(
    type: InjectableClass<T>,
    dependencyTokens: ResolveToken<any>[],
    lifestyle: Lifestyle,
    internalToken: string,
  ): FactoryFn<T> {
    return (container: Container) => {
      if (lifestyle === Lifestyle.Singleton) {
        internalToken ??= container.extractInternalToken(type);
        if (!container._singletons.has(internalToken)) {
          const dependencies = dependencyTokens.map((dependency) =>
            container.get(dependency),
          );
          container._singletons.set(internalToken, new type(...dependencies));
        }

        return container._singletons.get(internalToken);
      }

      const dependencies = dependencyTokens.map((dependency) =>
        container.get(dependency),
      );
      return new type(...dependencies);
    };
  }
}

class ChildMap extends Map<string, any> {
  constructor(private readonly _parent: Map<string, any>) {
    super();
  }

  get(key: string): any {
    return this._parent.get(key) ?? super.get(key);
  }

  has(key: string): boolean {
    return this._parent.has(key) || super.has(key);
  }
}

class ChildContainer extends Container {
  constructor(protected readonly _parent: Container) {
    super();

    this._parent.verify();

    const parentGraph = this._parent["_graph"].toDict();
    this._graph = DiGraph.fromRaw(parentGraph);
    this._singletons = new ChildMap(this._parent["_singletons"]);
  }
}
