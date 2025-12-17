import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Platform, StatusBar, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { API_URL, getAuthHeaders } from '../config';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Trophy, ArrowRight, ArrowLeft } from 'lucide-react-native';

type TournamentListScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'TournamentList'>;

interface Tournament {
    id: string;
    name: string;
    format: string; // or number/enum
    capacity: number;
    status: string;
    participants: any[];
}

export const TournamentListScreen = () => {
    const navigation = useNavigation<TournamentListScreenNavigationProp>();
    const { user } = useAuth();
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchTournaments = React.useCallback(async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${API_URL}/tournaments`, {
                headers
            });

            if (response.ok) {
                const data = await response.json();
                setTournaments(data);
            }
        } catch (error) {
            console.error('Failed to fetch tournaments', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            fetchTournaments();
        }, [fetchTournaments])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchTournaments();
    };

    const renderItem = ({ item }: { item: Tournament }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('TournamentDetail', { id: item.id })}
        >
            <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                    <Trophy size={24} color="#facc15" />
                </View>
                <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <Text style={styles.cardDescription}>{item.capacity} Players • {item.status}</Text>
                    {/* <Text style={styles.memberCount}>{item.participants?.length || 0} participants</Text> */}
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
                        <Text style={styles.title}>Tournaments</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.createButton}
                        onPress={() => navigation.navigate('CreateTournament')}
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
                        data={tournaments}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#a855f7" />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Trophy size={48} color="#2e1065" />
                                <Text style={styles.emptyText}>No tournaments found</Text>
                                <Text style={styles.emptySubtext}>Create one to compete!</Text>
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
        backgroundColor: 'rgba(250, 204, 21, 0.1)',
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
        textTransform: 'capitalize'
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
