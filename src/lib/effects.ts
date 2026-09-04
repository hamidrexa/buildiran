/**
 * BuildIran — Animation Effects Library (react-native-reanimated)
 * Reusable animation hooks and presets for game UI.
 */

import {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  interpolate,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useEffect, useCallback } from 'react';

// ─── Glow Pulse ──────────────────────────────────────────────────────────────
// Continuously pulsing glow/opacity effect for highlighted elements.

export function useGlowPulse(minOpacity = 0.5, maxOpacity = 1.0) {
  const opacity = useSharedValue(minOpacity);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(maxOpacity, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return { style, opacity };
}

// ─── Float In ────────────────────────────────────────────────────────────────
// Modal / card entrance animation (fade + translate up).

export function useFloatIn(delayMs = 0) {
  const translateY = useSharedValue(40);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delayMs,
      withSpring(0, { damping: 14, stiffness: 120 })
    );
    opacity.value = withDelay(
      delayMs,
      withTiming(1, { duration: 350, easing: Easing.out(Easing.quad) })
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return { style };
}

// ─── Scale Pop ───────────────────────────────────────────────────────────────
// Quick scale-up pop for buttons and confirmations.

export function useScalePop() {
  const scale = useSharedValue(1);

  const pop = useCallback(() => {
    scale.value = withSequence(
      withTiming(0.92, { duration: 80, easing: Easing.out(Easing.quad) }),
      withSpring(1, { damping: 8, stiffness: 200 })
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { style, pop };
}

// ─── Shake (error feedback) ───────────────────────────────────────────────────

export function useShake() {
  const translateX = useSharedValue(0);

  const shake = useCallback(() => {
    translateX.value = withSequence(
      withTiming(-8, { duration: 60 }),
      withTiming(8,  { duration: 60 }),
      withTiming(-8, { duration: 60 }),
      withTiming(8,  { duration: 60 }),
      withTiming(0,  { duration: 60 })
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return { style, shake };
}

// ─── Counting Number ─────────────────────────────────────────────────────────
// Animate a number from 0 to target (useful for stats display).

export function useCountUp(target: number, duration = 1000) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(target, {
      duration,
      easing: Easing.out(Easing.quad),
    });
  }, [target]);

  const animatedValue = useAnimatedStyle(() => {
    // This returns style, not value; use in a Text component with onLayout trick
    return {};
  });

  return { progress };
}

// ─── Stat Bar Fill ────────────────────────────────────────────────────────────
// Animates a horizontal bar from 0% to a percentage.

export function useStatBarFill(targetPercent: number, delay = 0) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withDelay(
      delay,
      withTiming(Math.min(Math.max(targetPercent, 0), 100), {
        duration: 1000,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [targetPercent]);

  const style = useAnimatedStyle(() => ({
    width: `${width.value}%` as any,
  }));

  return { style };
}

// ─── Floating Particles (for login background) ─────────────────────────────
// Simple floating particle animation data.

export function useParticle(index: number) {
  const y = useSharedValue(0);
  const x = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    const delay = index * 200;
    const duration = 3000 + Math.random() * 2000;

    opacity.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(0.7, { duration: duration * 0.3 }),
        withTiming(0.2, { duration: duration * 0.7 }),
      ),
      -1, true
    ));

    y.value = withDelay(delay, withRepeat(
      withTiming(-300, { duration, easing: Easing.linear }),
      -1, false
    ));

    scale.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(1, { duration: duration * 0.5 }),
        withTiming(0.3, { duration: duration * 0.5 }),
      ),
      -1, true
    ));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  return { style };
}

// ─── Bounce In ───────────────────────────────────────────────────────────────

export function useBounceIn(delay = 0) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 200 }));
    scale.value = withDelay(
      delay,
      withSpring(1, { damping: 10, stiffness: 180, mass: 0.8 })
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return { style };
}
