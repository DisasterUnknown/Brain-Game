import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
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

const { width } = Dimensions.get('window');

const HEX_SIZE = 35;
const HEX_HEIGHT = HEX_SIZE * 2;
const HEX_WIDTH = Math.sqrt(3) * HEX_SIZE;
const VERT_SPACING = HEX_HEIGHT * 0.75;
const HORIZ_SPACING = HEX_WIDTH;

/* ========================= TYPES ========================= */

interface HexProps {
    level: number | null;
    x: number;
    y: number;
    type: 'normal' | 'boss' | 'empty';
}

/* ========================= HEX ========================= */

const Hexagon: React.FC<HexProps> = ({ level, x, y, type }) => {
    const points = [
        [HEX_WIDTH / 2, 0],
        [HEX_WIDTH, HEX_HEIGHT / 4],
        [HEX_WIDTH, (HEX_HEIGHT * 3) / 4],
        [HEX_WIDTH / 2, HEX_HEIGHT],
        [0, (HEX_HEIGHT * 3) / 4],
        [0, HEX_HEIGHT / 4],
    ]
        .map(p => `${p[0]},${p[1]}`)
        .join(' ');

    const isBoss = type === 'boss';
    const isEmpty = type === 'empty';

    return (
        <View style={[styles.hexContainer, { left: x, top: y }]}>
            <Svg width={HEX_WIDTH} height={HEX_HEIGHT}>
                <Polygon
                    points={points}
                    fill={
                        isBoss
                            ? 'transparent'
                            : isEmpty
                            ? '#0a0015'
                            : '#1a0033'
                    }
                    stroke={
                        isBoss
                            ? '#ff0033'
                            : isEmpty
                            ? '#330055'
                            : '#ff66ff'
                    }
                    strokeWidth={isBoss ? 3 : isEmpty ? 1 : 2}
                    opacity={isEmpty ? 0.3 : 1}
                />
            </Svg>

            {!isEmpty && (
                <View style={[styles.hexContent, { width: HEX_WIDTH, height: HEX_HEIGHT }]}>
                    <Text
                        style={[
                            styles.hexText,
                            isBoss && styles.bossText,
                        ]}
                    >
                        {isBoss ? '∞' : level}
                    </Text>
                </View>
            )}
        </View>
    );
};

/* ========================= SCREEN ========================= */

export default function MapScreen() {
    const router = useRouter();
    const glow = useSharedValue(0);

    useEffect(() => {
        glow.value = withRepeat(
            withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );
    }, []);

    const generateHexMap = () => {
        const hexes: HexProps[] = [];

        const rows = 60;
        const cols = 10;

        /* ===== PATTERNS ===== */

        const bossPattern = [
            [2, 3], [2, 4],
            [3, 2], [3, 3], [3, 4],
            [4, 3], [4, 4],
        ];

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
        const levelSet = new Set(levelPattern.slice(0, 100).map(p => `${p[0]}-${p[1]}`));

        let levelCounter = 1;

        const totalColsView = 8;
        const gridWidth = totalColsView * HORIZ_SPACING;
        const offsetXStart = (width - gridWidth) / 2;

        for (let row = rows - 1; row >= 0; row--) {
            const isEvenRow = row % 2 === 0;

            for (let col = -2; col < cols; col++) {
                const x =
                    col * HORIZ_SPACING +
                    offsetXStart +
                    (isEvenRow ? 0 : HORIZ_SPACING / 2);

                const y = row * VERT_SPACING - 50;
                const key = `${row}-${col}`;

                if (bossSet.has(key)) {
                    hexes.push({ level: null, x, y, type: 'boss' });
                } else if (levelSet.has(key) && levelCounter <= 100) {
                    hexes.push({ level: levelCounter, x, y, type: 'normal' });
                    levelCounter++;
                } else {
                    hexes.push({ level: null, x, y, type: 'empty' });
                }
            }
        }

        return hexes;
    };

    const hexes = generateHexMap();

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#000000', '#140027', '#1b0036']}
                style={StyleSheet.absoluteFill}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {hexes.map((hex, i) => (
                    <Hexagon key={i} {...hex} />
                ))}
            </ScrollView>

            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
        </View>
    );
}

/* ========================= STYLES ========================= */

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { minHeight: HEX_SIZE * 78 },
    hexContainer: { position: 'absolute' },
    hexContent: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    hexText: {
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
    backButton: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        backgroundColor: '#330066',
        paddingVertical: 15,
        paddingHorizontal: 25,
        borderRadius: 15,
    },
    backButtonText: {
        color: '#f8b9f8',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
