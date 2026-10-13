import { TextStyle, ViewStyle } from 'react-native';

/** Shared look for app dialogs (detail screens). Spread into a screen's StyleSheet and add layout tweaks there. */
export const modalStyles: { overlay: ViewStyle; card: ViewStyle; title: TextStyle } = {
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    card: {
        width: '100%',
        maxWidth: 420, // stays dialog-sized on wide browser windows
        backgroundColor: '#1a1a2e',
        borderRadius: 16,
        padding: 24,
        borderWidth: 1,
        borderColor: '#2e1065',
    },
    title: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
};
