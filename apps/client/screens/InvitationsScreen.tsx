import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useSocket } from '../hooks/useSocket';

interface Invitation {
    id: string;
    tournament: {
        id: string;
        name: string;
    };
    status: string;
}

export const InvitationsScreen = () => {
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const socket = useSocket();

    useEffect(() => {
        fetchInvitations();

        if (socket) {
            socket.on('invitation_created', (invitation) => {
                console.log('New invitation received:', invitation);
                setInvitations(prev => [invitation, ...prev]);
            });

            return () => {
                socket.off('invitation_created');
            };
        }
    }, [socket]);

    const fetchInvitations = async () => {
        try {
            const token = 'YOUR_JWT_TOKEN_HERE';
            const response = await fetch('http://localhost:3000/tournaments/invitations/my', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await response.json();
            setInvitations(data);
        } catch (error) {
            console.error('Failed to fetch invitations:', error);
        }
    };

    const handleAccept = async (invitationId: string) => {
        try {
            const token = 'YOUR_JWT_TOKEN_HERE';
            await fetch(`http://localhost:3000/tournaments/invitations/${invitationId}/accept`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
        } catch (error) {
            console.error('Failed to accept invitation:', error);
        }
    };

    const handleDecline = async (invitationId: string) => {
        try {
            const token = 'YOUR_JWT_TOKEN_HERE';
            await fetch(`http://localhost:3000/tournaments/invitations/${invitationId}/decline`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
        } catch (error) {
            console.error('Failed to decline invitation:', error);
        }
    };

    const renderInvitation = ({ item }: { item: Invitation }) => (
        <View style={styles.invitationCard}>
            <Text style={styles.tournamentName}>{item.tournament.name}</Text>
            <View style={styles.buttonRow}>
                <TouchableOpacity
                    style={[styles.button, styles.acceptButton]}
                    onPress={() => handleAccept(item.id)}
                >
                    <Text style={styles.buttonText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.button, styles.declineButton]}
                    onPress={() => handleDecline(item.id)}
                >
                    <Text style={styles.buttonText}>Decline</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Tournament Invitations</Text>
            {invitations.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No pending invitations</Text>
                </View>
            ) : (
                <FlatList
                    data={invitations}
                    renderItem={renderInvitation}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContainer}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a1a',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        padding: 20,
        backgroundColor: '#2a2a2a',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    listContainer: {
        padding: 16,
    },
    invitationCard: {
        backgroundColor: '#2a2a2a',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#333',
    },
    tournamentName: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 10,
    },
    button: {
        flex: 1,
        padding: 12,
        borderRadius: 6,
        alignItems: 'center',
    },
    acceptButton: {
        backgroundColor: '#10b981',
    },
    declineButton: {
        backgroundColor: '#ef4444',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        color: '#888',
        fontSize: 16,
    },
});
