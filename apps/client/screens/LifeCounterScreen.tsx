import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGameEngine } from '../hooks/useGameEngine';
import { PlayerZone } from '../components/LifeCounter/PlayerZone';
import { Settings, RotateCcw, Home } from 'lucide-react-native';
import { SettingsModal } from '../components/LifeCounter/SettingsModal';
import { layouts } from '../utils/layouts';
import { SafeAreaView } from 'react-native-safe-area-context';

export const LifeCounterScreen = () => {
    const [playerCount, setPlayerCount] = useState(4);
    const [startingLife, setStartingLife] = useState(40);
    const [showSettings, setShowSettings] = useState(false);
    const navigation = useNavigation();
    const { players, modifyLife, resetGame, updatePlayerName, applyCommanderDamage, modifyPoison } = useGameEngine(playerCount, startingLife);

    const applySettings = (newPlayerCount: number, newStartingLife: number) => {
        setPlayerCount(newPlayerCount);
        setStartingLife(newStartingLife);
        resetGame(newPlayerCount, newStartingLife);
        setShowSettings(false);
    };

    const renderPlayers = () => {
        const layoutConfig = layouts[playerCount];
        if (!layoutConfig) {
            return null;
        }

        const { styles: layoutStyles, players: playerLayouts, isColumnLayout } = layoutConfig;

        if (isColumnLayout) {
            const leftCount = 3;
            // rightCount is remainder, but for 5 and 6 players logic holds:
            // 5 players: 3 left, 2 right
            // 6 players: 3 left, 3 right

            const leftPlayers = players.slice(0, leftCount);
            const rightPlayers = players.slice(leftCount);

            return (
                <View style={styles.columnContainer}>
                    <View style={styles.column}>
                        {leftPlayers.map((player, index) => (
                            <View key={player.id} style={[styles.playerWrapper, { width: playerLayouts[index].width, height: playerLayouts[index].height }]}>
                                <PlayerZone
                                    player={player}
                                    opponents={players.filter(p => p.id !== player.id)}
                                    onModifyLife={(amount) => modifyLife(player.id, amount)}
                                    onUpdateName={(name) => updatePlayerName(player.id, name)}
                                    onApplyCommanderDamage={(attackerId, amount) => applyCommanderDamage(player.id, attackerId, amount)}
                                    onModifyPoison={(amount) => modifyPoison(player.id, amount)}
                                    rotation={playerLayouts[index].rotation}
                                />
                            </View>
                        ))}
                    </View>
                    <View style={styles.column}>
                        {rightPlayers.map((player, index) => (
                            <View key={player.id} style={[styles.playerWrapper, { width: playerLayouts[leftCount + index].width, height: playerLayouts[leftCount + index].height }]}>
                                <PlayerZone
                                    player={player}
                                    opponents={players.filter(p => p.id !== player.id)}
                                    onModifyLife={(amount) => modifyLife(player.id, amount)}
                                    onUpdateName={(name) => updatePlayerName(player.id, name)}
                                    onApplyCommanderDamage={(attackerId, amount) => applyCommanderDamage(player.id, attackerId, amount)}
                                    onModifyPoison={(amount) => modifyPoison(player.id, amount)}
                                    rotation={playerLayouts[leftCount + index].rotation}
                                />
                            </View>
                        ))}
                    </View>
                </View>
            );
        }

        return (
            <View style={[styles.grid, layoutStyles]}>
                {players.map((player, index) => (
                    <View
                        key={player.id}
                        style={[
                            styles.playerWrapper,
                            {
                                width: playerLayouts[index].width,
                                height: playerLayouts[index].height,
                            },
                        ]}
                    >
                        <PlayerZone
                            player={player}
                            opponents={players.filter(p => p.id !== player.id)}
                            onModifyLife={(amount) => modifyLife(player.id, amount)}
                            onUpdateName={(name) => updatePlayerName(player.id, name)}
                            onApplyCommanderDamage={(attackerId, amount) => applyCommanderDamage(player.id, attackerId, amount)}
                            onModifyPoison={(amount) => modifyPoison(player.id, amount)}
                            rotation={playerLayouts[index].rotation}
                        />
                    </View>
                ))}
            </View>
        );
    };

    const getCenterMenuStyle = () => {
        return {
            ...styles.centerMenu,
            flexDirection: (playerCount <= 3 ? 'row' : 'column') as 'row' | 'column',
        };
    };

    return (
        <View style={styles.container}>
            <StatusBar hidden />
            {renderPlayers()}

            <View style={styles.centerMenuWrapper} pointerEvents="box-none">
                <View style={getCenterMenuStyle()}>
                    <TouchableOpacity style={styles.menuButton} onPress={() => navigation.goBack()}>
                        <Home color="white" size={24} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuButton} onPress={() => resetGame(playerCount, startingLife)}>
                        <RotateCcw color="white" size={24} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuButton} onPress={() => setShowSettings(true)}>
                        <Settings color="white" size={24} />
                    </TouchableOpacity>
                </View>
            </View>

            <SettingsModal
                visible={showSettings}
                onClose={() => setShowSettings(false)}
                onApply={applySettings}
                initialPlayerCount={playerCount}
                initialStartingLife={startingLife}
            />
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
    },
    columnContainer: {
        flex: 1,
        flexDirection: 'row',
        width: '100%',
        height: '100%',
    },
    column: {
        flex: 1,
        height: '100%',
    },
    playerWrapper: {},
    centerMenuWrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    centerMenu: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderRadius: 20,
        padding: 10,
        gap: 15,
    },
    menuButton: {
        padding: 10,
    },
});
