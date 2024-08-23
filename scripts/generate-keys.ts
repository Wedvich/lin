// Helper script to generate a random Master Encryption Key (MEK) and Data Encryption Key (DEK),
// and encrypt the DEK using the MEK

import assert from "node:assert/strict";
import crypto from "node:crypto";

const mek = crypto.randomBytes(32);
const dek = crypto.randomBytes(32);

const iv = crypto.randomBytes(12);

const cipher = crypto.createCipheriv("aes-256-gcm", mek, iv);
const encryptedDek = Buffer.concat([cipher.update(dek), cipher.final()]);
const tag = cipher.getAuthTag();
const encryptedData = Buffer.concat([iv, encryptedDek, tag]);

console.log("MEK:\n  %s", mek.toString("hex"));
console.log("DEK:\n  %s", dek.toString("hex"));
console.log("DEK(enc):\n  %s", encryptedData.toString("hex"));

{
  const iv = encryptedData.subarray(0, 12);
  const encryptedDek = encryptedData.subarray(12, encryptedData.length - 16);
  const tag = encryptedData.subarray(encryptedData.length - 16);

  const decipher = crypto.createDecipheriv("aes-256-gcm", mek, iv);
  decipher.setAuthTag(tag);

  const decryptedDek = Buffer.concat([
    decipher.update(encryptedDek),
    decipher.final(),
  ]);

  assert.ok(crypto.timingSafeEqual(dek, decryptedDek));
}
