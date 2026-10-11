import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto'

const PARAMS = { N: 16384, r: 8, p: 1 }
const KEY_BYTES = 64

function derive(password: string, salt: Buffer, options: ScryptOptions) {
  return new Promise<Buffer>((resolve, reject) =>
    scrypt(password.normalize('NFKC'), salt, KEY_BYTES, { ...options, maxmem: 64 * 1024 * 1024 }, (error, key) =>
      error ? reject(error) : resolve(key),
    ),
  )
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16)
  const key = await derive(password, salt, PARAMS)
  return ['scrypt', PARAMS.N, PARAMS.r, PARAMS.p, salt.toString('base64url'), key.toString('base64url')].join('$')
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, N, r, p, salt, hash] = stored.split('$')
  if (scheme !== 'scrypt' || !salt || !hash) return false
  const expected = Buffer.from(hash, 'base64url')
  const actual = await derive(password, Buffer.from(salt, 'base64url'), { N: +N, r: +r, p: +p })
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

// Used when an email is unknown so sign-in takes the same time either way.
export const DUMMY_HASH =
  'scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
