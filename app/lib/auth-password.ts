import crypto from "node:crypto";

const toBase64Url = (value: Buffer | string) =>
  Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const fromBase64Url = (value: string) => {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(
    padded + "=".repeat((4 - (padded.length % 4 || 4)) % 4),
    "base64"
  );
};

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const derived = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, key) =>
      err ? reject(err) : resolve(key as Buffer)
    );
  });
  return `scrypt$${toBase64Url(salt)}$${toBase64Url(derived)}`;
}

export async function verifyPassword(
  storedPassword: string,
  input: string
): Promise<boolean> {
  if (storedPassword.startsWith("scrypt$")) {
    const [, saltB64, hashB64] = storedPassword.split("$");
    if (!saltB64 || !hashB64) return false;
    const salt = fromBase64Url(saltB64);
    const hash = fromBase64Url(hashB64);
    const derived = await new Promise<Buffer>((resolve, reject) => {
      crypto.scrypt(input, salt, hash.length, (err, key) =>
        err ? reject(err) : resolve(key as Buffer)
      );
    });
    return crypto.timingSafeEqual(hash, derived);
  }
  return storedPassword === input;
}
