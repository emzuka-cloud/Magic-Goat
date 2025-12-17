import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, StatusBar, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, User, Mail, Hash } from 'lucide-react-native';
import { fetchUserAttributes } from 'aws-amplify/auth';

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

export const ProfileScreen = () => {
    const navigation = useNavigation<ProfileScreenNavigationProp>();
    const { user } = useAuth();
    const [attributes, setAttributes] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getAttributes = async () => {
            try {
                const userAttributes = await fetchUserAttributes();
                setAttributes(userAttributes);
            } catch (error) {
                console.error('Error fetching user attributes:', error);
            } finally {
                setLoading(false);
            }
        };

        getAttributes();
    }, []);

    const username = user?.username || 'N/A';
    // Use fetched attributes or fallbacks
    const email = attributes?.email || user?.signInDetails?.loginId || 'N/A';
    const userId = attributes?.nickname || 'N/A';

    if (loading) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color="#a855f7" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <ArrowLeft color="white" size={24} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Profile</Text>
                    <View style={{ width: 40 }} /> {/* Spacer for alignment */}
                </View>

                <View style={styles.content}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <User size={64} color="#a855f7" />
                        </View>
                        <Text style={styles.usernameText}>{username}</Text>
                    </View>

                    <View style={styles.infoContainer}>
                        <View style={styles.infoItem}>
                            <View style={styles.iconContainer}>
                                <Hash size={20} color="#a855f7" />
                            </View>
                            <View style={styles.textContainer}>
                                <Text style={styles.label}>User ID</Text>
                                <Text style={styles.value}>{userId}</Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.infoItem}>
                            <View style={styles.iconContainer}>
                                <Mail size={20} color="#a855f7" />
                            </View>
                            <View style={styles.textContainer}>
                                <Text style={styles.label}>Email</Text>
                                <Text style={styles.value}>{email}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f0518',
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    safeArea: {
        flex: 1,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#2e1065',
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    headerTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        padding: 24,
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 48,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#a855f7',
        marginBottom: 16,
    },
    usernameText: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    },
    infoContainer: {
        backgroundColor: '#1a1a2e',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#2e1065',
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
    },
    label: {
        color: '#888',
        fontSize: 14,
        marginBottom: 4,
    },
    value: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: '#2e1065',
        marginVertical: 8,
    },
});
