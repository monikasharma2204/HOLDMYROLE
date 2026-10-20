import { SignJWT, jwtVerify, JWTPayload } from "jose";

export interface TokenPayload extends JWTPayload {
  sub: string;
  email: string;
  name: string;
  role: "ADMIN" | "CUSTOMER";
}

const DEFAULT_SECRET = "default-insecure-jwt-secret-key-assessment-mode-only";

function getJwtSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET || DEFAULT_SECRET;
  return new TextEncoder().encode(secret);
}

/**
 * Sign a JWT with the user payload and standard expiration (7 days).
 */
export async function signToken(
  payload: {
    sub: string;
    email: string;
    name: string;
    role: "ADMIN" | "CUSTOMER";
  },
  expiresIn: string = "7d"
): Promise<string> {
  const secretKey = getJwtSecretKey();

  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secretKey);
}

/**
 * Verify a JWT string.
 * Returns the decoded typed payload if valid, or null if invalid or expired.
 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const secretKey = getJwtSecretKey();
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    });

    if (
      !payload.sub ||
      typeof payload.email !== "string" ||
      typeof payload.role !== "string"
    ) {
      return null;
    }

    return payload as TokenPayload;
  } catch (error) {
    return null;
  }
}
