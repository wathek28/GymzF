import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { useNavigation, useLocalSearchParams, useRouter } from 'expo-router';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import Animated, { 
  useAnimatedGestureHandler, 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  runOnJS 
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.3;

const GymDetailsScreen = () => {
  const navigation = useNavigation();
  const router = useRouter(); 
  const params = useLocalSearchParams();
  
  // État des gyms et de l'index actuel
  const [gyms, setGyms] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Extract userId from params
  const userId = params.userId;
  
  // Animation pour le swipe
  const translateX = useSharedValue(0);
  const scrollViewRef = useRef(null);
  
  // Charger tous les gyms au chargement du composant
  useEffect(() => {
    fetchGyms();
  }, []);
  
  // Mettre à jour l'index actuel lorsque les gyms sont chargés
  // In the GymDetailsScreen component, add these lines at the top of the component
  const gymId = params.id || params.idGym || params.gymId; // Check all possible parameter names
  console.log("Received gymId:", gymId, "Params:", JSON.stringify(params));  // Get gymId from either id or idGym parameter
// For debugging
// Then update the useEffect that finds the gym index to use this value
useEffect(() => {
  if (gyms.length > 0 && gymId) {
    const index = gyms.findIndex(gym => String(gym.id) === String(gymId));
    console.log("Found index:", index, "for Gym ID:", gymId);
    
    if (index !== -1) {
      setCurrentIndex(index);
    }
  }
}, [gyms, gymId]);
  
  // Fonction pour récupérer tous les gyms
 // Fonction pour récupérer les gyms
const fetchGyms = async () => {
  try {
    setLoading(true);
    
    // If gymId is available, we could fetch just that gym
    // But since your current logic relies on having all gyms for swipe navigation,
    // we'll keep fetching all gyms and then find the right index
    const response = await fetch(`http://192.168.0.3:8082/api/auth/gyms`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (Array.isArray(data)) {
      setGyms(data);
      
      // If we have a gymId, find the correct index right away
      if (gymId && data.length > 0) {
        const index = data.findIndex(gym => String(gym.id) === String(gymId));
        console.log("Found index right after fetch:", index, "for Gym ID:", gymId);
        
        if (index !== -1) {
          setCurrentIndex(index);
        }
      }
    } else {
      console.error('La réponse n\'est pas un tableau', data);
      setError('Format de données incorrect');
    }
  } catch (err) {
    console.error('Erreur lors du chargement des gyms:', err);
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
  
  // Obtenir le gym actuel
  const gym = gyms.length > 0 && currentIndex >= 0 && currentIndex < gyms.length 
    ? gyms[currentIndex] 
    : params; // Fallback to params if gyms aren't loaded yet or index is invalid
  
  // Fonction pour naviguer vers un autre gym
  const navigateToGym = (direction) => {
    let newIndex = currentIndex;
    
    if (direction === 'next' && currentIndex < gyms.length - 1) {
      newIndex = currentIndex + 1;
    } else if (direction === 'prev' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else {
      // Si on ne peut pas naviguer, retour à la position initiale
      translateX.value = withSpring(0);
      return;
    }
    
    // Mettre à jour l'index et réinitialiser la position
    setCurrentIndex(newIndex);
    translateX.value = withSpring(0);
    
    // Remonter le scrollView
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: false });
    }
  };
  
  // Gestionnaire de swipe
  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.startX = translateX.value;
    },
    onActive: (event, context) => {
      translateX.value = context.startX + event.translationX;
    },
    onEnd: (event) => {
      if (event.velocityX > 500 || translateX.value > SWIPE_THRESHOLD) {
        // Swipe vers la droite (gym précédent)
        runOnJS(navigateToGym)('prev');
      } else if (event.velocityX < -500 || translateX.value < -SWIPE_THRESHOLD) {
        // Swipe vers la gauche (gym suivant)
        runOnJS(navigateToGym)('next');
      } else {
        // Retour à la position initiale
        translateX.value = withSpring(0);
      }
    },
  });
  
  // Style animé pour le contenu
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });
  
  // Fonctions de rendu des éléments UI
  const renderBadge = (icon, text, value) => (
    <View style={styles.badge}>
      <Ionicons name={icon} size={16} color="#FFF" style={styles.badgeIcon} />
      <Text style={styles.badgeText}>{text}</Text>
      <Text style={styles.badgeValue}>{value || 'N/A'}</Text>
    </View>
  );

  const renderLocationInfo = () => {
    console.log("Vérification de gym:", gym);
    console.log("Vérification de typeCoaching:", gym?.typeCoaching);
  
    if (!gym) return null; // Évite les erreurs si gym est indéfini
  
    const typeCoaching = gym?.typeCoaching ? gym.typeCoaching : "Non spécifié";
  
    return (
      <View style={styles.locationContainer}>
        <View style={styles.locationBox}>
          <Text style={styles.locationText}>{typeCoaching}</Text>
        </View>
      </View>
    );
  };
  
  
  
  
  const handleProfilePress = () => {
    // Utiliser les données du gym actuel plutôt que les paramètres initiaux
    const currentGym = gyms.length > 0 ? gyms[currentIndex] : params;
    
    router.push({
      pathname: '/Sallec',
      params: {
        userId: userId,
        idGym: currentGym.id, 
        id: currentGym.id, 
        competencesGenerales: currentGym.competencesGenerales,
        coursSpecifiques: currentGym.coursSpecifiques,
        disciplines: currentGym.disciplines,
        dureeExperience: currentGym.dureeExperience,
        dureeSeance: currentGym.dureeSeance,
        email: currentGym.email,
        entrainementPhysique: currentGym.entrainementPhysique,
        fb: currentGym.fb,
        firstName: currentGym.firstName,
        insta: currentGym.insta,
        niveauCours: currentGym.niveauCours,
        phoneNumber: currentGym.phoneNumber,
        photo: currentGym.photo,
        poste: currentGym.poste,
        prixSeance: currentGym.prixSeance,
        santeEtBienEtre: currentGym.santeEtBienEtre,
        tiktok: currentGym.tiktok,
        typeCoaching: currentGym.typeCoaching,
        bio: currentGym.bio,
        address:currentGym.address
      }
    });
  };

  // Afficher un indicateur de chargement pendant le chargement des gyms
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#CCFF00" />
        <Text style={styles.loadingText}>Chargement des gyms...</Text>
      </SafeAreaView>
    );
  }

  // Afficher un message d'erreur si le chargement a échoué
  if (error) {
    return (
      <SafeAreaView style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorText}>Erreur: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchGyms}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <PanGestureHandler onGestureEvent={gestureHandler}>
          <Animated.View style={[{ flex: 1 }, animatedStyle]}>
            <ScrollView 
              ref={scrollViewRef}
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
            >
              {/* Header Section with Back Button */}
              <View style={styles.header}>
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={() => router.back()} 
                >
                  <Ionicons name="chevron-back" size={24} color="#FFF" />
                </TouchableOpacity>
                
                {/* Navigation indicators */}
                <View style={styles.navIndicator}>
                  <Text style={styles.navText}>
                    {currentIndex + 1} / {gyms.length}
                  </Text>
                </View>
              </View>

              {/* Profile Image */}
              <Image
                source={
                  gym.photo 
                    ? { uri: `data:image/jpeg;base64,${gym.photo}` }
                    : require('../../assets/images/b.png')
                }
                style={styles.profileImage}
                resizeMode="cover"
              />

              {/* Gym Info Overlay */}
              <View style={styles.infoOverlay}>
                <View style={styles.nameSection}>
                  <View style={styles.nameContainer}>
                    <Text style={styles.name}>{gym.firstName || 'Gym'}</Text>
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={16} color="#007AFF" />
                    </View>
                  </View>
                  <TouchableOpacity style={styles.profileButton} onPress={handleProfilePress}>
                    <Text style={styles.profileButtonText}>Voir le profil</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.title}>{gym.address || 'Adresse non disponible'}</Text>
                {renderLocationInfo()}

                {/* Badges Section */}
                <View style={styles.badgesContainer}>
                  {renderBadge("stats-chart", "Avantage", "WiFi, Parking")}
                  <View style={styles.experienceBadge}>
                    {renderBadge("time", "Horaire", "7H-21H")}
                  </View>
                  {renderBadge("star", "Avis", "3.5/5")}
                </View>

              </View>
            </ScrollView>
          </Animated.View>
        </PanGestureHandler>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',  // Ajout d'une couleur de fond explicite
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#333',  // Changé pour une meilleure lisibilité
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FF4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#CCFF00',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#000',
    fontWeight: '600',
  },
  header: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    zIndex: 1,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navIndicator: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  navText: {
    color: '#FFF',  // Ajout de la couleur du texte
  },
  profileImage: {
    width: '100%',
    height: 450,
  },
  infoOverlay: {
    padding: 20,
    backgroundColor: 'black',  // Ajout d'une couleur de fond explicite
  },
  nameSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  nameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: 'white',
    marginRight: 8,
    flex: 1,
  },
  verifiedBadge: {
    marginLeft: 4,
  },
  profileButton: {
    backgroundColor: '#CCFF00',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 12,
  },
  profileButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 14,
    color: '#999',
    marginBottom: 20,
  },
  badgesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  badge: {
    backgroundColor: '#2C2C2C',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    flex: 1,
  },
  experienceBadge: {
    flex: 1,
    marginHorizontal: 8,
  },
  badgeIcon: {
    marginBottom: 4,
  },
  badgeText: {
    color: '#999',
    fontSize: 12,
    marginBottom: 2,
  },
  badgeValue: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  locationContainer: {
    marginBottom: 20,
  },
  locationBox: {
    backgroundColor: '#2C2C2C',
    padding: 16,
    borderRadius: 8,
  },
  locationText: {
    color: '#FFF',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 'bold'
  },
});

export default GymDetailsScreen;