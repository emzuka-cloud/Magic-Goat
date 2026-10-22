import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, ActivityIndicator } from 'react-native';
import { LogIn } from 'lucide-react-native';
import { API_URL, getAuthHeaders } from '../config';
import { showApiError, showError, showMessage, NETWORK_ERROR } from '../utils/errors';
import { modalStyles } from '../utils/modalStyles';

interface Props {
    kind: 'tournaments' | 'leagues';
}

/** Header button + dialog: paste the code an owner shared, and ask them to let you in. */
export function JoinWithCode({ kind }: Props) {
    const noun = kind === 'tournaments' ? 'tournament' : 'league';
    const [visible, setVisible] = useState(false);
    const [code, setCode] = useState('');
    const [sending, setSending] = useState(false);

    const send = async () => {
        const id = code.trim();
        if (!id) return;
        setSending(true);
        try {
            const res = await fetch(`${API_URL}/${kind}/${encodeURIComponent(id)}/join`, { method: 'POST', headers: await getAuthHeaders() });
            if (res.ok) {
                const data = await res.json();
                const name = data.tournament?.name ?? data.league?.name ?? `the ${noun}`;
                setVisible(false);
                setCode('');
                showMessage('Request sent', `We asked the owner of "${name}" to let you in. You will get a notification when they answer.`);
            } else {
                await showApiError(res, `Could not send the request. Check the ${noun} code.`);
            }
        } catch {
            showError(NETWORK_ERROR);
        } finally {
            setSending(false);
        }
    };

    return (
        <>
            <TouchableOpacity style={styles.headerButton} onPress={() => setVisible(true)} accessibilityLabel={`Join a ${noun} with a code`}>
                <LogIn size={22} color="white" />
            </TouchableOpacity>
            <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
                <View style={modalStyles.overlay}>
                    <View style={modalStyles.card}>
                        <Text style={[modalStyles.title, { marginBottom: 8 }]}>Join a {noun}</Text>
                        <Text style={styles.hint}>Paste the code the owner shared with you. They approve your request.</Text>
                        <TextInput
                            style={styles.input}
                            value={code}
                            onChangeText={setCode}
                            placeholder={kind === 'tournaments' ? 'Tournament code' : 'League code'}
                            placeholderTextColor="#666"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <View style={styles.buttons}>
                            <TouchableOpacity onPress={() => setVisible(false)} style={styles.cancelButton}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={send} style={[styles.confirmButton, !code.trim() && { opacity: 0.5 }]} disabled={sending || !code.trim()}>
                                {sending ? <ActivityIndicator color="white" /> : <Text style={styles.confirmText}>Send request</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    headerButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#2e1065',
        justifyContent: 'center',
        alignItems: 'center',
    },
    hint: { color: '#aaa', fontSize: 14, marginBottom: 16 },
    input: { backgroundColor: '#0f0518', color: 'white', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#2e1065', marginBottom: 24 },
    buttons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
    cancelButton: { padding: 12 },
    cancelText: { color: '#666', fontWeight: 'bold' },
    confirmButton: { backgroundColor: '#a855f7', padding: 12, borderRadius: 8, paddingHorizontal: 24, minWidth: 120, alignItems: 'center' },
    confirmText: { color: 'white', fontWeight: 'bold' },
});
