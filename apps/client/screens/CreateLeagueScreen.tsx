import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, SafeAreaView, Platform, StatusBar, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { ArrowLeft } from 'lucide-react-native';

import { API_URL } from '../config';
import { showApiError, showError, NETWORK_ERROR } from '../utils/errors';
import { todayLocal, isValidDateOnly } from '../utils/dates';
import { getAuthToken } from '../contexts/AuthContext';

type CreateLeagueScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateLeague'>;

export const CreateLeagueScreen = () => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState(todayLocal());
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation<CreateLeagueScreenNavigationProp>();

    const handleCreate = async () => {
        if (!name.trim()) {
            showError('Please enter a league name.');
            return;
        }
        if (!isValidDateOnly(startDate)) {
            showError('Please enter a valid start date (YYYY-MM-DD).');
            return;
        }

        setLoading(true);
        try {
            const token = await getAuthToken();
            if (!token) {
                showError('Your session has expired. Please sign in again.');
                return;
            }

            const response = await fetch(`${API_URL}/leagues`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    description,
                    start_date: startDate,
                }),
            });

            if (response.ok) {
                const createdLeague = await response.json();
                // Navigate to the detail screen of the created league
                navigation.replace('LeagueDetail', { id: createdLeague.id });
            } else {
                await showApiError(response, 'Could not create the league.');
            }
        } catch (error) {
            showError(NETWORK_ERROR);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0f0518" />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <ArrowLeft size={24} color="white" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Create League</Text>
                    </View>
                </View>

                <View style={styles.form}>
                    <Text style={styles.label}>League Name</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Enter league name"
                        placeholderTextColor="#666"
                    />

                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Enter description"
                        placeholderTextColor="#666"
                        multiline
                        numberOfLines={4}
                    />

                    <Text style={styles.label}>Start Date</Text>
                    {Platform.OS === 'web' ? (
                        // Native browser date picker; react-native has no web date input.
                        React.createElement('input', {
                            type: 'date',
                            value: startDate,
                            onChange: (e: any) => setStartDate(e.target.value),
                            style: { ...StyleSheet.flatten(styles.input), borderStyle: 'solid', colorScheme: 'dark', fontFamily: 'inherit', fontSize: 15 },
                        })
                    ) : (
                        <TextInput
                            style={styles.input}
                            value={startDate}
                            onChangeText={setStartDate}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor="#666"
                        />
                    )}

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleCreate}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.buttonText}>Create League</Text>
                        )}
                    </TouchableOpacity>
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
    form: {
        padding: 20,
    },
    label: {
        color: '#aaa',
        marginBottom: 8,
        fontSize: 16,
    },
    input: {
        backgroundColor: '#1a1a2e',
        color: 'white',
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#2e1065',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    button: {
        backgroundColor: '#a855f7',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

