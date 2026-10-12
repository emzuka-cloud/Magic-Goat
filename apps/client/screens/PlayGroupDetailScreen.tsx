import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Platform, StatusBar, TextInput, Alert, Modal, Image, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { API_URL, getAuthHeaders } from '../config';
import { showApiError, showError, NETWORK_ERROR } from '../utils/errors';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Users, UserPlus, Shield, User, Trash2 } from 'lucide-react-native';
import { fetchAuthSession } from 'aws-amplify/auth';
import { Dropdown } from '../components/Dropdown';
import { useMyPlayGroups } from '../hooks/useMyPlayGroups';

type PlayGroupDetailRouteProp = RouteProp<RootStackParamList, 'PlayGroupDetail'>;
type PlayGroupDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PlayGroupDetail'>;

interface PlayGroup {
    id: string;
    name: string;
    description: string;
    owner: { id: string; username: string };
    members: { id: string; username: string; email: string }[];
}

export const PlayGroupDetailScreen = () => {
    const route = useRoute<PlayGroupDetailRouteProp>();
    const navigation = useNavigation<PlayGroupDetailNavigationProp>();
    const { id } = route.params;
    const { user } = useAuth(); // Get current user

    const [group, setGroup] = useState<PlayGroup | null>(null);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const { players: myPlayers } = useMyPlayGroups(modalVisible);
    const [newMemberId, setNewMemberId] = useState('');
    const [addingMember, setAddingMember] = useState(false);

    // Derived owner check
    // Note: group.owner.username vs user.username might be safer if IDs formats differ, but ID is best.
    const isOwner = group?.owner?.username === user?.username;

    const fetchGroupDetails = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${API_URL}/playgroups/${id}`, { headers });
            if (response.ok) {
                setGroup(await response.json());
            } else {
                await showApiError(response, 'Could not load this play group.');
            }
        } catch (error) {
            showError(NETWORK_ERROR);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroupDetails();
    }, [id]);

    const handleRemoveMember = async (memberId: string, username: string) => {
        const proceedWithRemoval = async () => {
            try {
                const headers = await getAuthHeaders();
                const response = await fetch(`${API_URL}/playgroups/${id}/members/${memberId}`, {
                    method: 'DELETE',
                    headers,
                });
                if (response.ok) {
                    fetchGroupDetails();
                } else {
                    await showApiError(response, 'Could not remove the member.');
                }
            } catch (e) {
                showError(NETWORK_ERROR);
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm(`Are you sure you want to remove ${username}?`)) {
                await proceedWithRemoval();
            }
        } else {
            Alert.alert(
                'Remove Member',
                `Are you sure you want to remove ${username}?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Remove',
                        style: 'destructive',
                        onPress: proceedWithRemoval
                    }
                ]
            );
        }
    };

    const handleDeleteGroup = async () => {
        const proceedWithDeletion = async () => {
            try {
                const headers = await getAuthHeaders();
                const response = await fetch(`${API_URL}/playgroups/${id}`, {
                    method: 'DELETE',
                    headers,
                });
                if (response.ok) {
                    navigation.navigate('PlayGroups');
                } else {
                    await showApiError(response, 'Could not delete the play group.');
                }
            } catch (e) {
                showError(NETWORK_ERROR);
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm('Are you sure you want to delete this group permanently?')) {
                await proceedWithDeletion();
            }
        } else {
            Alert.alert(
                'Delete Group',
                'Are you sure you want to delete this group? This cannot be undone.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: proceedWithDeletion
                    }
                ]
            );
        }
    };

    const handleLeaveGroup = async () => {
        const proceedWithLeaving = async () => {
            try {
                const headers = await getAuthHeaders();
                // Get the actual user ID from the auth session
                const session = await fetchAuthSession();
                const userId = session.tokens?.idToken?.payload?.sub;

                console.log('🔍 [handleLeaveGroup] userId from session:', userId);

                const response = await fetch(`${API_URL}/playgroups/${id}/leave`, {
                    method: 'POST',
                    headers,
                });
                if (response.ok) {
                    navigation.goBack();
                } else {
                    await showApiError(response, 'Could not leave the play group.');
                }
            } catch (e) {
                showError(NETWORK_ERROR);
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm('Are you sure you want to leave this group?')) {
                await proceedWithLeaving();
            }
        } else {
            Alert.alert(
                'Leave Group',
                'Are you sure you want to leave this group?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Leave', style: 'destructive', onPress: proceedWithLeaving }
                ]
            );
        }
    };

    const handleAddMember = async () => {
        if (!newMemberId.trim()) return;
        setAddingMember(true);
        try {
            // ... (rest of add member logic same as before)
            const headers = await getAuthHeaders();
            const response = await fetch(`${API_URL}/playgroups/${id}/members`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ identifier: newMemberId })
            });

            if (response.ok) {
                Alert.alert('Success', 'Member added successfully');
                setNewMemberId('');
                setModalVisible(false);
                fetchGroupDetails();
            } else {
                await showApiError(response, 'Could not add the member. Check the username, email or ID.');
            }
        } catch (error) {
            showError(NETWORK_ERROR);
        } finally {
            setAddingMember(false);
        }
    };

    const renderMember = ({ item }: { item: any }) => (
        <View style={styles.memberCard}>
            <View style={styles.avatar}>
                <User size={20} color="white" />
            </View>
            <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{item.username}</Text>
                <Text style={styles.memberRole}>
                    {item.id === group?.owner?.id ? 'Owner' : 'Member'}
                </Text>
            </View>
            {item.id === group?.owner?.id && <Shield size={16} color="#a855f7" />}

            {isOwner && item.id !== group?.owner?.id && (
                <TouchableOpacity onPress={() => handleRemoveMember(item.id, item.username)} style={{ marginLeft: 10 }}>
                    <Trash2 size={20} color="#ef4444" />
                </TouchableOpacity>
            )}
        </View>
    );

    if (loading) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color="#a855f7" />
            </View>
        );
    }

    if (!group) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <Text style={styles.errorText}>Group not found</Text>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.linkText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowLeft size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Group Details</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.infoSection}>
                    <Text style={styles.groupName}>{group.name}</Text>
                    <Text style={{ color: '#666', marginBottom: 8, fontSize: 12 }}>ID: {group.id}</Text>
                    {group.description ? <Text style={styles.groupDesc}>{group.description}</Text> : null}

                    <View style={styles.statsRow}>
                        <View style={styles.stat}>
                            <Users size={16} color="#a855f7" />
                            <Text style={styles.statText}>{group.members.length} Members</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.membersSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Members</Text>
                        {isOwner && (
                            <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
                                <UserPlus size={20} color="white" />
                                <Text style={styles.addButtonText}>Add</Text>
                            </TouchableOpacity>
                        )}
                        {!isOwner && <View />}
                    </View>

                    <FlatList
                        data={group.members}
                        renderItem={renderMember}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.membersList}
                    />
                </View>

                {isOwner && (
                    <TouchableOpacity style={styles.deleteGroupButton} onPress={handleDeleteGroup}>
                        <Text style={styles.deleteGroupText}>Delete Group</Text>
                    </TouchableOpacity>
                )}

                {/* Leave Group button for non-owners */}
                {!isOwner && (
                    <TouchableOpacity style={styles.leaveGroupButton} onPress={handleLeaveGroup}>
                        <Text style={styles.leaveGroupText}>Leave Group</Text>
                    </TouchableOpacity>
                )}

                {/* Add Member Modal */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Add Member</Text>
                            <Text style={styles.modalSubtitle}>Pick someone from your other play groups, or type a username, email or user ID</Text>
                            <Dropdown
                                placeholder="Pick a player"
                                emptyText="No players in your other play groups yet."
                                options={myPlayers
                                    .filter(m => !group?.members.some(g => g.id === m.id))
                                    .map(m => ({ label: m.username, value: m.username, hint: m.custom_id }))}
                                value={newMemberId || null}
                                onChange={setNewMemberId}
                            />

                            <TextInput
                                style={styles.modalInput}
                                placeholder="Username / ID"
                                placeholderTextColor="#666"
                                value={newMemberId}
                                onChangeText={setNewMemberId}
                                autoCapitalize="none"
                            />

                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.cancelButton]}
                                    onPress={() => setModalVisible(false)}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.confirmButton]}
                                    onPress={handleAddMember}
                                    disabled={addingMember}
                                >
                                    {addingMember ? (
                                        <ActivityIndicator color="white" size="small" />
                                    ) : (
                                        <Text style={styles.confirmButtonText}>Add</Text>
                                    )}
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
    container: {
        flex: 1,
        backgroundColor: '#0f0518',
    },
    safeArea: {
        flex: 1,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    backButton: {
        padding: 8,
    },
    title: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    infoSection: {
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#2e1065',
    },
    groupName: {
        color: 'white',
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    groupDesc: {
        color: '#ccc',
        fontSize: 16,
        marginBottom: 16,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 16,
    },
    stat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        padding: 8,
        borderRadius: 8,
    },
    statText: {
        color: '#a855f7',
        fontWeight: '500',
    },
    membersSection: {
        flex: 1,
        padding: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#a855f7',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    addButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    membersList: {
        gap: 12,
    },
    memberCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a2e',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#2e1065',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#2e1065',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    memberInfo: {
        flex: 1,
    },
    memberName: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    memberRole: {
        color: '#888',
        fontSize: 12,
    },
    errorText: {
        color: '#ef4444',
        fontSize: 18,
        marginBottom: 16,
    },
    linkText: {
        color: '#a855f7',
        fontSize: 16,
        textDecorationLine: 'underline',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        width: '100%',
        backgroundColor: '#1a1a2e',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: '#2e1065',
    },
    modalTitle: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    modalSubtitle: {
        color: '#888',
        fontSize: 14,
        marginBottom: 24,
        textAlign: 'center',
    },
    modalInput: {
        backgroundColor: '#0f0518',
        borderWidth: 1,
        borderColor: '#2e1065',
        borderRadius: 12,
        padding: 16,
        color: 'white',
        fontSize: 16,
        marginBottom: 24,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 16,
    },
    modalButton: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#2e1065',
    },
    confirmButton: {
        backgroundColor: '#a855f7',
    },
    cancelButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    confirmButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    deleteGroupButton: {
        backgroundColor: '#1a1a2e',
        padding: 16,
        borderRadius: 12,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#ef4444',
    },
    leaveGroupButton: {
        backgroundColor: '#1a1a2e',
        padding: 16,
        borderRadius: 12,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#f59e0b',
    },
    leaveGroupText: {
        color: '#f59e0b',
        textAlign: 'center',
        fontWeight: '600',
        fontSize: 16,
    },
    deleteGroupText: {
        color: '#ef4444',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});
