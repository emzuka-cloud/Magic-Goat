import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Platform, StatusBar, TextInput, Alert, Modal, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fetchAuthSession } from 'aws-amplify/auth';
import { RootStackParamList } from '../types';
import { API_URL } from '../config';
import { showApiError, showError, NETWORK_ERROR } from '../utils/errors';
import { startLabel } from '../utils/dates';
import { useAuth, getAuthToken } from '../contexts/AuthContext';
import { ArrowLeft, Users, UserPlus, Trash2, X, Edit2, Trophy, Plus } from 'lucide-react-native';
import { Dropdown } from '../components/Dropdown';
import { useMyPlayGroups } from '../hooks/useMyPlayGroups';
import { modalStyles } from '../utils/modalStyles';
import { JoinRequests } from '../components/JoinRequests';

type LeagueDetailRouteProp = RouteProp<RootStackParamList, 'LeagueDetail'>;
type LeagueDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'LeagueDetail'>;

interface Standing {
    id: string;
    user: { username: string; id: string };
    points: number;
    matches_played: number;
    matches_won: number;
    matches_drawn: number;
    matches_lost: number;
    omw_percentage: number;
    // Owner's manual corrections on top of tournament results.
    adj_points: number;
    adj_matches_played: number;
    adj_matches_won: number;
    adj_matches_drawn: number;
    adj_matches_lost: number;
}

const isAdjusted = (s: Standing) =>
    !!(s.adj_points || s.adj_matches_played || s.adj_matches_won || s.adj_matches_drawn || s.adj_matches_lost);

interface LeagueDetail {
    id: string;
    name: string;
    description?: string;
    start_date: string;
    created_by: { id: string; username: string };
    tournaments?: { id: string; name: string; status: string; format: string }[];
}

