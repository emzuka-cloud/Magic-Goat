import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { confirmSignUp, resendSignUpCode } from 'aws-amplify/auth';

type VerifyEmailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'VerifyEmail'>;
type VerifyEmailRouteProp = RouteProp<RootStackParamList, 'VerifyEmail'>;

export const VerifyEmailScreen = () => {
    const navigation = useNavigation<VerifyEmailNavigationProp>();
    const route = useRoute<VerifyEmailRouteProp>();
    const { email, username } = route.params;

    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleVerify = async () => {
        if (!code.trim()) {
            setError('Please enter the verification code');
            return;
        }

        setError('');
        setLoading(true);

        try {
            await confirmSignUp({
                username,
                confirmationCode: code,
            });
            setSuccess('Email verified! You can now log in.');
            setTimeout(() => {
                navigation.replace('Auth');
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            await resendSignUpCode({ username });
            setSuccess('Verification code resent to your email');
        } catch (err: any) {
            setError(err.message || 'Failed to resend code');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Verify Your Email</Text>
                <Text style={styles.subtitle}>
                    We sent a verification code to{'\n'}
                    <Text style={styles.email}>{email}</Text>
                </Text>

                {error ? <Text style={styles.error}>{error}</Text> : null}
                {success ? <Text style={styles.success}>{success}</Text> : null}

                <TextInput
                    style={styles.input}
                    placeholder="Enter 6-digit code"
                    placeholderTextColor="#888"
                    value={code}
                    onChangeText={setCode}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                />

                <TouchableOpacity
                    style={[styles.button, styles.primaryButton]}
                    onPress={handleVerify}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Verify Email</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.resendButton}
                    onPress={handleResendCode}
                    disabled={loading}
                >
                    <Text style={styles.resendText}>Didn't receive the code? Resend</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.replace('Auth')}
                >
                    <Text style={styles.backText}>← Back to Login</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f0518',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fbbf24',
        textAlign: 'center',
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 16,
        color: '#a855f7',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    email: {
        fontWeight: 'bold',
        color: '#fff',
    },
    input: {
        backgroundColor: '#1a1a2e',
        borderWidth: 1,
        borderColor: '#2e1065',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        fontSize: 24,
        color: '#fff',
        textAlign: 'center',
        letterSpacing: 8,
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
    resendButton: {
        padding: 12,
        marginBottom: 24,
    },
    resendText: {
        color: '#a855f7',
        textAlign: 'center',
        fontSize: 14,
    },
    backButton: {
        padding: 12,
    },
    backText: {
        color: '#888',
        textAlign: 'center',
        fontSize: 14,
    },
    error: {
        color: '#ef4444',
        textAlign: 'center',
        marginBottom: 16,
        padding: 12,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 8,
    },
    success: {
        color: '#10b981',
        textAlign: 'center',
        marginBottom: 16,
        padding: 12,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderRadius: 8,
    },
});
