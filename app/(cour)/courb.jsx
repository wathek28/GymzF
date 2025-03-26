import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

// Configuration API - pourrait être déplacée dans un fichier séparé pour être réutilisée
const API_CONFIG = {
  BASE_URL: 'http://192.168.0.3:8082',
  ENDPOINTS: {
    COURSE_DETAIL: '/api/courses',
    COURSE_EXERCISES: '/api/courses'
  },
  // Ajout de paramètres de timeout pour les requêtes
  TIMEOUT: 10000, // 10 secondes
};

// Formater la durée - fonction déplacée en dehors du composant
const formatDuration = (exercise) => {
  if (exercise.durationSeconds) {
    const minutes = Math.floor(exercise.durationSeconds / 60);
    const seconds = exercise.durationSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  } 
  
  if (exercise.repetitions) {
    return `${exercise.repetitions} × ${exercise.sets || 1}`;
  }
  
  return '';
};

// Composant d'exercice extrait pour éviter les re-rendus inutiles
const ExerciseItem = React.memo(({ exercise, isLast, onPress }) => {
  return (
    <TouchableOpacity 
      style={[
        styles.exerciseItem,
        isLast ? { borderBottomWidth: 0 } : {}
      ]}
      onPress={() => onPress(exercise)}
    >
      <View style={styles.exerciseLeft}>
        <Image 
          source={exercise.icon} 
          style={styles.exerciseIcon}
          // Préchargement et mise en cache pour les images
          defaultSource={require('../../assets/images/b.png')}
        />
        <Text style={styles.exerciseName}>{exercise.name}</Text>
      </View>
      
      <View style={styles.exerciseRight}>
        <Text style={styles.exerciseDuration}>{exercise.duration}</Text>
        <Ionicons name="chevron-forward" size={18} color="#888" />
      </View>
    </TouchableOpacity>
  );
});

