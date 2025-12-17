import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface RoundTimerProps {
    startTime: Date | null;
    durationMinutes: number;
    paused: boolean;
}

export const RoundTimer: React.FC<RoundTimerProps> = ({ startTime, durationMinutes, paused }) => {
    const [timeRemaining, setTimeRemaining] = useState<number>(0);

    useEffect(() => {
        if (!startTime || paused) {
            return;
        }

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const start = new Date(startTime).getTime();
            const elapsed = Math.floor((now - start) / 1000); // seconds
            const total = durationMinutes * 60;
            const remaining = Math.max(0, total - elapsed);

            setTimeRemaining(remaining);
        }, 1000);

        return () => clearInterval(interval);
    }, [startTime, durationMinutes, paused]);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const isLowTime = timeRemaining > 0 && timeRemaining < 300; // Less than 5 minutes
    const isExpired = timeRemaining === 0 && startTime !== null;

    if (!startTime) {
        return (
            <View style={styles.container}>
                <Text style={styles.timerText}>--:--</Text>
                <Text style={styles.statusText}>Timer not started</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={[
                styles.timerText,
                isExpired && styles.expiredText,
                isLowTime && styles.lowTimeText,
            ]}>
                {formatTime(timeRemaining)}
            </Text>
            {paused && <Text style={styles.statusText}>PAUSED</Text>}
            {isExpired && <Text style={styles.statusText}>TIME EXPIRED</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#2a2a2a',
        borderRadius: 10,
        marginVertical: 10,
    },
    timerText: {
        color: 'white',
        fontSize: 48,
        fontWeight: 'bold',
        fontFamily: 'monospace',
    },
    lowTimeText: {
        color: '#fbbf24', // Yellow warning
    },
    expiredText: {
        color: '#ef4444', // Red
    },
    statusText: {
        color: '#aaa',
        fontSize: 14,
        marginTop: 5,
    },
});
