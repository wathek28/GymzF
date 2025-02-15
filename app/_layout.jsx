import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      {/* Désactivation de l'en-tête pour l'écran login */}
      <Stack.Screen name="(login)" options={{ headerShown: false }} />
      {/* Désactivation de l'en-tête pour l'écran home */}
      <Stack.Screen name="home" options={{ headerShown: false }} />
      {/* Désactivation de l'en-tête pour l'écran profil */}
      <Stack.Screen name="(profil)" options={{ headerShown: false }} />
      {/* Désactivation de l'en-tête pour l'écran coach */}
      <Stack.Screen name="(coach)" options={{ headerShown: false  }} />
       {/* Désactivation de l'en-tête pour l'écran coach */}
      <Stack.Screen name="(event)" options={{ headerShown: false  }} />
      

      
    </Stack>
  );
}
