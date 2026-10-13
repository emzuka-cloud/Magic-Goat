import { Platform } from 'react-native';
import { fetchAuthSession } from 'aws-amplify/auth';

// Local API: the Android emulator reaches the host machine at 10.0.2.2.
const LOCAL_API = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

// Expo inlines EXPO_PUBLIC_* at build time; keep the full `process.env.EXPO_PUBLIC_...` spelling (no destructuring).
export const API_URL = process.env.EXPO_PUBLIC_API_URL || LOCAL_API;

/**
 * Get authorization headers with Cognito JWT token
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
    try {
        const session = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString();

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
