import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useMemo } from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Easing, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Polygon } from 'react-native-svg';

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');

const currentLevel = 20;
const HEX_SIZE = 35;
const HEX_HEIGHT = HEX_SIZE * 2;
const HEX_WIDTH = Math.sqrt(3) * HEX_SIZE;
const VERT_SPACING = HEX_HEIGHT * 0.75;
const HORIZ_SPACING = HEX_WIDTH;

// Pre-calculate points string once to save CPU cycles
const HEX_POINTS = [
    [HEX_WIDTH / 2, 0],
    [HEX_WIDTH, HEX_HEIGHT / 4],
    [HEX_WIDTH, (HEX_HEIGHT * 3) / 4],
    [HEX_WIDTH / 2, HEX_HEIGHT],
    [0, (HEX_HEIGHT * 3) / 4],
    [0, HEX_HEIGHT / 4],
]
    .map(p => `${p[0]},${p[1]}`)
    .join(' ');

/* ========================= TYPES ========================= */

interface HexProps {
    level: number | null;
    x: number;
    y: number;
    type: 'completed' | 'current' | 'locked' | 'boss' | 'empty';
}

/* ========================= HEX (MEMOIZED) ========================= */

// React.memo prevents unnecessary re-renders of the hundreds of hexagons
const Hexagon = React.memo(({ level, x, y, type }: HexProps) => {
    const isBoss = type === 'boss';
    const isEmpty = type === 'empty';
    const tileColor = isBoss ? '#ff0033' : isEmpty ? '#330055' : type === 'current' ? '#6cff5e' : type === 'completed' ? '#ff66ff' : '#ff7566';
    const tileTextColor = isBoss ? styles.bossText : type === 'completed' ? styles.completedText : type === 'current' ? styles.currentText : styles.lockedText;
    const tileBgColor = isBoss ? 'transparent' : isEmpty ? '#0a0015' : type === 'current' ? '#042c00' : type === 'completed' ? '#1a0033' : '#2b0400';

    return (
        <View style={[styles.hexContainer, { left: x, top: y }]}>
            <Svg width={HEX_WIDTH} height={HEX_HEIGHT}>
                <Polygon
                    points={HEX_POINTS}
                    fill={tileBgColor}
                    stroke={tileColor}
                    strokeWidth={isBoss ? 3 : isEmpty ? 4 : 2}
                    opacity={isEmpty ? 0.4 : 1}
                />
            </Svg>

            {!isEmpty && (
                <View style={[styles.hexContent, { width: HEX_WIDTH, height: HEX_HEIGHT }]}>
                    <Text style={tileTextColor}>
                        {isBoss ? '∞' : type === 'locked' ? 'LOCK' : level}
                    </Text>
                </View>
            )}
        </View>
    );
});

/* ========================= SCREEN ========================= */

