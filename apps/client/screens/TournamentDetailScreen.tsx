import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput, ActivityIndicator, SafeAreaView, Platform, StatusBar, RefreshControl } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { API_URL, getAuthHeaders } from '../config';
import { showApiError, showError, NETWORK_ERROR } from '../utils/errors';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Users, Trophy, Trash2, Plus, Play, UserPlus, Shield } from 'lucide-react-native';
import { fetchAuthSession } from 'aws-amplify/auth';
import { Dropdown } from '../components/Dropdown';
import { useMyPlayGroups } from '../hooks/useMyPlayGroups';
import { useMyLeagues } from '../hooks/useMyLeagues';
import { modalStyles } from '../utils/modalStyles';
import { JoinRequests } from '../components/JoinRequests';

type TournamentDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'TournamentDetail'>;
type RouteParams = { id: string };

interface User {
    id: string;
    username: string;
}

interface Participant {
    id: string;
    user: User;
    score: number;
}

interface Pairing {
    id: string;
    round: number;
    order: number;
    player1: User | null;
    player2: User | null;
    player3: User | null;
    player4: User | null;
    result: string; // 'pending' | 'p1_win' etc or 'p1_p2'
}

interface Tournament {
    id: string;
    name: string;
    status: 'upcoming' | 'active' | 'completed';
    format: 'single_elimination' | 'commander';
    capacity: number;
    created_by: User;
    participants: Participant[];
    league?: { id: string; name: string } | null;
}

