// Import this first (before any app code) so values from apps/api/.env are in process.env
// when modules read them at load time. Node's built-in loader; real env vars win over the file.
try {
    process.loadEnvFile();
} catch {
    // No .env file: use the real environment and the defaults in code.
}
