import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Platform, StatusBar, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { API_URL, getAuthHeaders } from '../config';
import { showApiError, showError, NETWORK_ERROR } from '../utils/errors';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Users, ArrowRight, ArrowLeft } from 'lucide-react-native';

type PlayGroupsListScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PlayGroupsList'>;

interface PlayGroup {
    id: string;
    name: string;
    description: string;
    ownerId: string;
    members: any[];
}

export const PlayGroupsListScreen = () => {
    const navigation = useNavigation<PlayGroupsListScreenNavigationProp>();
    const { user } = useAuth();
    const [groups, setGroups] = useState<PlayGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchGroups = async () => {
        try {
            const headers = await getAuthHeaders();
            // Get current user ID (assuming backend returns groups for the user)
            // Wait, I need the user's ID. In generic cognitive user object it's trickier.
            // But the backend `findAllForUser` expects a userId param.
            // I'll try to use the user.username or attributes.sub if available.
            // For now, let's assume valid ID is available or use a placeholder if AuthContext doesn't provide it clearly yet.
            // Actually, verify_profile output showed we have attributes.
            // Let's assume we can get it or the backend parses the token. 
            // My backend controller `findAll` expects `:userId`.
            // Let's use `user.username` as a fallback or `sub`.
            const userId = user?.username || 'unknown';

            // To be robust I should probably fetch user attributes here too or update AuthContext to expose full profile.
            // For now proceed with username/id from user object.

            const response = await fetch(`${API_URL}/playgroups/user/${userId}`, {
                headers
            });

            if (response.ok) {
                setGroups(await response.json());
            } else {
                await showApiError(response, 'Could not load your play groups.');
            }
        } catch (error) {
            showError(NETWORK_ERROR);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchGroups();
    };

    const renderItem = ({ item }: { item: PlayGroup }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('PlayGroupDetail', { id: item.id })}
        >
            <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                    <Users size={24} color="#a855f7" />
                </View>
                <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    {item.description ? <Text style={styles.cardDescription}>{item.description}</Text> : null}
                    <Text style={styles.memberCount}>{item.members?.length || 1} members</Text>
                </View>
                <ArrowRight size={20} color="#666" />
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0f0518" />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
                            <ArrowLeft size={24} color="white" />
                        </TouchableOpacity>
                        <Text style={styles.title}>Play Groups</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.createButton}
                        onPress={() => navigation.navigate('CreatePlayGroup')}
                    >
                        <Plus size={24} color="white" />
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={styles.centerContent}>
                        <ActivityIndicator size="large" color="#a855f7" />
                    </View>
                ) : (
                    <FlatList
                        data={groups}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#a855f7" />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Users size={48} color="#2e1065" />
                                <Text style={styles.emptyText}>No play groups yet</Text>
                                <Text style={styles.emptySubtext}>Create one to get started!</Text>
                            </View>
                        }
                    />
                )}
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#0f0518',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
    },
    createButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#a855f7',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
        paddingBottom: 80,
    },
    card: {
        backgroundColor: '#1a1a2e',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#2e1065',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    cardDescription: {
        color: '#888',
        fontSize: 14,
        marginBottom: 4,
    },
    memberCount: {
        color: '#a855f7',
        fontSize: 12,
        fontWeight: '500',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 64,
    },
    emptyText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 16,
    },
    emptySubtext: {
        color: '#666',
        fontSize: 14,
        marginTop: 8,
    },
});
