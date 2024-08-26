import assert from "node:assert/strict";
import test from "node:test";
import { Entity } from "./entity.js";

test("id cannot be reassigned", () => {
  class ConcreteEntity extends Entity {
    setId(id: string) {
      this.id = id;
    }
  }

  const entity = new ConcreteEntity();

  entity.setId("1234");
  assert.throws(() => {
    entity.setId("5678");
  });
});
