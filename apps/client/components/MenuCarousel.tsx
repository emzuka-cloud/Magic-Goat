import React from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    SharedValue,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { ChevronLeft, ChevronRight, LucideIcon } from 'lucide-react-native';

export interface MenuCarouselItem {
    title: string;
    color: string;
    Icon: LucideIcon;
    badge?: number;
    onOpen: () => void;
}

/*
 * Home menu as a 3D ring of cards turning around the vertical axis (after React Bits' CircularCarousel,
 * "cylinder" preset). React Native has no CSS preserve-3d, so each card is projected to 2D from its angle
 * on the ring: position, scale, turn, depth order and fade.
 *
 * Drag spins it with momentum and snaps to a card; tapping a side card brings it to the front; tapping the
 * front card opens it. No idle drift: this is navigation used many times a day, its targets shouldn't move
 * on their own.
 */

// Apple-style spring (duration 500ms, bounce 0.2): carries the drag's velocity into the snap.
const SNAP_SPRING = { duration: 500, dampingRatio: 0.8 } as const;
const GAP = 24;
const TILT = 8; // degrees the camera looks down, so the back of the ring sits a little higher
const MOMENTUM = 0.25; // seconds of fling velocity projected forward when picking the card to snap to
const DEPTH_FADE = 0.55; // how much the cards at the back fade
// With few items a ring looks bare and neighbours turn edge-on (5 cards = 72° apart). Repeat the items
// until the ring has at least this many cards; copies sit opposite each other, so only one is ever visible.
const MIN_RING = 10;

/** Angle in (-180, 180]. Runs on the UI thread too. */
function wrap(deg: number) {
    'worklet';
    const a = ((deg % 360) + 540) % 360 - 180;
    return a === -180 ? 180 : a;
}

interface CardProps {
    item: MenuCarouselItem;
    index: number;
    step: number;
    angle: SharedValue<number>;
    radius: number;
    width: number;
    height: number;
    onPress: () => void;
}

function Card({ item, index, step, angle, radius, width, height, onPress }: CardProps) {
    const perspective = radius * 4;
    const style = useAnimatedStyle(() => {
        const theta = wrap(index * step + angle.value); // 0 = facing you
        const rad = (theta * Math.PI) / 180;
        const z = radius * (Math.cos(rad) - 1); // 0 at the front, -2r at the back
        const s = perspective / (perspective - z);
        const facing = Math.cos(rad); // 1 front, 0 side-on, -1 back
        return {
            zIndex: Math.round(facing * 100) + 100,
            // Back-facing cards fade out instead of showing their mirrored back.
            opacity: facing < -0.1 ? 0 : 1 - DEPTH_FADE * (1 - facing) / 2,
            transform: [
                { perspective },
                { translateX: radius * Math.sin(rad) * s },
                { translateY: z * Math.sin((TILT * Math.PI) / 180) * s },
                { scale: s },
                { rotateY: `${theta}deg` },
            ],
        };
    });

    return (
        <Animated.View style={[styles.cardSlot, { width, height, marginLeft: -width / 2, marginTop: -height / 2 }, style]}>
            <Pressable
                onPress={onPress}
                style={[styles.card, { backgroundColor: item.color }]}
                accessibilityRole="button"
                accessibilityLabel={item.badge ? `${item.title}, ${item.badge} unread` : item.title}
            >
                <item.Icon color="white" size={Math.round(width * 0.22)} />
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                {!!item.badge && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.badge > 99 ? '99+' : item.badge}</Text>
                    </View>
                )}
            </Pressable>
        </Animated.View>
    );
}

export function MenuCarousel({ items }: { items: MenuCarouselItem[] }) {
    const { width: screenW } = useWindowDimensions();
    const reduceMotion = useReducedMotion();
    const count = items.length * Math.max(1, Math.ceil(MIN_RING / items.length)); // cards on the ring
    const step = 360 / count;
    const cardW = Math.min(screenW * 0.42, 200);
    const cardH = cardW * 1.25;
    // Ring just big enough that neighbouring cards sit GAP apart (chord between card centres).
    const radius = (cardW + GAP) / (2 * Math.sin(Math.PI / count));
    const perPixel = 180 / (Math.PI * radius); // degrees per pixel dragged, so the front card tracks the finger

    const angle = useSharedValue(0);
    const dragStart = useSharedValue(0);

    const settle = (target: number, velocity = 0) => {
        'worklet';
        angle.value = reduceMotion
            ? withTiming(target, { duration: 0 })
            : withSpring(target, { ...SNAP_SPRING, velocity });
    };

    const pan = Gesture.Pan()
        .activeOffsetX([-10, 10]) // short taps stay taps
        .failOffsetY([-15, 15]) // a vertical drag scrolls the page instead
        .onStart(() => {
            dragStart.value = angle.value;
        })
        .onUpdate(e => {
            angle.value = dragStart.value + e.translationX * perPixel;
        })
        .onEnd(e => {
            const velocity = e.velocityX * perPixel; // deg/s
            const target = Math.round((angle.value + velocity * MOMENTUM) / step) * step;
            settle(target, velocity);
        });

    const frontIndex = () => ((Math.round(-angle.value / step) % count) + count) % count;

    /** Turn the shortest way until card `index` faces you. */
    const bringToFront = (index: number) => {
        const target = angle.value - wrap(index * step + angle.value);
        settle(target);
    };

    const onCardPress = (index: number) => {
        if (index === frontIndex()) items[index % items.length].onOpen();
        else bringToFront(index);
    };

    const turn = (by: number) => bringToFront((frontIndex() + by + count) % count);

    return (
        <View style={styles.wrapper}>
            <GestureDetector gesture={pan}>
                <View style={[styles.stage, { height: cardH * 1.35 }]} accessibilityHint="Swipe to turn the menu, tap a card to open it">
                    {Array.from({ length: count }, (_, i) => (
                        <Card
                            key={i}
                            item={items[i % items.length]}
                            index={i}
                            step={step}
                            angle={angle}
                            radius={radius}
                            width={cardW}
                            height={cardH}
                            onPress={() => onCardPress(i)}
                        />
                    ))}
                </View>
            </GestureDetector>

            {/* For mouse and keyboard users: dragging isn't obvious on desktop. */}
            <View style={styles.controls}>
                <Pressable style={styles.arrow} onPress={() => turn(-1)} accessibilityRole="button" accessibilityLabel="Previous">
                    <ChevronLeft color="white" size={22} />
                </Pressable>
                <Pressable style={styles.arrow} onPress={() => turn(1)} accessibilityRole="button" accessibilityLabel="Next">
                    <ChevronRight color="white" size={22} />
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        alignItems: 'center',
    },
    stage: {
        width: '100%',
        overflow: 'hidden',
        zIndex: 0, // own stacking context: the cards' depth z-indexes must not cover the header dropdown
    },
    cardSlot: {
        position: 'absolute',
        left: '50%',
        top: '50%',
    },
    card: {
        flex: 1,
        borderRadius: 18,
        padding: 16,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 8,
    },
    cardTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    badge: {
        position: 'absolute',
        top: 10,
        right: 10,
        minWidth: 24,
        height: 24,
        borderRadius: 12,
        paddingHorizontal: 6,
        backgroundColor: '#ef4444',
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    controls: {
        flexDirection: 'row',
        gap: 24,
        marginTop: 8,
    },
    arrow: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(168, 85, 247, 0.25)',
        borderWidth: 1,
        borderColor: 'rgba(168, 85, 247, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
