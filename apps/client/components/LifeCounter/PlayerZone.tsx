import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal } from 'react-native';
import { Player } from '../../hooks/useGameEngine';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Shield, X, Check, Edit2, Skull, Plus, Minus } from 'lucide-react-native';
import { AnimatedBackground } from './AnimatedBackground';

interface PlayerZoneProps {
    player: Player;
    opponents: Player[];
    onModifyLife: (amount: number) => void;
    onUpdateName: (name: string) => void;
    onApplyCommanderDamage: (attackerId: number, amount: number) => void;
    onModifyPoison: (amount: number) => void;
    rotation?: number;
}

export const PlayerZone: React.FC<PlayerZoneProps> = ({
    player,
    opponents,
    onModifyLife,
    onUpdateName,
    onApplyCommanderDamage,
    onModifyPoison,
    rotation = 0
}) => {
    const scale = useSharedValue(1);
    const [mode, setMode] = useState<'normal' | 'counters' | 'editName'>('normal');
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [tempName, setTempName] = useState(player.name);

    const tapGesture = Gesture.Tap()
        .onBegin(() => {
            scale.value = 0.95;
        })
        .onFinalize(() => {
            scale.value = withSpring(1);
        });

    const isRotated = Math.abs(rotation) === 90 || Math.abs(rotation) === 270;

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }, { rotate: `${rotation}deg` }],
        width: isRotated && dimensions.height ? dimensions.height : '100%',
        height: isRotated && dimensions.width ? dimensions.width : '100%',
    }));

    const handleNameSave = () => {
        if (tempName.trim()) {
            onUpdateName(tempName.trim());
        }
        setMode('normal');
    };

    const renderNormalMode = () => (
        <View style={styles.lifeContainer}>
            <TouchableOpacity
                style={styles.touchArea}
                onPress={() => onModifyLife(-1)}
                onLongPress={() => onModifyLife(-10)}
            >
                <Text style={styles.controlText}>-</Text>
            </TouchableOpacity>

            <View style={styles.info}>
                <Text style={styles.lifeText}>{player.life}</Text>
                <TouchableOpacity onPress={() => {
                    setTempName(player.name);
                    setMode('editName');
                }}>
                    <Text style={styles.nameText}>{player.name} <Edit2 size={14} color="rgba(255,255,255,0.5)" /></Text>
                </TouchableOpacity>

                {/* Status Pills (Commander Damage & Poison) */}
                <View style={styles.statusRow}>
                    {/* Poison Pill */}
                    {player.poison > 0 && (
                        <View style={[styles.statusPill, { borderColor: '#10b981' }]}>
                            <Skull size={10} color="#10b981" />
                            <Text style={[styles.statusPillText, { color: '#10b981' }]}>{player.poison}</Text>
                        </View>
                    )}

                    {/* Commander Damage Pills */}
                    {Object.entries(player.commanderDamage).map(([attackerId, damage]) => {
                        if (damage === 0) return null;
                        const attacker = opponents.find(p => p.id === parseInt(attackerId));
                        if (!attacker) return null;
                        return (
                            <View key={attackerId} style={[styles.statusPill, { borderColor: attacker.color }]}>
                                <Shield size={10} color={attacker.color} />
                                <Text style={[styles.statusPillText, { color: attacker.color }]}>{damage}</Text>
                            </View>
                        );
                    })}
                </View>
            </View>

            <TouchableOpacity
                style={styles.touchArea}
                onPress={() => onModifyLife(1)}
                onLongPress={() => onModifyLife(10)}
            >
                <Text style={styles.controlText}>+</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.commanderButton} onPress={() => setMode('counters')}>
                <Shield size={24} color="rgba(255,255,255,0.3)" />
            </TouchableOpacity>
        </View>
    );

    const renderCounterCell = (
        icon: React.ReactNode,
        value: number,
        color: string,
        onDecrement: () => void,
        onIncrement: () => void
    ) => (
        <View style={[styles.counterCell, { borderColor: color }]}>
            <View style={styles.counterIconContainer}>
                {icon}
            </View>
            <Text style={[styles.counterCellValue, { color }]}>{value}</Text>

            {/* Split Touch Areas */}
            <TouchableOpacity style={styles.cellTouchLeft} onPress={onDecrement}>
                <Minus size={16} color="rgba(255,255,255,0.3)" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.cellTouchRight} onPress={onIncrement}>
                <Plus size={16} color="rgba(255,255,255,0.3)" />
            </TouchableOpacity>
        </View>
    );

    const renderCountersMode = () => (
        <Modal visible={mode === 'counters'} transparent animationType="fade" onRequestClose={() => setMode('normal')}>
            <View style={styles.modalBackdrop}>
                <TouchableOpacity
                    style={styles.backdropTouchable}
                    activeOpacity={1}
                    onPress={() => setMode('normal')}
                />
                <View style={styles.modalContent}>
                    <View style={styles.overlayHeader}>
                        <Text style={styles.overlayTitle}>Counters & Damage</Text>
                        <TouchableOpacity onPress={() => setMode('normal')}>
                            <X size={24} color="white" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.countersGrid}>
                        {/* Infect Cell */}
                        {renderCounterCell(
                            <Skull size={32} color="#10b981" />,
                            player.poison,
                            "#10b981",
                            () => onModifyPoison(-1),
                            () => onModifyPoison(1)
                        )}

                        {/* Commander Damage Cells */}
                        {opponents.map(opponent => (
                            <React.Fragment key={opponent.id}>
                                {renderCounterCell(
                                    <Shield size={32} color={opponent.color} />,
                                    player.commanderDamage[opponent.id] || 0,
                                    opponent.color,
                                    () => onApplyCommanderDamage(opponent.id, -1),
                                    () => onApplyCommanderDamage(opponent.id, 1)
                                )}
                            </React.Fragment>
                        ))}
                    </View>
                </View>
            </View>
        </Modal>
    );

    const renderEditNameMode = () => (
        <Modal visible={mode === 'editName'} transparent animationType="fade" onRequestClose={() => setMode('normal')}>
            <View style={styles.modalBackdrop}>
                <TouchableOpacity
                    style={styles.backdropTouchable}
                    activeOpacity={1}
                    onPress={() => setMode('normal')}
                />
                <View style={styles.modalContent}>
                    <Text style={styles.overlayTitle}>Edit Name</Text>
                    <TextInput
                        style={styles.nameInput}
                        value={tempName}
                        onChangeText={setTempName}
                        placeholder="Enter Name"
                        placeholderTextColor="#666"
                        autoFocus
                    />
                    <View style={styles.editActions}>
                        <TouchableOpacity style={styles.actionButton} onPress={() => setMode('normal')}>
                            <X size={24} color="#ef4444" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton} onPress={handleNameSave}>
                            <Check size={24} color="#22c55e" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    return (
        <View
            style={[styles.container, { backgroundColor: player.color }]}
            onLayout={(event) => {
                const { width, height } = event.nativeEvent.layout;
                setDimensions({ width, height });
            }}
        >
            <AnimatedBackground color={player.color} />
            <GestureDetector gesture={tapGesture}>
                <Animated.View style={[styles.content, animatedStyle]}>
                    {renderNormalMode()}
                </Animated.View>
            </GestureDetector>
            {renderCountersMode()}
            {renderEditNameMode()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    content: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    lifeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
    },
    touchArea: {
        width: '30%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    info: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    lifeText: {
        fontSize: 100,
        fontWeight: '900',
        color: 'white',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 10,
        includeFontPadding: false,
    },
    nameText: {
        fontSize: 20,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.9)',
        marginTop: -10,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 5,
        flexDirection: 'row',
        alignItems: 'center',
    },
    controlText: {
        fontSize: 60,
        fontWeight: '300',
        color: 'rgba(255,255,255,0.3)',
    },
    commanderButton: {
        position: 'absolute',
        bottom: 20,
        alignSelf: 'center',
        padding: 10,
        zIndex: 20,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backdropTouchable: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    modalContent: {
        width: '90%',
        maxWidth: 600,
        maxHeight: '80%',
        backgroundColor: 'rgba(0,0,0,0.95)',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
    },
    overlayHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 20,
    },
    overlayTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    countersGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 15,
        width: '100%',
    },
    counterCell: {
        width: '45%',
        aspectRatio: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
        borderWidth: 2,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    counterIconContainer: {
        marginBottom: 5,
    },
    counterCellValue: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    cellTouchLeft: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: '50%',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingLeft: 10,
    },
    cellTouchRight: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: '50%',
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingRight: 10,
    },
    nameInput: {
        backgroundColor: 'white',
        width: '100%',
        padding: 15,
        borderRadius: 10,
        fontSize: 18,
        marginBottom: 20,
        textAlign: 'center',
    },
    editActions: {
        flexDirection: 'row',
        gap: 20,
    },
    actionButton: {
        padding: 15,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 50,
    },
    statusRow: {
        flexDirection: 'row',
        gap: 5,
        marginTop: 5,
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    statusPillText: {
        fontSize: 10,
        fontWeight: 'bold',
    }
});
