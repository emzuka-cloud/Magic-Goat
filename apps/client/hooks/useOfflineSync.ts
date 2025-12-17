import { useEffect, useState } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { storage, PendingMutation } from '../utils/storage';

const API_BASE = 'http://localhost:3000';

export const useOfflineSync = () => {
    const isOnline = useNetworkStatus();
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncError, setSyncError] = useState<string | null>(null);

    useEffect(() => {
        if (isOnline && !isSyncing) {
            syncPendingMutations();
        }
    }, [isOnline]);

    const syncPendingMutations = async () => {
        setIsSyncing(true);
        setSyncError(null);

        try {
            const mutations = await storage.getPendingMutations();

            for (const mutation of mutations) {
                try {
                    await executeMutation(mutation);
                    await storage.clearMutation(mutation.id);
                } catch (error) {
                    console.error('Failed to sync mutation:', mutation, error);
                    setSyncError('Some changes failed to sync');
                }
            }
        } catch (error) {
            console.error('Failed to sync mutations:', error);
            setSyncError('Sync failed');
        } finally {
            setIsSyncing(false);
        }
    };

    const executeMutation = async (mutation: PendingMutation) => {
        const token = 'YOUR_JWT_TOKEN_HERE'; // TODO: Get from auth context

        switch (mutation.type) {
            case 'report_result':
                await fetch(`${API_BASE}/tournaments/${mutation.payload.tournamentId}/pairings/${mutation.payload.pairingId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ result: mutation.payload.result }),
                });
                break;

            case 'start_timer':
                await fetch(`${API_BASE}/tournaments/${mutation.payload.tournamentId}/timer/start`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ durationMinutes: mutation.payload.durationMinutes }),
                });
                break;

            case 'pause_timer':
                await fetch(`${API_BASE}/tournaments/${mutation.payload.tournamentId}/timer/pause`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
                break;

            case 'reset_timer':
                await fetch(`${API_BASE}/tournaments/${mutation.payload.tournamentId}/timer/reset`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
                break;

            default:
                console.warn('Unknown mutation type:', mutation.type);
        }
    };

    return {
        isOnline,
        isSyncing,
        syncError,
        syncPendingMutations,
    };
};
