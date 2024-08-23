import { DiGraph, type VertexDefinition } from "digraph-js";
import {
  AlreadyRegisteredError,
  CircularDependenciesError,
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
  get<T>(token: ResolveToken<T>): T;

  register<T>(
    token: ResolveToken<T>,
    type: InjectableClass<T>,
    lifestyle: Lifestyle
  ): void;

  registerInstance<T extends Class>(token: ResolveToken<T>, instance: T): void;

  verify(): void;
}

interface RegistrationDescriptor<T> extends Record<string, unknown> {
  placeholder?: boolean;
  factory?: () => T;
  lifestyle?: Lifestyle;
}

type Registration<T> = VertexDefinition<RegistrationDescriptor<T>>;

export class Container implements IContainer {
  private readonly _graph = new DiGraph<Registration<any>>();
  private readonly _singletons = new Map<string, any>();

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

    return descriptor.factory!();
  }

  register<T>(
    token: ResolveToken<T>,
    type: InjectableClass<T>,
    lifestyle: Lifestyle
  ): void {
    const internalToken = this.extractInternalToken(token);
    const dependencyTokens = type[Inject] ?? [];

    if (this._graph.hasVertex(internalToken)) {
      this._graph.mergeVertexBody(internalToken, (body) => {
        if (!body.placeholder) {
          throw new AlreadyRegisteredError(
            `Token ${internalToken} is already registered`
          );
        }

        delete body.placeholder;
        body.factory = this.makeFactory(
          type,
          dependencyTokens,
          lifestyle,
          internalToken
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
            internalToken
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
    const internalToken = this.extractInternalToken(token);
    if (this._singletons.has(internalToken)) {
      throw new AlreadyRegisteredError(
        `Token ${internalToken} is already registered`
      );
    }

    this.register(
      internalToken,
      instance.constructor as unknown as InjectableClass<T>,
      Lifestyle.Singleton
    );
    this._singletons.set(internalToken, instance);
  }

  verify(): void {
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
          `Token ${registration.id} is not registered`
        );
      }
    }
  }

  private extractInternalToken<T>(token: ResolveToken<T>): string {
    if (typeof token === "string") return token;
    if (typeof token === "symbol") return token.toString();

    return token.prototype.constructor.name;
  }

  private makeFactory<T>(
    type: InjectableClass<T>,
    dependencyTokens: ResolveToken<any>[],
    lifestyle: Lifestyle,
    internalToken: string
  ): () => T {
    return () => {
      if (lifestyle === Lifestyle.Singleton) {
        internalToken ??= this.extractInternalToken(type);
        if (!this._singletons.has(internalToken)) {
          const dependencies = dependencyTokens.map((dependency) =>
            this.get(dependency)
          );
          this._singletons.set(internalToken, new type(...dependencies));
        }

        return this._singletons.get(internalToken);
      }

      const dependencies = dependencyTokens.map((dependency) =>
        this.get(dependency)
      );
      return new type(...dependencies);
    };
  }
}
