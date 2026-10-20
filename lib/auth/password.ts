import { hash, verify } from "@node-rs/argon2";

/**
 * Hash a plain-text password using Argon2id.
 */
export async function hashPassword(password: string): Promise<string> {
  return await hash(password, {
    algorithm: 2, // 2 = Algorithm.Argon2id
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });
}

/**
 * Verify a plain-text password against an Argon2id hash.
 */
export async function verifyPassword(hashString: string, password: string): Promise<boolean> {
  try {
    return await verify(hashString, password);
  } catch (error) {
    return false;
  }
}
