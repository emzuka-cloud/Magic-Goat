import { useEffect, useState } from 'react';
import { API_URL, getAuthHeaders } from '../config';
import { useAuth } from '../contexts/AuthContext';

/** Leagues the signed-in user owns: the ones a tournament can be put into. Silent on failure (picker just stays empty). */
export function useMyLeagues(enabled = true) {
    const { user } = useAuth();
    const [leagues, setLeagues] = useState<{ id: string; name: string }[]>([]);

    useEffect(() => {
        if (!enabled) return;
        (async () => {
            try {
                const res = await fetch(`${API_URL}/leagues`, { headers: await getAuthHeaders() });
                if (!res.ok) return;
                const all: { id: string; name: string; created_by?: { username: string } }[] = await res.json();
                setLeagues(all.filter(l => l.created_by?.username === user?.username));
            } catch {
                // Offline.
            }
        })();
    }, [enabled, user?.username]);

    return leagues;
}