export default function MapScreen() {
    const router = useRouter();
    const glow = useSharedValue(0);
    const scrollRef = useRef<ScrollView>(null);

    useEffect(() => {
        glow.value = withRepeat(
            withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );
    }, []);

    // Memoize the entire map data so it only generates ONCE
    const hexes = useMemo(() => {
        const hexData: HexProps[] = [];
        const rows = 60;
        const cols = 10;

        const bossPattern = [[2, 3], [2, 4], [3, 2], [3, 3], [3, 4], [4, 3], [4, 4]];
        const levelPattern = [
            [16, 5], [15, 3], [43, 0], [42, 2], [31, 5], [43, 6], [38, 5],
            [42, 4], [37, 2], [13, 3], [42, 6], [26, 3], [7, 2], [48, 5],
            [32, 1], [48, 3], [19, 6], [30, 3], [21, 2], [29, 1],
            [44, 1], [21, 6], [19, 4], [25, 6], [8, 6], [6, 4],
            [11, 6], [13, 2], [15, 4], [27, 6], [40, 3], [16, 1],
            [6, 1], [39, 3], [27, 0], [37, 4], [22, 3], [40, 2],
            [35, 5], [28, 3], [26, 1], [24, 6], [11, 1], [17, 1],
            [44, 5], [9, 3], [41, 3], [28, 5], [45, 4], [33, 5],
            [30, 2], [34, 5], [38, 6], [18, 2], [30, 1], [30, 4],
            [45, 0], [25, 2], [15, 0], [19, 3], [39, 0], [29, 0],
            [39, 4], [18, 3], [30, 6], [29, 2], [28, 1], [44, 2],
            [17, 6], [35, 1], [46, 2], [43, 2], [20, 5], [33, 3],
            [38, 3], [6, 6], [23, 1], [33, 1], [13, 5], [40, 4],
            [9, 1], [24, 1], [10, 2], [37, 6], [25, 5], [8, 5],
            [9, 2], [22, 4], [43, 4], [32, 2], [45, 2], [36, 2],
            [10, 4], [11, 0], [12, 4], [42, 5], [41, 6], [7, 4],
            [38, 2], [49, 2],
        ];

        const bossSet = new Set(bossPattern.map(p => `${p[0]}-${p[1]}`));
        const levelSet = new Set(levelPattern.map(p => `${p[0]}-${p[1]}`));

        let levelCounter = 1;
        const totalColsView = 8;
        const gridWidth = totalColsView * HORIZ_SPACING;
        const offsetXStart = (width - gridWidth) / 2;

        for (let row = rows - 1; row >= 0; row--) {
            const isEvenRow = row % 2 === 0;
            for (let col = -2; col < cols; col++) {
                const x = col * HORIZ_SPACING + offsetXStart + (isEvenRow ? 0 : HORIZ_SPACING / 2);
                const y = row * VERT_SPACING - 50;
                const key = `${row}-${col}`;

                if (bossSet.has(key)) {
                    hexData.push({ level: null, x, y, type: 'boss' });
                } else if (levelSet.has(key) && levelCounter < currentLevel) {
                    hexData.push({ level: levelCounter++, x, y, type: 'completed' });
                } else if (levelSet.has(key) && levelCounter == currentLevel) {
                    hexData.push({ level: levelCounter++, x, y, type: 'current' });
                } else if (levelSet.has(key) && levelCounter > currentLevel) {
                    hexData.push({ level: levelCounter++, x, y, type: 'locked' });
                } else {
                    hexData.push({ level: null, x, y, type: 'empty' });
                }
            }
        }
        return hexData;
    }, []);

    // Faster scrolling logic
    useEffect(() => {
        const currentHex = hexes.find(h => h.level === currentLevel);
        if (currentHex) {
            const scrollPosition = currentHex.y - SCREEN_HEIGHT / 2 + HEX_HEIGHT / 2;
            // Immediate scroll without a timeout feels snappier
            scrollRef.current?.scrollTo({ y: scrollPosition, animated: false });
        }
    }, [hexes]);

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#000000', '#140027', '#1b0036']}
                style={StyleSheet.absoluteFill}
            />

            <ScrollView
                ref={scrollRef}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                // Optimization: remove items from memory when far off-screen
                removeClippedSubviews={true}
            >
                {hexes.map((hex, i) => (
                    <Hexagon key={`${hex.x}-${hex.y}`} {...hex} />
                ))}
            </ScrollView>

            <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={['#ff00ff9d', '#330066dd']}
                    style={styles.backButtonGradient}
                >
                    <Text style={styles.backButtonText}>← Back</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
}

/* ========================= STYLES ========================= */

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { height: HEX_SIZE * 78 }, // Fixed height is faster than minHeight
    hexContainer: { position: 'absolute' },
    hexContent: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    completedText: {
        color: '#f8acf8',
        fontSize: 14,
        fontWeight: 'bold',
        textShadowColor: '#ff33ff',
        textShadowRadius: 10,
    },
    bossText: {
        color: '#ff0033',
        fontSize: 22,
        textShadowColor: '#ff0033',
        textShadowRadius: 15,
    },
    lockedText: {
        color: '#ff7566',
        fontSize: 14,
        textShadowColor: '#ff7566',
        textShadowRadius: 10,
    },
    currentText: {
        color: '#6cff5e',
        fontSize: 14,
        textShadowColor: '#6cff5e',
        textShadowRadius: 10,
    },
    backButton: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        borderRadius: 15,
        overflow: 'hidden',
    },
    backButtonGradient: {
        paddingVertical: 15,
        paddingHorizontal: 25,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backButtonText: {
        color: '#f8b9f8',
        fontSize: 18,
        fontWeight: 'bold',
        textShadowColor: '#ff33ff',
        textShadowRadius: 10,
    },
});