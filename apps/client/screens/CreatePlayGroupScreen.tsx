import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, Platform, StatusBar, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { API_URL, getAuthHeaders } from '../config';
import { showApiError, showError, NETWORK_ERROR } from '../utils/errors';
import { ArrowLeft } from 'lucide-react-native';

type CreatePlayGroupScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreatePlayGroup'>;

export const CreatePlayGroupScreen = () => {
    const navigation = useNavigation<CreatePlayGroupScreenNavigationProp>();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!name.trim()) {
            showError('Please enter a group name');
            return;
        }

        setLoading(true);
        try {
            const headers = await getAuthHeaders();

            const response = await fetch(`${API_URL}/playgroups`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    name,
                    description,
                }),
            });

            if (response.ok) {
                // Navigate back to list and refresh (or just go back, and list fetches on focus)
                // Assuming list fetches on mount, we might need to manually refresh or pass a param.
                // For simplicity, just go back.
                navigation.goBack();
            } else {
                await showApiError(response, 'Could not create the play group.');
            }
        } catch (error) {
            showError(NETWORK_ERROR);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <ArrowLeft size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Create New Group</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.form}>
                    <Text style={styles.label}>Group Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Sunday Commander Night"
                        placeholderTextColor="#666"
                        value={name}
                        onChangeText={setName}
                    />

                    <Text style={styles.label}>Description (Optional)</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="What's this group about?"
                        placeholderTextColor="#666"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />

                    <TouchableOpacity
                        style={styles.createButton}
                        onPress={handleCreate}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.buttonText}>Create Group</Text>
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
        padding: 16,
        marginBottom: 24,
    },
    backButton: {
        padding: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    form: {
        padding: 24,
    },
    label: {
        color: '#a855f7',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#1a1a2e',
        borderWidth: 1,
        borderColor: '#2e1065',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        color: 'white',
        fontSize: 16,
    },
    textArea: {
        height: 120,
    },
    createButton: {
        backgroundColor: '#a855f7',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 24,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
