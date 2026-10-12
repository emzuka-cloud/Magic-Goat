import { useCallback, useEffect, useState } from 'react';
import { API_URL, getAuthHeaders } from '../config';

interface Member { id: string; username: string; custom_id?: string }
interface Group { id: string; name: string; members: Member[] }

/**
 * The caller's play groups, plus everyone in them, as pick-lists for "add player/group" dialogs.
 * Failures are silent on purpose: the dialogs still accept a typed username/ID.
 */
export function useMyPlayGroups(enabled = true) {
    const [groups, setGroups] = useState<Group[]>([]);

    const load = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/playgroups/user/me`, { headers: await getAuthHeaders() });
            if (res.ok) setGroups(await res.json());
        } catch {
            // Offline: dropdowns show their empty state.
        }
    }, []);

    useEffect(() => { if (enabled) load(); }, [enabled, load]);

    const players = [...new Map(groups.flatMap(g => g.members ?? []).map(m => [m.id, m])).values()]
        .sort((a, b) => a.username.localeCompare(b.username));

    return { groups, players, reload: load };
}
