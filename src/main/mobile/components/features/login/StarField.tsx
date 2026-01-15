import React, { useMemo, useRef, useEffect } from 'react';
import { Dimensions, View, StyleSheet, Animated } from 'react-native';

interface StarFieldProps {
  starCount?: number; // total small stars per layer
  color?: string; // star color
}

// Render a light-weight animated star field using two parallax layers
const StarField: React.FC<StarFieldProps> = ({ starCount = 90, color = '#ffffff' }) => {
  const { width, height } = Dimensions.get('window');

  // Pre-generate star positions and sizes (very small)
  const layer1Stars = useMemo(
    () => Array.from({ length: Math.floor(starCount * 0.6) }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.4 + 0.6, // 0.6~2.0 px
      o: Math.random() * 0.4 + 0.6,  // 0.6~1 opacity
    })),
    [width, height, starCount]
  );

  const layer2Stars = useMemo(
    () => Array.from({ length: Math.floor(starCount * 0.4) }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.2 + 0.4, // 0.4~1.6 px
      o: Math.random() * 0.5 + 0.4,  // 0.4~0.9 opacity
    })),
    [width, height, starCount]
  );

  // Single animated values per layer for efficient movement
  const layer1Translate = useRef(new Animated.Value(0)).current;
  const layer2Translate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // gentle downward drift; wrap around by interpolating large range
    const loop1 = Animated.loop(
      Animated.timing(layer1Translate, {
        toValue: 1,
        duration: 120000, // 120s slow drift
        useNativeDriver: true,
      })
    );
    const loop2 = Animated.loop(
      Animated.timing(layer2Translate, {
        toValue: 1,
        duration: 180000, // 180s even slower
        useNativeDriver: true,
      })
    );
    layer1Translate.setValue(0);
    layer2Translate.setValue(0);
    loop1.start();
    loop2.start();
    return () => {
      loop1.stop();
      loop2.stop();
    };
  }, [layer1Translate, layer2Translate]);

  // Interpolate translateY from 0 to window height and use double layers for seamless loop
  const layer1TranslateY = layer1Translate.interpolate({ inputRange: [0, 1], outputRange: [0, height] });
  const layer2TranslateY = layer2Translate.interpolate({ inputRange: [0, 1], outputRange: [0, height] });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* Layer 2: two copies for seamless flow */}
      <Animated.View style={[styles.layerContainer, { transform: [{ translateY: layer2TranslateY }] }]}>
        {layer2Stars.map((s, idx) => (
          <View key={`l2a-${idx}`} style={{ position: 'absolute', left: s.x, top: s.y, width: s.r, height: s.r, borderRadius: s.r / 2, backgroundColor: color, opacity: s.o * 0.8 }} />
        ))}
      </Animated.View>
      <Animated.View style={[styles.layerContainer, { transform: [{ translateY: Animated.add(layer2TranslateY, new Animated.Value(-height)) }] }]}>
        {layer2Stars.map((s, idx) => (
          <View key={`l2b-${idx}`} style={{ position: 'absolute', left: s.x, top: s.y, width: s.r, height: s.r, borderRadius: s.r / 2, backgroundColor: color, opacity: s.o * 0.8 }} />
        ))}
      </Animated.View>

      {/* Layer 1: two copies for seamless flow */}
      <Animated.View style={[styles.layerContainer, { transform: [{ translateY: layer1TranslateY }] }]}>
        {layer1Stars.map((s, idx) => (
          <View key={`l1a-${idx}`} style={{ position: 'absolute', left: s.x, top: s.y, width: s.r, height: s.r, borderRadius: s.r / 2, backgroundColor: color, opacity: s.o }} />
        ))}
      </Animated.View>
      <Animated.View style={[styles.layerContainer, { transform: [{ translateY: Animated.add(layer1TranslateY, new Animated.Value(-height)) }] }]}>
        {layer1Stars.map((s, idx) => (
          <View key={`l1b-${idx}`} style={{ position: 'absolute', left: s.x, top: s.y, width: s.r, height: s.r, borderRadius: s.r / 2, backgroundColor: color, opacity: s.o }} />
        ))}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  layerContainer: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default StarField;