export const LeagueDetailScreen = () => {
    const route = useRoute<LeagueDetailRouteProp>();
    const navigation = useNavigation<LeagueDetailNavigationProp>();
    const { id } = route.params;
    const { user } = useAuth();

    const [league, setLeague] = useState<LeagueDetail | null>(null);
    const [standings, setStandings] = useState<Standing[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [addMemberModalVisible, setAddMemberModalVisible] = useState(false);
    const [editStandingModalVisible, setEditStandingModalVisible] = useState(false);
    const [newMemberId, setNewMemberId] = useState('');
    const { players: myPlayers } = useMyPlayGroups(addMemberModalVisible);
    const [addingMember, setAddingMember] = useState(false);
    const [editingStanding, setEditingStanding] = useState(false);

    // Edit standing state
    const [editingUser, setEditingUser] = useState<Standing | null>(null);
    const [editPoints, setEditPoints] = useState('');
    const [editMatchesPlayed, setEditMatchesPlayed] = useState('');
    const [editMatchesWon, setEditMatchesWon] = useState('');
    const [editMatchesDrawn, setEditMatchesDrawn] = useState('');
    const [editMatchesLost, setEditMatchesLost] = useState('');

    const isOwner = league?.created_by?.username === user?.username;

    const fetchLeagueDetails = async () => {
        try {
            const token = await getAuthToken();
            if (!token) return;

            const [leagueResponse, standingsResponse] = await Promise.all([
                fetch(`${API_URL}/leagues/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                }),
                fetch(`${API_URL}/leagues/${id}/standings`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                })
            ]);

            if (leagueResponse.ok) {
                const leagueData = await leagueResponse.json();
                setLeague(leagueData);
            } else {
                await showApiError(leagueResponse, 'Could not load this league.');
            }

            if (standingsResponse.ok) {
                const standingsData = await standingsResponse.json();
                setStandings(standingsData);
            }
        } catch (error) {
            showError(NETWORK_ERROR);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchLeagueDetails();
    }, [id]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchLeagueDetails();
    };

    const handleAddMember = async () => {
        if (!newMemberId.trim()) return;

        setAddingMember(true);
        try {
            const token = await getAuthToken();
            if (!token) return;

            const response = await fetch(`${API_URL}/leagues/${id}/members`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username: newMemberId }),
            });

            if (response.ok) {
                setNewMemberId('');
                setAddMemberModalVisible(false);
                fetchLeagueDetails();
            } else {
                await showApiError(response, 'Could not add the member. Check the username, email or ID.');
            }
        } catch (error) {
            showError(NETWORK_ERROR);
        } finally {
            setAddingMember(false);
        }
    };

    const openEditStanding = (standing: Standing) => {
        setEditingUser(standing);
        setEditPoints(standing.points.toString());
        setEditMatchesPlayed(standing.matches_played.toString());
        setEditMatchesWon(standing.matches_won.toString());
        setEditMatchesDrawn(standing.matches_drawn.toString());
        setEditMatchesLost(standing.matches_lost.toString());
        setEditStandingModalVisible(true);
    };

    const handleUpdateStanding = async () => {
        if (!editingUser) return;

        setEditingStanding(true);
        try {
            const token = await getAuthToken();
            if (!token) return;

            const response = await fetch(`${API_URL}/leagues/${id}/standings/${editingUser.user.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                // Only send what the owner changed; untouched stats keep following tournament results.
                body: JSON.stringify(Object.fromEntries(Object.entries({
                    points: editPoints,
                    matches_played: editMatchesPlayed,
                    matches_won: editMatchesWon,
                    matches_drawn: editMatchesDrawn,
                    matches_lost: editMatchesLost,
                }).map(([k, v]) => [k, parseInt(v) || 0])
                  .filter(([k, v]) => v !== editingUser[k as keyof Standing]))),
            });

            if (response.ok) {
                setEditStandingModalVisible(false);
                fetchLeagueDetails();
            } else {
                await showApiError(response, 'Could not update the standing.');
            }
        } catch (error) {
            showError(NETWORK_ERROR);
        } finally {
            setEditingStanding(false);
        }
    };

    const handleUseResultsOnly = async () => {
        if (!editingUser) return;
        setEditingStanding(true);
        try {
            const token = await getAuthToken();
            if (!token) return;
            const response = await fetch(`${API_URL}/leagues/${id}/standings/${editingUser.user.id}/adjustments`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                setEditStandingModalVisible(false);
                fetchLeagueDetails();
            } else {
                await showApiError(response, 'Could not reset the standing.');
            }
        } catch (error) {
            showError(NETWORK_ERROR);
        } finally {
            setEditingStanding(false);
        }
    };

    const handleRemoveMember = async (memberId: string, username: string) => {
        const proceedWithRemoval = async () => {
            try {
                const token = await getAuthToken();
                if (!token) return;

                const response = await fetch(`${API_URL}/leagues/${id}/members/${memberId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                if (response.ok) {
                    fetchLeagueDetails();
                } else {
                    await showApiError(response, 'Could not remove the member.');
                }
            } catch (e) {
                showError(NETWORK_ERROR);
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm(`Remove ${username} from this league?`)) {
                await proceedWithRemoval();
            }
        } else {
            Alert.alert(
                'Remove Member',
                `Remove ${username} from this league?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Remove', style: 'destructive', onPress: proceedWithRemoval }
                ]
            );
        }
    };

    const handleDeleteLeague = () => {
        const proceedWithDeletion = async () => {
            try {
                const token = await getAuthToken();
                if (!token) return;

                const response = await fetch(`${API_URL}/leagues/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                if (response.ok) {
                    navigation.goBack();
                } else {
                    await showApiError(response, 'Could not delete the league.');
                }
            } catch (e) {
                showError(NETWORK_ERROR);
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm('Are you sure you want to delete this league? This action cannot be undone.')) {
                proceedWithDeletion();
            }
        } else {
            Alert.alert(
                'Delete League',
                'Are you sure? This action cannot be undone.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: proceedWithDeletion }
                ]
            );
        }
    };

    const handleLeaveLeague = async () => {
        const proceedWithLeaving = async () => {
            try {
                const token = await getAuthToken();
                const session = await fetchAuthSession();
                const userId = session.tokens?.idToken?.payload?.sub;

                if (!token || !userId) return;

                const response = await fetch(`${API_URL}/leagues/${id}/leave`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    navigation.goBack();
                } else {
                    await showApiError(response, 'Could not leave the league.');
                }
            } catch (e) {
                showError(NETWORK_ERROR);
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm('Are you sure you want to leave this league?')) {
                proceedWithLeaving();
            }
        } else {
            Alert.alert(
                'Leave League',
                'Are you sure you want to leave this league?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Leave', style: 'destructive', onPress: proceedWithLeaving }
                ]
            );
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <ArrowLeft size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#a855f7" />
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    if (!league) {
        return (
            <View style={styles.container}>
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <ArrowLeft size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.loadingContainer}>
                        <Text style={styles.errorText}>League not found</Text>
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0f0518" />
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <ArrowLeft size={24} color="white" />
                        </TouchableOpacity>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.headerTitle}>{league.name}</Text>
                            <Text style={styles.headerSubtitle}>{startLabel(league.start_date)}</Text>
                        </View>
                    </View>
                </View>

                <ScrollView
                    style={styles.content}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#a855f7" />
                    }
                >
                    {/* Description */}
                    {league.description && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>About</Text>
                            <Text style={styles.description}>{league.description}</Text>
                        </View>
                    )}

                    {/* Standings */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Standings</Text>
                        {standings.length === 0 ? (
                            <Text style={styles.emptyText}>No standings available yet.</Text>
                        ) : (
                            <View style={styles.table}>
                                <View style={styles.tableHeader}>
                                    <Text style={[styles.tableHeaderText, styles.colRank]}>#</Text>
                                    <Text style={[styles.tableHeaderText, styles.colPlayer]}>Player</Text>
                                    <Text style={[styles.tableHeaderText, styles.colPoints]}>Pts</Text>
                                    <Text style={[styles.tableHeaderText, styles.colOMW]}>OMW%</Text>
                                    <Text style={[styles.tableHeaderText, styles.colRecord]}>W-D-L</Text>
                                    {isOwner && <Text style={[styles.tableHeaderText, styles.colActions]}>Actions</Text>}
                                </View>
                                {standings.map((s, index) => (
                                    <View key={s.id} style={styles.tableRow}>
                                        <Text style={[styles.tableCell, styles.colRank]}>{index + 1}</Text>
                                        <Text style={[styles.tableCell, styles.colPlayer]} numberOfLines={1}>
                                            {s.user.username}
                                            {isAdjusted(s) && <Text style={styles.editedTag}> · edited</Text>}
                                        </Text>
                                        <Text style={[styles.tableCell, styles.colPoints]}>{s.points}</Text>
                                        <Text style={[styles.tableCell, styles.colOMW]}>{(s.omw_percentage * 100).toFixed(1)}%</Text>
                                        <Text style={[styles.tableCell, styles.colRecord]}>
                                            {s.matches_won}-{s.matches_drawn}-{s.matches_lost}
                                        </Text>
                                        {isOwner && (
                                            <View style={[styles.colActions, { flexDirection: 'row', gap: 8 }]}>
                                                <TouchableOpacity onPress={() => openEditStanding(s)} accessibilityLabel={`Edit standing for ${s.user.username}`}>
                                                    <Edit2 size={16} color="#a855f7" />
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={() => handleRemoveMember(s.user.id, s.user.username)} accessibilityLabel={`Remove ${s.user.username}`}>
                                                    <Trash2 size={16} color="#ef4444" />
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Tournaments that count toward the standings */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Tournaments</Text>
                        {league.tournaments?.length ? league.tournaments.map(t => (
                            <TouchableOpacity key={t.id} style={styles.tournamentRow} onPress={() => navigation.navigate('TournamentDetail', { id: t.id })}>
                                <Trophy size={16} color="#a855f7" />
                                <Text style={styles.tournamentName} numberOfLines={1}>{t.name}</Text>
                                <Text style={styles.tournamentStatus}>{t.status}</Text>
                            </TouchableOpacity>
                        )) : (
                            <Text style={styles.emptyText}>No tournaments yet. Their results will count toward the standings.</Text>
                        )}
                    </View>

                    {/* Admin Actions */}
                    {isOwner && <JoinRequests kind="leagues" id={id} onApproved={fetchLeagueDetails} />}
                    {isOwner && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Admin Actions</Text>
                            <TouchableOpacity style={styles.addButton} onPress={() => setAddMemberModalVisible(true)}>
                                <UserPlus size={20} color="white" />
                                <Text style={styles.addButtonText}>Add Member</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('CreateTournament', { leagueId: id })}>
                                <Plus size={20} color="white" />
                                <Text style={styles.addButtonText}>New League Tournament</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteLeague}>
                                <Trash2 size={20} color="#ef4444" />
                                <Text style={styles.deleteButtonText}>Delete League</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Leave League button for non-owners */}
                    {!isOwner && (
                        <View style={styles.section}>
                            <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveLeague}>
                                <Trash2 size={20} color="#f59e0b" />
                                <Text style={styles.leaveButtonText}>Leave League</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>

                {/* Add Member Modal */}
                <Modal visible={addMemberModalVisible} transparent animationType="slide" onRequestClose={() => setAddMemberModalVisible(false)}>
                    <View style={styles.modalBackdrop}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Add Member</Text>
                                <TouchableOpacity onPress={() => setAddMemberModalVisible(false)}>
                                    <X size={24} color="white" />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.modalLabel}>From your play groups</Text>
                            <Dropdown
                                placeholder="Pick a player"
                                emptyText="No players in your play groups yet. Type a name below."
                                options={myPlayers
                                    .filter(m => !standings.some(s => s.user.id === m.id))
                                    .map(m => ({ label: m.username, value: m.username, hint: m.custom_id }))}
                                value={newMemberId || null}
                                onChange={setNewMemberId}
                            />
                            <Text style={styles.modalLabel}>Or type a username, email or user ID</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={newMemberId}
                                onChangeText={setNewMemberId}
                                placeholder="Enter username or user ID"
                                placeholderTextColor="#666"
                                autoCapitalize="none"
                            />

                            <TouchableOpacity
                                style={[styles.modalButton, addingMember && styles.modalButtonDisabled]}
                                onPress={handleAddMember}
                                disabled={addingMember || !newMemberId.trim()}
                            >
                                {addingMember ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.modalButtonText}>Add Member</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* Edit Standing Modal */}
                <Modal visible={editStandingModalVisible} transparent animationType="slide" onRequestClose={() => setEditStandingModalVisible(false)}>
                    <View style={styles.modalBackdrop}>
                        <ScrollView contentContainerStyle={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <View style={styles.modalContent}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Edit Standing - {editingUser?.user.username}</Text>
                                    <TouchableOpacity onPress={() => setEditStandingModalVisible(false)}>
                                        <X size={24} color="white" />
                                    </TouchableOpacity>
                                </View>

                                <Text style={styles.modalHint}>
                                    Totals come from league tournaments. A change here is kept as a correction, and new results still add to it.
                                </Text>

                                <Text style={styles.modalLabel}>Points</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    value={editPoints}
                                    onChangeText={setEditPoints}
                                    placeholder="0"
                                    placeholderTextColor="#666"
                                    keyboardType="numeric"
                                />

                                <Text style={styles.modalLabel}>Matches Played</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    value={editMatchesPlayed}
                                    onChangeText={setEditMatchesPlayed}
                                    placeholder="0"
                                    placeholderTextColor="#666"
                                    keyboardType="numeric"
                                />

                                <Text style={styles.modalLabel}>Matches Won</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    value={editMatchesWon}
                                    onChangeText={setEditMatchesWon}
                                    placeholder="0"
                                    placeholderTextColor="#666"
                                    keyboardType="numeric"
                                />

                                <Text style={styles.modalLabel}>Matches Drawn</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    value={editMatchesDrawn}
                                    onChangeText={setEditMatchesDrawn}
                                    placeholder="0"
                                    placeholderTextColor="#666"
                                    keyboardType="numeric"
                                />

                                <Text style={styles.modalLabel}>Matches Lost</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    value={editMatchesLost}
                                    onChangeText={setEditMatchesLost}
                                    placeholder="0"
                                    placeholderTextColor="#666"
                                    keyboardType="numeric"
                                />

                                <TouchableOpacity
                                    style={[styles.modalButton, editingStanding && styles.modalButtonDisabled]}
                                    onPress={handleUpdateStanding}
                                    disabled={editingStanding}
                                >
                                    {editingStanding ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text style={styles.modalButtonText}>Update Standing</Text>
                                    )}
                                </TouchableOpacity>

                                {editingUser && isAdjusted(editingUser) && (
                                    <TouchableOpacity style={styles.secondaryButton} onPress={handleUseResultsOnly} disabled={editingStanding}>
                                        <Text style={styles.secondaryButtonText}>Use results only (remove corrections)</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </ScrollView>
                    </View>
                </Modal>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f0518',
    },
    safeArea: {
        flex: 1,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    header: {
        padding: 20,
        backgroundColor: '#0f0518',
        borderBottomWidth: 1,
        borderBottomColor: '#2e1065',
    },
    headerTitle: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        color: '#aaa',
        fontSize: 14,
        marginTop: 4,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: '#ef4444',
        fontSize: 16,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        color: '#a855f7',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    description: {
        color: '#ddd',
        lineHeight: 24,
    },
    emptyText: {
        color: '#666',
        fontStyle: 'italic',
    },
    table: {
        backgroundColor: '#1a1a2e',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#2e1065',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#2e1065',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#444',
    },
    tableHeaderText: {
        color: '#aaa',
        fontWeight: 'bold',
        fontSize: 12,
    },
    tableRow: {
        flexDirection: 'row',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#2e1065',
        alignItems: 'center',
    },
    tableCell: {
        color: 'white',
        fontSize: 14,
    },
    colRank: { width: 30, textAlign: 'center' },
    colPlayer: { flex: 1 },
    colPoints: { width: 40, textAlign: 'center', fontWeight: 'bold' },
    colOMW: { width: 60, textAlign: 'center' },
    colRecord: { width: 60, textAlign: 'center' },
    colActions: { width: 70, alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#a855f7',
        padding: 14,
        borderRadius: 12,
        marginBottom: 12,
    },
    addButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#1a1a2e',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ef4444',
    },
    deleteButtonText: {
        color: '#ef4444',
        fontWeight: 'bold',
        fontSize: 16,
    },
    leaveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#1a1a2e',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#f59e0b',
    },
    leaveButtonText: {
        color: '#f59e0b',
        fontWeight: 'bold',
        fontSize: 16,
    },
    modalBackdrop: modalStyles.overlay,
    modalContent: modalStyles.card,
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: { ...modalStyles.title, flex: 1 },
    modalHint: {
        color: '#aaa',
        fontSize: 13,
        marginBottom: 16,
    },
    secondaryButton: {
        marginTop: 12,
        padding: 12,
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: '#a855f7',
        fontWeight: 'bold',
    },
    editedTag: {
        color: '#a855f7',
        fontSize: 11,
        fontWeight: 'normal',
    },
    tournamentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#2e1065',
    },
    tournamentName: {
        color: 'white',
        fontSize: 15,
        flex: 1,
    },
    tournamentStatus: {
        color: '#888',
        fontSize: 12,
        textTransform: 'uppercase',
    },
    modalLabel: {
        color: '#aaa',
        marginBottom: 8,
        fontSize: 14,
    },
    modalInput: {
        backgroundColor: '#0f0518',
        color: 'white',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#2e1065',
    },
    modalButton: {
        backgroundColor: '#a855f7',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    modalButtonDisabled: {
        opacity: 0.6,
    },
    modalButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
