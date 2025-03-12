import React, { useEffect } from 'react';
import Navbar from '../Navbar/_layout';
import { Slot, usePathname } from 'expo-router';
import { View, StyleSheet, Animated } from 'react-native';

export default function Login() {
  const scrollY = new Animated.Value(0);
  const pathname = usePathname();
  
  const navbarOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });
  
  // Vérifie si le chemin actuel est celui de CoachB avec une vérification stricte
  const isCoachB = pathname.includes('Coachb');
  
  // Débogage
  useEffect(() => {
    console.log('Chemin actuel:', pathname);
    console.log('isCoachB:', isCoachB);
  }, [pathname]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Slot />
      </View>
      {!isCoachB ? (
        <Animated.View 
          style={[
            styles.navbarContainer, 
            { opacity: navbarOpacity }
          ]}
        >
          <Navbar />
        </Animated.View>
      ) : null}
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