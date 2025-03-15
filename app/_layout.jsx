import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {/* Désactivation de l'en-tête pour l'écran login */}
      <Stack.Screen name="(login)" />
      {/* Désactivation de l'en-tête pour l'écran home */}
      <Stack.Screen name="home" />
      {/* Désactivation de l'en-tête pour l'écran profil */}
      <Stack.Screen name="(profil)" />
      {/* Désactivation de l'en-tête pour l'écran coach */}
      <Stack.Screen name="(coach)" />
      {/* Désactivation de l'en-tête pour l'écran event */}
      <Stack.Screen name="(event)" />
      {/* Désactivation de l'en-tête pour l'écran Gymzer */}
      <Stack.Screen name="(Gymzer)" />
      {/* Désactivation de l'en-tête pour l'écran Salle */}
      <Stack.Screen name="(Salle)" />
      {/* Désactivation de l'en-tête pour l'écran Reels */}
      <Stack.Screen name="(Reels)" />
    </Stack>
  );
}