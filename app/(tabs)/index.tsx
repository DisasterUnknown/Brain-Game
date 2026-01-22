import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const glow = useSharedValue(0);

  useEffect(() => {
    glow.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedButtonStyle = useAnimatedStyle(() => ({
    opacity: 0.8 + glow.value * 0.2,
    shadowRadius: 15 + glow.value * 15,
    transform: [{ scale: 1 + glow.value * 0.05 }],
  }));

  // Floating particle animation positions
  const particles = React.useMemo(() => Array.from({ length: 20 }).map(() => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 6 + 2,
  })), []);

  const handleResume = () => router.push('/(tabs)/pages/game');
  const handleMap = () => router.push('/(tabs)/pages/map');
  const handleOptions = () => router.push('/(tabs)/pages/options');

  return (
    <View style={styles.container}>
      {/* Dark Gradient Background */}
      <LinearGradient
        colors={['#000000', '#140027', '#1b0036']}
        start={[0, 0]}
        end={[1, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Floating neon particles */}
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            borderRadius: p.size / 2,
            backgroundColor: '#ff66ff',
            opacity: 0.4,
          }}
        />
      ))}

      <Text style={styles.title}>  Find the Path  </Text>

      <View style={styles.buttonContainer}>
        <Animated.View style={[styles.buttonWrapper, animatedButtonStyle]}>
          <TouchableOpacity style={styles.button} onPress={handleResume}>
            <Text style={styles.buttonText}>  Resume Play  </Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.buttonWrapper, animatedButtonStyle]}>
          <TouchableOpacity style={styles.button} onPress={handleMap}>
            <Text style={styles.buttonText}>  Map  </Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.buttonWrapper, animatedButtonStyle]}>
          <TouchableOpacity style={styles.button} onPress={handleOptions}>
            <Text style={styles.buttonText}>  Options  </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  title: {
    fontSize: 42,
    color: '#f8acf8',
    fontWeight: 'bold',
    marginBottom: 70,
    textShadowColor: '#ff33ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 25,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  buttonWrapper: {
    marginBottom: 25,
  },
  button: {
    backgroundColor: '#330066', // deep purple button
    paddingVertical: 18,
    paddingHorizontal: 50,
    borderRadius: 15,
    width: width * 0.7,
    alignItems: 'center',
    shadowColor: '#f157f1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
  },
  buttonText: {
    color: '#f8b9f8',
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: '#f209f2',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
});