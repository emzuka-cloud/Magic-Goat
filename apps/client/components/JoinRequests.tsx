import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Check, X } from 'lucide-react-native';
import { API_URL, getAuthHeaders } from '../config';
import { showApiError, showError, NETWORK_ERROR } from '../utils/errors';

interface Props {
    kind: 'tournaments' | 'leagues';
    id: string;
    /** Called after an approval so the screen can reload its member list. */
    onApproved: () => void;
}

interface JoinRequest { id: string; user: { id: string; username: string } }

/** Owner-only: the code to share, and pending "let me in" requests to approve or decline. */
export function JoinRequests({ kind, id, onApproved }: Props) {
    const [requests, setRequests] = useState<JoinRequest[]>([]);

    const load = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/${kind}/${id}/join-requests`, { headers: await getAuthHeaders() });
            if (res.ok) setRequests(await res.json());
        } catch {
            // Offline: the section shows just the code.
        }
    }, [kind, id]);

    useEffect(() => { load(); }, [load]);

    const answer = async (requestId: string, decision: 'approve' | 'decline') => {
        try {
            const res = await fetch(`${API_URL}/${kind}/${id}/join-requests/${requestId}/${decision}`, { method: 'POST', headers: await getAuthHeaders() });
            if (!res.ok) await showApiError(res, 'Could not answer the request.');
            else if (decision === 'approve') onApproved();
        } catch {
            showError(NETWORK_ERROR);
        }
        load();
    };

    return (
        <View style={styles.section}>
            <Text style={styles.title}>Join code</Text>
            <Text style={styles.hint}>Share this code. People send a join request with it from the {kind} list.</Text>
            <Text style={styles.code} selectable>{id}</Text>

            {requests.length > 0 && <Text style={[styles.title, { marginTop: 20 }]}>Join requests ({requests.length})</Text>}
            {requests.map(r => (
                <View key={r.id} style={styles.row}>
                    <Text style={styles.name} numberOfLines={1}>{r.user.username}</Text>
                    <TouchableOpacity style={[styles.action, styles.approve]} onPress={() => answer(r.id, 'approve')} accessibilityLabel={`Approve ${r.user.username}`}>
                        <Check size={18} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.action, styles.decline]} onPress={() => answer(r.id, 'decline')} accessibilityLabel={`Decline ${r.user.username}`}>
                        <X size={18} color="#ef4444" />
                    </TouchableOpacity>
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    section: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#2e1065', marginBottom: 24 },
    title: { color: '#a855f7', fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
    hint: { color: '#aaa', fontSize: 13, marginBottom: 8 },
    code: { color: 'white', fontFamily: 'monospace', fontSize: 13, backgroundColor: '#0f0518', padding: 10, borderRadius: 8 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
    name: { color: 'white', fontSize: 15, flex: 1 },
    action: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    approve: { backgroundColor: '#16a34a' },
    decline: { borderWidth: 1, borderColor: '#ef4444' },
});
