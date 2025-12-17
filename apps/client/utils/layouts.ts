import { ViewStyle, DimensionValue } from 'react-native';

interface PlayerLayout {
    width: DimensionValue;
    height: DimensionValue;
    rotation: number;
}

interface LayoutConfiguration {
    [playerCount: number]: {
        styles: ViewStyle;
        players: PlayerLayout[];
        isColumnLayout?: boolean;
    };
}

export const layouts: LayoutConfiguration = {
    2: {
        styles: {
            flexDirection: 'row',
            flexWrap: 'wrap',
        },
        players: [
            { width: '100%', height: '50%', rotation: 180 },
            { width: '100%', height: '50%', rotation: 0 },
        ],
    },
    3: {
        styles: {
            flexDirection: 'row',
            flexWrap: 'wrap',
        },
        players: [
            { width: '100%', height: '50%', rotation: 180 },
            { width: '50%', height: '50%', rotation: 0 },
            { width: '50%', height: '50%', rotation: 0 },
        ],
    },
    4: {
        styles: {
            flexDirection: 'row',
            flexWrap: 'wrap',
        },
        players: [
            { width: '50%', height: '50%', rotation: 180 },
            { width: '50%', height: '50%', rotation: 180 },
            { width: '50%', height: '50%', rotation: 0 },
            { width: '50%', height: '50%', rotation: 0 },
        ],
    },
    5: {
        styles: {
            flexDirection: 'row',
        },
        players: [
            { width: '100%', height: '33.33%', rotation: 90 },
            { width: '100%', height: '33.33%', rotation: 90 },
            { width: '100%', height: '33.33%', rotation: 90 },
            { width: '100%', height: '50%', rotation: -90 },
            { width: '100%', height: '50%', rotation: -90 },
        ],
        isColumnLayout: true,
    },
    6: {
        styles: {
            flexDirection: 'row',
        },
        players: [
            { width: '100%', height: '33.33%', rotation: 90 },
            { width: '100%', height: '33.33%', rotation: 90 },
            { width: '100%', height: '33.33%', rotation: 90 },
            { width: '100%', height: '33.33%', rotation: -90 },
            { width: '100%', height: '33.33%', rotation: -90 },
            { width: '100%', height: '33.33%', rotation: -90 },
        ],
        isColumnLayout: true,
    },
};
