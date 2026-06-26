const MAGIC = 'TOPOLAENC1';
const MAGIC_BYTES = new TextEncoder().encode(MAGIC);
const ITERATIONS_OFFSET = MAGIC_BYTES.length;
const SALT_OFFSET = ITERATIONS_OFFSET + 4;
const SALT_LENGTH = 16;
const IV_OFFSET = SALT_OFFSET + SALT_LENGTH;
const IV_LENGTH = 12;
const DATA_OFFSET = IV_OFFSET + IV_LENGTH;

export interface EncryptedArchiveHeader {
  iterations: number;
  salt: Uint8Array;
  iv: Uint8Array;
  ciphertext: Uint8Array;
}

function equalBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((value, index) => value === b[index]);
}

export function parseEncryptedArchive(
  encryptedArchive: ArrayBuffer,
): EncryptedArchiveHeader {
  const bytes = new Uint8Array(encryptedArchive);
  if (bytes.length <= DATA_OFFSET) {
    throw new Error('Encrypted archive is too small.');
  }
  if (!equalBytes(bytes.slice(0, MAGIC_BYTES.length), MAGIC_BYTES)) {
    throw new Error('Unsupported encrypted archive format.');
  }

  const view = new DataView(encryptedArchive);
  const iterations = view.getUint32(ITERATIONS_OFFSET, false);
  if (!iterations) {
    throw new Error('Encrypted archive has invalid key settings.');
  }

  return {
    iterations,
    salt: bytes.slice(SALT_OFFSET, IV_OFFSET),
    iv: bytes.slice(IV_OFFSET, DATA_OFFSET),
    ciphertext: bytes.slice(DATA_OFFSET),
  };
}

async function deriveAesKey(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<CryptoKey> {
  const passwordBytes = new TextEncoder().encode(password);
  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBytes,
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer.slice(salt.byteOffset, salt.byteOffset + salt.byteLength) as ArrayBuffer,
      iterations,
      hash: 'SHA-256',
    },
    baseKey,
    {name: 'AES-GCM', length: 256},
    false,
    ['decrypt'],
  );
}

export async function decryptEncryptedArchive(
  encryptedArchive: ArrayBuffer,
  password: string,
): Promise<ArrayBuffer> {
  const header = parseEncryptedArchive(encryptedArchive);
  const key = await deriveAesKey(password, header.salt, header.iterations);
  try {
    return await crypto.subtle.decrypt(
      {name: 'AES-GCM', iv: new Uint8Array(header.iv)},
      key,
      new Uint8Array(header.ciphertext),
    );
  } catch (e) {
    throw new Error('Wrong password or corrupted encrypted archive.');
  }
}
