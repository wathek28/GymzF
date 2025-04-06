import { Stack } from 'expo-router';
import { LogBox } from 'react-native';

// Ignorer spécifiquement l'erreur de text strings
LogBox.ignoreLogs(['Text strings must be rendered within a <Text> component']);

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {/* Screens groupés par catégorie avec des options spécifiques si nécessaire */}
      <Stack.Screen 
        name="(login)" 
        options={{
          animation: 'slide_from_bottom',
        }} 
      />
      <Stack.Screen name="home" />
      <Stack.Screen name="(profil)" />
      <Stack.Screen name="(coach)" />
      <Stack.Screen name="(event)" />
      <Stack.Screen name="(Gymzer)" />
      <Stack.Screen name="(Salle)" />
      <Stack.Screen name="(Reels)" />
      <Stack.Screen name="(cour)" />
      
      {/* Screen d'index qui redirige vers login */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}