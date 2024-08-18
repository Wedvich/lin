export abstract class Entity {
  private _id = "00000000-0000-0000-0000-000000000000";
  private _idAssigned = false;

  protected get id(): string {
    return this._id;
  }

  protected set id(value: string) {
    if (this._idAssigned) {
      throw new Error("Cannot change id once assigned");
    }

    this._id = value;
    this._idAssigned = true;
  }
}

export abstract class EntityFactory<T extends Entity> {
  protected readonly generateId: () => string;

  protected constructor(idGenerator: () => string) {
    this.generateId = idGenerator;
  }

  abstract create(): T;
}