export const TournamentDetailScreen = () => {
    const navigation = useNavigation<TournamentDetailScreenNavigationProp>();
    const route = useRoute();
    const { id } = route.params as RouteParams;
    const { user } = useAuth();

    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [pairings, setPairings] = useState<Pairing[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Modals
    const [addUserModalVisible, setAddUserModalVisible] = useState(false);
    const [addGroupModalVisible, setAddGroupModalVisible] = useState(false);

    // Commander Result Modal
    const [resultModalVisible, setResultModalVisible] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState<Pairing | null>(null);
    const [selectedWinners, setSelectedWinners] = useState<string[]>([]); // "p1", "p2" etc

    const [identifier, setIdentifier] = useState('');
    const [groupId, setGroupId] = useState('');
    const { groups: myGroups, players: myPlayers } = useMyPlayGroups(addUserModalVisible || addGroupModalVisible);
    const [actionLoading, setActionLoading] = useState(false);

    const isOwner = tournament?.created_by.username === user?.username;
    const myLeagues = useMyLeagues(isOwner);

    const handleSetLeague = async (leagueId: string) => {
        try {
            const res = await fetch(`${API_URL}/tournaments/${id}/league`, {
                method: 'PUT',
                headers: await getAuthHeaders(),
                body: JSON.stringify({ leagueId: leagueId || null }),
            });
            if (res.ok) fetchData();
            else await showApiError(res, 'Could not change the league.');
        } catch {
            showError(NETWORK_ERROR);
        }
    };

    const fetchData = useCallback(async () => {
        try {
            const headers = await getAuthHeaders();
            const [tRes, pRes] = await Promise.all([
                fetch(`${API_URL}/tournaments/${id}`, { headers }),
                fetch(`${API_URL}/tournaments/${id}/pairings`, { headers })
            ]);

            if (tRes.ok) {
                const tData = await tRes.json();
                setTournament(tData);
            } else {
                await showApiError(tRes, 'Could not load this tournament.');
            }
            if (pRes.ok) {
                const pData = await pRes.json();
                setPairings(pData);
            }
        } catch (error) {
            showError(NETWORK_ERROR);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [id]);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleAddParticipant = async () => {
        if (!identifier.trim()) return;
        setActionLoading(true);
        try {
            const headers = await getAuthHeaders();
            const res = await fetch(`${API_URL}/tournaments/${id}/participants`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ username: identifier }) // Try username first as per common usage
            });

            if (res.ok) {
                setAddUserModalVisible(false);
                setIdentifier('');
                fetchData();
            } else {
                await showApiError(res, 'Could not add the player. Check the username, email or ID.');
            }
        } catch (e) {
            showError(NETWORK_ERROR);
        } finally {
            setActionLoading(false);
        }
    };

    const handleAddGroup = async () => {
        if (!groupId.trim()) return;
        setActionLoading(true);
        try {
            const headers = await getAuthHeaders();
            const res = await fetch(`${API_URL}/tournaments/${id}/groups`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ groupId })
            });

            if (res.ok) {
                setAddGroupModalVisible(false);
                setGroupId('');
                fetchData();
            } else {
                await showApiError(res, 'Could not add the play group.');
            }
        } catch (e) {
            showError(NETWORK_ERROR);
        } finally {
            setActionLoading(false);
        }
    };

    const handleRemoveParticipant = async (userId: string) => {
        if (Platform.OS === 'web') {
            if (!window.confirm('Remove this participant?')) return;
        } else {
            // Native alert logic if needed, but Alert.alert acts different. 
            // We'll proceed or wrap in promise for confirm.
        }

        try {
            const headers = await getAuthHeaders();
            const res = await fetch(`${API_URL}/tournaments/${id}/participants/${userId}`, {
                method: 'DELETE',
                headers
            });
            if (res.ok) {
                fetchData();
            } else {
                await showApiError(res, 'Could not remove the player.');
            }
        } catch (e) {
            showError(NETWORK_ERROR);
        }
    };

    const handleDeleteTournament = async () => {
        if (Platform.OS === 'web') {
            if (!window.confirm('Are you sure you want to delete this tournament? This cannot be undone.')) return;
        } else {
            // Native alert placeholder
        }

        try {
            const headers = await getAuthHeaders();
            const res = await fetch(`${API_URL}/tournaments/${id}`, {
                method: 'DELETE',
                headers
            });
            if (res.ok) {
                navigation.goBack();
            } else {
                await showApiError(res, 'Could not delete the tournament.');
            }
        } catch (e) {
            showError(NETWORK_ERROR);
        }
    };

    const handleLeaveTournament = async () => {
        const proceedWithLeaving = async () => {
            try {
                const headers = await getAuthHeaders();
                const session = await fetchAuthSession();
                const userId = session.tokens?.idToken?.payload?.sub;

                const res = await fetch(`${API_URL}/tournaments/${id}/leave`, {
                    method: 'POST',
                    headers,
                });
                if (res.ok) {
                    navigation.goBack();
                } else {
                    await showApiError(res, 'Could not leave the tournament.');
                }
            } catch (e) {
                showError(NETWORK_ERROR);
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm('Are you sure you want to leave this tournament?')) {
                await proceedWithLeaving();
            }
        } else {
            Alert.alert(
                'Leave Tournament',
                'Are you sure you want to leave?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Leave', style: 'destructive', onPress: proceedWithLeaving }
                ]
            );
        }
    };

    const handleStartTournament = async () => {
        try {
            const headers = await getAuthHeaders();
            const res = await fetch(`${API_URL}/tournaments/${id}/pairings/generate`, {
                method: 'POST',
                headers
            });
            if (res.ok) {
                fetchData();
            } else {
                await showApiError(res, 'Could not start the tournament.');
            }
        } catch (e) {
            showError(NETWORK_ERROR);
        }
    };

    const handleUpdateResult = async (pairingId: string, result: string) => {
        if (!isOwner) return;
        try {
            const headers = await getAuthHeaders();
            const res = await fetch(`${API_URL}/tournaments/${id}/pairings/${pairingId}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ result })
            });
            if (res.ok) {
                setResultModalVisible(false);
                setSelectedMatch(null);
                setSelectedWinners([]);
                fetchData();
            } else {
                await showApiError(res, 'Could not save the match result.');
            }
        } catch (e) {
            showError(NETWORK_ERROR);
        }
    };

    // Commander: the last round is the final (one winner); every other pod sends two players on.
    const lastRound = Math.max(0, ...pairings.map(p => p.round));
    const winnersNeeded = (p: Pairing | null) => (p && p.round === lastRound ? 1 : 2);
    const podPlayers = (p: Pairing) => [p.player1, p.player2, p.player3, p.player4].filter(Boolean).length;

    const openCommanderResultModal = (pairing: Pairing) => {
        // Pods with no more players than move on are decided automatically.
        if (!isOwner || podPlayers(pairing) <= winnersNeeded(pairing)) return;
        setSelectedMatch(pairing);
        setSelectedWinners([]);
        setResultModalVisible(true);
    };

    const toggleCommanderWinner = (pKey: string) => {
        if (selectedWinners.includes(pKey)) {
            setSelectedWinners(prev => prev.filter(k => k !== pKey));
        } else {
            if (selectedWinners.length < winnersNeeded(selectedMatch)) {
                setSelectedWinners(prev => [...prev, pKey]);
            }
        }
    };

    const submitCommanderResult = () => {
        if (!selectedMatch || selectedWinners.length !== winnersNeeded(selectedMatch)) return;
        // Seats in order: "p1_p3" for two players moving on, "p3_win" for the final's winner.
        const seats = [...selectedWinners].sort();
        handleUpdateResult(selectedMatch.id, seats.length === 1 ? `${seats[0]}_win` : seats.join('_'));
    };

    const renderLobby = () => (
        <View style={styles.section}>
            <View style={styles.participantsHeader}>
                <Text style={styles.sectionTitle}>Participants ({tournament?.participants.length}/{tournament?.capacity})</Text>
                {isOwner && (
                    <View style={styles.headerButtons}>
                        <TouchableOpacity style={styles.iconButton} onPress={() => setAddUserModalVisible(true)}>
                            <UserPlus size={20} color="#a855f7" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconButton} onPress={() => setAddGroupModalVisible(true)}>
                            <Users size={20} color="#a855f7" />
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {tournament?.participants.map(p => (
                <View key={p.id} style={styles.participantRow}>
                    <Text style={styles.participantName}>{p.user.username}</Text>
                    {isOwner && (
                        <TouchableOpacity onPress={() => handleRemoveParticipant(p.user.id)}>
                            <Trash2 size={20} color="#ef4444" />
                        </TouchableOpacity>
                    )}
                </View>
            ))}

            {isOwner && (
                <View style={styles.adminActions}>
                    <TouchableOpacity style={styles.startButton} onPress={handleStartTournament}>
                        <Play size={20} color="white" />
                        <Text style={styles.startButtonText}>Start Tournament</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    const renderBracket = () => {
        const rounds = new Map<number, Pairing[]>();
        pairings.forEach(p => {
            const list = rounds.get(p.round) || [];
            list.push(p);
            rounds.set(p.round, list);
        });

        const sortedRounds = Array.from(rounds.keys()).sort((a, b) => a - b);
        rounds.forEach(list => list.sort((a, b) => a.order - b.order));
        const isCommander = tournament?.format === 'commander';
        const final = rounds.get(sortedRounds[sortedRounds.length - 1])?.[0];
        const finalSeat = Number(final?.result.match(/^p([1-4])_win$/)?.[1] ?? 0);
        const champion = tournament?.status === 'completed' && final && finalSeat
            ? [final.player1, final.player2, final.player3, final.player4][finalSeat - 1]
            : null;

        return (
            <View style={styles.section}>
                {champion && (
                    <View style={styles.championCard} accessibilityRole="summary">
                        <Trophy size={36} color="#facc15" />
                        <View>
                            <Text style={styles.championLabel}>Champion</Text>
                            <Text style={styles.championName}>{champion.username}</Text>
                        </View>
                    </View>
                )}
                {sortedRounds.map(r => (
                    <View key={r} style={styles.roundContainer}>
                        <Text style={styles.roundTitle}>Round {r}</Text>
                        {rounds.get(r)?.map(p => {
                            if (isCommander) {
                                return (
                                    <View key={p.id} style={styles.matchCard}>
                                        <View style={styles.podHeader}>
                                            <Text style={styles.podTitle}>Pod {p.order + 1}</Text>
                                        </View>
                                        {[p.player1, p.player2, p.player3, p.player4].map((player, idx) => {
                                            const pKey = `p${idx + 1}`;
                                            const isSelected = p.result.includes(pKey); // Check historical result
                                            return (
                                                <TouchableOpacity
                                                    key={idx}
                                                    style={[styles.playerObj, isSelected && styles.winner]}
                                                    onPress={() => openCommanderResultModal(p)}
                                                >
                                                    <Text style={[styles.playerName, !player && { color: '#666' }]}>{player ? player.username : 'Empty seat'}</Text>
                                                </TouchableOpacity>
                                            )
                                        })}
                                    </View>
                                );
                            }
                            const canReport = isOwner && !!p.player1 && !!p.player2;
                            return (
                                <View key={p.id} style={styles.matchCard}>
                                    <View style={[styles.playerObj, p.result === 'p1_win' && styles.winner]}>
                                        <Text style={styles.playerName}>{p.player1 ? p.player1.username : 'BYE'}</Text>
                                    </View>
                                    <View style={styles.vsContainer}>
                                        <Text style={styles.vsText}>VS</Text>
                                    </View>
                                    <View style={[styles.playerObj, p.result === 'p2_win' && styles.winner]}>
                                        <Text style={styles.playerName}>{p.player2 ? p.player2.username : 'BYE'}</Text>
                                    </View>
                                    {canReport && (
                                        <View style={styles.reportRow}>
                                            <Dropdown
                                                placeholder="Report result"
                                                options={[
                                                    { label: `${p.player1!.username} wins`, value: 'p1_win' },
                                                    { label: `${p.player2!.username} wins`, value: 'p2_win' },
                                                ]}
                                                value={p.result === 'p1_win' || p.result === 'p2_win' ? p.result : null}
                                                onChange={result => handleUpdateResult(p.id, result)}
                                            />
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                ))}
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#a855f7" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0f0518" />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <ArrowLeft size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.title}>{tournament?.name}</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView
                    contentContainerStyle={styles.content}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#a855f7" />}
                >
                    <View style={styles.statusCard}>
                        <Trophy size={32} color="#facc15" />
                        <View style={styles.statusInfo}>
                            <Text style={styles.statusText}>Status: {tournament?.status.toUpperCase()}</Text>
                            <Text style={styles.formatText}>
                                {tournament?.capacity} Player {tournament?.format === 'commander' ? 'Commander' : 'Single Elimination'}
                            </Text>
                            {tournament?.league && (
                                <TouchableOpacity onPress={() => navigation.navigate('LeagueDetail', { id: tournament.league!.id })}>
                                    <Text style={styles.leagueLink}>League: {tournament.league.name}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {isOwner && tournament?.status === 'upcoming' && <JoinRequests kind="tournaments" id={id} onApproved={fetchData} />}

                    {tournament?.status === 'upcoming' ? renderLobby() : renderBracket()}

                    {/* Global Admin Actions */}
                    {isOwner && (
                        <View style={[styles.adminActions, { marginTop: 40, borderTopWidth: 1, borderTopColor: '#2e1065', paddingTop: 20 }]}>
                            {(myLeagues.length > 0 || tournament?.league) && (
                                <View>
                                    <Text style={styles.sectionTitle}>League</Text>
                                    <Dropdown
                                        placeholder="Not part of a league"
                                        options={[
                                            { label: 'Not part of a league', value: '' },
                                            ...myLeagues.map(l => ({ label: l.name, value: l.id, hint: 'Results count toward its standings' })),
                                        ]}
                                        value={tournament?.league?.id ?? ''}
                                        onChange={handleSetLeague}
                                    />
                                </View>
                            )}
                            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteTournament}>
                                <Trash2 size={20} color="#ef4444" />
                                <Text style={styles.deleteButtonText}>Delete Tournament</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Leave Tournament button for non-owners */}
                    {!isOwner && (
                        <View style={[styles.adminActions, { marginTop: 40, borderTopWidth: 1, borderTopColor: '#2e1065', paddingTop: 20 }]}>
                            <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveTournament}>
                                <Trash2 size={20} color="#f59e0b" />
                                <Text style={styles.leaveButtonText}>Leave Tournament</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>

                {/* Add User Modal */}
                <Modal visible={addUserModalVisible} transparent animationType="slide" onRequestClose={() => setAddUserModalVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Add Participant</Text>
                            <Dropdown
                                placeholder="Pick a player from your play groups"
                                emptyText="No other players in your play groups yet. Type a name below."
                                options={myPlayers
                                    .filter(m => !tournament?.participants.some(p => p.user?.id === m.id))
                                    .map(m => ({ label: m.username, value: m.username, hint: m.custom_id }))}
                                value={identifier || null}
                                onChange={setIdentifier}
                            />
                            <Text style={styles.orText}>or type a username, email or user ID</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Username, email or U-ID"
                                placeholderTextColor="#666"
                                value={identifier}
                                onChangeText={setIdentifier}
                            />
                            <View style={styles.modalButtons}>
                                <TouchableOpacity onPress={() => setAddUserModalVisible(false)} style={styles.cancelButton}>
                                    <Text style={styles.cancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleAddParticipant} style={styles.confirmButton}>
                                    <Text style={styles.confirmText}>Add</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Add Group Modal */}
                <Modal visible={addGroupModalVisible} transparent animationType="slide" onRequestClose={() => setAddGroupModalVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Add Play Group</Text>
                            <Dropdown
                                placeholder="Choose one of your play groups"
                                emptyText="You don't have any play groups yet."
                                options={myGroups.map(g => ({ label: g.name, value: g.id, hint: `${g.members?.length ?? 0} members` }))}
                                value={groupId || null}
                                onChange={setGroupId}
                            />
                            <View style={styles.modalButtons}>
                                <TouchableOpacity onPress={() => setAddGroupModalVisible(false)} style={styles.cancelButton}>
                                    <Text style={styles.cancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleAddGroup} style={styles.confirmButton}>
                                    <Text style={styles.confirmText}>Add Group</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Commander Result Modal */}
                <Modal visible={resultModalVisible} transparent animationType="slide" onRequestClose={() => setResultModalVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>
                                {winnersNeeded(selectedMatch) === 1 ? 'Pick the winner of the final' : 'Pick the 2 players moving on'}
                            </Text>
                            {selectedMatch && [selectedMatch.player1, selectedMatch.player2, selectedMatch.player3, selectedMatch.player4].map((player, idx) => {
                                const pKey = `p${idx + 1}`;
                                const isSelected = selectedWinners.includes(pKey);
                                return (
                                    <TouchableOpacity
                                        key={idx}
                                        style={[styles.participantRow, isSelected && styles.winner, !player && { opacity: 0.4 }]}
                                        onPress={() => player && toggleCommanderWinner(pKey)}
                                        disabled={!player}
                                    >
                                        <Text style={styles.participantName}>{player ? player.username : 'Empty seat'}</Text>
                                        {isSelected && <Trophy size={20} color="#facc15" />}
                                    </TouchableOpacity>
                                )
                            })}
                            <View style={[styles.modalButtons, { marginTop: 24 }]}>
                                <TouchableOpacity onPress={() => setResultModalVisible(false)} style={styles.cancelButton}>
                                    <Text style={styles.cancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={submitCommanderResult}
                                    style={[styles.confirmButton, selectedWinners.length !== winnersNeeded(selectedMatch) && { opacity: 0.5 }]}
                                    disabled={selectedWinners.length !== winnersNeeded(selectedMatch)}
                                >
                                    <Text style={styles.confirmText}>Confirm</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f0518' },
    safeArea: { flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0518' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
    title: { color: 'white', fontSize: 20, fontWeight: 'bold' },
    content: { padding: 20 },
    statusCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', padding: 16, borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: '#2e1065' },
    statusInfo: { marginLeft: 16 },
    statusText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    formatText: { color: '#888', fontSize: 14 },
    section: { marginBottom: 24 },
    sectionTitle: { color: '#a855f7', fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
    participantsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    headerButtons: { flexDirection: 'row', gap: 12 },
    iconButton: { padding: 8, backgroundColor: '#2e1065', borderRadius: 8 },
    participantRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1a1a2e', padding: 16, borderRadius: 8, marginBottom: 8 },
    participantName: { color: 'white', fontSize: 16 },
    adminActions: { marginTop: 32, gap: 16 },
    startButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#22c55e', padding: 16, borderRadius: 12, gap: 8 },
    startButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', padding: 16, borderRadius: 12, gap: 8, borderWidth: 1, borderColor: '#ef4444' },
    deleteButtonText: { color: '#ef4444', fontWeight: 'bold', fontSize: 16 },
    leaveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', padding: 16, borderRadius: 12, gap: 8, borderWidth: 1, borderColor: '#f59e0b' },
    leaveButtonText: { color: '#f59e0b', fontWeight: 'bold', fontSize: 16 },
    roundContainer: { marginBottom: 24 },
    roundTitle: { color: '#a855f7', fontSize: 16, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
    matchCard: { backgroundColor: '#1a1a2e', borderRadius: 12, overflow: 'hidden', marginBottom: 12, borderWidth: 1, borderColor: '#2e1065' },
    playerObj: { padding: 12, alignItems: 'center' },
    winner: { backgroundColor: 'rgba(34, 197, 94, 0.2)' },
    playerName: { color: 'white', fontWeight: 'bold' },
    vsContainer: { backgroundColor: '#0f0518', padding: 4, alignItems: 'center' },
    vsText: { color: '#666', fontSize: 10, fontWeight: 'bold' },
    podHeader: { backgroundColor: '#2e1065', padding: 8, alignItems: 'center' },
    podTitle: { color: '#a855f7', fontWeight: 'bold', fontSize: 12 },
    leagueLink: { color: '#a855f7', fontSize: 14, marginTop: 4 },
    modalOverlay: modalStyles.overlay,
    modalContent: modalStyles.card,
    modalTitle: { ...modalStyles.title, marginBottom: 24 },
    orText: { color: '#888', fontSize: 12, marginBottom: 8 },
    reportRow: { paddingHorizontal: 12, paddingTop: 12 },
    championCard: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: '#422006', borderColor: '#facc15', borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 24 },
    championLabel: { color: '#facc15', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
    championName: { color: 'white', fontSize: 22, fontWeight: 'bold' },
    input: { backgroundColor: '#0f0518', color: 'white', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#2e1065', marginBottom: 24 },
    modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
    cancelButton: { padding: 12 },
    cancelText: { color: '#666', fontWeight: 'bold' },
    confirmButton: { backgroundColor: '#a855f7', padding: 12, borderRadius: 8, paddingHorizontal: 24 },
    confirmText: { color: 'white', fontWeight: 'bold' }
});
