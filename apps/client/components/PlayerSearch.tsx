import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StyleProp, TextStyle } from 'react-native';
import { API_URL, getAuthHeaders } from '../config';

interface Props {
    value: string;
    onChange: (value: string) => void;
    inputStyle: StyleProp<TextStyle>;
    placeholder?: string;
}

interface Found { id: string; username: string; custom_id?: string }

/**
 * Text field for a username, email or U-ID that also suggests matching players from the whole app
 * (not just your play groups) as you type. Picking a suggestion fills in the username.
 */
export function PlayerSearch({ value, onChange, inputStyle, placeholder = 'Username, email or U-ID' }: Props) {
    const [results, setResults] = useState<Found[]>([]);
    const [picked, setPicked] = useState('');

    useEffect(() => {
        const q = value.trim();
        // Emails are matched only when added (never searched), and a just-picked name needs no suggestions.
        if (q.length < 2 || q.includes('@') || q === picked) {
            setResults([]);
            return;
        }
        let cancelled = false;
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`${API_URL}/users/search?q=${encodeURIComponent(q)}`, { headers: await getAuthHeaders() });
                if (!cancelled && res.ok) setResults(await res.json());
            } catch {
                // Offline: typing a username still works.
            }
        }, 250);
        return () => { cancelled = true; clearTimeout(timer); };
    }, [value, picked]);

    return (
        <View>
            <TextInput
                style={inputStyle}
                value={value}
                onChangeText={onChange}
                placeholder={placeholder}
                placeholderTextColor="#666"
                autoCapitalize="none"
                autoCorrect={false}
            />
            {results.length > 0 && (
                <View style={styles.list} accessibilityRole="menu">
                    {results.map(u => (
                        <TouchableOpacity
                            key={u.id}
                            style={styles.item}
                            accessibilityRole="menuitem"
                            onPress={() => { setPicked(u.username); onChange(u.username); }}
                        >
                            <Text style={styles.name} numberOfLines={1}>{u.username}</Text>
                            {u.custom_id && <Text style={styles.hint}>{u.custom_id}</Text>}
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    list: { marginTop: -16, marginBottom: 16, borderWidth: 1, borderColor: '#2e1065', borderRadius: 8, backgroundColor: '#0f0518', overflow: 'hidden' },
    item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#1a1a2e' },
    name: { color: 'white', fontSize: 15, flex: 1 },
    hint: { color: '#888', fontSize: 12, marginLeft: 8 },
});
