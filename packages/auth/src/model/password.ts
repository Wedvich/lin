export class Password {
  private readonly _value: string;

  constructor(value: string) {
    this._value = value.trim().normalize("NFKD");
  }

  get value(): string {
    return this._value;
  }
}

Password.prototype.toString = function toString() {
  return this.value;
};

export class HashedPassword {
  constructor(readonly artifact: string, readonly version: number) {}
}
