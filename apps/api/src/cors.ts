// Browser origins allowed to call the API and open sockets. Native apps send no Origin header.
// Auth is a bearer token (no cookies), so credentials are never needed.
// Read per request so a .env loaded by ConfigModule is honoured.
export const corsOrigin = (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
    const allowed = (process.env.CORS_ORIGINS ?? 'http://localhost:8081').split(',').map((o) => o.trim());
    cb(null, !origin || allowed.includes(origin));
};
