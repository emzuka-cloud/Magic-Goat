import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { ChevronDown, ChevronUp, Check } from 'lucide-react-native';

export interface DropdownOption {
    label: string;
    value: string;
    hint?: string;
}

interface Props {
    options: DropdownOption[];
    value: string | null;
    onChange: (value: string) => void;
    placeholder: string;
    emptyText?: string;
}

// Inline (non-portal) dropdown: works the same on web and native, including inside Modals.
export function Dropdown({ options, value, onChange, placeholder, emptyText = 'Nothing to choose from yet' }: Props) {
    const [open, setOpen] = useState(false);
    const selected = options.find(o => o.value === value);
    const Chevron = open ? ChevronUp : ChevronDown;

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[styles.trigger, open && styles.triggerOpen]}
                onPress={() => setOpen(o => !o)}
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
                accessibilityLabel={selected ? `${placeholder}: ${selected.label}` : placeholder}
            >
                <Text style={[styles.triggerText, !selected && styles.placeholder]} numberOfLines={1}>
                    {selected ? selected.label : placeholder}
                </Text>
                <Chevron size={18} color="#a855f7" />
            </TouchableOpacity>

            {open && (
                <ScrollView style={styles.list} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                    {options.length === 0 ? (
                        <Text style={styles.empty}>{emptyText}</Text>
                    ) : options.map(o => (
                        <TouchableOpacity
                            key={o.value}
                            style={[styles.option, o.value === value && styles.optionSelected]}
                            onPress={() => { onChange(o.value); setOpen(false); }}
                            accessibilityRole="menuitem"
                        >
                            <View style={{ flex: 1 }}>
                                <Text style={styles.optionText} numberOfLines={1}>{o.label}</Text>
                                {o.hint ? <Text style={styles.hint} numberOfLines={1}>{o.hint}</Text> : null}
                            </View>
                            {o.value === value && <Check size={16} color="#a855f7" />}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { marginBottom: 12 },
    trigger: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#0f0518', borderWidth: 1, borderColor: '#2e1065', borderRadius: 8,
        paddingHorizontal: 12, minHeight: 44,
    },
    triggerOpen: { borderColor: '#a855f7' },
    triggerText: { color: 'white', fontSize: 15, flex: 1, marginRight: 8 },
    placeholder: { color: '#666' },
    list: { maxHeight: 220, marginTop: 4, backgroundColor: '#0f0518', borderWidth: 1, borderColor: '#2e1065', borderRadius: 8 },
    option: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, minHeight: 44, borderBottomWidth: 1, borderBottomColor: '#1a1a2e' },
    optionSelected: { backgroundColor: '#2e1065' },
    optionText: { color: 'white', fontSize: 15 },
    hint: { color: '#888', fontSize: 12, marginTop: 2 },
    empty: { color: '#888', padding: 12, fontSize: 14 },
});
