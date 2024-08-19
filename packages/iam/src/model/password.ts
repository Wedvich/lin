export class HashedPassword {
  constructor(
    readonly artifact: string,
    readonly version: number,
  ) {}

  equals(other: HashedPassword): boolean {
    return this.artifact === other.artifact && this.version === other.version;
  }
}
