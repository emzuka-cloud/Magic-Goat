import { Amplify } from 'aws-amplify';

export const awsConfig = {
    Auth: {
        Cognito: {
            userPoolId: 'us-east-2_irm6sACmh',
            userPoolClientId: '41cteuobnc1299nlkuh3ei15kc',
            loginWith: {
                oauth: {
                    domain: 'us-east-2irm6sacmh.auth.us-east-2.amazoncognito.com',
                    scopes: ['email', 'profile', 'openid'],
                    redirectSignIn: ['http://localhost:8081/', 'exp://localhost:8081'],
                    redirectSignOut: ['http://localhost:8081/', 'exp://localhost:8081'],
                    responseType: 'code',
                },
            },
        },
    },
};

// Configure Amplify
Amplify.configure(awsConfig as any);
