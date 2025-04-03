import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  Alert,
  Platform
} from 'react-native';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as FileSystem from 'expo-file-system';

// Configuration de l'API
const API_CONFIG = {
  BASE_URL: 'http://192.168.0.3:8082',
  ENDPOINTS: {
    EXERCISE_DETAIL: '/api/courses/exercises',
    EXERCISE_VIDEO: '/api/courses/exercises'
  },
};

const JumpingJacksScreen = () => {
  // États pour gérer les données de l'exercice
  const [exerciseData, setExerciseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps, setTotalSteps] = useState(1);
  const [videoStatus, setVideoStatus] = useState({});
  const [videoUri, setVideoUri] = useState(null);
  const [videoRef, setVideoRef] = useState(null);
  const [loadingVideo, setLoadingVideo] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  
  // États pour la navigation entre exercices
  const [exerciseIds, setExerciseIds] = useState([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [programId, setProgramId] = useState(null);
  
  // Récupérer les paramètres de navigation
  const params = useLocalSearchParams();
  const [currentExerciseId, setCurrentExerciseId] = useState(params.exerciseId);
  
  // Références pour éviter les appels multiples
  const initializedRef = useRef(false);
  const dataFetchedRef = useRef(false);
  const downloadInProgressRef = useRef(false);
  
  // Initialiser le router pour la navigation
  const router = useRouter();
  const userId = params.userId;
  
  // Fonction pour parser les IDs d'exercice
  const parseExerciseIds = (idsParam) => {
    if (!idsParam) {
      return currentExerciseId ? [currentExerciseId] : [];
    }
    
    // Si idsParam est déjà un tableau, le retourner
    if (Array.isArray(idsParam)) {
      return idsParam;
    }
    
    try {
      // Essayer de parser comme JSON
      const parsed = JSON.parse(idsParam);
      
      // Vérifier si c'est un tableau
      if (Array.isArray(parsed)) {
        return parsed;
      } 
      
      // Si c'est un objet ou une autre valeur non-tableau
      return currentExerciseId ? [currentExerciseId] : [];
      
    } catch (error) {
      // Si ce n'est pas un JSON valide mais une chaîne, la traiter comme un seul ID
      if (typeof idsParam === 'string') {
        // Si c'est une liste séparée par des virgules
        if (idsParam.includes(',')) {
          return idsParam.split(',').map(id => id.trim());
        }
        // Sinon, c'est un seul ID
        return [idsParam];
      }
      
      // En dernier recours, retourner un tableau avec l'ID actuel
      return currentExerciseId ? [currentExerciseId] : [];
    }
  };
  
  // Fonction pour générer l'URL de la vidéo directe depuis le serveur
  const getVideoUrl = useCallback((videoPath) => {
    if (!videoPath) return null;
    // Utiliser directement l'URL complète au format de l'API
    return `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.EXERCISE_VIDEO}/video/stream/${videoPath}${userId ? `?userId=${userId}` : ''}`;
  }, [userId]);
  
  // Fonction modifiée pour télécharger directement le fichier et l'utiliser localement
  const loadVideoFromBackend = useCallback(async (exerciseId) => {
    // Afficher l'indicateur de chargement
    setLoadingVideo(true);
    console.log('Tentative de chargement depuis le backend pour exercice ID:', exerciseId);
    
    try {
      // 1. Construire l'URL de téléchargement
      const downloadUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.EXERCISE_VIDEO}/${exerciseId}/video`;
      console.log('URL de téléchargement:', downloadUrl);
      
      // 2. Définir le chemin de destination
      const destinationPath = `${FileSystem.cacheDirectory}video_${exerciseId}.mp4`;
      console.log('Destination:', destinationPath);
      
      // 3. Vérifier si le fichier existe déjà en cache
      const fileInfo = await FileSystem.getInfoAsync(destinationPath);
      
      if (fileInfo.exists) {
        console.log('Vidéo trouvée en cache, utilisation directe');
        setVideoUri(destinationPath);
        setLoadingVideo(false);
        return;
      }
      
      // 4. Télécharger la vidéo
      console.log('Téléchargement en cours...');
      const downloadResult = await FileSystem.downloadAsync(
        downloadUrl,
        destinationPath,
        {
          headers: {
            'Accept': 'video/mp4,*/*',
            'Content-Type': 'video/mp4'
          }
        }
      );
      
      console.log('Résultat du téléchargement:', downloadResult);
      
      if (downloadResult.status === 200) {
        console.log('Téléchargement réussi, utilisation du fichier local');
        setVideoUri(destinationPath);
      } else {
        console.log('Échec du téléchargement avec statut:', downloadResult.status);
        throw new Error(`Téléchargement échoué avec statut ${downloadResult.status}`);
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      
      // Essayer d'utiliser l'URL directe en cas d'échec
      const directUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.EXERCISE_VIDEO}/${exerciseId}/video`;
      console.log('Tentative avec URL directe:', directUrl);
      setVideoUri(directUrl);
    } finally {
      setLoadingVideo(false);
    }
  }, [API_CONFIG]);
  
  // Initialiser les IDs d'exercices une seule fois au chargement initial
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    
    if (params.programId) {
      setProgramId(params.programId);
    }
    
    try {
      // Obtenir la liste des IDs et parser
      const ids = params.allExerciseIds || params.exerciseIds;
      const idArray = ids ? parseExerciseIds(ids) : (currentExerciseId ? [currentExerciseId] : []);
      
      // Mettre à jour l'état
      setExerciseIds(idArray);
      
      // Déterminer l'index actuel et le total
      if (idArray.length > 0 && currentExerciseId) {
        // Recherche manuelle pour éviter les problèmes avec findIndex
        const strExerciseId = String(currentExerciseId);
        let foundIndex = -1;
        
        for (let i = 0; i < idArray.length; i++) {
          if (String(idArray[i]) === strExerciseId) {
            foundIndex = i;
            break;
          }
        }
        
        if (foundIndex !== -1) {
          setCurrentExerciseIndex(foundIndex);
          setCurrentStep(foundIndex + 1);
        } else {
          setCurrentExerciseIndex(0);
          setCurrentStep(1);
        }
        
        setTotalSteps(idArray.length);
      } else {
        setCurrentExerciseIndex(0);
        setCurrentStep(1);
        setTotalSteps(idArray.length || 1);
      }
    } catch (err) {
      console.error('Erreur lors de l\'initialisation des exercices:', err);
      
      // Fallback en cas d'erreur
      if (currentExerciseId) {
        setExerciseIds([currentExerciseId]);
        setCurrentExerciseIndex(0);
        setCurrentStep(1);
        setTotalSteps(1);
      }
    }
  }, []); // Une seule fois au montage
  
  // Nettoyage lors du démontage du composant
  useEffect(() => {
    return () => {
      if (videoRef) {
        videoRef.unloadAsync().catch(() => {});
      }
      // Réinitialiser toutes les références
      downloadInProgressRef.current = false;
      dataFetchedRef.current = false;
      initializedRef.current = false;
      console.log('Nettoyage du composant effectué');
    };
  }, []);
  
  // Fonction pour récupérer les données de l'exercice
  const fetchExerciseData = useCallback(async (exerciseId) => {
    if (!exerciseId) return;
    
    try {
      setLoading(true);
      dataFetchedRef.current = true;
      
      // Requête API
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.EXERCISE_DETAIL}/${exerciseId}`;
      console.log('Récupération des données depuis:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      setExerciseData(data);
      
      // Réinitialiser la vidéo
      setVideoUri(null);
      if (videoRef) {
        try {
          await videoRef.unloadAsync();
        } catch(e) {
          // Ignorer les erreurs
        }
      }
      
      // Utiliser la nouvelle méthode de chargement
      loadVideoFromBackend(exerciseId);
      
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors de la récupération des données:', err);
      setError(`Erreur: ${err.message}`);
      setLoading(false);
    }
  }, [loadVideoFromBackend]);
  
  // Charger les données de l'exercice lorsque l'ID change
  useEffect(() => {
    if (currentExerciseId && !dataFetchedRef.current) {
      fetchExerciseData(currentExerciseId);
    }
  }, [currentExerciseId, fetchExerciseData]);
  
  const handleVideoError = useCallback((error) => {
    console.error('Erreur de lecture vidéo:', error);
    
    // Essayer l'approche de téléchargement direct
    console.log('Tentative de téléchargement direct après erreur de lecture');
    loadVideoFromBackend(currentExerciseId);
    
    // Proposer de réessayer manuellement
    Alert.alert(
      "Problème de lecture vidéo",
      "La lecture de la vidéo a échoué. Voulez-vous réessayer ?",
      [
        { 
          text: "Réessayer", 
          onPress: () => {
            if (videoRef) {
              videoRef.unloadAsync().catch(() => {});
            }
            setVideoUri(null);
            setTimeout(() => {
              loadVideoFromBackend(currentExerciseId);
            }, 500);
          } 
        },
        { text: "Annuler" }
      ]
    );
  }, [currentExerciseId, videoRef, loadVideoFromBackend]);
  
  // Gestion du statut de la vidéo
  const handleVideoStatusUpdate = useCallback((status) => {
    setVideoStatus(status);
  }, []);
  
  // Gestion du bouton de lecture
  const togglePlayback = useCallback(() => {
    if (!videoRef) return;
    
    try {
      if (videoStatus.isPlaying) {
        videoRef.pauseAsync();
      } else {
        videoRef.playAsync();
      }
    } catch (e) {
      console.error('Erreur lors du toggle de lecture:', e);
      
      // En cas d'erreur, tenter de recharger la vidéo
      loadVideoFromBackend(currentExerciseId);
    }
  }, [videoRef, videoStatus, currentExerciseId, loadVideoFromBackend]);
  
  const goToPrevious = useCallback(() => {
    if (!Array.isArray(exerciseIds) || exerciseIds.length <= 1) {
      Alert.alert("Information", "Pas d'autres exercices disponibles.");
      return;
    }
    
    if (currentExerciseIndex > 0) {
      const prevIndex = currentExerciseIndex - 1;
      const prevExerciseId = exerciseIds[prevIndex];
      
      // Réinitialiser les données
      dataFetchedRef.current = false;
      setVideoUri(null);
      if (videoRef) {
        videoRef.unloadAsync().catch(() => {});
      }
      
      // Mettre à jour l'état local
      setCurrentExerciseIndex(prevIndex);
      setCurrentStep(prevIndex + 1);
      setCurrentExerciseId(prevExerciseId);
    } else {
      Alert.alert("Information", "Vous êtes déjà au premier exercice.");
    }
  }, [currentExerciseIndex, exerciseIds, videoRef]);
  
  const goToNext = useCallback(() => {
    if (!Array.isArray(exerciseIds) || exerciseIds.length <= 1) {
      Alert.alert("Information", "Pas d'autres exercices disponibles.");
      return;
    }
    
    if (currentExerciseIndex < exerciseIds.length - 1) {
      const nextIndex = currentExerciseIndex + 1;
      const nextExerciseId = exerciseIds[nextIndex];
      
      // Réinitialiser les données
      dataFetchedRef.current = false;
      setVideoUri(null);
      if (videoRef) {
        videoRef.unloadAsync().catch(() => {});
      }
      
      // Mettre à jour l'état local
      setCurrentExerciseIndex(nextIndex);
      setCurrentStep(nextIndex + 1);
      setCurrentExerciseId(nextExerciseId);
    } else {
      Alert.alert("Information", "Vous avez terminé tous les exercices!", [
        { text: "Retour", onPress: () => router.back() }
      ]);
    }
  }, [currentExerciseIndex, exerciseIds, router, videoRef]);
  
  // Fermer l'écran d'exercice
  const closeExercise = useCallback(() => {
    router.back();
  }, [router]);
  
  // Formatage des données de l'exercice avec priorité aux répétitions
  const formattedData = useMemo(() => {
    // Nouvelle fonction pour formater l'information d'exercice, privilégiant les répétitions
    const formatExerciseInfo = (exercise) => {
      // Si l'exercice a des répétitions, on les affiche en priorité
      if (exercise?.repetitions) {
        return `${exercise.repetitions} `;
      } 
      
      // Sinon on affiche la durée en secondes si disponible
      if (exercise?.durationSeconds) {
        const minutes = Math.floor(exercise.durationSeconds / 60);
        const remainingSeconds = exercise.durationSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
      }
      
      // Valeur par défaut
      return "00:30";
    };
    
    return {
      exerciseName: exerciseData?.name || "Exercice",
      exerciseDescription: exerciseData?.description || "Description non disponible",
      duration: formatExerciseInfo(exerciseData),
      // Stocke également si l'exercice est basé sur les répétitions ou la durée
      isRepetitionBased: exerciseData?.repetitions ? true : false,
      targetMuscles: ['Quadriceps', 'Mollets', 'Adducteurs'] // Vous pourriez le récupérer de l'API si disponible
    };
  }, [exerciseData]);
  
  // Interface utilisateur
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#DDFF00" />
        <Text style={styles.loadingText}>Chargement de l'exercice...</Text>
      </SafeAreaView>
    );
  }
  
  if (error) {
    return (
      <SafeAreaView style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={() => {
            setError(null);
            dataFetchedRef.current = false;
            fetchExerciseData(currentExerciseId);
          }}
        >
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
        <TouchableOpacity style={styles.backButton} onPress={closeExercise}>
          <Ionicons name="chevron-back-circle" size={36} color="#E0E0E0" />
        </TouchableOpacity>
        <Text style={styles.title}>{formattedData.exerciseName}</Text>
      </View>
      
      {/* ScrollView pour permettre le défilement */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Section vidéo */}
        <View style={styles.videoContainer}>
          {loadingVideo ? (
            <View style={styles.videoLoadingContainer}>
              <ActivityIndicator size="large" color="#DDFF00" />
              <Text style={styles.videoLoadingText}>
                Téléchargement de la vidéo... {downloadProgress}%
              </Text>
            </View>
          ) : videoUri ? (
            <>
              {/* Utiliser une approche adaptée pour iOS */}
              <Video
                ref={ref => setVideoRef(ref)}
                source={{ 
                  uri: videoUri,
                  headers: {
                    'Accept': 'video/mp4,*/*',
                    'Range': 'bytes=0-',
                    'Content-Type': 'video/mp4'
                  },
                  overrideFileExtensionAndroid: 'mp4' 
                }}
                rate={1.0}
                volume={1.0}
                isMuted={false}
                resizeMode="contain"
                shouldPlay={false}
                style={styles.video}
                onPlaybackStatusUpdate={handleVideoStatusUpdate}
                useNativeControls={true}
                onError={handleVideoError}
                isLooping={false}
                usePoster={true}
              />
              <TouchableOpacity style={styles.playButton} onPress={togglePlayback}>
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
                style={styles.exerciseImage} 
                resizeMode="contain"
              />
              <TouchableOpacity 
                style={styles.playButton} 
                onPress={() => {
                  if (videoUri) {
                    togglePlayback();
                  } else {
                    // Charger la vidéo si pas encore chargée
                    loadVideoFromBackend(currentExerciseId);
                  }
                }}
              >
                <Ionicons name="play" size={30} color="white" />
              </TouchableOpacity>
            </>
          )}
        </View>
        
        {/* Section objectif - selon si c'est basé sur les répétitions ou la durée */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>
            {formattedData.isRepetitionBased ? "Répétition" : "Durée"}
          </Text>
          <Text style={[
            styles.durationText,
            formattedData.isRepetitionBased ? styles.repetitionsText : {}
          ]}>
            {formattedData.duration}
          </Text>
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
            {formattedData.targetMuscles.map((muscle, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{muscle}</Text>
              </View>
            ))}
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
  videoLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoLoadingText: {
    marginTop: 10,
    color: '#333',
    fontSize: 14,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  exerciseImage: {
    width: '100%',
    height: '100%',
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
  // Nouveau style pour mettre en évidence les répétitions
  repetitionsText: {
    fontSize: 18,
    color: '#000',
    fontWeight: '700',
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