import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
    interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient'; // Ensure this is installed, otherwise might need substitute or handle differently if project uses plain View

interface AnimatedBackgroundProps {
    color: string;
}

// Generate complementary colors based on base color
const generatePalette = (baseColor: string): string[] => {
    // For now, use predefined palettes based on common MTG colors
    const palettes: Record<string, string[]> = {
        '#ef4444': ['#dc2626', '#991b1b', '#7f1d1d'], // Red (Fire/Magma)
        '#3b82f6': ['#1d4ed8', '#1e3a8a', '#0c1844'], // Blue (Ocean/Sky)
        '#22c55e': ['#16a34a', '#15803d', '#14532d'], // Green (Forest)
        '#eab308': ['#ca8a04', '#a16207', '#713f12'], // Yellow/Gold
        '#8b5cf6': ['#7c3aed', '#6d28d9', '#5b21b6'], // Purple/Violet
        '#f97316': ['#ea580c', '#c2410c', '#9a3412'], // Orange
        '#ec4899': ['#db2777', '#be185d', '#9f1239'], // Pink/Magenta
    };

    // Find closest match or default to a neutral gradient
    return palettes[baseColor] || [baseColor, '#1a1a1a', '#000000'];
};

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ color }) => {
    const progress = useSharedValue(0);
    const palette = generatePalette(color);

    useEffect(() => {
        // Infinite loop animation (breathing/flowing effect)
        progress.value = withRepeat(
            withTiming(1, {
                duration: 6000, // 6 seconds for a full cycle
                easing: Easing.inOut(Easing.ease),
            }),
            -1, // Infinite
            true // Reverse (ping-pong)
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        // Interpolate rotation for a flowing effect
        const rotate = interpolate(progress.value, [0, 1], [0, 15]);
        // Interpolate scale for a breathing effect
        const scale = interpolate(progress.value, [0, 0.5, 1], [1, 1.1, 1]);
        // Interpolate opacity for additional depth
        const opacity = interpolate(progress.value, [0, 0.5, 1], [0.85, 1, 0.85]);

        return {
            transform: [{ rotate: `${rotate}deg` }, { scale }],
            opacity,
        };
    });

    return (
        <Animated.View style={[styles.gradientContainer, animatedStyle]}>
            {/* Note: LinearGradient requires 'expo-linear-gradient' */}
            <LinearGradient
                colors={[palette[0], palette[1], palette[2], palette[0]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
            />
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    gradientContainer: {
        ...StyleSheet.absoluteFillObject,
        width: '120%',
        height: '120%',
        left: '-10%',
        top: '-10%',
    },
});
