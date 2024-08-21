import test from "node:test";
import assert from "node:assert/strict";
import { Password } from "./password.js";

test("whitespace is trimmed", () => {
  assert.equal(new Password("  foo  ").toString(), "foo");
});

test("unicode is normalized", () => {
  const password1 = new Password(
    "\u0041\u006d\u00e9\u006c\u0069\u0065"
  ).toString();
  const password2 = new Password(
    "\u0041\u006d\u0065\u0301\u006c\u0069\u0065"
  ).toString();

  assert.equal(password1, password2);
});
