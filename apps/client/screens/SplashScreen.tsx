import React, { useEffect } from 'react';
import { View, StyleSheet, Image, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    withSequence,
    withDelay,
    withRepeat,
    Easing,
    interpolateColor
} from 'react-native-reanimated';
export const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
    const [phase, setPhase] = React.useState<'zoom' | 'intro' | 'glow' | 'fadeOut'>('zoom');

    // Shared values for animations
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);
    const glowScale1 = useSharedValue(0);
    const glowOpacity1 = useSharedValue(0);
    const glowScale2 = useSharedValue(0);
    const glowOpacity2 = useSharedValue(0);
    const flashOpacity = useSharedValue(0);
    const bgProgress = useSharedValue(0);

    // Particles
    const particles = Array(20).fill(0).map(() => ({
        scale: useSharedValue(0),
        x: useSharedValue(0),
        y: useSharedValue(0),
        opacity: useSharedValue(0),
    }));

    useEffect(() => {
        // Background animation (breathing effect)
        bgProgress.value = withRepeat(
            withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
            -1, // Infinite repeat
            true // Reverse
        );

        // Sequence runner
        const runSequence = async () => {
            // Phase 1: Zoom/Intro
            setPhase('intro');
            scale.value = withSpring(1, {
                damping: 12,
                stiffness: 90,
                mass: 1
            });
            opacity.value = withTiming(1, { duration: 800 });

            // Wait for intro
            await new Promise(r => setTimeout(r, 800));

            // Phase 2: Glow & Particles
            setPhase('glow');

            // Glow rings
            glowScale1.value = withTiming(2, { duration: 1000 });
            glowOpacity1.value = withSequence(withTiming(0.6, { duration: 500 }), withTiming(0, { duration: 500 }));

            glowScale2.value = withDelay(100, withTiming(1.8, { duration: 1000 }));
            glowOpacity2.value = withDelay(100, withSequence(withTiming(0.5, { duration: 500 }), withTiming(0, { duration: 500 })));

            // Flash
            flashOpacity.value = withSequence(withTiming(0.3, { duration: 200 }), withTiming(0, { duration: 200 }));

            // Particles
            particles.forEach((p, i) => {
                const angle = (i / 20) * Math.PI * 2;
                const distance = 200;

                p.scale.value = withSequence(withTiming(1, { duration: 200 }), withTiming(0, { duration: 800 }));
                p.opacity.value = withSequence(withTiming(1, { duration: 200 }), withTiming(0, { duration: 800 }));
                p.x.value = withTiming(Math.cos(angle) * distance, { duration: 1000, easing: Easing.out(Easing.ease) });
                p.y.value = withTiming(Math.sin(angle) * distance, { duration: 1000, easing: Easing.out(Easing.ease) });
            });

            // Wait for glow
            await new Promise(r => setTimeout(r, 1500));

            // Phase 3: Fade Out
            setPhase('fadeOut');
            scale.value = withTiming(1.2, { duration: 500 });
            opacity.value = withTiming(0, { duration: 500 });

            // Signal finish
            setTimeout(() => {
                onFinish();
            }, 500);
        };

        runSequence();
    }, []);

    const containerStyle = useAnimatedStyle(() => {
        const backgroundColor = interpolateColor(
            bgProgress.value,
            [0, 1],
            ['#0f0518', '#2e1065'] // Deep black-purple to rich purple
        );
        return { backgroundColor };
    });

    const logoStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    const glow1Style = useAnimatedStyle(() => ({
        transform: [{ scale: glowScale1.value }],
        opacity: glowOpacity1.value,
    }));

    const glow2Style = useAnimatedStyle(() => ({
        transform: [{ scale: glowScale2.value }],
        opacity: glowOpacity2.value,
    }));

    const flashStyle = useAnimatedStyle(() => ({
        opacity: flashOpacity.value,
    }));

    return (
        <Animated.View style={[styles.container, containerStyle]}>
            {/* Glow Rings */}
            <Animated.View style={[styles.glowRing, { backgroundColor: 'rgba(168, 85, 247, 0.4)', width: 300, height: 300, borderRadius: 150 }, glow1Style]} />
            <Animated.View style={[styles.glowRing, { backgroundColor: 'rgba(251, 191, 36, 0.3)', width: 250, height: 250, borderRadius: 125 }, glow2Style]} />

            {/* Particles */}
            {particles.map((p, i) => {
                const particleStyle = useAnimatedStyle(() => ({
                    transform: [
                        { translateX: p.x.value },
                        { translateY: p.y.value },
                        { scale: p.scale.value }
                    ],
                    opacity: p.opacity.value
                }));
                return <Animated.View key={i} style={[styles.particle, particleStyle]} />;
            })}

            {/* Main Logo */}
            <Animated.View style={[styles.logoContainer, logoStyle]}>
                <Image
                    source={require('../assets/magic-goat-logo-circular.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
            </Animated.View>

            {/* Flash Overlay */}
            <Animated.View style={[styles.flash, flashStyle]} />
        </Animated.View>
    );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    logoContainer: {
        width: width * 0.8,
        height: width * 0.8,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    glowRing: {
        position: 'absolute',
        zIndex: 1,
    },
    particle: {
        position: 'absolute',
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#fbbf24',
        zIndex: 5,
    },
    flash: {
        position: 'absolute',
        width: width,
        height: height,
        backgroundColor: 'white',
        zIndex: 20,
        pointerEvents: 'none',
    },
});
