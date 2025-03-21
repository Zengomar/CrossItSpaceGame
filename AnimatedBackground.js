import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View, Easing } from 'react-native';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

const AnimatedBackground = React.memo(({ backgroundImage }) => {
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scrollY, {
          toValue: screenHeight,
          duration: 5000,
          easing: Easing.linear,
          useNativeDriver: true, // Changed to true
        }),
        Animated.timing(scrollY, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true, // Changed to true
        }),
      ])
    ).start();
  }, [scrollY]);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={backgroundImage}
        style={[styles.background, { transform: [{ translateY: scrollY }] }]}
        resizeMode="cover"
      />
      <Animated.Image
        source={backgroundImage}
        style={[
          styles.background,
          { transform: [{ translateY: Animated.add(scrollY, -screenHeight) }] },
        ]}
        resizeMode="cover"
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: screenWidth,
    height: screenHeight,
    overflow: 'hidden',
  },
  background: {
    position: 'absolute',
    width: screenWidth,
    height: screenHeight,
  },
});

export default AnimatedBackground;