const ExerciseDetailScreen = () => {
  // États
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [courseData, setCourseData] = useState(null);
  const [exercises, setExercises] = useState([]);
  
  // Hooks pour la navigation
  const router = useRouter();
  const params = useLocalSearchParams();
  const id = params.id;
  
  // Fonction pour récupérer les données du cours avec controller pour annuler les requêtes en cas de démontage
  const fetchCourseData = useCallback(async () => {
    if (!id) {
      setError("Aucun ID de cours fourni");
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;
    
    try {
      setLoading(true);
      setError(null);
      
      // Récupérer les détails du cours avec un timeout
      const coursePromise = fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.COURSE_DETAIL}/${id}`, 
        { 
          signal,
          headers: {
            'Cache-Control': 'no-cache', // Désactive le cache HTTP pour les données fraîches
          },
        }
      );
      
      // Ajout d'un timeout manuel pour éviter les attentes infinies
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout dépassé')), API_CONFIG.TIMEOUT)
      );
      
      // Course response avec race pour gérer le timeout
      const courseResponse = await Promise.race([coursePromise, timeoutPromise]);
      
      if (!courseResponse.ok) {
        throw new Error(`Erreur HTTP: ${courseResponse.status}`);
      }
      
      const courseData = await courseResponse.json();
      setCourseData(courseData);
      
      // Récupérer les exercices associés au cours - avec Promise.all pour paralléliser
      const exercisesPromise = fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.COURSE_EXERCISES}/${id}/exercises`,
        { 
          signal,
          headers: {
            'Cache-Control': 'no-cache',
          },
        }
      );
      
      const exercisesResponse = await Promise.race([exercisesPromise, timeoutPromise]);
      
      if (!exercisesResponse.ok) {
        throw new Error(`Erreur lors de la récupération des exercices: ${exercisesResponse.status}`);
      }
      
      const exercisesData = await exercisesResponse.json();
      
      // Transformer les données des exercices pour l'affichage
      const formattedExercises = exercisesData.map(ex => ({
        id: ex.id,
        name: ex.title || ex.name,
        duration: formatDuration(ex),
        description: ex.description || '',
        icon: ex.imageUrl ? { uri: ex.imageUrl } : require('../../assets/images/b.png')
      }));
      
      setExercises(formattedExercises);
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Requête annulée');
        return;
      }
      console.error('Erreur lors de la récupération des données:', err);
      setError(`Erreur: ${err.message}`);
    } finally {
      setLoading(false);
      controller.abort(); // Nettoyer le controller
    }
  }, [id]);
  
  // Préchargement des images pour améliorer les performances visuelles
  const precacheImages = useCallback(async () => {
    if (!courseData) return;
    
    // Liste des images à précharger
    const imagesToPreload = [];
    
    // Image du cours
    if (courseData.thumbnail) {
      imagesToPreload.push(`data:image/jpeg;base64,${courseData.thumbnail}`);
    }
    
    // Images des exercices
    exercises.forEach(exercise => {
      if (exercise.icon && exercise.icon.uri) {
        imagesToPreload.push(exercise.icon.uri);
      }
    });
    
    // Préchargement des images (vous pouvez utiliser Image.prefetch si disponible)
    // Note: cette partie est conceptuelle et pourrait nécessiter une bibliothèque comme 'react-native-fast-image'
    console.log('Préchargement de', imagesToPreload.length, 'images');
  }, [courseData, exercises]);
  
  // Charger les données au montage du composant avec annulation en cas de démontage
  useEffect(() => {
    fetchCourseData();
    
    // Nettoyage en cas de démontage du composant
    return () => {
      // Si vous utilisez une bibliothèque comme react-query, vous pouvez annuler ici
      console.log('Nettoyage du composant');
    };
  }, [fetchCourseData]);
  
  // Précharger les images lorsque les données sont disponibles
  useEffect(() => {
    if (courseData && exercises.length > 0) {
      precacheImages();
    }
  }, [courseData, exercises, precacheImages]);

  // Navigation retour - mémorisée pour éviter les re-créations
  const handleGoBack = useCallback(() => {
    router.back();
  }, [router]);

  // Gestion du clic sur un exercice - mémorisée pour éviter les re-créations
  const handleExercisePress = useCallback((exercise) => {
    Alert.alert(
      exercise.name,
      exercise.description || "Aucune description disponible"
    );
  }, []);

  // Gestion du clic sur le bouton de démarrage - mémorisée pour éviter les re-créations
  const handleStartPress = useCallback(() => {
    if (exercises.length > 0) {
      // Extraire tous les IDs des exercices
      const exerciseIds = exercises.map(exercise => exercise.id);
      
      // Pour optimiser, préchargez les données du premier exercice avant la navigation
      // Cette partie est conceptuelle et dépend de votre architecture d'application
      
      // Passer les IDs des exercices en paramètre à la page courc
      router.push({
        pathname: '/courc',
        params: { 
          exerciseId: exerciseIds[0],            // ID du premier exercice
          allExerciseIds: exerciseIds.join(',')  // Tous les IDs pour navigation
        }
      });
    } else {
      Alert.alert(
        "Aucun exercice disponible",
        "Ce cours ne contient pas d'exercices disponibles."
      );
    }
  }, [exercises, router]);

  // Calcul du niveau mémorisé pour éviter les calculs répétés
  const levelText = useMemo(() => {
    if (!courseData) return '';
    
    switch(courseData.level) {
      case 'DEBUTANT': return 'Débutant';
      case 'INTERMEDIAIRE': return 'Intermédiaire';
      case 'AVANCE': return 'Avancé';
      default: return courseData.level;
    }
  }, [courseData]);

  // Afficher un indicateur de chargement
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#CBFF06" />
        <Text style={styles.loadingText}>Chargement du programme...</Text>
      </SafeAreaView>
    );
  }

  // Afficher un message d'erreur si nécessaire
  if (error) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.accentButton} onPress={fetchCourseData}>
          <Text style={styles.accentButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Si aucune donnée n'est disponible
  if (!courseData) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Aucune donnée disponible pour ce cours</Text>
        <TouchableOpacity style={styles.accentButton} onPress={handleGoBack}>
          <Text style={styles.accentButtonText}>Retour</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header Image avec placeholder pour chargement rapide */}
      <View style={styles.headerContainer}>
        <Image 
          source={courseData.thumbnail 
            ? { uri: `data:image/jpeg;base64,${courseData.thumbnail}` }
            : require('../../assets/images/b.png')} 
          style={styles.headerImage}
          // Ajout du placeholder pour chargement plus rapide
          defaultSource={require('../../assets/images/b.png')}
        />
        
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleGoBack}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        
        {/* ID Badge */}
        <View style={styles.idBadge}>
          <Text style={styles.idText}>Cours #{id}</Text>
        </View>
      </View>
      
      {/* Content - optimisé pour ne pas recréer les fonctions de rendu */}
      <ScrollView 
        style={styles.content}
        removeClippedSubviews={true} // Optimisation pour grandes listes
        initialNumToRender={5} // Réduire le nombre initial d'éléments rendus
      >
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{courseData.title}</Text>
          
          <View style={styles.levelContainer}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>{levelText}</Text>
            </View>
            <Text style={styles.durationText}>
              • {courseData.durationMinutes || 0}min • {exercises.length} exercices
            </Text>
          </View>
          
          <Text style={styles.description}>
            {courseData.description}
          </Text>
        </View>
        
        {/* Exercises Section Title */}
        {exercises.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Exercices à réaliser</Text>
              <Text style={styles.sectionSubtitle}>Suivez l'ordre recommandé pour de meilleurs résultats</Text>
            </View>
            
            {/* Exercises List - utilisation du composant mémorisé */}
            <View style={styles.exercisesList}>
              {exercises.map((exercise, index) => (
                <ExerciseItem
                  key={exercise.id}
                  exercise={exercise}
                  isLast={index === exercises.length - 1}
                  onPress={handleExercisePress}
                />
              ))}
            </View>
          </>
        )}
        
        {/* Start Button */}
        <TouchableOpacity 
          style={styles.startButton} 
          onPress={handleStartPress}
        >
          <Text style={styles.startButtonText}>Commencer</Text>
        </TouchableOpacity>
        
        {/* Bottom space */}
        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#333',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  accentButton: {
    backgroundColor: '#CBFF06',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  accentButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  headerContainer: {
    height: 220,
    width: '100%',
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  backButton: {
    position: 'absolute',
    top: 15,
    left: 15,
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  idBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  idText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
  },
  titleSection: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  levelBadge: {
    backgroundColor: '#CBFF06',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginRight: 8,
  },
  levelText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 12,
  },
  durationText: {
    color: '#666',
    fontSize: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: '#555',
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#777',
    marginBottom: 10,
  },
  exercisesList: {
    backgroundColor: '#f8f8f8',
    borderRadius: 15,
    marginHorizontal: 20,
    paddingHorizontal: 15,
    paddingVertical: 5,
    marginBottom: 20,
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  exerciseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseIcon: {
    width: 40,
    height: 40,
    marginRight: 15,
  },
  exerciseName: {
    fontSize: 15,
    color: '#333',
  },
  exerciseRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseDuration: {
    fontSize: 14,
    color: '#888',
    marginRight: 8,
  },
  startButton: {
    backgroundColor: '#CBFF06',
    borderRadius: 30,
    paddingVertical: 15,
    marginHorizontal: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  startButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomSpace: {
    height: 20,
  },
});

export default ExerciseDetailScreen;