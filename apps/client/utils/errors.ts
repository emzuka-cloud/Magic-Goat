import { Alert, Platform } from 'react-native';

/**
 * Turn a failed API response into a message a user can act on.
 * Prefers the server's message (NestJS sends { statusCode, message }); falls back per status.
 */
export async function apiErrorMessage(res: Response, fallback: string): Promise<string> {
    let message: string | undefined;
    try {
        const body = await res.json();
        message = Array.isArray(body?.message) ? body.message.join('\n') : body?.message;
    } catch {
        // Body was empty or not JSON.
    }

    switch (res.status) {
        case 401: return 'Your session has expired. Please sign in again.';
        case 403: return message || 'You don\'t have permission to do this. Only the owner can make this change.';
        case 404: return message || 'This item no longer exists. It may have been deleted.';
        case 429: return 'Too many requests. Please wait a minute and try again.';
    }
    if (res.status >= 500) return `${fallback} Something went wrong on our side, please try again later.`;
    return message || fallback;
}

// Alert.alert is a no-op on react-native-web, so fall back to window.alert there.
export function showMessage(title: string, message: string) {
    if (Platform.OS === 'web') window.alert(message);
    else Alert.alert(title, message);
}

export function showError(message: string, title = 'Error') {
    showMessage(title, message);
}

export async function showApiError(res: Response, fallback: string) {
    showError(await apiErrorMessage(res, fallback));
}

export const NETWORK_ERROR = 'Could not reach the server. Check your connection and try again.';

/** Ask before a destructive action. Alert.alert buttons do nothing on web, so use window.confirm there. */
export function confirmAction(title: string, message: string, confirmLabel: string, onConfirm: () => void) {
    if (Platform.OS === 'web') {
        if (window.confirm(message)) onConfirm();
        return;
    }
    Alert.alert(title, message, [
        { text: 'Cancel', style: 'cancel' },
        { text: confirmLabel, style: 'destructive', onPress: onConfirm },
    ]);
}
