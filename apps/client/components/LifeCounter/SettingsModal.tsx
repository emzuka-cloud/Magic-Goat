import React, { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { X } from 'lucide-react-native';

interface SettingsModalProps {
    visible: boolean;
    onClose: () => void;
    onApply: (playerCount: number, startingLife: number) => void;
    initialPlayerCount: number;
    initialStartingLife: number;
}

export const SettingsModal = ({ visible, onClose, onApply, initialPlayerCount, initialStartingLife }: SettingsModalProps) => {
    const [playerCount, setPlayerCount] = useState(initialPlayerCount.toString());
    const [startingLife, setStartingLife] = useState(initialStartingLife.toString());

    useEffect(() => {
        setPlayerCount(initialPlayerCount.toString());
        setStartingLife(initialStartingLife.toString());
    }, [initialPlayerCount, initialStartingLife, visible]);

    const handleApply = () => {
        const count = parseInt(playerCount);
        const life = parseInt(startingLife);
        if (!isNaN(count) && !isNaN(life) && count >= 2 && count <= 6 && life > 0) {
            onApply(count, life);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Game Settings</Text>
                        <TouchableOpacity onPress={onClose}>
                            <X size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>Players (2-6)</Text>
                        <TextInput
                            style={styles.input}
                            value={playerCount}
                            onChangeText={setPlayerCount}
                            keyboardType="numeric"
                            maxLength={1}
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>Starting Life</Text>
                        <TextInput
                            style={styles.input}
                            value={startingLife}
                            onChangeText={setStartingLife}
                            keyboardType="numeric"
                            maxLength={3}
                        />
                    </View>

                    <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
                        <Text style={styles.buttonText}>Apply Changes</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        backgroundColor: '#2a2a2a',
        width: '80%',
        maxWidth: 400,
        padding: 24,
        borderRadius: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    field: {
        marginBottom: 20,
    },
    label: {
        color: '#999',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#1a1a1a',
        color: '#fff',
        padding: 12,
        borderRadius: 8,
        fontSize: 16,
    },
    applyButton: {
        backgroundColor: '#a855f7',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
