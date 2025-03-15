import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Slot } from 'expo-router';

export default function ReelsLayout() {
  // Ce layout permet d'afficher les écrans de la section Reels
  // tout en conservant la structure de navigation
  return (
    <View style={styles.container}>
      <Slot />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});