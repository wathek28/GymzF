import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

// Configuration de l'API
const API_CONFIG = {
  BASE_URL: 'http://192.168.0.3:8082',
  ENDPOINTS: {
    EXERCISE_DETAIL: '/api/courses/exercises'
  },
};

const JumpingJacksScreen = () => {
  // États pour gérer les données de l'exercice
  const [exerciseData, setExerciseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps, setTotalSteps] = useState(5);
  const [videoStatus, setVideoStatus] = useState({});
  const [videoUri, setVideoUri] = useState(null);
  
  // États pour la navigation entre exercices
  const [exerciseIds, setExerciseIds] = useState([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [programId, setProgramId] = useState(null);
  
  // Récupérer les paramètres de navigation
  const params = useLocalSearchParams();
  const exerciseId = params.exerciseId; // ID de l'exercice actuel
  const exerciseIdsParam = params.exerciseIds; // Liste des IDs d'exercices au format JSON
  
  // Initialiser le router pour la navigation
  const router = useRouter();
  
  // Fonction pour parser les IDs d'exercice - optimisée avec useCallback
  const parseExerciseIds = useCallback((idsParam) => {
    if (!idsParam) return [];
    
    try {
      return JSON.parse(idsParam);
    } catch (error) {
      console.error("Erreur lors du parsing des IDs d'exercices:", error);
      return [];
    }
  }, []);
  
  // Initialiser le tableau des IDs d'exercices et l'index courant
  useEffect(() => {
    // Récupérer l'ID du programme s'il existe
    if (params.programId) {
      setProgramId(params.programId);
    }
    
    if (exerciseIdsParam) {
      const parsedIds = parseExerciseIds(exerciseIdsParam);
      setExerciseIds(parsedIds);
      
      // Trouver l'index de l'exercice actuel dans le tableau
      const index = parsedIds.findIndex(id => id.toString() === exerciseId?.toString());
      if (index !== -1) {
        setCurrentExerciseIndex(index);
        setCurrentStep(index + 1);
        setTotalSteps(parsedIds.length);
      }
    }
  }, [exerciseId, exerciseIdsParam, params.programId, parseExerciseIds]);
  
  // Fonction pour récupérer les données de l'exercice - optimisée avec useCallback
  const fetchExerciseData = useCallback(async () => {
    if (!exerciseId) {
      setError("Aucun ID d'exercice fourni");
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // Construire l'URL complète
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.EXERCISE_DETAIL}/${exerciseId}`;
      
      // Effectuer la requête à l'API
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Mettre à jour l'état avec les données récupérées
      setExerciseData(data);
      
      // Gérer les données vidéo si disponibles
      if (data?.video?.videoData) {
        // Convertir les données base64 en blob vidéo
        const videoData = data.video.videoData;
        const videoBlob = `data:video/mp4;base64,${videoData}`;
        setVideoUri(videoBlob);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors de la récupération des données:', err);
      setError(`Erreur: ${err.message}`);
      setLoading(false);
    }
  }, [exerciseId]);
  
  // Charger les données de l'exercice au chargement du composant
  useEffect(() => {
    fetchExerciseData();
  }, [fetchExerciseData]);
  
  // Gestion de la vidéo
  const handleVideoStatusUpdate = useCallback((status) => {
    setVideoStatus(status);
  }, []);
  
  // Fonction pour gérer le bouton de lecture/pause de la vidéo
  const togglePlayback = useCallback(() => {
    setVideoStatus(prevStatus => ({
      ...prevStatus,
      isPlaying: !prevStatus.isPlaying
    }));
  }, []);

  // Naviguer à l'exercice précédent
  const goToPrevious = useCallback(() => {
    if (currentExerciseIndex > 0) {
      const prevIndex = currentExerciseIndex - 1;
      const prevExerciseId = exerciseIds[prevIndex];
      
      // Naviguer vers l'exercice précédent
      router.push({
        pathname: '/exercise',
        params: {
          exerciseId: prevExerciseId,
          exerciseIds: exerciseIdsParam,
          programId: programId
        }
      });
    } else {
      Alert.alert("Information", "Vous êtes déjà au premier exercice.");
    }
  }, [currentExerciseIndex, exerciseIds, exerciseIdsParam, programId, router]);

  // Naviguer à l'exercice suivant
  const goToNext = useCallback(() => {
    if (currentExerciseIndex < exerciseIds.length - 1) {
      const nextIndex = currentExerciseIndex + 1;
      const nextExerciseId = exerciseIds[nextIndex];
      
      // Naviguer vers l'exercice suivant
      router.push({
        pathname: '/exercise',
        params: {
          exerciseId: nextExerciseId,
          exerciseIds: exerciseIdsParam,
          programId: programId
        }
      });
    } else {
      Alert.alert("Information", "Vous avez terminé tous les exercices!", [
        { 
          text: "Retour à la liste", 
          onPress: () => {
            if (programId) {
              router.push({
                pathname: '/courb',
                params: { id: programId }
              });
            } else {
              router.back();
            }
          }
        }
      ]);
    }
  }, [currentExerciseIndex, exerciseIds, exerciseIdsParam, programId, router]);

  // Fermer l'écran d'exercice
  const closeExercise = useCallback(() => {
    router.back();
  }, [router]);
  
  // Valeurs calculées avec useMemo pour optimiser les performances
  const formattedData = useMemo(() => {
    // Formater la durée (secondes → format mm:ss)
    const formatDuration = (seconds) => {
      if (!seconds) return "00:30";
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };
    
    const exerciseName = exerciseData?.name || "Exercice";
    const exerciseDescription = exerciseData?.description || "Description non disponible";
    const duration = exerciseData?.durationSeconds 
      ? formatDuration(exerciseData.durationSeconds) 
      : exerciseData?.repetitions || "00:30";
    
    return {
      exerciseName,
      exerciseDescription,
      duration
    };
  }, [exerciseData]);
  
  // Afficher un indicateur de chargement pendant le chargement des données
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#DDFF00" />
        <Text style={styles.loadingText}>Chargement de l'exercice...</Text>
      </SafeAreaView>
    );
  }

  // Afficher un message d'erreur en cas d'erreur
  if (error) {
    return (
      <SafeAreaView style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchExerciseData}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* En-tête */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={closeExercise}
        >
          <Ionicons name="chevron-back-circle" size={36} color="#E0E0E0" />
        </TouchableOpacity>
        <Text style={styles.title}>{formattedData.exerciseName}</Text>
      </View>
      
      {/* ScrollView pour permettre le défilement */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Section vidéo */}
        <View style={styles.videoContainer}>
          {videoUri ? (
            <>
              <Video
                source={{ uri: videoUri }}
                rate={1.0}
                volume={1.0}
                isMuted={false}
                resizeMode="contain"
                shouldPlay={videoStatus.isPlaying}
                style={styles.video}
                onPlaybackStatusUpdate={handleVideoStatusUpdate}
                useNativeControls={false}
              />
              <TouchableOpacity 
                style={styles.playButton}
                onPress={togglePlayback}
              >
                <Ionicons 
                  name={videoStatus.isPlaying ? "pause" : "play"} 
                  size={30} 
                  color="white" 
                />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Image 
                source={require('../../assets/images/b.png')} 
                style={styles.exerciseImage} 
                resizeMode="contain"
              />
              <TouchableOpacity 
                style={styles.playButton}
                onPress={togglePlayback}
              >
                <Ionicons name="play" size={30} color="white" />
              </TouchableOpacity>
            </>
          )}
        </View>
        
        {/* Section durée */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Durée</Text>
          <Text style={styles.durationText}>{formattedData.duration}</Text>
        </View>
        
        {/* Section instructions */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          <Text style={styles.instructionText}>
            {formattedData.exerciseDescription}
          </Text>
        </View>
        
        {/* Section muscles ciblés */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Muscles ciblés</Text>
          <View style={styles.tagsContainer}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>Quadriceps</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText}>Mollets</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText}>Adducteurs</Text>
            </View>
          </View>
        </View>
        
        {/* Section équipements */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Équipements</Text>
          <Text style={styles.equipmentText}>
            Pas d'équipement à utiliser pour cet exercice.
          </Text>
        </View>
        
        {/* Espace supplémentaire en bas */}
        <View style={styles.bottomSpace} />
      </ScrollView>
      
      {/* Barre de navigation inférieure */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity onPress={goToPrevious}>
          <Ionicons name="chevron-back-circle" size={30} color="black" />
        </TouchableOpacity>
        
        <Text style={styles.progressText}>{currentStep} / {totalSteps}</Text>
        
        <TouchableOpacity onPress={goToNext}>
          <Ionicons name="chevron-forward-circle" size={30} color="black" />
        </TouchableOpacity>
      </View>
      
      {/* Bouton Fermer */}
      <TouchableOpacity 
        style={styles.closeButton}
        onPress={closeExercise}
      >
        <Text style={styles.closeButtonText}>Fermer</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#333',
    fontSize: 16,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#DDFF00',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  backButton: {
    marginRight: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollContent: {
    flexGrow: 1,
  },
  videoContainer: {
    height: 200,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  exerciseImage: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  playButton: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  sectionContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  durationText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  tag: {
    backgroundColor: '#333',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 12,
    margin: 3,
  },
  tagText: {
    color: 'white',
    fontSize: 12,
  },
  equipmentText: {
    fontSize: 14,
  },
  bottomSpace: {
    height: 20,
  },
  bottomNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: 'white',
  },
  progressText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: '#DDFF00',
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 15,
    borderRadius: 25,
    marginVertical: 10,
    marginBottom: 50,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
  },
});

export default JumpingJacksScreen;