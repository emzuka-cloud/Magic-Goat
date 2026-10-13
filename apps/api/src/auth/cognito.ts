import { JwksClient } from 'jwks-rsa';
import { verify, JwtHeader, SigningKeyCallback } from 'jsonwebtoken';

// Defaults are the shared dev pool, so local runs need no .env. Pool and app client IDs are not secrets.
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || 'us-east-2_irm6sACmh';
const REGION = USER_POOL_ID.split('_')[0]; // pool IDs are "<region>_<id>"
export const COGNITO_ISSUER = `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`;
export const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID || '41cteuobnc1299nlkuh3ei15kc';
export const COGNITO_JWKS_URI = `${COGNITO_ISSUER}/.well-known/jwks.json`;

const jwks = new JwksClient({ jwksUri: COGNITO_JWKS_URI, cache: true, rateLimit: true, jwksRequestsPerMinute: 5 });

const getKey = (header: JwtHeader, cb: SigningKeyCallback) =>
    jwks.getSigningKey(header.kid, (err, key) => cb(err, key?.getPublicKey()));

/** Verifies a Cognito ID token (same rules as JwtStrategy) and returns its payload. For sockets. */
export function verifyIdToken(token: string): Promise<any> {
    return new Promise((resolve, reject) =>
        verify(token, getKey, { issuer: COGNITO_ISSUER, audience: COGNITO_CLIENT_ID, algorithms: ['RS256'] }, (err, payload: any) => {
            if (err) return reject(err);
            if (payload?.token_use !== 'id') return reject(new Error('Not an ID token'));
            resolve(payload);
        }));
}
