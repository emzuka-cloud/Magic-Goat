import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, Platform, StatusBar, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { API_URL, getAuthHeaders } from '../config';
import { ArrowLeft, Users, Trophy } from 'lucide-react-native';

type CreateTournamentNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateTournament'>;

export const CreateTournamentScreen = () => {
    const navigation = useNavigation<CreateTournamentNavigationProp>();
    const [name, setName] = useState('');
    const [capacity, setCapacity] = useState<number>(8); // Default 8
    const [format, setFormat] = useState('single_elimination');
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter a tournament name');
            return;
        }

        setLoading(true);
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${API_URL}/tournaments`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    name,
                    capacity, // 8, 16, 32
                    format // 'single_elimination' or 'commander'
                }),
            });

            if (response.ok) {
                const data = await response.json();
                // Replace current screen with Detail screen so back button goes to List
                // @ts-ignore
                navigation.replace('TournamentDetail', { id: data.id });
            } else {
                const errorData = await response.json();
                Alert.alert('Error', errorData.message || 'Failed to create tournament');
            }
        } catch (error) {
            console.error('Create tournament error:', error);
            Alert.alert('Error', 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const FormatOption = ({ value, label }: { value: number; label: string }) => (
        <TouchableOpacity
            style={[styles.formatOption, capacity === value && styles.formatOptionSelected]}
            onPress={() => setCapacity(value)}
        >
            <Users size={24} color={capacity === value ? 'white' : '#666'} />
            <Text style={[styles.formatText, capacity === value && styles.formatTextSelected]}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0f0518" />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowLeft size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Create Tournament</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Tournament Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Friday Night Magic"
                            placeholderTextColor="#666"
                            value={name}
                            onChangeText={setName}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Game Format</Text>
                        <View style={styles.formatContainer}>
                            <TouchableOpacity
                                style={[styles.formatOption, format === 'single_elimination' && styles.formatOptionSelected]}
                                onPress={() => setFormat('single_elimination')}
                            >
                                <Trophy size={24} color={format === 'single_elimination' ? 'white' : '#666'} />
                                <Text style={[styles.formatText, format === 'single_elimination' && styles.formatTextSelected]}>1v1 Duel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.formatOption, format === 'commander' && styles.formatOptionSelected]}
                                onPress={() => setFormat('commander')}
                            >
                                <Users size={24} color={format === 'commander' ? 'white' : '#666'} />
                                <Text style={[styles.formatText, format === 'commander' && styles.formatTextSelected]}>Commander (4P)</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Capacity (Players)</Text>
                        <View style={styles.formatContainer}>
                            <FormatOption value={8} label="8 Players" />
                            <FormatOption value={16} label="16 Players" />
                            <FormatOption value={32} label="32 Players" />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.createButton, loading && styles.disabledButton]}
                        onPress={handleCreate}
                        disabled={loading}
                    >
                        <Text style={styles.createButtonText}>
                            {loading ? 'Creating...' : 'Create Tournament'}
                        </Text>
                    </TouchableOpacity>
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
    },
    backButton: {
        padding: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    content: {
        padding: 20,
    },
    formGroup: {
        marginBottom: 24,
    },
    label: {
        color: '#a855f7', // Purple logic
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#1a1a2e',
        borderRadius: 12,
        padding: 16,
        color: 'white',
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#2e1065',
    },
    formatContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    formatOption: {
        flex: 1,
        backgroundColor: '#1a1a2e',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2e1065',
    },
    formatOptionSelected: {
        backgroundColor: '#a855f7',
        borderColor: '#a855f7',
    },
    formatText: {
        color: '#666',
        marginTop: 8,
        fontWeight: 'bold',
    },
    formatTextSelected: {
        color: 'white',
    },
    createButton: {
        backgroundColor: '#a855f7',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 24,
    },
    disabledButton: {
        opacity: 0.7,
    },
    createButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
