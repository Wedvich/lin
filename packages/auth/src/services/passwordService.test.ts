import assert from "node:assert/strict";
import test from "node:test";
import { Password } from "../model/password.js";
import { PasswordService } from "./passwordService.js";
import type { IDataEncryptionKeyProvider } from "./dataEncryptionKeyProvider.js";

const dataEncryptionKeyProvider: IDataEncryptionKeyProvider = {
  getKey: async () =>
    Buffer.from(
      "cf63161283424479949b9df352020abc0dd13047d6fa4261aec9cf0880303729",
      "hex",
    ),
};

test("hashes passwords securely", async () => {
  const passwordService = new PasswordService(dataEncryptionKeyProvider);

  const a = await passwordService.hash(new Password("verysafepassword"));
  const b = await passwordService.hash(new Password("verysafepassword"));

  assert.notEqual(a, b);
});

test("verifies passwords", async () => {
  const passwordService = new PasswordService(dataEncryptionKeyProvider);

  const password = new Password("verysafepassword");

  const hashedPassword = await passwordService.hash(password);

  assert.ok(await passwordService.verify(password, hashedPassword));
});

test("fails verification when version mismatches", async () => {
  const passwordService = new PasswordService(dataEncryptionKeyProvider);

  const password = new Password("verysafepassword");

  const hashedPassword = await passwordService.hash(password);
  (hashedPassword as any).version += 1;

  assert.equal(false, await passwordService.verify(password, hashedPassword));
});
