export interface IDataEncryptionKeyProvider {
  getKey(): Promise<Buffer>;
}
