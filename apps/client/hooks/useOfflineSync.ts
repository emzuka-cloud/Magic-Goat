import { useEffect, useState } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { storage, PendingMutation } from '../utils/storage';
import { API_URL, getAuthHeaders } from '../config';
import { apiErrorMessage, showError } from '../utils/errors';

function requestFor(mutation: PendingMutation): { path: string; method: string; body?: object } | null {
    const { tournamentId, pairingId, result, durationMinutes } = mutation.payload ?? {};
    switch (mutation.type) {
        case 'report_result': return { path: `/tournaments/${tournamentId}/pairings/${pairingId}`, method: 'PUT', body: { result } };
        case 'start_timer': return { path: `/tournaments/${tournamentId}/timer/start`, method: 'POST', body: { durationMinutes } };
        case 'pause_timer': return { path: `/tournaments/${tournamentId}/timer/pause`, method: 'POST' };
        case 'reset_timer': return { path: `/tournaments/${tournamentId}/timer/reset`, method: 'POST' };
        default: return null;
    }
}

// 401 (session expired) and 429 (rate limited) may succeed later; other 4xx never will.
const isPermanent = (status: number) => status >= 400 && status < 500 && status !== 401 && status !== 429;

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
        const rejected: string[] = [];
        let retryLater = false;

        try {
            const mutations = await storage.getPendingMutations();
            const headers = await getAuthHeaders();

            for (const mutation of mutations) {
                const req = requestFor(mutation);
                if (!req) {
                    await storage.clearMutation(mutation.id);
                    continue;
                }
                try {
                    const res = await fetch(`${API_URL}${req.path}`, {
                        method: req.method,
                        headers,
                        body: req.body ? JSON.stringify(req.body) : undefined,
                    });
                    if (res.ok) {
                        await storage.clearMutation(mutation.id);
                    } else if (isPermanent(res.status)) {
                        // The server will never accept this change; drop it and tell the user why.
                        rejected.push(await apiErrorMessage(res, 'A change made offline could not be saved.'));
                        await storage.clearMutation(mutation.id);
                    } else {
                        retryLater = true;
                    }
                } catch {
                    retryLater = true; // Network dropped again; keep it queued.
                }
            }
        } catch (error) {
            retryLater = true;
        } finally {
            setIsSyncing(false);
        }

        if (rejected.length) {
            const message = `Some changes made offline were not saved:\n${[...new Set(rejected)].join('\n')}`;
            setSyncError(message);
            showError(message, 'Sync failed');
        } else if (retryLater) {
            setSyncError('Some offline changes have not synced yet. They will be retried automatically.');
        }
    };

    return {
        isOnline,
        isSyncing,
        syncError,
        syncPendingMutations,
    };
};
