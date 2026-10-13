import { JwksClient } from 'jwks-rsa';
import { verify, JwtHeader, SigningKeyCallback } from 'jsonwebtoken';

// ponytail: hard-coded pool; move to env with the rest of the config (see PENDING_TASKS.md).
export const COGNITO_ISSUER = 'https://cognito-idp.us-east-2.amazonaws.com/us-east-2_irm6sACmh';
export const COGNITO_CLIENT_ID = '41cteuobnc1299nlkuh3ei15kc';
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
