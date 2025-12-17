import { Platform } from 'react-native';
import { fetchAuthSession } from 'aws-amplify/auth';

const LOCALHOST = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

export const API_URL = LOCALHOST;

/**
 * Get authorization headers with Cognito JWT token
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
    try {
        const session = await fetchAuthSession();
        console.log('Auth Session:', session);
        const token = session.tokens?.idToken?.toString();
        console.log('Token:', token ? 'Found' : 'Missing');

        if (token) {
            return {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            };
        }
    } catch (error) {
        console.error('Failed to get auth token:', error);
    }

    return {
        'Content-Type': 'application/json',
    };
}
