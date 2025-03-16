// Modifiez votre fichier _layout.js comme suit:

import React, { useEffect } from 'react';
import Navbar from '../Navbar/_layout';
import { Slot, usePathname } from 'expo-router';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

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

  // Calculer la hauteur approximative de la navbar
  const navbarHeight = 70; // Ajustez cette valeur selon la hauteur réelle de votre navbar

  return (
    <View style={styles.container}>
      <View style={[
        styles.content,
        !isCoachB && { paddingBottom: navbarHeight } // Ajoute un padding en bas seulement si la navbar est visible
      ]}>
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
    backgroundColor: '#fff', // Assurez-vous que la navbar a un fond
    borderTopWidth: 1,       // Optionnel: ajoute une bordure au top
    borderTopColor: '#eee',  // Optionnel: couleur de la bordure
    elevation: 8,            // Pour Android
    shadowColor: '#000',     // Pour iOS
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  }
});