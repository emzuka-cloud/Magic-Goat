import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Platform, StatusBar, SafeAreaView, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { fetchAuthSession } from 'aws-amplify/auth';
import { API_URL } from '../config';
import { showApiError, showError, NETWORK_ERROR } from '../utils/errors';
import { Ionicons } from '@expo/vector-icons';
import { Trash2, ArrowLeft, Bell } from 'lucide-react-native';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    relatedEntityId: string;
    isRead: boolean;
    createdAt: string;
}

export const NotificationsScreen = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation<any>();

    const fetchNotifications = async () => {
        try {
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();

            const response = await fetch(`${API_URL}/notifications`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setNotifications(await response.json());
            } else {
                await showApiError(response, 'Could not load notifications.');
            }
        } catch (error) {
            showError(NETWORK_ERROR);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();

            const response = await fetch(`${API_URL}/notifications/${id}/read`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) return showApiError(response, 'Could not mark the notification as read.');

            // Update local state
            setNotifications(prev => prev.map(n =>
                n.id === id ? { ...n, isRead: true } : n
            ));
        } catch (error) {
            showError(NETWORK_ERROR);
        }
    };

    const handleDelete = async (id: string) => {
        if (Platform.OS === 'web') {
            if (!window.confirm('Delete this notification?')) return;
        } else {
            // Let user just tap it, maybe add swipe later or long press. For now add delete icon.
        }

        try {
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();

            const response = await fetch(`${API_URL}/notifications/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setNotifications(prev => prev.filter(n => n.id !== id));
            } else {
                await showApiError(response, 'Could not delete the notification.');
            }
        } catch (error) {
            showError(NETWORK_ERROR);
        }
    };

    const handleNotificationPress = async (notification: Notification) => {
        if (!notification.isRead) {
            await markAsRead(notification.id);
        }

        // Navigate to related entity
        switch (notification.type) {
            case 'PLAYGROUP_ADD':
                navigation.navigate('PlayGroupDetail', { id: notification.relatedEntityId });
                break;
            case 'TOURNAMENT_ADD':
                navigation.navigate('TournamentDetail', { id: notification.relatedEntityId });
                break;
            case 'LEAGUE_ADD':
                navigation.navigate('LeagueDetail', { id: notification.relatedEntityId });
                break;
            default:
                // Just mark as read
                break;
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchNotifications();
        setRefreshing(false);
    };

    const renderItem = ({ item }: { item: Notification }) => (
        <View style={[styles.item, !item.isRead && styles.unreadItem]}>
            <TouchableOpacity
                style={styles.contentWrapper}
                onPress={() => handleNotificationPress(item)}
            >
                <View style={[styles.iconContainer,
                item.type.includes('PLAYGROUP') ? { backgroundColor: 'rgba(168, 85, 247, 0.1)' } : // Purple
                    item.type.includes('TOURNAMENT') ? { backgroundColor: 'rgba(34, 197, 94, 0.1)' } : // Green
                        { backgroundColor: 'rgba(239, 68, 68, 0.1)' } // Red/Default
                ]}>
                    <Ionicons
                        name={item.type.includes('PLAYGROUP') ? 'people' : item.type.includes('TOURNAMENT') ? 'trophy' : 'list'}
                        size={24}
                        color={
                            item.type.includes('PLAYGROUP') ? '#a855f7' :
                                item.type.includes('TOURNAMENT') ? '#22c55e' :
                                    '#ef4444'
                        }
                    />
                </View>
                <View style={styles.contentContainer}>
                    <Text style={[styles.title, !item.isRead && styles.unreadText]} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
                    <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
                {!item.isRead && <View style={styles.dot} />}
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(item.id)}
            >
                <Trash2 size={20} color="#666" />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0f0518" />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <ArrowLeft size={24} color="white" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Notifications</Text>
                    </View>
                </View>

                {loading ? (
                    <View style={styles.centerContent}>
                        <ActivityIndicator size="large" color="#a855f7" />
                    </View>
                ) : (
                    <FlatList
                        data={notifications}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#a855f7" />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Bell size={48} color="#2e1065" />
                                <Text style={styles.emptyText}>No notifications</Text>
                            </View>
                        }
                        contentContainerStyle={styles.listContent}
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
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
    },
    listContent: {
        padding: 16,
        paddingBottom: 80,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    item: {
        flexDirection: 'row',
        backgroundColor: '#1a1a2e',
        padding: 0,
        borderRadius: 16,
        marginBottom: 12,
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#2e1065',
    },
    contentWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    deleteButton: {
        padding: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderLeftWidth: 1,
        borderLeftColor: '#2e1065',
    },
    unreadItem: {
        backgroundColor: '#252540', // Slightly lighter for unread
        borderLeftWidth: 4,
        borderLeftColor: '#a855f7',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    contentContainer: {
        flex: 1,
    },
    title: {
        color: '#e2e8f0',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    unreadText: {
        color: 'white',
        fontWeight: 'bold',
    },
    message: {
        color: '#94a3b8',
        fontSize: 14,
        marginBottom: 4,
    },
    date: {
        color: '#64748b',
        fontSize: 12,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#a855f7',
        marginLeft: 8,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 64,
    },
    emptyText: {
        color: '#666',
        fontSize: 16,
        marginTop: 16,
    },
});
