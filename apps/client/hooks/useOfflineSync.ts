import { useEffect } from 'react';
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

let syncing: Promise<void> | null = null;

/**
 * Send changes saved while offline, oldest first. Safe to call any time (no-op when the queue is empty,
 * and concurrent calls share one run). Changes the server rejects are dropped and the user is told why;
 * temporary failures stay queued for the next call.
 */
export function syncPendingMutations(): Promise<void> {
    syncing ??= (async () => {
        const rejected: string[] = [];
        try {
            const mutations = await storage.getPendingMutations();
            if (!mutations.length) return;
            const headers = await getAuthHeaders();
            for (const mutation of mutations) {
                const req = requestFor(mutation);
                if (!req) {
                    await storage.clearMutation(mutation.id);
                    continue;
                }
                const res = await fetch(`${API_URL}${req.path}`, {
                    method: req.method,
                    headers,
                    body: req.body ? JSON.stringify(req.body) : undefined,
                }).catch(() => null);
                if (!res) break; // Still offline: keep this and everything after it, in order.
                if (res.ok) {
                    await storage.clearMutation(mutation.id);
                } else if (isPermanent(res.status)) {
                    rejected.push(await apiErrorMessage(res, 'A change made offline could not be saved.'));
                    await storage.clearMutation(mutation.id);
                }
            }
        } finally {
            syncing = null;
        }
        if (rejected.length) {
            showError(`Some changes made offline were not saved:\n${[...new Set(rejected)].join('\n')}`, 'Sync failed');
        }
    })();
    return syncing;
}

/** Mounted once for the signed-in app: syncs at start and every time the connection comes back. */
export const useOfflineSync = () => {
    const isOnline = useNetworkStatus();
    useEffect(() => {
        if (isOnline) syncPendingMutations();
    }, [isOnline]);
};
