import admin from 'firebase-admin';

if (!admin.apps.length) {
    let serviceAccount;
    
    // Attempt to load and parse the service account from environment variables
    const rawAccount = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (rawAccount) {
        try {
            // Strip wrapping single/double quotes if added accidentally by shell
            let cleanJson = rawAccount.trim();
            if (cleanJson.startsWith("'") && cleanJson.endsWith("'")) {
                cleanJson = cleanJson.substring(1, cleanJson.length - 1);
            } else if (cleanJson.startsWith('"') && cleanJson.endsWith('"')) {
                cleanJson = cleanJson.substring(1, cleanJson.length - 1);
            }
            
            serviceAccount = JSON.parse(cleanJson);
            
            // Format private key if needed (converting literal \n to actual newlines)
            if (serviceAccount.private_key && typeof serviceAccount.private_key === 'string') {
                serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
            }
        } catch (e) {
            console.error('⚠️ Firebase Admin Initialization: Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', e);
        }
    }

    if (serviceAccount && serviceAccount.private_key) {
        try {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
            });
            console.log('✅ Firebase Admin: Initialized with service account');
        } catch (err) {
            console.error('⚠️ Firebase Admin: Initialization with service account failed, falling back:', err);
            admin.initializeApp({
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'bbinxx-base'
            });
        }
    } else {
        console.warn('⚠️ Firebase Admin: No service account found. Using default client/environment setup.');
        admin.initializeApp({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'bbinxx-base'
        });
    }
}

export const db = admin.firestore();
export const auth = admin.auth();
