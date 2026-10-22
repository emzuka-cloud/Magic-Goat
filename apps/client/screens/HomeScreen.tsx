import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, SafeAreaView, Platform, StatusBar } from 'react-native';
import { MenuCarousel } from '../components/MenuCarousel';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { Users, Trophy, Swords, Heart, Bell, Menu, User, LogOut, CircleHelp } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';
import { fetchAuthSession } from 'aws-amplify/auth';
import { useFocusEffect } from '@react-navigation/native';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export const HomeScreen = () => {
    const navigation = useNavigation<HomeScreenNavigationProp>();
    const { signOut } = useAuth();
    const [menuVisible, setMenuVisible] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchUnreadCount = async () => {
        try {
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();
            if (!token) return;

            const response = await fetch(`${API_URL}/notifications/unread-count`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setUnreadCount(data.count);
            }
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchUnreadCount();
        }, [])
    );

    const handleLogout = async () => {
        setMenuVisible(false);
        await signOut();
    };

    const menuItems = [
        {
            title: 'Play Groups',
            color: '#3b82f6', // Blue
            route: 'PlayGroupsList',
            Icon: Users
        },
        {
            title: 'Tourneys',
            color: '#22c55e', // Green
            route: 'TournamentList',
            Icon: Trophy
        },
        {
            title: 'Leagues',
            color: '#d4b483', // Beige
            route: 'LeagueList',
            Icon: Swords
        },
        {
            title: 'Life Counter',
            color: '#ef4444', // Red
            route: 'Game',
            Icon: Heart
        },
        {
            title: 'Notifications',
            color: '#64748b', // Slate/Black-ish
            route: 'Notifications',
            Icon: Bell
        }
    ];

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                {/* Header with Menu Button */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={[styles.menuButton, { marginRight: 12 }]}
                        onPress={() => navigation.navigate('Notifications')}
                    >
                        <View>
                            <Bell color="white" size={28} />
                            {unreadCount > 0 && <View style={styles.badge} />}
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuButton}
                        onPress={() => setMenuVisible(!menuVisible)}
                    >
                        <Menu color="white" size={28} />
                    </TouchableOpacity>
                </View>

                {/* Dropdown Menu */}
                {menuVisible && (
                    <View style={styles.dropdown}>
                        <TouchableOpacity
                            style={styles.dropdownItem}
                            onPress={() => {
                                setMenuVisible(false);
                                navigation.navigate('Profile');
                            }}
                        >
                            <User size={20} color="white" />
                            <Text style={styles.dropdownText}>User Profile</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.dropdownItem}
                            onPress={() => {
                                setMenuVisible(false);
                                // navigation.navigate('Support');
                            }}
                        >
                            <CircleHelp size={20} color="white" />
                            <Text style={styles.dropdownText}>Support</Text>
                        </TouchableOpacity>

                        <View style={styles.dropdownDivider} />

                        <TouchableOpacity
                            style={styles.dropdownItem}
                            onPress={handleLogout}
                        >
                            <LogOut size={20} color="#ef4444" />
                            <Text style={[styles.dropdownText, { color: '#ef4444' }]}>Log Out</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Banner */}
                <View style={styles.bannerContainer}>
                    <Image
                        source={require('../assets/home-banner.png')}
                        style={styles.banner}
                        resizeMode="cover"
                    />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <MenuCarousel
                        items={menuItems.map(item => ({
                            ...item,
                            badge: item.route === 'Notifications' ? unreadCount : undefined,
                            // @ts-ignore - dynamic route names
                            onOpen: () => navigation.navigate(item.route),
                        }))}
                    />
                </ScrollView>
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
        position: 'absolute',
        top: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 50,
        right: 20,
        zIndex: 100,
        flexDirection: 'row',
    },
    menuButton: {
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
    },
    badge: {
        position: 'absolute',
        top: -2,
        right: -2,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#ef4444',
        borderWidth: 2,
        borderColor: '#0f0518',
    },
    dropdown: {
        position: 'absolute',
        top: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 60 : 100,
        right: 20,
        backgroundColor: '#1a1a2e',
        borderRadius: 12,
        padding: 8,
        minWidth: 180,
        zIndex: 100,
        borderWidth: 1,
        borderColor: '#2e1065',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 8,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 12,
    },
    dropdownText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
    },
    dropdownDivider: {
        height: 1,
        backgroundColor: '#2e1065',
        marginVertical: 4,
    },
    bannerContainer: {
        width: '100%',
        height: 150,
        backgroundColor: '#0f0518',
        marginBottom: 24,
        marginTop: 0, // Reset margin since we're using SafeAreaView
    },
    banner: {
        width: '100%',
        height: '100%',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 16,
        paddingBottom: 32,
        justifyContent: 'center', // Center content vertically
    },
});
