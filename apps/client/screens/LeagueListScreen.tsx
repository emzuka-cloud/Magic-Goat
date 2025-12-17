import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Platform, StatusBar, RefreshControl, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { API_URL } from '../config';
import { getAuthToken } from '../contexts/AuthContext';
import { ArrowLeft, Plus, Users } from 'lucide-react-native';

interface League {
    id: string;
    name: string;
    description?: string;
    start_date: string;
    end_date?: string;
}

type LeagueListScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'LeagueList'>;

export const LeagueListScreen = () => {
    const [leagues, setLeagues] = useState<League[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const navigation = useNavigation<LeagueListScreenNavigationProp>();

    const fetchLeagues = async () => {
        try {
            const token = await getAuthToken();
            if (!token) {
                console.error('No auth token available');
                return;
            }

            const response = await fetch(`${API_URL}/leagues`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setLeagues(data);
        } catch (error) {
            console.error('Failed to fetch leagues:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            fetchLeagues();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchLeagues();
    };

    const renderLeague = ({ item }: { item: League }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('LeagueDetail', { id: item.id })}
        >
            <View style={styles.cardHeader}>
                <Users size={20} color="#a855f7" />
                <Text style={styles.name}>{item.name}</Text>
            </View>
            {item.description && <Text style={styles.description} numberOfLines={2}>{item.description}</Text>}
            <Text style={styles.date}>Starts: {new Date(item.start_date).toLocaleDateString()}</Text>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.container}>
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.header}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <TouchableOpacity onPress={() => navigation.goBack()}>
                                <ArrowLeft size={24} color="white" />
                            </TouchableOpacity>
                            <Text style={styles.headerTitle}>Leagues</Text>
                        </View>
                    </View>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#a855f7" />
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0f0518" />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <ArrowLeft size={24} color="white" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Leagues</Text>
                    </View>
                </View>

                {leagues.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Users size={64} color="#2e1065" />
                        <Text style={styles.emptyTitle}>No Leagues Yet</Text>
                        <Text style={styles.emptyText}>Create a league to get started!</Text>
                    </View>
                ) : (
                    <FlatList
                        data={leagues}
                        renderItem={renderLeague}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.list}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#a855f7" />
                        }
                    />
                )}

                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => navigation.navigate('CreateLeague')}
                >
                    <Plus size={24} color="white" />
                </TouchableOpacity>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        padding: 16,
    },
    card: {
        backgroundColor: '#1a1a2e',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#2e1065',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    name: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
    },
    description: {
        color: '#aaa',
        fontSize: 14,
        marginBottom: 8,
    },
    date: {
        color: '#888',
        fontSize: 12,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 20,
    },
    emptyText: {
        color: '#666',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 8,
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        backgroundColor: '#a855f7',
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
});
