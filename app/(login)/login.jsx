import { StyleSheet, Text, View, ImageBackground, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

export default function WelcomePage() {
  const handleStart = () => {
    router.push('/singup');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ImageBackground 
        source={require('../../assets/images/b.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <View style={styles.contentContainer}>
            <Text style={styles.title}>
              Trouvez les meilleures salles de sport et coachs près de chez vous.
            </Text>
            
            <Text style={styles.subtitle}>
              Réservez des séances privées, et atteignez vos objectifs plus facilement.
            </Text>

            <View style={styles.buttonWrapper}>
              <TouchableOpacity 
                style={styles.button}
                onPress={handleStart}
              >
                <Text style={styles.buttonText}>Commencer</Text>
              </TouchableOpacity>
              
              <View style={styles.arrowContainer}>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </View>
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
    paddingBottom: 50,
  },
  contentContainer: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    marginBottom: 32,
    opacity: 0.9,
  },
  buttonWrapper: {
    position: 'relative',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#000',
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  arrowContainer: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -16 }],
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  }
});