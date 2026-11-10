const PROJECT_ID = 'demo-questify-e2e'
function environment(parent = process.env) {
    const inherited = Object.fromEntries(['PATH', 'HOME', 'USER', 'TMPDIR', 'JAVA_HOME', 'LANG', 'SYSTEMROOT'].filter(k => parent[k]).map(k => [k, parent[k]]))
    return {
        ...inherited, CI: '1', NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1',
        HOSTNAME: '127.0.0.1', PORT: '3210', QUESTIFY_BUILD_DIR: '.next-e2e',
        SESSION_SECRET: 'local-playwright-session-key-not-for-production-0001',
        FIRESTORE_EMULATOR_HOST: '127.0.0.1:8088', GCLOUD_PROJECT: PROJECT_ID,
        GOOGLE_CLOUD_PROJECT: PROJECT_ID, NEXT_PUBLIC_FIREBASE_PROJECT_ID: PROJECT_ID,
        FIREBASE_SERVICE_ACCOUNT: '', FIREBASE_SERVICE_ACCOUNT_KEY: '', GOOGLE_APPLICATION_CREDENTIALS: '',
        FIREBASE_CONFIG: '', FIREBASE_TOKEN: '', GOOGLE_OAUTH_ACCESS_TOKEN: '',
        R2_ACCOUNT_ID: 'local-e2e', R2_ACCESS_KEY_ID: 'S3RVER', R2_SECRET_ACCESS_KEY: 'S3RVER', R2_BUCKET_NAME: 'questify-e2e',
        R2_ENDPOINT: 'http://127.0.0.1:4569', R2_PUBLIC_URL: '', NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL: '',
        CLOUDFLARE_R2_ACCOUNT_ID: '', CLOUDFLARE_R2_ACCESS_KEY_ID: '', CLOUDFLARE_R2_SECRET_ACCESS_KEY: '', CLOUDFLARE_R2_BUCKET_NAME: '',
        METADATA_SERVER_DETECTION: 'none',
    }
}
module.exports = { environment, PROJECT_ID }
