import AsyncStorage from '@react-native-async-storage/async-storage';

const TOURNAMENT_PREFIX = 'tournament_';
const MUTATIONS_KEY = 'pending_mutations';

export interface PendingMutation {
    id: string;
    type: 'report_result' | 'create_pairing' | 'start_timer' | 'pause_timer' | 'reset_timer';
    payload: any;
    timestamp: number;
}

export const storage = {
    async saveTournament(tournamentId: string, data: any): Promise<void> {
        try {
            await AsyncStorage.setItem(`${TOURNAMENT_PREFIX}${tournamentId}`, JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save tournament:', error);
        }
    },

    async getTournament(tournamentId: string): Promise<any | null> {
        try {
            const data = await AsyncStorage.getItem(`${TOURNAMENT_PREFIX}${tournamentId}`);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Failed to get tournament:', error);
            return null;
        }
    },

    async queueMutation(mutation: Omit<PendingMutation, 'id' | 'timestamp'>): Promise<void> {
        try {
            const mutations = await this.getPendingMutations();
            const newMutation: PendingMutation = {
                ...mutation,
                id: `${Date.now()}_${Math.random()}`,
                timestamp: Date.now(),
            };
            mutations.push(newMutation);
            await AsyncStorage.setItem(MUTATIONS_KEY, JSON.stringify(mutations));
        } catch (error) {
            console.error('Failed to queue mutation:', error);
        }
    },

    async getPendingMutations(): Promise<PendingMutation[]> {
        try {
            const data = await AsyncStorage.getItem(MUTATIONS_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Failed to get pending mutations:', error);
            return [];
        }
    },

    async clearMutation(mutationId: string): Promise<void> {
        try {
            const mutations = await this.getPendingMutations();
            const filtered = mutations.filter(m => m.id !== mutationId);
            await AsyncStorage.setItem(MUTATIONS_KEY, JSON.stringify(filtered));
        } catch (error) {
            console.error('Failed to clear mutation:', error);
        }
    },

    async clearAllMutations(): Promise<void> {
        try {
            await AsyncStorage.setItem(MUTATIONS_KEY, JSON.stringify([]));
        } catch (error) {
            console.error('Failed to clear all mutations:', error);
        }
    },
};
