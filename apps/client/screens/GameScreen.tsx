import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useGameEngine } from '../hooks/useGameEngine';
import { PlayerZone } from '../components/LifeCounter/PlayerZone';
import { Settings, RotateCcw } from 'lucide-react-native';

export const GameScreen = () => {
    const { players, modifyLife, resetGame, updatePlayerName, applyCommanderDamage, modifyPoison } = useGameEngine(4, 40);

    const getLayout = (index: number, total: number) => {
        // Simple grid logic for now. Can be enhanced for specific player counts.
        const isTwoPlayer = total === 2;
        const rotation = isTwoPlayer && index === 0 ? 180 : 0;
        return { rotation };
    };

    return (
        <View style={styles.container}>
            <View style={styles.grid}>
                {players.map((player, index) => {
                    const opponents = players.filter(p => p.id !== player.id);
                    return (
                        <View key={player.id} style={styles.playerWrapper}>
                            <PlayerZone
                                player={player}
                                opponents={opponents}
                                onModifyLife={(amount) => modifyLife(player.id, amount)}
                                onUpdateName={(name) => updatePlayerName(player.id, name)}
                                onApplyCommanderDamage={(attackerId, amount) => applyCommanderDamage(player.id, attackerId, amount)}
                                onModifyPoison={(amount) => modifyPoison(player.id, amount)}
                                rotation={getLayout(index, players.length).rotation}
                            />
                        </View>
                    );
                })}
            </View>

            <View style={styles.centerMenu}>
                <TouchableOpacity style={styles.menuButton} onPress={() => resetGame(4, 40)}>
                    <RotateCcw color="white" size={24} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuButton}>
                    <Settings color="white" size={24} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a1a',
    },
    grid: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    playerWrapper: {
        width: '50%', // Default to 2 columns
        height: '50%', // Default to 2 rows
    },
    centerMenu: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -50 }, { translateY: -50 }],
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderRadius: 20,
        padding: 10,
        gap: 15,
    },
    menuButton: {
        padding: 10,
    },
});
