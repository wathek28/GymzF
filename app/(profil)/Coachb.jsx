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

const CoachDetailsScreen = () => {
  const navigation = useNavigation();
  const router = useRouter(); 
  const params = useLocalSearchParams();
  const originalCoach = params;
  
  // État des coachs et de l'index actuel
  const [coaches, setCoaches] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Extract userId and coachId from params
  const userId = params.userId;
  const coachId = params.coachId;
  
  // Log parameters to verify they're received correctly
  useEffect(() => {
    console.log("Received in Session Screen - userId:", userId, "coachId:", coachId);
    console.log("Coach details:", params.coachFirstName, params.coachEmail);
  }, []);
  
  // Animation pour le swipe
  const translateX = useSharedValue(0);
  const scrollViewRef = useRef(null);
  
  // Charger tous les coachs au chargement du composant
  useEffect(() => {
    fetchCoaches();
  }, []);
  
  // Mettre à jour l'index actuel lorsque les coachs sont chargés
  useEffect(() => {
    if (coaches.length > 0 && coachId) {
      const index = coaches.findIndex(coach => coach.id.toString() === coachId.toString());
      if (index !== -1) {
        setCurrentIndex(index);
      }
    }
  }, [coaches, coachId]);
  
  // Fonction pour récupérer tous les coachs
  const fetchCoaches = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://192.168.0.3:8082/api/auth/coaches`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setCoaches(data);
      } else {
        console.error('La réponse n\'est pas un tableau', data);
        setError('Format de données incorrect');
      }
    } catch (err) {
      console.error('Erreur lors du chargement des coachs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Obtenir le coach actuel
  const coach = coaches.length > 0 ? coaches[currentIndex] : originalCoach;
  
  // Fonction pour naviguer vers un autre coach
  const navigateToCoach = (direction) => {
    let newIndex = currentIndex;
    
    if (direction === 'next' && currentIndex < coaches.length - 1) {
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
        // Swipe vers la droite (coach précédent)
        runOnJS(navigateToCoach)('prev');
      } else if (event.velocityX < -500 || translateX.value < -SWIPE_THRESHOLD) {
        // Swipe vers la gauche (coach suivant)
        runOnJS(navigateToCoach)('next');
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

  const renderLocationInfo = () => (
    <View style={styles.locationContainer}>
      <View style={styles.locationBox}>
        <Text style={styles.locationText}>
          Des Cours : En ligne, à domicile aux alentours de {coach.typeCoaching || 'N/A'}, ou à {coach.disciplines || 'N/A'}
        </Text>
      </View>
    </View>
  );
  
  const handleProfilePress  = () => {
    router.push({
      pathname: '/coachc',
      params: {
        userId: userId,
        coachId: coach.id,  // Changed from idCoach to coachId for consistency
        id: coach.id, 
        competencesGenerales: coach.competencesGenerales,
        coursSpecifiques: coach.coursSpecifiques,
        disciplines: coach.disciplines,
        dureeExperience: coach.dureeExperience,
        dureeSeance: coach.dureeSeance,
        email: coach.email,
        entrainementPhysique: coach.entrainementPhysique,
        fb: coach.fb,
        firstName: coach.firstName,
        insta: coach.insta,
        niveauCours: coach.niveauCours,
        phoneNumber: coach.phoneNumber,
        photo: coach.photo,
       
        prixSeance: coach.prixSeance,
        santeEtBienEtre: coach.santeEtBienEtre,
        tiktok: coach.tiktok,
        typeCoaching: coach.typeCoaching,
        bio: coach.bio,
        poste: coach.poste,
      }
    });
  };

  // Afficher un indicateur de chargement pendant le chargement des coachs
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#CCFF00" />
        <Text style={styles.loadingText}>Chargement des coachs...</Text>
      </SafeAreaView>
    );
  }

  // Afficher un message d'erreur si le chargement a échoué
  if (error) {
    return (
      <SafeAreaView style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorText}>Erreur: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchCoaches}>
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
                    {currentIndex + 1} / {coaches.length}
                  </Text>
                </View>
              </View>

              {/* Profile Image */}
              <Image
                source={
                  coach.photo 
                    ? { uri: `data:image/jpeg;base64,${coach.photo}` }
                    : require('../../assets/images/b.png')
                }
                style={styles.profileImage}
                resizeMode="cover"
              />

              {/* Coach Info Overlay */}
              <View style={styles.infoOverlay}>
                <View style={styles.nameSection}>
                  <View style={styles.nameContainer}>
                    <Text style={styles.name}>{coach.firstName || 'Coach'}</Text>
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={16} color="#007AFF" />
                    </View>
                  </View>
                  <TouchableOpacity style={styles.profileButton} onPress={handleProfilePress}>
                    <Text style={styles.profileButtonText}>Voir le profil</Text>
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.title}> {coach.poste || 'N/A'}</Text>

                {/* Badges Section */}
                <View style={styles.badgesContainer}>
                  {renderBadge("stats-chart", "Niveau", coach.niveauCours)}
                  <View style={styles.experienceBadge}>
                    {renderBadge("time", "Expérience", coach.dureeExperience)}
                  </View>
                  {renderBadge("star", "Avis", "3.5/5")}
                </View>

                {renderLocationInfo()}
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
    backgroundColor: 'black',
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
    color: '#FFF',
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
  profileImage: {
    width: '100%',
    height: 450,
  },
  infoOverlay: {
    padding: 20,
    backgroundColor: 'black',
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
  locationHeader: {
    fontSize: 16,
    color: '#FFF',
    marginBottom: 12,
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
  },
  navText: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  }
});

export default CoachDetailsScreen;