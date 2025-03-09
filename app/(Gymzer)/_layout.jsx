import React from 'react';
import Navbar from '../Navbar/_layout';
import { Slot } from 'expo-router';
import { View, StyleSheet, Animated } from 'react-native';

export default function Login() {
  const scrollY = new Animated.Value(0);
  
  const navbarOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Slot />
      </View>
      <Animated.View style={[styles.navbarContainer, { opacity: navbarOpacity }]}>
        <Navbar />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  navbarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  }
});