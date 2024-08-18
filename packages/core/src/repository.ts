import type { Entity, EntityFactory } from "./entity";

export abstract class Repository<T extends Entity> {
  protected constructor(protected readonly entityFactory: EntityFactory<T>) {}

  abstract getById(id: string): Promise<T | null>;
  abstract save(entity: T): Promise<T>;
}
