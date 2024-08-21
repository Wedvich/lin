import crypto from "node:crypto";
import { HashedPassword, Password } from "../model/password";
import type { IDataEncryptionKeyProvider } from "./dataEncryptionKeyProvider";

export interface IPasswordHashingService {
  hash(password: Password): Promise<HashedPassword>;
}

export interface IPasswordVerificationService {
  verify(password: Password, hashedPassword: HashedPassword): Promise<boolean>;
}

/** @see https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#scrypt */
const scryptOptions: crypto.ScryptOptions = {
  N: 2 ** 13,
  r: 8,
  p: 10,
};

export class PasswordService
  implements IPasswordHashingService, IPasswordVerificationService
{
  private readonly _version = 1;

  constructor(
    private readonly _dataEncryptionKeyProvider: IDataEncryptionKeyProvider
  ) {}

  async hash(password: Password): Promise<HashedPassword> {
    const buffer = Buffer.from(password.value);
    const saltedHash = await this.createSaltedHash(buffer);

    const key = await this._dataEncryptionKeyProvider.getKey();
    const encryptedHash = this.encrypt(saltedHash, key);

    return new HashedPassword(encryptedHash.toString("utf16le"), this._version);
  }

  async verify(
    password: Password,
    hashedPassword: HashedPassword
  ): Promise<boolean> {
    if (hashedPassword.version !== this._version) {
      return false;
    }

    const key = await this._dataEncryptionKeyProvider.getKey();
    const decryptedHash = this.decrypt(
      Buffer.from(hashedPassword.artifact, "utf16le"),
      key
    );

    const salt = decryptedHash.subarray(-16);
    const saltedHash = await this.createSaltedHash(
      Buffer.from(password.value),
      salt
    );

    return crypto.timingSafeEqual(decryptedHash, saltedHash);
  }

  private async createSaltedHash(
    password: Buffer,
    salt = crypto.randomBytes(16)
  ): Promise<Buffer> {
    const hash = await new Promise<Buffer>((resolve) => {
      crypto.scrypt(password, salt, 32, scryptOptions, (err, derivedKey) => {
        if (err) {
          throw err;
        }

        resolve(derivedKey);
      });
    });

    return Buffer.concat([hash, salt]);
  }

  private encrypt(data: Buffer, key: Buffer) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const aad = Buffer.from([this._version]);
    cipher.setAAD(aad);

    const encryptedData = Buffer.concat([cipher.update(data), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return Buffer.concat([iv, encryptedData, authTag]);
  }

  private decrypt(data: Buffer, key: Buffer) {
    const iv = data.subarray(0, 12);
    const encryptedData = data.subarray(12, -16);
    const authTag = data.subarray(-16);
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    const aad = Buffer.from([this._version]);
    decipher.setAAD(aad);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
  }
}
