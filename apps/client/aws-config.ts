import { Amplify } from 'aws-amplify';

const redirectUrls = (process.env.EXPO_PUBLIC_AUTH_REDIRECT_URLS || 'http://localhost:8081/,exp://localhost:8081')
    .split(',').map((u: string) => u.trim());

export const awsConfig = {
    Auth: {
        Cognito: {
            // Defaults are the shared dev pool. Expo inlines EXPO_PUBLIC_* at build time (write them out in full).
            userPoolId: process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID || 'us-east-2_irm6sACmh',
            userPoolClientId: process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID || '41cteuobnc1299nlkuh3ei15kc',
            loginWith: {
                oauth: {
                    domain: process.env.EXPO_PUBLIC_COGNITO_DOMAIN || 'us-east-2irm6sacmh.auth.us-east-2.amazoncognito.com',
                    scopes: ['email', 'profile', 'openid'],
                    redirectSignIn: redirectUrls,
                    redirectSignOut: redirectUrls,
                    responseType: 'code',
                },
            },
        },
    },
};

// Configure Amplify
Amplify.configure(awsConfig as any);
