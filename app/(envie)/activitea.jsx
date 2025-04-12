import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity, Image, StatusBar, ActivityIndicator } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import { useLocalSearchParams, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Configuration de l'API
const API_CONFIG = {
  BASE_URL: 'http://192.168.0.3:8082',
  ENDPOINTS: {
    IMAGES: '/api/images',
    COURSES: '/api/courses',
  },
};

const activitea = () => {
  const params = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState('cours');
  const [userData, setUserData] = useState({
    firstName: '',
    userPhoto: '',
    userId: null
  });
  
  // États pour les données de l'API
  const [purchasedCourses, setPurchasedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Référence pour savoir si le composant est monté
  const isMounted = useRef(true);
  
  // Charger les données utilisateur depuis AsyncStorage
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedFirstName = await AsyncStorage.getItem('firstName');
        const storedUserPhoto = await AsyncStorage.getItem('userPhoto');
        const storedUserId = await AsyncStorage.getItem('userId');
        
        if (isMounted.current) {
          setUserData({
            firstName: storedFirstName || '',
            userPhoto: storedUserPhoto || '',
            userId: storedUserId || (params.userId || null)
          });
        }
        
        console.log('Données utilisateur chargées:', storedFirstName, 'User ID:', storedUserId);
      } catch (error) {
        console.error('Erreur lors du chargement des données utilisateur:', error);
      }
    };
    
    loadUserData();
    
    // Nettoyage lors du démontage
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Récupérer les cours achetés depuis l'API
  useEffect(() => {
    const fetchPurchasedCourses = async () => {
      if (!userData.userId) {
        console.log('Pas d\'ID utilisateur disponible pour récupérer les cours');
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        console.log(`Récupération des cours achetés pour l'utilisateur ${userData.userId}...`);
        
        // URL de l'API - utiliser l'adresse IP complète
        const apiUrl = `${API_CONFIG.BASE_URL}/api/courses/purchased?userId=${userData.userId}`;
        console.log('URL de l\'API:', apiUrl);
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 secondes timeout
        });
        
        if (!response.ok) {
          throw new Error(`Erreur API: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Cours récupérés:', data.length);
        
        if (isMounted.current) {
          setPurchasedCourses(Array.isArray(data) ? data : []);
        }
        
      } catch (err) {
        console.error('Erreur lors de la récupération des cours:', err);
        if (isMounted.current) {
          setError(err.message);
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };
    
    if (userData.userId) {
      fetchPurchasedCourses();
    }
  }, [userData.userId]);

  // État pour les événements
  const [events, setEvents] = useState([]);
  const [eventLoading, setEventLoading] = useState(true);
  const [eventError, setEventError] = useState(null);
  
  // Récupération des événements depuis l'API
// Nouvelle version de fetchEvents qui vérifie si la réponse est vide avant de faire le json()
useEffect(() => {
  const fetchEvents = async () => {
    if (!userData.userId) {
      console.log('Pas d\'ID utilisateur disponible pour récupérer les événements');
      setEventLoading(false);
      setEvents([]); // Initialiser avec un tableau vide
      return;
    }
    
    try {
      setEventLoading(true);
      setEventError(null);
      
      console.log(`Récupération des événements pour l'utilisateur ${userData.userId}...`);
      
      // URL de l'API pour les événements
      const apiUrl = `${API_CONFIG.BASE_URL}/api/events/user/${userData.userId}/events`;
      console.log('URL de l\'API pour les événements:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 secondes timeout
      });
      
      // Vérifier si le statut est dans la plage 2xx (succès)
      if (!response.ok) {
        console.log(`Réponse API non valide: ${response.status}`);
        setEvents([]);
        return;
      }
      
      // Vérifier le type de contenu et la taille
      const contentType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');
      
      // Si le contenu est vide ou n'est pas du JSON, on renvoie un tableau vide
      if (contentLength === '0' || (contentType && !contentType.includes('application/json'))) {
        console.log('Réponse vide ou non-JSON détectée');
        setEvents([]);
        return;
      }
      
      // Récupérer le texte brut de la réponse d'abord
      const responseText = await response.text();
      
      // Vérifier si le texte est vide ou juste des espaces
      if (!responseText || responseText.trim() === '') {
        console.log('Réponse vide détectée');
        setEvents([]);
        return;
      }
      
      let data;
      try {
        // Convertir le texte en JSON
        data = JSON.parse(responseText);
        
        // Si on a une réponse mais ce n'est pas un tableau, on crée un tableau vide
        if (!Array.isArray(data)) {
          console.log('La réponse n\'est pas un tableau:', data);
          data = [];
        }
      } catch (jsonError) {
        console.log('Erreur lors du parsing JSON:', jsonError);
        console.log('Texte reçu:', responseText);
        data = []; // En cas d'erreur JSON, on utilise un tableau vide
      }
      
      console.log('Événements récupérés:', data.length);
      
      if (isMounted.current) {
        setEvents(data);
      }
      
    } catch (err) {
      console.error('Erreur lors de la récupération des événements:', err);
      if (isMounted.current) {
        // Ne pas définir d'erreur, simplement initialiser avec un tableau vide
        setEvents([]);
      }
    } finally {
      if (isMounted.current) {
        setEventLoading(false);
      }
    }
  };
  
  if (userData.userId) {
    fetchEvents();
  } else {
    // Pas d'ID utilisateur, donc pas d'événements
    setEvents([]);
    setEventLoading(false);
  }
}, [userData.userId]);

  // Fonction pour gérer l'affichage de la photo utilisateur
  const getUserImage = () => {
    // Utiliser ces sources dans cet ordre de priorité
    const photoSource = userData.userPhoto || params.photo;
    
    if (photoSource) {
      // Si la photo commence déjà par "data:image", c'est déjà un format base64 complet
      if (photoSource.startsWith('data:image')) {
        return { uri: photoSource };
      }
      // Sinon, on considère que c'est une chaîne base64 sans préfixe
      return { uri: `data:image/jpeg;base64,${photoSource}` };
    } else {
      // Pas de photo, retourner null pour afficher le placeholder
      return null;
    }
  };

  // Fonction pour obtenir la miniature du cours en utilisant l'ID du cours
  const getCourseThumbnailUrl = (courseId) => {
    if (!courseId) return null;
    return `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.COURSES}/${courseId}/thumbnail`;
  };

  // Composant CourseCard pour gérer efficacement l'affichage des cours
  const CourseCard = ({ course, onPress }) => {
    const [imageLoading, setImageLoading] = useState(true);
    const [imageError, setImageError] = useState(false);
    
    // URL de la miniature basée sur l'ID du cours
    const thumbnailUrl = getCourseThumbnailUrl(course.id);
    
    return (
      <TouchableOpacity 
        key={course.id} 
        style={styles.courseCard} 
        activeOpacity={0.9}
        onPress={() => {
          // Navigation vers ExerciseDetailScreen avec les paramètres nécessaires
          router.push({
            pathname: "/activitec",
            params: { 
              id: course.id,
              isFree: true // Tous les cours achetés sont considérés comme "débloqués"
            }
          });
        }}
      >
        {/* Image de base (fallback) */}
        <Image 
          source={require('../../assets/images/b.png')} 
          style={[styles.courseImage, { position: 'absolute' }]} 
        />
        
        {/* Indicateur de chargement */}
        {imageLoading && (
          <View style={styles.imageLoaderContainer}>
            <ActivityIndicator size="small" color="#007AFF" />
          </View>
        )}
        
        {/* Image du cours */}
        {thumbnailUrl && !imageError && (
          <Image 
            source={{ uri: thumbnailUrl }}
            style={styles.courseImage}
            onLoadStart={() => setImageLoading(true)}
            onLoad={() => setImageLoading(false)}
            onLoadEnd={() => setImageLoading(false)}
            onError={() => {
              console.log(`Erreur de chargement d'image pour le cours ${course.id}`);
              setImageLoading(false);
              setImageError(true);
            }}
            fadeDuration={300}
          />
        )}
        
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.courseGradient}
        />
        
        <View style={styles.courseOverlay}>
          <View style={styles.courseIconContainer}>
            <MaterialCommunityIcons 
              name={
                course.title.toLowerCase().includes('yoga') ? "yoga" : 
                course.title.toLowerCase().includes('boxe') ? "boxing-glove" : 
                "dumbbell"
              } 
              size={20} 
              color="#fff" 
            />
          </View>
          <Text style={styles.courseName}>{course.title}</Text>
          <View style={styles.courseDetailsContainer}>
            <View style={styles.courseDetail}>
              <Feather name="clock" size={14} color="#fff" style={styles.courseDetailIcon} />
              <Text style={styles.courseDetailText}>{course.durationMinutes} min</Text>
            </View>
            <View style={styles.courseDetail}>
              <Feather name="activity" size={14} color="#fff" style={styles.courseDetailIcon} />
              <Text style={styles.courseDetailText}>{course.exerciseCount} exercices</Text>
            </View>
          </View>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${course.completed ? '100' : Math.random() * 70 + 10}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {course.completed ? 'Terminé' : 'En cours'}
            </Text>
          </View>
        </View>
        
        <View style={styles.levelBadgeCard}>
          <Text style={styles.levelBadgeText}>{course.level}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Gestionnaire de navigation vers EventB pour un événement - avec gestion d'erreur
  const handleNavigateToEventB = (event) => {
    console.log('Navigation vers EventB pour l\'événement:', event.id);
    
    try {
      // Préparer les données de l'événement à passer avec gestion d'erreur
      const eventDataString = JSON.stringify(event);
      
      // Utiliser router.push avec les paramètres nécessaires
      router.push({
        pathname: "/(envie)/activiteb",
        params: {
          userId: userData.userId,
          eventId: event.id,
          eventData: eventDataString
        }
      });
    } catch (error) {
      console.error('Erreur lors de la préparation des données d\'événement:', error);
      // Naviguer sans les données complètes en cas d'erreur
      router.push({
        pathname: "/(envie)/activiteb",
        params: {
          userId: userData.userId,
          eventId: event.id
        }
      });
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { flex: 1, textAlign: 'center' }]}>Mes Activités</Text>
        {/* Espace vide pour équilibrer le header et garder le titre centré */}
        <View style={{ width: 40 }} />
      </View>
      
      <View style={styles.profileHeader}>
        <View style={styles.profileImageContainer}>
          {getUserImage() ? (
            <Image 
              source={getUserImage()} 
              style={styles.profileImage} 
            />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Feather name="user" size={22} color="#fff" />
            </View>
          )}
        </View>
        <View>
          <Text style={styles.profileName}>{userData.firstName || params.firstName || 'Utilisateur'}</Text>
         
        </View>
      </View>

      {/* Navigation interne entre cours et événements - style centré */}
      <View style={styles.internalNavContainer}>
        <TouchableOpacity 
          style={[styles.internalNavButton, activeTab === 'cours' && styles.activeInternalNav]} 
          onPress={() => setActiveTab('cours')}
        >
          <Text style={[styles.internalNavText, activeTab === 'cours' && styles.activeInternalNavText]}>Mes cours</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.internalNavButton, activeTab === 'evenements' && styles.activeInternalNav]} 
          onPress={() => setActiveTab('evenements')}
        >
          <Text style={[styles.internalNavText, activeTab === 'evenements' && styles.activeInternalNavText]}>Mes événements</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'cours' ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Mes cours achetés</Text>
              
            </View>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Chargement de vos cours...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Feather name="alert-circle" size={24} color="#FF3B30" />
                <Text style={styles.errorText}>Erreur: {error}</Text>
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={() => {
                    if (userData.userId) {
                      setLoading(true);
                      fetch(`${API_CONFIG.BASE_URL}/api/courses/purchased?userId=${userData.userId}`)
                        .then(response => {
                          if (!response.ok) throw new Error(`Erreur API: ${response.status}`);
                          return response.json();
                        })
                        .then(data => {
                          setPurchasedCourses(Array.isArray(data) ? data : []);
                          setError(null);
                        })
                        .catch(err => {
                          console.error('Erreur lors de la récupération des cours:', err);
                          setError(err.message);
                        })
                        .finally(() => setLoading(false));
                    }
                  }}
                >
                  <Text style={styles.retryButtonText}>Réessayer</Text>
                </TouchableOpacity>
              </View>
            ) : purchasedCourses.length === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="book" size={50} color="#ccc" />
                <Text style={styles.emptyStateText}>Vous n'avez pas encore acheté de cours</Text>
                <TouchableOpacity 
                  style={styles.exploreButton}
                  onPress={() => router.push('/home')}
                >
                  <Text style={styles.exploreButtonText}>Découvrir des cours</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Liste des cours achetés avec le nouveau composant CourseCard
              <>
                {purchasedCourses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </>
            )}
          </>
        ) : (
          // Liste des événements
          <>
            
            
            {activeTab === 'evenements' && (
  <>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>Événements à venir</Text>
    </View>
    
    {eventLoading ? (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Chargement de vos événements...</Text>
      </View>
    ) : events.length === 0 ? (
      // État vide - toujours affiché si pas d'événements, quelle que soit la raison
      <View style={styles.emptyState}>
        <Feather name="calendar" size={50} color="#ccc" />
        <Text style={styles.emptyStateText}>Vous n'avez pas encore d'événements</Text>
        <TouchableOpacity 
          style={styles.exploreButton}
          onPress={() => router.push('/home')}
        >
          <Text style={styles.exploreButtonText}>Découvrir des événements</Text>
        </TouchableOpacity>
      </View>
    ) : (
      // Affichage des événements récupérés depuis l'API
      events.map((event) => (
        <TouchableOpacity 
          key={event.id || Math.random().toString()} // Ajout d'une clé de secours
          style={styles.eventCard} 
          activeOpacity={0.95}
          onPress={() => {
            try {
              handleNavigateToEventB(event);
            } catch (error) {
              console.log('Erreur de navigation:', error);
              // Navigation de secours
              router.push('/events');
            }
          }}
        >
          {/* Image avec gestion d'erreur */}
          <Image 
            source={
              event.photo 
                ? { uri: `data:image/jpeg;base64,${event.photo}` } 
                : require('../../assets/images/b.png')
            } 
            style={styles.eventImage}
            defaultSource={require('../../assets/images/b.png')} 
            onError={() => console.log(`Erreur de chargement d'image pour l'événement`)}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.75)']}
            style={styles.eventGradient}
          />
          
          {/* Indicateur de date avec gestion d'erreur */}
          <View style={styles.dateIndicator}>
            {(() => {
              try {
                if (!event.date) throw new Error('Pas de date');
                const eventDate = new Date(event.date);
                // Vérifier si la date est valide
                if (isNaN(eventDate.getTime())) throw new Error('Date invalide');
                
                const day = eventDate.getDate();
                const month = eventDate.toLocaleString('fr-FR', { month: 'short' }).toUpperCase();
                return (
                  <>
                    <Text style={styles.dateDay}>{day}</Text>
                    <Text style={styles.dateMonth}>{month}</Text>
                  </>
                );
              } catch (error) {
                return (
                  <>
                    <Text style={styles.dateDay}>--</Text>
                    <Text style={styles.dateMonth}>---</Text>
                  </>
                );
              }
            })()}
          </View>
          
          <View style={styles.eventOverlay}>
            <Text style={styles.eventName}>{event.titre || 'Événement'}</Text>
            <View style={styles.eventDetails}>
              <View style={styles.eventDetail}>
                <Feather name="map-pin" size={12} color="#fff" style={styles.eventDetailIcon} />
                <Text style={styles.eventLocation}>{event.adresse || 'Lieu non spécifié'}</Text>
              </View>
              <View style={styles.eventDetail}>
                <Feather name="clock" size={12} color="#fff" style={styles.eventDetailIcon} />
                <Text style={styles.eventTime}>
                  {`${event.heureDebut ? event.heureDebut.substring(0, 5) : '--:--'} - ${event.heureFin ? event.heureFin.substring(0, 5) : '--:--'}`}
                </Text>
              </View>
            </View>
            <View style={styles.eventFooter}>
              <Text style={styles.eventPrice}>{`${event.prix || 0} DT / Pers`}</Text>
              <TouchableOpacity 
                style={[styles.eventStatusButton, styles.reservedButton]}
                onPress={() => {
                  try {
                    handleNavigateToEventB(event);
                  } catch (error) {
                    console.log('Erreur de navigation:', error);
                    router.push('/events');
                  }
                }}
              >
                <Text style={styles.eventStatusText}>Déjà réservée</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      ))
    )}
  </>
)}

          </>
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  profileImageContainer: {
    marginRight: 15,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 16,
  },
  profileImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBCD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#C78200',
    marginLeft: 4,
  },
  internalNavContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    justifyContent: 'center',
  },
  internalNavButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    minWidth: 140,
    alignItems: 'center',
  },
  activeInternalNav: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  internalNavText: {
    fontWeight: '600',
    color: '#333',
    fontSize: 14,
  },
  activeInternalNavText: {
    color: '#CBFF06',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  // Style pour le bouton de rechargement des images
  refreshImagesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginBottom: 15,
    alignSelf: 'center',
  },
  refreshIcon: {
    marginRight: 8,
  },
  refreshImagesText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  // Styles pour le chargement et les erreurs
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  errorText: {
    marginTop: 10,
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginVertical: 15,
    textAlign: 'center',
  },
  exploreButton: {
    backgroundColor: 'black',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  exploreButtonText: {
    color: '#CBFF06',
    fontWeight: '600',
  },
  // Styles pour les cartes de cours
  courseCard: {
    height: 190,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backgroundColor: '#e0e0e0', // Couleur de fond pour les images en échec
  },
  courseImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e0e0e0',
  },
  imageLoaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(240,240,240,0.5)',
  },
  courseGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '80%',
  },
  courseOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
  },
  courseIconContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  courseName: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  courseDetailsContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  courseDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  courseDetailIcon: {
    marginRight: 5,
  },
  courseDetailText: {
    color: 'white',
    fontSize: 13,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    marginRight: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  progressText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  levelBadgeCard: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  levelBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Styles pour les cartes d'événements  
  eventCard: {
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backgroundColor: '#e0e0e0', // Couleur de fond pour les images en échec
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  eventGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70%',
  },
  dateIndicator: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: '#CBFF06',
    padding: 8,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 45,
  },
  dateDay: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  dateMonth: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  gymLogoContainer: {
    position: 'absolute',
    top: 15,
    left: 15,
    backgroundColor: '#fff',
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gymLogoText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
  },
  eventOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
  },
  eventHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  participantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  participantsText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 5,
  },
  gymName: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '500',
  },
  eventName: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  eventDetails: {
    marginBottom: 15,
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  eventDetailIcon: {
    marginRight: 8,
  },
  eventLocation: {
    color: 'white',
    fontSize: 14,
  },
  eventTime: {
    color: 'white',
    fontSize: 14,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventPrice: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  eventStatusButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 12,
  },
  reservedButton: {
    backgroundColor: '#CBFF06',
  },
  bookButton: {
    backgroundColor: '#007AFF',
  },
  eventStatusText: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#333',
  },
  bottomPadding: {
    height: 100, // Pour éviter que le dernier élément ne soit caché par la navbar
  }
}); 

export default activitea