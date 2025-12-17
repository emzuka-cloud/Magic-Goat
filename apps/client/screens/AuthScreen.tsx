import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../contexts/AuthContext';

type AuthScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Auth'>;

export const AuthScreen = () => {
    const navigation = useNavigation<AuthScreenNavigationProp>();
    const { signIn, signUp, signInWithGoogle } = useAuth();

    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        setError('');

        // Validation
        if (!email.trim() || !password.trim()) {
            setError('Please fill in all fields');
            return;
        }

        if (mode === 'signup') {
            if (!name.trim()) {
                setError('Please enter your name');
                return;
            }
            if (!username.trim()) {
                setError('Please enter a username');
                return;
            }

            // Cognito password requirements
            if (password.length < 8) {
                setError('Password must be at least 8 characters long');
                return;
            }

            if (!/[A-Z]/.test(password)) {
                setError('Password must contain at least one uppercase letter');
                return;
            }

            if (!/[a-z]/.test(password)) {
                setError('Password must contain at least one lowercase letter');
                return;
            }

            if (!/[0-9]/.test(password)) {
                setError('Password must contain at least one number');
                return;
            }

            if (!/[^A-Za-z0-9]/.test(password)) {
                setError('Password must contain at least one special character');
                return;
            }
        }

        setLoading(true);

        try {
            if (mode === 'login') {
                await signIn(email, password);
                // Navigation is handled by App.tsx conditional rendering
            } else {
                await signUp(email, password, name, username);
                // Navigate to verification screen
                navigation.replace('VerifyEmail', { email, username });
            }
        } catch (err: any) {
            // Better error messages
            let errorMessage = err.message || 'An error occurred';

            if (errorMessage.includes('User already exists')) {
                errorMessage = 'An account with this email already exists. Please log in instead.';
            } else if (errorMessage.includes('Password did not conform')) {
                errorMessage = 'Password must be at least 8 characters with uppercase, lowercase, number, and special character';
            } else if (errorMessage.includes('Incorrect username or password')) {
                if (mode === 'login') {
                    errorMessage = 'Incorrect email or password. Please try again.';
                } else {
                    errorMessage = 'Unable to create account. Please check your password meets all requirements.';
                }
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        setLoading(true);
        try {
            await signInWithGoogle();
            // OAuth redirect will handle navigation
        } catch (err: any) {
            setError(err.message || 'Google sign in failed');
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* Banner at the very top - full width */}
            <Image
                source={require('../assets/magic-goat-banner.png')}
                style={styles.banner}
                resizeMode="cover"
            />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.content}>
                    <Text style={styles.subtitle}>
                        {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                    </Text>

                    {/* Error Message */}
                    {error ? <Text style={styles.error}>{error}</Text> : null}

                    {/* Form */}
                    <View style={styles.form}>
                        {mode === 'signup' && (
                            <>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Name"
                                    placeholderTextColor="#888"
                                    value={name}
                                    onChangeText={setName}
                                    autoCapitalize="words"
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Username"
                                    placeholderTextColor="#888"
                                    value={username}
                                    onChangeText={setUsername}
                                    autoCapitalize="none"
                                />
                            </>
                        )}

                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor="#888"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor="#888"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            autoCapitalize="none"
                        />

                        {mode === 'signup' && (
                            <Text style={styles.hint}>
                                Password must be 8+ characters with uppercase, lowercase, number, and special character
                            </Text>
                        )}

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[styles.button, styles.primaryButton]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>
                                    {mode === 'login' ? 'Log In' : 'Sign Up'}
                                </Text>
                            )}
                        </TouchableOpacity>

                        {/* Divider */}
                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>OR</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Google Sign In */}
                        <TouchableOpacity
                            style={[styles.button, styles.googleButton]}
                            onPress={handleGoogleSignIn}
                            disabled={loading}
                        >
                            <Text style={styles.googleButtonText}>
                                🔍 Continue with Google
                            </Text>
                        </TouchableOpacity>

                        {/* Toggle Mode */}
                        <TouchableOpacity
                            style={styles.toggleButton}
                            onPress={() => {
                                setMode(mode === 'login' ? 'signup' : 'login');
                                setError('');
                            }}
                        >
                            <Text style={styles.toggleText}>
                                {mode === 'login'
                                    ? "Don't have an account? Sign Up"
                                    : 'Already have an account? Log In'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f0518',
    },
    banner: {
        width: '100%',
        height: 150,
    },
    scrollContent: {
        flexGrow: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 32,
        paddingVertical: 24,
    },
    subtitle: {
        fontSize: 20,
        color: '#a855f7',
        textAlign: 'center',
        marginBottom: 32,
    },
    error: {
        color: '#ef4444',
        textAlign: 'center',
        marginBottom: 16,
        padding: 12,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 8,
    },
    hint: {
        color: '#888',
        fontSize: 12,
        marginTop: -12,
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    form: {
        width: '100%',
    },
    input: {
        backgroundColor: '#1a1a2e',
        borderWidth: 1,
        borderColor: '#2e1065',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        fontSize: 16,
        color: '#fff',
    },
    button: {
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginBottom: 16,
    },
    primaryButton: {
        backgroundColor: '#a855f7',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    googleButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    googleButtonText: {
        color: '#333',
        fontSize: 16,
        fontWeight: '600',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#2e1065',
    },
    dividerText: {
        color: '#888',
        paddingHorizontal: 16,
        fontSize: 14,
    },
    toggleButton: {
        marginTop: 16,
        padding: 12,
    },
    toggleText: {
        color: '#a855f7',
        textAlign: 'center',
        fontSize: 14,
    },
});
