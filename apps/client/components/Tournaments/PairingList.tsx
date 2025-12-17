import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface Pairing {
    id: string;
    round: number;
    player1: { username: string };
    player2: { username: string };
    result: string;
}

interface PairingListProps {
    pairings: Pairing[];
    onReportResult: (pairingId: string, result: string) => void;
}

export const PairingList: React.FC<PairingListProps> = ({ pairings, onReportResult }) => {
    return (
        <View style={styles.container}>
            {pairings.map((pairing) => (
                <View key={pairing.id} style={styles.pairingItem}>
                    <View style={styles.matchup}>
                        <Text style={styles.playerText}>{pairing.player1?.username || 'Bye'}</Text>
                        <Text style={styles.vsText}>vs</Text>
                        <Text style={styles.playerText}>{pairing.player2?.username || 'Bye'}</Text>
                    </View>
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.button, pairing.result === 'p1_win' && styles.selected]}
                            onPress={() => onReportResult(pairing.id, 'p1_win')}
                        >
                            <Text style={styles.buttonText}>P1 Win</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, pairing.result === 'draw' && styles.selected]}
                            onPress={() => onReportResult(pairing.id, 'draw')}
                        >
                            <Text style={styles.buttonText}>Draw</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, pairing.result === 'p2_win' && styles.selected]}
                            onPress={() => onReportResult(pairing.id, 'p2_win')}
                        >
                            <Text style={styles.buttonText}>P2 Win</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 10,
    },
    pairingItem: {
        backgroundColor: '#333',
        marginBottom: 10,
        padding: 15,
        borderRadius: 8,
    },
    matchup: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    playerText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
    },
    vsText: {
        color: '#aaa',
        marginHorizontal: 10,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    button: {
        backgroundColor: '#444',
        padding: 8,
        borderRadius: 5,
        minWidth: 70,
        alignItems: 'center',
    },
    selected: {
        backgroundColor: '#3b82f6',
    },
    buttonText: {
        color: 'white',
        fontSize: 12,
    },
});
