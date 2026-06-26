const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline/promises');

const MAGIC = Buffer.from('TOPOLAENC1', 'utf8');
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const DEFAULT_ITERATIONS = 250000;

function usage() {
  console.error('Usage: node scripts/encrypt-tree.js <input.zip> <output.enc>');
}

async function getPassword() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  try {
    const password = await rl.question('Archive password: ');
    const confirmation = await rl.question('Confirm password: ');
    if (password !== confirmation) {
      throw new Error('Passwords do not match.');
    }
    return password;
  } finally {
    rl.close();
  }
}

async function main() {
  const [, , inputPath, outputPath] = process.argv;
  if (!inputPath || !outputPath) {
    usage();
    process.exitCode = 1;
    return;
  }

  const password = await getPassword();
  if (!password) {
    throw new Error('Password cannot be empty.');
  }

  const plaintext = fs.readFileSync(inputPath);
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = crypto.pbkdf2Sync(
    password,
    salt,
    DEFAULT_ITERATIONS,
    32,
    'sha256',
  );

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext),
    cipher.final(),
    cipher.getAuthTag(),
  ]);

  const iterations = Buffer.alloc(4);
  iterations.writeUInt32BE(DEFAULT_ITERATIONS, 0);
  const output = Buffer.concat([MAGIC, iterations, salt, iv, ciphertext]);

  fs.mkdirSync(path.dirname(path.resolve(outputPath)), {recursive: true});
  fs.writeFileSync(outputPath, output);
  console.log(`Encrypted ${inputPath} -> ${outputPath}`);
}

main().catch((error) => {
  console.error(error.message || String(error));
  process.exitCode = 1;
});
