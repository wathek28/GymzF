import React, { useState, useEffect, useRef, useCallback ,useMemo} from 'react';
import { 
  KeyboardAvoidingView, 
  Platform, 
  Alert,
  ActivityIndicator,
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  Modal, 
  Keyboard,
  SafeAreaView,
 
    
   
  
  
  
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Dimensions } from 'react-native';

// Pour l'instant, nous utilisons expo-av pour le composant Video
import { Video } from 'expo-av';
import * as FileSystem from 'expo-file-system';

const SAlle = () => {
  // Récupérer les paramètres passés à la route
  const route = useRoute(); // Utiliser useRoute au lieu de useLocalSearchParams
  const params = route.params || {}; // Récupérer les paramètres de la route
  const navigation = useNavigation();
  console.log("Tous les paramètres:", params);
  
  // Log des paramètres pour débogage
  console.log("Paramètres reçus:", JSON.stringify(params));
  
  // Extraire les données du gym à partir des paramètres
  const {
    firstName,
    photo,
    email,
    phoneNumber,
    poste,
    typeCoaching,
    bio,
    idGym  
  } = params;
  console.log("ID du gym:", idGym);
  
  // États pour la gestion des données et UI
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState('document');
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [selectedVideoUri, setSelectedVideoUri] = useState(null);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [reels, setReels] = useState([]);
  const [reelsLoading, setReelsLoading] = useState(true);
  const [reelsError, setReelsError] = useState(null);


//////////////////////////////
const router = useRouter();
const navigateToSalled = useCallback(() => {
  if (idGym) {
    console.log("Navigation vers Salled avec idGym:", idGym);
    router.push({
      pathname: '/(Salle)/Salled',
      params: { idGym }
    });
  } else {
    Alert.alert(
      "Erreur",
      "Impossible d'accéder aux abonnements pour le moment.",
      [{ text: "OK" }]
    );
  }
}, [idGym, router]); 

  
  // Fonction pour récupérer les coachs depuis l'API
  useEffect(() => {
    const fetchCoaches = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://192.168.0.3:8082/api/auth/coaches');
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        setCoaches(data);
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors de la récupération des coachs:', err);
        setError(err.message);
        setLoading(false);
        
        // Données de secours en cas d'erreur
        setCoaches([
          { id: '1', firstName: 'Karim', photo: null },
          { id: '2', firstName: 'Tarek', photo: null },
          { id: '3', firstName: 'Tahra', photo: null },
          { id: '4', firstName: 'Saoudi', photo: null },
        ]);
      }
    };
    
    fetchCoaches();
  }, []);
 
///////////////////////////////////////////////////////////////
const enhancedProcessVideoData = async (videoData) => {
  try {
    // Detailed logging for video data
    console.log('🔍 Video Data Diagnostic:');
    console.log('Data Type:', typeof videoData);
    
    if (typeof videoData === 'string') {
      console.log('String Length:', videoData.length);
      console.log('First 50 chars:', videoData.substring(0, 50));
      
      // Check base64 validity
      const base64Regex = /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{4}|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)$/;
      console.log('Valid Base64:', base64Regex.test(videoData));
    }

    // Validate video data before processing
    if (!videoData) {
      throw new Error('No video data provided');
    }

    // Multiple validation and conversion strategies
    let processedUri = null;

    // Strategy 1: Direct URL
    if (typeof videoData === 'string' && 
        (videoData.startsWith('http') || videoData.startsWith('file://'))) {
      return videoData;
    }

    // Strategy 2: Base64 to File
    if (typeof videoData === 'string') {
      // Remove potential data URI prefix
      const base64Data = videoData.includes('base64,') 
        ? videoData.split('base64,')[1] 
        : videoData;

      // Create unique filename
      const filename = `${FileSystem.cacheDirectory}temp_video_${Date.now()}.mp4`;
      
      try {
        await FileSystem.writeAsStringAsync(filename, base64Data, {
          encoding: FileSystem.EncodingType.Base64
        });

        console.log('✅ Temporary video file created:', filename);
        processedUri = filename;
      } catch (writeError) {
        console.error('❌ File Write Error:', writeError);
        throw new Error('Cannot write video file');
      }
    }

    // Strategy 3: Handle Blob/Object data
    if (videoData && videoData.data) {
      console.log('Processing blob/object video data');
      
      if (Array.isArray(videoData.data)) {
        // Convert Uint8Array to base64
        const uint8Array = new Uint8Array(videoData.data);
        const base64 = btoa(String.fromCharCode.apply(null, uint8Array));
        
        const filename = `${FileSystem.cacheDirectory}temp_video_blob_${Date.now()}.mp4`;
        
        try {
          await FileSystem.writeAsStringAsync(filename, base64, {
            encoding: FileSystem.EncodingType.Base64
          });
          
          processedUri = filename;
        } catch (blobError) {
          console.error('❌ Blob Processing Error:', blobError);
          throw new Error('Cannot process blob video data');
        }
      }
    }

    // Fallback strategy
    if (!processedUri) {
      console.warn('Falling back to default video');
      processedUri = 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4';
    }

    return processedUri;

  } catch (overallError) {
    console.error('🚨 Critical Video Processing Error:', overallError);
    
    // Final fallback
    return 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4';
  }
};
// Advanced Error Tracking in Video Component
const VideoErrorHandler = ({ 
  videoUri, 
  onError, 
  fallbackUri = 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4' 
}) => {
  const [currentVideoUri, setCurrentVideoUri] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);

  useEffect(() => {
    const processVideo = async () => {
      try {
        const processedUri = await enhancedProcessVideoData(videoUri);
        setCurrentVideoUri(processedUri);
      } catch (processingError) {
        console.error('Video Processing Initialization Error:', processingError);
        setCurrentVideoUri(fallbackUri);
        setErrorDetails(processingError);
        onError?.(processingError);
      }
    };

    processVideo();
  }, [videoUri]);

  const handleVideoError = (error) => {
    console.error('Video Playback Specific Error:', error);
    setCurrentVideoUri(fallbackUri);
    onError?.(error);
  };

  return (
    <Video
      source={{ uri: currentVideoUri }}
      onError={handleVideoError}
      // Autres props vidéo...
    />
  );
};
  // Fonction pour récupérer et traiter les reels du gym
 // Fonction améliorée de récupération des reels avec une meilleure gestion des erreurs
const fetchReels = useCallback(async (gymId) => {
  if (!gymId) {
    console.log('⚠️ Aucun ID de gym fourni');
    return [];
  }

  let retryCount = 0;
  const MAX_RETRIES = 2;

  // Fonction interne pour les tentatives
  const attemptFetch = async () => {
    try {
      console.log(`🔄 Tentative ${retryCount + 1}/${MAX_RETRIES + 1} de récupération des reels pour le gym ID: ${gymId}`);
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout dépassé')), 20000); // 8 secondes de timeout
      });
      
      // Create the fetch promise
      const fetchPromise = fetch(`http://192.168.0.3:8082/api/reels/user/${gymId}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        // Pas besoin d'AbortController ici car nous utilisons Promise.race
      });
      
      // Race between fetch and timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      // Utilisation d'un try/catch dédié pour le parsing JSON
      let reels;
      try {
        const text = await response.text(); // Récupérer d'abord le texte brut
        console.log('Réponse brute:', text.substring(0, 100) + "..."); // Log pour le débogage
        
        // Vérifier si la réponse est vide
        if (!text || text.trim() === '') {
          console.log('⚠️ Réponse vide de l\'API');
          return [];
        }
        
        reels = JSON.parse(text);
      } catch (parseError) {
        console.error('❌ Erreur lors du parsing JSON:', parseError);
        throw new Error('Format de réponse invalide');
      }
      
      console.log(`📊 ${reels.length} reels récupérés`);
      
      if (!Array.isArray(reels)) {
        console.error('⚠️ Format de réponse invalide - tableau attendu');
        return [];
      }
      
      // Simplifier le traitement des reels pour réduire les risques d'erreur
      const processedReels = reels.map(reel => {
        try {
          // Récupérer les données vidéo (peu importe leur format)
          const videoData = reel.videoData || reel.video_data || reel.video;
          
          // Construire l'objet reel de façon sécurisée avec des valeurs par défaut
          return {
            id: reel.id || `reel_${Date.now()}_${Math.random()}`,
            videoUri: videoData || null,
            thumbnailUri: reel.thumbnail 
              ? `data:image/jpeg;base64,${reel.thumbnail}`
              : require('../../assets/images/b.png'),
            title: reel.title || 'Vidéo sans titre',
            duration: reel.duration || ''
          };
        } catch (error) {
          console.warn(`⚠️ Erreur lors du traitement du reel ${reel.id || 'inconnu'}:`, error);
          // Retourner un reel avec des valeurs par défaut en cas d'erreur
          return {
            id: `error_${Date.now()}_${Math.random()}`,
            videoUri: null,
            thumbnailUri: require('../../assets/images/b.png'),
            title: 'Vidéo non disponible',
            duration: '',
            error: true
          };
        }
      });
      
      return processedReels;
      
    } catch (error) {
      // Si l'erreur est liée au réseau et qu'il reste des tentatives, réessayer
      if ((error.message.includes('Network') || error.message.includes('Timeout')) && 
          retryCount < MAX_RETRIES) {
        retryCount++;
        console.log(`🔄 Nouvelle tentative ${retryCount}/${MAX_RETRIES}...`);
        
        // Attendre un court délai avant de réessayer (backoff exponentiel)
        const delay = 1000 * Math.pow(2, retryCount);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Tentative récursive
        return attemptFetch();
      }
      
      console.error('❌ Erreur finale lors de la récupération des reels:', error.message);
      throw error;
    }
  };
  
  // Démarrer le processus de tentatives
  try {
    return await attemptFetch();
  } catch (finalError) {
    console.error('❌ Toutes les tentatives ont échoué:', finalError.message);
    // Retourner un tableau vide au lieu de propager l'erreur pour éviter les crashs
    return [];
  }
}, []);

// Utilisation de la fonction dans un effet pour charger les reels
useEffect(() => {
  let isMounted = true;

  const loadReels = async () => {
    if (!idGym) return;
    
    setReelsLoading(true);
    setReelsError(null);
    
    try {
      const processedReels = await fetchReels(idGym);
      
      // Vérifier si le composant est toujours monté avant de mettre à jour l'état
      if (isMounted) {
        if (processedReels && processedReels.length > 0) {
          setReels(processedReels);
          setReelsError(null);
        } else {
          // Si aucun reel n'a été récupéré, c'est peut-être une erreur
          console.log('⚠️ Aucun reel trouvé');
          setReels([]);
        }
      }
    } catch (error) {
      if (isMounted) {
        console.error('❌ Erreur dans loadReels:', error.message);
        setReelsError(error.message || "Impossible de charger les vidéos");
        
        // Même en cas d'erreur, on définit reels comme tableau vide pour éviter les undefined
        setReels([]);
      }
    } finally {
      if (isMounted) {
        setReelsLoading(false);
      }
    }
  };
  
  // Chargement initial
  loadReels();
  
  // Nettoyage pour éviter les fuites de mémoire
  return () => {
    isMounted = false;
  };
}, [idGym, fetchReels]);


  ///////////////////////////////
 // Ajoutez ces états à l'intérieur du composant principal
 const [comments, setComments] = useState([]);
 const [loadingComments, setLoadingComments] = useState(false);
 const [commentsError, setCommentsError] = useState(null);
 
 // ... vos autres états et hooks ...
 
 // Fonction pour récupérer les commentaires, à l'intérieur du composant
 const fetchComments = useCallback(async (gymId) => {
   if (!gymId) return;
   
   setLoadingComments(true);
   setCommentsError(null);
   
   try {
     const response = await fetch(`http://192.168.0.3:8082/api/commentaires/recus/${gymId}`);
     
     if (!response.ok) {
       throw new Error(`Erreur HTTP: ${response.status}`);
     }
     
     const data = await response.json();
     console.log("Commentaires récupérés:", data);
     setComments(data);
   } catch (error) {
     console.error("Erreur lors de la récupération des commentaires:", error);
     setCommentsError(error.message);
     
     // Fallback aux données statiques en cas d'erreur
     setComments(sampleReviews.map(review => ({
       id: review.id,
       evaluation: review.rating,
       commentaire: review.comment,
       dateCommentaire: new Date().toISOString(),
       utilisateur: { firstName: review.name },
       hasImageAvant: true,
       hasImageApres: true,
       imageAvantUrl: review.beforeImage,
       imageApresUrl: review.afterImage
     })));
   } finally {
     setLoadingComments(false);
   }
 }, []);
 
 // useEffect pour charger les commentaires, à l'intérieur du composant
 useEffect(() => {
   if (selectedTab === 'emoji' && idGym) {
     fetchComments(idGym);
   }
 }, [selectedTab, idGym, fetchComments]);
 
 // Fonction renderEmoji à l'intérieur du composant
 const renderEmoji = () => {
   return (
     <ScrollView style={styles.emojiScrollView}>
       <TouchableOpacity 
         style={styles.shareExperienceButton}
         onPress={() => setIsReviewModalVisible(true)}
       >
         <Text style={styles.shareExperienceText}>Partagez votre expérience</Text>
       </TouchableOpacity>
       
       <View style={styles.existingReviews}>
         <Text style={styles.reviewsSectionTitle}>Avis des clients</Text>
         
         {loadingComments ? (
           <View style={styles.loaderContainer}>
             <ActivityIndicator size="large" color="#D4FF00" />
             <Text style={styles.loaderText}>Chargement des avis...</Text>
           </View>
         ) : commentsError ? (
           <View style={styles.errorContainer}>
             <Text style={styles.errorText}>{commentsError}</Text>
             <TouchableOpacity 
               style={styles.retryButton}
               onPress={() => fetchComments(idGym)}
             >
               <Text style={styles.retryButtonText}>Réessayer</Text>
             </TouchableOpacity>
           </View>
         ) : comments.length === 0 ? (
           <Text style={styles.noCommentsText}>Aucun avis pour le moment</Text>
         ) : (
           comments.map((comment) => (
             <View key={comment.id} style={styles.reviewCard}>
               <View style={styles.reviewHeader}>
                 <Text style={styles.reviewerName}>
                   {comment.utilisateur?.firstName || "Utilisateur"}
                 </Text>
                 {renderStars(comment.evaluation)}
               </View>
               <Text style={styles.reviewDate}>
                 {new Date(comment.dateCommentaire).toLocaleDateString()}
               </Text>
               <Text style={styles.reviewText}>{comment.commentaire}</Text>
               <View style={styles.beforeAfterContainer}>
                 <View style={styles.transformationImageWrapper}>
                   <Image 
                     source={
                       comment.hasImageAvant
                         ? { uri: `http://192.168.0.3:8082${comment.imageAvantUrl}` }
                         : require('../../assets/images/b.png')
                     } 
                     style={styles.beforeAfterImage} 
                     resizeMode="cover"
                   />
                   <Text style={styles.imageLabel}>Avant</Text>
                 </View>
                 <View style={styles.transformationImageWrapper}>
                   <Image 
                     source={
                       comment.hasImageApres
                         ? { uri: `http://192.168.0.3:8082${comment.imageApresUrl}` }
                         : require('../../assets/images/b.png')
                     } 
                     style={styles.beforeAfterImage} 
                     resizeMode="cover"
                   />
                   <Text style={styles.imageLabel}>Après</Text>
                 </View>
               </View>
             </View>
           ))
         )}
       </View>
     </ScrollView>
   );
 };
 


  ////////////////////////////

  // Fonction pour rendre le contenu vidéo
  const renderVideoContent = () => {
    if (reelsLoading) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#D4FF00" />
          <Text style={styles.loaderText}>Chargement des vidéos...</Text>
        </View>
      );
    }
  
    if (reelsError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{reelsError}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setReelsLoading(true);
              setReelsError(null);
              fetchReels(idGym);
            }}
          >
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      );
    }
  
    if (!reels || reels.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.noVideosText}>Aucune vidéo disponible</Text>
        </View>
      );
    }
  
    return (
      <View style={styles.videoGridContainer}>
        {reels.map((reel) => {
          // Vérifier si l'URI vidéo est valide
          const hasValidVideo = !!reel.videoUri;
          
          return (
            <TouchableOpacity
              key={reel.id}
              style={styles.videoGridItem}
              onPress={() => {
                if (hasValidVideo) {
                  setSelectedVideoUri(reel.videoUri);
                  setVideoModalVisible(true);
                } else {
                  // Afficher une alerte si la vidéo n'est pas disponible
                  Alert.alert(
                    "Vidéo non disponible",
                    "Cette vidéo ne peut pas être lue actuellement.",
                    [{ text: "OK" }]
                  );
                }
              }}
            >
              <Image 
                source={
                  typeof reel.thumbnailUri === 'string' 
                    ? { uri: reel.thumbnailUri } 
                    : reel.thumbnailUri
                } 
                style={styles.videoGridThumbnail}
                resizeMode="cover"
              />
              {/* Overlay sombre */}
              <View style={styles.videoOverlay} />
              {/* Bouton play ou icône d'erreur si vidéo non disponible */}
              <View style={styles.playIconContainer}>
                <MaterialIcons 
                  name={hasValidVideo ? "play-circle-outline" : "error-outline"} 
                  size={40} 
                  color="#fff" 
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  // Render the gallery grid manually instead of using FlatList
  const useGymGalleryImages = (gymId) => {
    const [galleryImages, setGalleryImages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
  
    useEffect(() => {
      const fetchGalleryImages = async () => {
        if (!gymId) return;
  
        setIsLoading(true);
        try {
          const response = await fetch(`http://192.168.0.3:8082/api/photos/user/${gymId}`);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
  
          const data = await response.json();
          
          // Process images similar to coach profile
          const processedImages = data.map(photo => ({
            id: photo.id,
            source: photo.content 
              ? { uri: `data:image/jpeg;base64,${photo.content}` }
              : require('../../assets/images/b.png')
          }));
  
          setGalleryImages(processedImages);
        } catch (err) {
          console.error('Error fetching gym gallery images:', err);
          setError(err.message);
          
          // Fallback images if fetch fails
          setGalleryImages([
            { id: '1', source: require('../../assets/images/b.png') },
            { id: '2', source: require('../../assets/images/b.png') },
            { id: '3', source: require('../../assets/images/b.png') },
          ]);
        } finally {
          setIsLoading(false);
        }
      };
  
      fetchGalleryImages();
    }, [gymId]);
  
    return { galleryImages, isLoading, error };
  };

  // Then use the hook
  const { galleryImages, isLoading: galleryLoading, error: galleryError } = useGymGalleryImages(idGym);

  const renderGalleryGrid = () => {
    const rows = [];
    for (let i = 0; i < galleryImages.length; i += 3) {
      const rowImages = galleryImages.slice(i, i + 3);
      const row = (
        <View key={`row-${i}`} style={styles.galleryRow}>
          {rowImages.map(item => (
            <TouchableOpacity 
              key={item.id}
              onPress={() => {
                setSelectedImage(item.source);
                setPhotoModalVisible(true);
              }}
            >
              <Image 
                source={item.source} 
                style={styles.galleryImage} 
              />
            </TouchableOpacity>
          ))}
        </View>
      );
      rows.push(row);
    }
    return rows;
  };

  // Fonction pour rendre le contenu en fonction de l'onglet sélectionné
 // Function to render emoji content
// 1. Créez cette fonction à l'intérieur de votre composant SAlle
// Au niveau des states du composant principal SAlle
const [selectedDay, setSelectedDay] = useState('Lundi');
const [plannings, setPlannings] = useState([]);
const [planningLoading, setPlanningLoading] = useState(true);
const [planningError, setPlanningError] = useState(null);
const [scheduleData, setScheduleData] = useState({});

// Effet pour charger les plannings - DÉPLACÉ AU NIVEAU RACINE
// Modifiez la section dans useEffect qui gère le chargement des plannings

useEffect(() => {
  if (!idGym || selectedTab !== 'document') return;

  const fetchPlannings = async () => {
    try {
      setPlanningLoading(true);
      console.log(`Récupération des plannings pour le gym ID: ${idGym}`);

      // URL de l'API
      const apiUrl = `http://192.168.0.3:8082/api/plannings/user/${idGym}`;
      console.log('Appel API:', apiUrl);

      // Faire la requête GET
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log('Statut de la réponse:', response.status);

      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération des plannings (${response.status})`);
      }

      // Convertir la réponse en JSON
      const data = await response.json();
      console.log('Plannings récupérés:', data);

      if (!Array.isArray(data)) {
        console.error('Format de données non valide:', data);
        throw new Error('Format de données non valide');
      }

      setPlannings(data);

      // Transformer les données pour l'affichage
      const formattedData = transformPlanningsForDisplay(data);
      setScheduleData(formattedData);

      // SUPPRIMEZ CETTE PARTIE qui remplace automatiquement le jour sélectionné
      // if (Object.keys(formattedData).length > 0 && !formattedData[selectedDay]) {
      //   setSelectedDay(Object.keys(formattedData)[0]);
      // }

      setPlanningError(null);
    } catch (err) {
      console.error('Erreur lors de la récupération des plannings:', err);
      setPlanningError(err.message);
      
      // En cas d'erreur, utiliser les données statiques
      setScheduleData(getStaticScheduleData());
    } finally {
      setPlanningLoading(false);
    }
  };

  fetchPlannings();
}, [idGym, selectedTab, selectedDay]); // Vous pouvez aussi retirer selectedDay de la dépendance si ce n'est pas nécessaire// Ajout de selectedTab comme dépendance

// Fonction pour transformer les données reçues de l'API en format d'affichage
const transformPlanningsForDisplay = useCallback((planningsData) => {
  const formattedData = {};

  planningsData.forEach(planning => {
    // Vérifier que le planning contient toutes les données nécessaires
    if (!planning.dayName || !planning.dayTitle || !planning.activity1 || !planning.time1 || !planning.activity2 || !planning.time2) {
      console.warn('Planning incomplet ignoré:', planning);
      return;
    }

    // Créer ou mettre à jour l'entrée pour ce jour
    if (!formattedData[planning.dayName]) {
      formattedData[planning.dayName] = {
        title: planning.dayTitle,
        activities: []
      };
    }

    // Ajouter les activités
    formattedData[planning.dayName].activities.push(
      { name: planning.activity1, time: planning.time1 },
      { name: planning.activity2, time: planning.time2 }
    );
  });

  return formattedData;
}, []);

// Données statiques à utiliser en cas d'erreur ou pendant le chargement
const getStaticScheduleData = useCallback(() => {
  return {
    'Lundi': {
      title: 'Force & Musculation',
      activities: [
        { name: 'Musculation Haut du Corps', time: '06:00 - 08:00' },
        { name: 'Musculation Bas du Corps', time: '18:00 - 20:00' }
      ]
    },
    'Mardi': {
      title: 'Cardio & Endurance',
      activities: [
        { name: 'Course & Intervalles', time: '07:00 - 09:00' },
        { name: 'Spinning', time: '19:00 - 20:30' }
      ]
    },
    'Mercredi': {
      title: 'Fitness Mixte',
      activities: [
        { name: 'Yoga', time: '07:30 - 09:00' },
        { name: 'Circuit Training', time: '18:30 - 20:00' }
      ]
    },
    'Jeudi': {
      title: 'Musculation Intensive',
      activities: [
        { name: 'CrossFit', time: '06:30 - 08:00' },
        { name: 'Musculation Ciblée', time: '19:00 - 21:00' }
      ]
    },
    'Vendredi': {
      title: 'Cardio & Bien-être',
      activities: [
        { name: 'Pilates', time: '07:00 - 08:30' },
        { name: 'Boxe Fitness', time: '18:30 - 20:00' }
      ]
    },
    'Samedi': {
      title: 'Cours Collectifs',
      activities: [
        { name: 'Zumba', time: '09:00 - 10:30' },
        { name: 'Body Pump', time: '11:00 - 12:30' }
      ]
    },
    'Dimanche': {
      title: 'Récupération',
      activities: [
        { name: 'Stretching', time: '10:00 - 11:30' },
        { name: 'Cours de Relaxation', time: '11:45 - 13:00' }
      ]
    }
  };
}, []);

// Liste ordonnée des jours de la semaine
const orderedDays = useMemo(() => {
  // Ordre fixe des jours de la semaine
  const weekDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  
  // Si aucune donnée n'est disponible, afficher tous les jours
  if (Object.keys(scheduleData).length === 0) {
    return weekDays;
  }
  
  // Filtrer pour garder l'ordre tout en affichant uniquement les jours présents dans scheduleData
  return weekDays;
}, [scheduleData]);

// Fonction pour rafraîchir les données
const refreshPlannings = useCallback(() => {
  setPlanningLoading(true);
  setPlanningError(null);
  // Forcer la réexécution de l'useEffect
  setPlannings([]);
}, []);

// Fonction pour obtenir un titre et des activités par défaut pour un jour sans données
const getDefaultDayData = useCallback((day) => {
  const defaultTitles = {
    'Lundi': 'Jour de repos',
    'Mardi': 'Jour de repos',
    'Mercredi': 'Jour de repos',
    'Jeudi': 'Jour de repos',
    'Vendredi': 'Jour de repos',
    'Samedi': 'Jour de repos',
    'Dimanche': 'Jour de repos'
  };

  return {
    title: defaultTitles[day] || 'Jour de repos',
    activities: []
  };
}, []);

// Remplacer la fonction renderPlanning qui ne contient maintenant QUE l'affichage, pas d'états ou d'effets
// Modifiez la fonction renderPlanning pour mieux gérer l'affichage des jours sans planning

const renderPlanning = () => {
  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <Text style={styles.sectionTitle}>Planning d'entraînement</Text>
        {planningError && (
          <TouchableOpacity style={styles.refreshButton} onPress={refreshPlannings}>
            <Text style={styles.refreshButtonText}>Rafraîchir</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <Text style={styles.aboutText}>
        Découvrez nos différents programmes d'entraînement adaptés à tous les niveaux.
      </Text>
      
      {planningLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#CBFF06" />
          <Text style={styles.loadingText}>Chargement du planning...</Text>
        </View>
      ) : planningError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{planningError}</Text>
          <Text style={styles.normalText}>Affichage des données par défaut</Text>
        </View>
      ) : (
        <>
          {/* Sélecteur de jours */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daySelector}>
            {orderedDays.map((day) => (
              <TouchableOpacity 
                key={day} 
                style={[
                  styles.dayButton, 
                  selectedDay === day && styles.selectedDayButton
                ]}
                onPress={() => setSelectedDay(day)}
              >
                <Text style={[
                  styles.dayButtonText,
                  selectedDay === day && styles.selectedDayButtonText
                ]}>
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* Contenu du jour sélectionné */}
          <View style={styles.dayContent}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayTitle}>{selectedDay}</Text>
              <Text style={styles.daySubtitle}>
                {scheduleData[selectedDay] ? scheduleData[selectedDay].title : 'Aucun cours programmé'}
              </Text>
            </View>
            
            <View style={styles.activitiesTable}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderActivity}>Activité</Text>
                <Text style={styles.tableHeaderTime}>Horaire</Text>
              </View>
              
              {/* Vérifier si le jour sélectionné a des activités planifiées */}
              {scheduleData[selectedDay] && scheduleData[selectedDay].activities && scheduleData[selectedDay].activities.length > 0 ? (
                // Afficher les activités si disponibles
                scheduleData[selectedDay].activities.map((activity, index) => (
                  <View key={index} style={[
                    styles.tableRow,
                    index % 2 === 0 ? styles.evenRow : styles.oddRow
                  ]}>
                    <Text style={styles.activityName}>{activity.name}</Text>
                    <Text style={styles.activityTime}>{activity.time}</Text>
                  </View>
                ))
              ) : (
                // Afficher le message "aucune activité" si pas d'activités pour ce jour
                <View style={styles.noScheduleContainer}>
                  <Text style={styles.noScheduleText}>Aucune activité programmée pour ce jour</Text>
                </View>
              )}
            </View>
          </View>
          
          {/* Ajout d'un espace en bas pour éviter que la navbar cache le contenu */}
          <View style={{ height: 150 }} />
        </>
      )}
    </View>
  );
};

// Modify the renderMainContent function to use renderEmoji
const renderMainContent = () => {
  switch (selectedTab) {
    case 'document':
      return (
        renderPlanning()
      );
        
    case 'gallery':
      return (
        <View>
          <Text style={styles.sectionTitle}>Galerie photos</Text>
          {galleryLoading ? (
            <ActivityIndicator size="large" color="#111" />
          ) : galleryError ? (
            <Text style={styles.errorText}>Erreur de chargement des images: {galleryError}</Text>
          ) : (
            <ScrollView>
              {renderGalleryGrid()}
            </ScrollView>
          )}
        </View>
      );
        
    case 'video':
      return (
        <View>
          <Text style={styles.sectionTitle}>Vidéos</Text>
          {renderVideoContent()}
        </View>
      );
        
    case 'emoji':
      return renderEmoji();
        
    default:
      return null;
  }
};

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header avec l'image des haltères */}
       {/* Header avec l'image des haltères */}
<View style={styles.headerImageContainer}>
  <Image 
    source={
      photo 
        ? { uri: `data:image/jpeg;base64,${photo}` }
        : require('../../assets/images/b.png')
    } 
    style={styles.headerImage}
    resizeMode="cover"
  />
  
  {/* Bouton de retour */}
  <TouchableOpacity 
    style={styles.backButton}
    onPress={() => navigation.goBack()}
  >
    <Ionicons name="chevron-back" size={24} color="#fff" />
  </TouchableOpacity>
</View>

        {/* Section profil du gym */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <View style={styles.profileInfo}>
              <Image 
                source={
                  photo 
                    ? { uri: `data:image/jpeg;base64,${photo}` }
                    : require('../../assets/images/b.png')
                } 
                style={styles.logo} 
              />
              <View>
                <Text style={styles.gymName}>{firstName || 'Fitness Gym'}</Text>
                
                <View style={styles.gymHours}>
                  <Ionicons name="location-outline" size={20} color="#777" />
                  <Text style={styles.aboutText}>{typeCoaching}</Text>
                </View>
                <View style={styles.gymHours}>
                  <Ionicons name="time-outline" size={16} color="#777" />
                  <Text style={styles.hoursText}>Lun - Sam : 08:00 - 21:00</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Bouton Abonnements */}
         
          <TouchableOpacity 
  style={styles.subscriptionButton}
  onPress={navigateToSalled}
>
  <Text style={styles.subscriptionButtonText}>Abonnements</Text>
</TouchableOpacity>
          {/* À propos section */}
          <View style={styles.aboutSection}>
            <Text style={styles.sectionTitle}>À propos de nous</Text>
            <Text style={styles.aboutText}>
              {bio || 'Aucune biographie disponible.'}
            </Text>
            <View style={styles.contactInfo}>
              {email && (
                <View style={styles.contactItem}>
                  <Ionicons name="mail-outline" size={16} color="#777" />
                  <Text style={styles.contactText}>{email}</Text>
                </View>
              )}
              {phoneNumber && (
                <View style={styles.contactItem}>
                  <Ionicons name="call-outline" size={16} color="#777" />
                  <Text style={styles.contactText}>{phoneNumber}</Text>
                </View>
              )}
            </View>
          </View>
          
          {/* Type de coaching */}
          {typeCoaching && (
            <View style={styles.aboutSection}>
              <Text style={styles.sectionTitle1}>Type de coaching</Text>
              <Text style={styles.aboutText}>
                WiFi gratuit{'\n'}
                Parking gratuit{'\n'}
                Buvette / Bar à jus{'\n'}
                Magasin d'accessoires sportifs
              </Text>
            </View>
          )}

          {/* Coachs section */}
          {/* Coachs section */}
              {/* Coachs section */}
<View style={styles.coachesSection}>
  <Text style={styles.sectionTitle}>Nos Coachs</Text>
  
  {loading ? (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#111" />
      <Text style={styles.loadingText}>Chargement des coachs...</Text>
    </View>
  ) : error ? (
    <Text style={styles.errorText}>Erreur: {error}</Text>
  ) : (
    <ScrollView 
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.coachesScrollContainer}
    >
      {coaches.map((coach) => (
        <TouchableOpacity 
          key={coach.id} 
          style={styles.coachScrollItem}
          onPress={() => {
            console.log(`Coach ${coach.firstName} sélectionné`);
            // Navigate to SAlle screen with coach details
            router.push({
              pathname: '/(Salle)/Sallee',
              params: {
                firstName: coach.firstName,
                photo: coach.photo,
                bio: coach.bio || "Aucune biographie disponible pour ce coach.",
                phoneNumber: coach.phoneNumber,
                poste: "Coach personnel",
                typeCoaching: "Fitness et remise en forme",
                idGym: idGym // Pass the current gym ID if needed
              }
            });
          }}
        >
          <Image 
            source={
              coach.photo 
                ? { uri: `data:image/jpeg;base64,${coach.photo}` }
                : require('../../assets/images/b.png')
            } 
            style={styles.coachScrollImage} 
          />
          <Text style={styles.coachName}>{coach.firstName}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  )}
</View>


          {/* Barre de navigation intérieure */}
          <View style={styles.innerNavBar}>
            <TouchableOpacity 
              style={[styles.navItem, selectedTab === 'document' && styles.selectedNavItem]}
              onPress={() => setSelectedTab('document')}
            >
              <MaterialCommunityIcons 
                name="file-document-outline" 
                size={24} 
                color={selectedTab === 'document' ? "#000" : "#666"} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.navItem, selectedTab === 'gallery' && styles.selectedNavItem]}
              onPress={() => setSelectedTab('gallery')}
            >
              <MaterialIcons 
                name="photo-library" 
                size={24} 
                color={selectedTab === 'gallery' ? "#000" : "#666"} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.navItem, selectedTab === 'video' && styles.selectedNavItem]}
              onPress={() => setSelectedTab('video')}
            >
              <MaterialIcons 
                name="videocam" 
                size={24} 
                color={selectedTab === 'video' ? "#000" : "#666"} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.navItem, selectedTab === 'emoji' && styles.selectedNavItem]}
              onPress={() => setSelectedTab('emoji')}
            >
              <MaterialIcons 
                name="emoji-emotions" 
                size={24} 
                color={selectedTab === 'emoji' ? "#000" : "#666"} 
              />
            </TouchableOpacity>
          </View>
          <View style={styles.tabContent}>
            {renderMainContent()}
          </View>

        </View>
      </ScrollView>

      {/* Modals */}
      <ReviewModal 
        isVisible={isReviewModalVisible}
        onClose={() => setIsReviewModalVisible(false)}
        rating={rating}
        setRating={setRating}
        comment={comment}
        setComment={setComment}
        firstName={firstName}
      />
      <VideoModal 
        visible={videoModalVisible}
        onClose={() => {
          setVideoModalVisible(false);
          setSelectedVideoUri(null);
        }}
        videoUri={selectedVideoUri}
        allVideos={reels}
      />
      <PhotoViewerModal
        visible={photoModalVisible}
        onClose={() => {
          setPhotoModalVisible(false);
          setSelectedImage(null);
        }}
        imageUri={selectedImage}
        allImages={galleryImages}
      />
    </SafeAreaView>
  );
};

// Composants Modaux
const renderStars = (rating) => (
  <View style={styles.starsContainer}>
    {[1, 2, 3, 4, 5].map((star) => (
      <MaterialIcons
        key={star}
        name={star <= rating ? "star" : "star-border"}
        size={20}
        color="#FFD700"
      />
    ))}
  </View>
);
//////////////////////commentaire  
const ReviewModal = ({ 
  isVisible, 
  onClose, 
  rating, 
  setRating, 
  comment, 
  setComment, 
  firstName
}) => {
  const [beforeImage, setBeforeImage] = useState(null);
  const [afterImage, setAfterImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Utilisateur connecté (à remplacer par votre logique d'authentification)
  const utilisateurId = 4; // ID de l'utilisateur connecté (gymzer)
  
  // Paramètres du composant parent
  const route = useRoute();
  const params = route.params || {};
  const recepteurId = params.idGym; // ID du gym qui reçoit le commentaire

  const API_BASE_URL = 'http://192.168.0.3:8082'; // URL de l'API

  const pickImage = async (setImage) => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permission refusée", "La permission d'accéder à la galerie est requise !");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection de l\'image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  // Fonction pour soumettre le commentaire à l'API
  const submitReview = async () => {
    // Validation
    if (!rating) {
      Alert.alert("Erreur", "Veuillez donner une évaluation");
      return;
    }
    if (!comment.trim()) {
      Alert.alert("Erreur", "Veuillez ajouter un commentaire");
      return;
    }
    
    // Vérifier que les IDs requis sont disponibles
    if (!utilisateurId || !recepteurId) {
      Alert.alert("Erreur", "Information utilisateur manquante");
      console.error("utilisateurId ou recepteurId manquant", { utilisateurId, recepteurId });
      return;
    }

    setIsSubmitting(true);

    try {
      // Préparation du FormData
      const formData = new FormData();
      formData.append('evaluation', rating.toString());
      formData.append('commentaire', comment);

      // Traitement de l'image "avant" si disponible
      if (beforeImage) {
        const imageNameBefore = beforeImage.split('/').pop();
        const mimeTypeBefore = getMimeType(imageNameBefore);
        
        formData.append('imageAvant', {
          uri: Platform.OS === 'android' ? beforeImage : beforeImage.replace('file://', ''),
          name: imageNameBefore,
          type: mimeTypeBefore
        });
      }

      // Traitement de l'image "après" si disponible
      if (afterImage) {
        const imageNameAfter = afterImage.split('/').pop();
        const mimeTypeAfter = getMimeType(imageNameAfter);
        
        formData.append('imageApres', {
          uri: Platform.OS === 'android' ? afterImage : afterImage.replace('file://', ''),
          name: imageNameAfter,
          type: mimeTypeAfter
        });
      }

      // Log pour le debug
      console.log(`Envoi du commentaire à l'URL: ${API_BASE_URL}/api/commentaires/${utilisateurId}/${recepteurId}`);

      // Appel API
      const response = await fetch(`${API_BASE_URL}/api/commentaires/${utilisateurId}/${recepteurId}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          // Ne pas définir Content-Type pour un FormData multipart
        },
        body: formData
      });

      // Vérifier uniquement le statut HTTP
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      console.log("Commentaire publié avec succès");
      
      // Réinitialiser le formulaire
      setRating(0);
      setComment('');
      setBeforeImage(null);
      setAfterImage(null);
      
      // Fermer le modal
      onClose();
      
      // Message de succès
      Alert.alert(
        "Succès",
        "Votre avis a été publié avec succès !",
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error('Erreur lors de la publication de l\'avis:', error);
      Alert.alert(
        "Erreur",
        `Impossible de publier votre avis. ${error.message}`,
        [{ text: "OK" }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fonction utilitaire pour déterminer le type MIME
  const getMimeType = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    switch (ext) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      default:
        return 'image/jpeg'; // Par défaut
    }
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView>
                <Text style={styles.modalTitle}>
                  Partagez votre expérience{'\n'}
                  {firstName ? `chez ${firstName}` : 'au gym'}
                </Text>
                <Text style={styles.fieldLabel}>Évaluation *</Text>
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setRating(star)}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons
                        name={star <= rating ? "star" : "star-border"}
                        size={32}
                        color="#D4FF00"
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.fieldLabel}>Commentaire *</Text>
                <TextInput
                  style={styles.commentInput}
                  multiline
                  placeholder="Partagez votre expérience"
                  value={comment}
                  onChangeText={setComment}
                  textAlignVertical="top"
                />
                <Text style={styles.fieldLabel}>Images de la transformation</Text>
                <View style={styles.transformationImagesContainer}>
                  <View style={styles.transformationImageWrapper}>
                    <TouchableOpacity 
                      style={styles.uploadImageButton}
                      onPress={() => pickImage(setBeforeImage)}
                    >
                      {beforeImage ? (
                        <Image source={{ uri: beforeImage }} style={styles.uploadedImage} />
                      ) : (
                        <MaterialIcons name="add-photo-alternate" size={32} color="#D4FF00" />
                      )}
                    </TouchableOpacity>
                    <Text style={styles.imageLabel}>Avant</Text>
                  </View>
                  <View style={styles.transformationImageWrapper}>
                    <TouchableOpacity 
                      style={styles.uploadImageButton}
                      onPress={() => pickImage(setAfterImage)}
                    >
                      {afterImage ? (
                        <Image source={{ uri: afterImage }} style={styles.uploadedImage} />
                      ) : (
                        <MaterialIcons name="add-photo-alternate" size={32} color="#D4FF00" />
                      )}
                    </TouchableOpacity>
                    <Text style={styles.imageLabel}>Après</Text>
                  </View>
                </View>
                <View style={styles.buttonContainer}>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => {
                      onClose();
                      setRating(0);
                      setComment('');
                      setBeforeImage(null);
                      setAfterImage(null);
                    }}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.cancelButtonText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.submitButton, isSubmitting && { opacity: 0.7 }]}
                    onPress={submitReview}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.submitButtonText}>Publier</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// Sample reviews for the gym


//////////////////////


const VideoModal = ({ 
  visible, 
  onClose, 
  videoUri, 
  allVideos = [] 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [localVideoUris, setLocalVideoUris] = useState({});
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const scrollViewRef = useRef(null);
  const videoRefs = useRef({});
  const mountedRef = useRef(true);

  // Fonction stable de traitement des URI
  const processVideoUri = (videoData) => {
    if (!videoData) return null;

    try {
      // Vérification des différents types d'URI
      if (typeof videoData !== 'string') {
        console.error('❌ Type de données non valide');
        return null;
      }

      // Cas 1: URI déjà valide
      const validPrefixes = [
        'http://', 
        'https://', 
        'file://', 
        'content://'
      ];

      const isValidUri = validPrefixes.some(prefix => 
        videoData.startsWith(prefix)
      ) || videoData.endsWith('.mp4');

      if (isValidUri) {
        console.log('✅ URI valide détectée');
        return videoData;
      }

      // Fallback
      console.warn('⚠️ Aucun format d\'URI reconnu');
      return 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4';

    } catch (error) {
      console.error('🚨 Erreur de traitement vidéo:', error);
      return null;
    }
  };

  // Préparer les vidéos - version simplifiée
  const prepareVideos = useCallback(async () => {
    if (!visible) return;
    
    try {
      setIsLoading(true);
      setError(null);

      // Sélectionner les vidéos à traiter
      const videosToProcess = allVideos.length > 0 
        ? allVideos.slice(0, 5)  // Limiter à 5 vidéos max
        : (videoUri ? [{ id: 'single', videoUri }] : []);

      const processedUris = {};
      
      for (const video of videosToProcess) {
        if (!mountedRef.current) break;
        
        const videoData = video.videoUri;
        if (videoData) {
          const processedUri = processVideoUri(videoData);
          if (processedUri) {
            processedUris[video.id] = processedUri;
          }
        }
      }
      
      if (mountedRef.current) {
        setLocalVideoUris(processedUris);
      }
      
    } catch (err) {
      if (mountedRef.current) {
        console.error('Erreur de préparation:', err);
        setError('Impossible de préparer les vidéos');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [visible, allVideos, videoUri]);

  // Effet pour préparer les vidéos
  useEffect(() => {
    mountedRef.current = true;
    
    if (visible) {
      prepareVideos();
    }

    return () => {
      mountedRef.current = false;
    };
  }, [visible, prepareVideos]);

  // Gestion du scroll
  const handleScroll = useCallback((event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const width = Dimensions.get('window').width;
    const newIndex = Math.round(offsetX / width);
    
    if (newIndex !== currentVideoIndex) {
      // Pause toutes les vidéos
      Object.values(videoRefs.current).forEach(ref => {
        if (ref) {
          ref.pauseAsync().catch(console.error);
        }
      });
      
      setCurrentVideoIndex(newIndex);
    }
  }, [currentVideoIndex]);

  // Ne rien afficher si le modal n'est pas visible
  if (!visible) return null;

  // Déterminer les vidéos à afficher
  const videosToShow = allVideos.length > 0 
    ? allVideos.slice(0, 5)  // Limiter à 5 vidéos max
    : (videoUri ? [{ id: 'single', videoUri }] : []);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      transparent={false}
    >
      <View style={styles.videoModalContainer}>
        {/* Bouton de fermeture */}
        <TouchableOpacity 
          style={styles.videoModalCloseButton}
          onPress={onClose}
        >
          <Text style={styles.videoModalCloseText}>Fermer</Text>
        </TouchableOpacity>

        {/* Contenu des vidéos */}
        {videosToShow.length > 0 ? (
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
            contentContainerStyle={styles.videoScrollViewContent}
            scrollEventThrottle={16}
          >
            {videosToShow.map((video, index) => (
              <View key={video.id || index} style={styles.videoScrollItem}>
                {localVideoUris[video.id] ? (
                  <Video
                    ref={ref => { 
                      if (ref) videoRefs.current[video.id] = ref; 
                    }}
                    style={styles.videoPlayer}
                    source={{ uri: localVideoUris[video.id] }}
                    resizeMode="contain"
                    useNativeControls
                    shouldPlay={false}
                    isLooping={false}
                    onLoadStart={() => {
                      if (index === currentVideoIndex) setIsLoading(true);
                    }}
                    onLoad={() => {
                      if (index === currentVideoIndex) setIsLoading(false);
                    }}
                    onError={(error) => {
                      console.error(`Erreur de lecture vidéo:`, error);
                      if (index === currentVideoIndex) {
                        setError(`Erreur de lecture`);
                        setIsLoading(false);
                      }
                    }}
                  />
                ) : (
                  <View style={styles.videoLoadingContainer}>
                    <ActivityIndicator size="large" color="#FFFFFF" />
                    <Text style={styles.videoLoadingText}>
                      Chargement de la vidéo...  
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.videoErrorContainer}>
            <MaterialIcons name="videocam-off" size={60} color="#555" />
            <Text style={styles.videoErrorText}>Aucune vidéo disponible</Text>
          </View>
        )}

        {/* Indicateur de chargement */}
        {isLoading && currentVideoIndex >= 0 && (
          <View style={styles.videoLoadingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.videoLoadingText}>Chargement de la vidéo...</Text>
          </View>
        )}

        {/* Gestion des erreurs */}
        {error && (
          <View style={styles.videoErrorContainer}>
            <Text style={styles.videoErrorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={prepareVideos}
            >
              <Text style={styles.retryButtonText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Indicateur de position pour plusieurs vidéos */}
        {videosToShow.length > 1 && (
          <View style={styles.videoPageIndicator}>
            {videosToShow.map((_, index) => (
              <View 
                key={index} 
                style={[
                  styles.indicatorDot,
                  index === currentVideoIndex && styles.indicatorDotActive
                ]} 
              />
            ))}
          </View>
        )}
      </View>
    </Modal>
  );
};

// N'oubliez pas d'ajouter ces imports en haut du fichier


// Ajoutez ce composant après le composant VideoModal dans votre code

const PhotoViewerModal = ({ visible, onClose, imageUri, allImages = [] }) => {
  // Log pour le débogage
  console.log('Images reçues:', allImages);
  console.log('Image sélectionnée:', imageUri);

  // Préparer les images à afficher
  const imagesToShow = allImages.length > 0 ? allImages : 
      (imageUri ? [{ id: 'single', source: imageUri }] : []);

  // Trouver l'index initial
  const initialScrollIndex = allImages.findIndex(img => 
      img.source === imageUri || 
      (imageUri && img.source.uri === imageUri.uri)
  );

  // Vérification des conditions d'affichage
  if (!visible) return null;
  if (imagesToShow.length === 0) {
      console.warn('Aucune image à afficher');
      return null;
  }

  return (
      <Modal
          visible={visible}
          transparent={true}
          animationType="fade"
          onRequestClose={onClose}
      >
          <View style={styles.photoModalContainer}>
              <TouchableOpacity 
                  style={styles.closeButton} 
                  onPress={onClose}
              >
                  <Ionicons name="close" size={30} color="white" />
              </TouchableOpacity>

              <View style={styles.photoModalContent}>
                  <ScrollView 
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      initialScrollIndex={initialScrollIndex > -1 ? initialScrollIndex : 0}
                      contentContainerStyle={styles.scrollViewContent}
                  >
                      {imagesToShow.map((image, index) => (
                          <View 
                              key={image.id || `image-${index}`} 
                              style={styles.photoScrollItem}
                          >
                              <Image 
                                  source={image.source} 
                                  style={styles.photoModalImage}
                                  resizeMode="contain"
                                  onError={(e) => {
                                      console.error(
                                          'Erreur de chargement de l\'image:', 
                                          e.nativeEvent.error
                                      );
                                  }}
                              />
                          </View>
                      ))}
                  </ScrollView>
              </View>
          </View>
      </Modal>
  );
};
////////
// Enhanced video data processing with more detailed logging
const processVideoData = async (videoData) => {
  if (!videoData) return null;
  
  try {
    console.log("Type de vidéo à traiter:", typeof videoData);
    
    // Si c'est déjà une URL directe
    if (typeof videoData === 'string' && (videoData.startsWith('http') || videoData.startsWith('file://'))) {
      return videoData;
    }
    
    // Créer un nom de fichier avec extension correcte
    const timestamp = Date.now();
    const filename = `${FileSystem.cacheDirectory}temp_video_${timestamp}.mp4`;
    
    // Si c'est une data URI avec base64
    if (typeof videoData === 'string') {
      let base64Data = videoData;
      
      // Extraire la partie base64 si format data URI
      if (videoData.includes('base64,')) {
        base64Data = videoData.split('base64,')[1];
      }
      
      // Vérification minimale des données base64
      const isBase64 = /^[A-Za-z0-9+/=]+$/.test(base64Data.substring(0, 100));
      if (!isBase64) {
        console.error("Format de données vidéo non reconnu");
        return null;
      }
      
      try {
        await FileSystem.writeAsStringAsync(filename, base64Data, {
          encoding: FileSystem.EncodingType.Base64
        });
        
        // Vérification que le fichier a bien été créé
        const fileInfo = await FileSystem.getInfoAsync(filename);
        if (!fileInfo.exists || fileInfo.size < 1000) { // Si fichier trop petit, probablement corrompu
          console.error("Fichier vidéo trop petit ou corrompu");
          return null;
        }
        
        console.log("✅ Fichier vidéo créé avec succès:", filename);
        return filename;
      } catch (err) {
        console.error("❌ Erreur lors de l'écriture du fichier vidéo:", err);
        return null;
      }
    }
    
    console.error('❓ Format vidéo non supporté');
    return null;
  } catch (error) {
    console.error('❌ Erreur critique de traitement vidéo:', error);
    return null;
  }
};

// Enhanced Video Error Handling


const styles = StyleSheet.create({
  noScheduleContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noScheduleText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic'
  },

  ////////////////////


  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  normalText: {
    fontSize: 14, 
    color: '#777',
    marginTop: 5,
  },
  ////////////////////////

  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  aboutText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  daySelector: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  dayButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  selectedDayButton: {
    backgroundColor: '#CBFF06',
  },
  dayButtonText: {
    fontSize: 14,
    color: '#333',
  },
  selectedDayButtonText: {
    fontWeight: 'bold',
    color: '#000',
  },
  dayContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    marginBottom: 80,
  },
  dayHeader: {
    backgroundColor: '#CBFF06',
    padding: 16,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  daySubtitle: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
  },
  activitiesTable: {
    padding: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 8,
    marginBottom: 8,
  },
  tableHeaderActivity: {
    flex: 2,
    fontWeight: 'bold',
    color: '#000',
  },
  tableHeaderTime: {
    flex: 1,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'right',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  evenRow: {
    backgroundColor: '#f9f9f9',
  },
  oddRow: {
    backgroundColor: '#fff',
  },
  activityName: {
    flex: 2,
    fontSize: 14,
    color: '#333',
  },
  activityTime: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  //////////////////////////
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  //////////////////////commentaire 
  uploadedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
  },

  /////////////////////
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerImageContainer: {
    height: 200,
    backgroundColor: '#111',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  profileSection: {
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  tabContent: {
    paddingVertical: 10,
  },

  // ===== Styles profil gym =====
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 10,
  },
  gymName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  gymLocation: {
    fontSize: 14,
    color: '#777',
  },
  gymHours: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hoursText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  subscriptionButton: {
    backgroundColor: '#111',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 15,
  },
  subscriptionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },

  // ===== Styles sections content =====
  aboutSection: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionTitle1: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  aboutText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  contactInfo: {
    marginTop: 5,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  contactText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 8,
  },

  // ===== Styles coach section =====
  // ===== Updated coach section styles =====
coachesSection: {
  marginBottom: 0
},
coachesScrollContainer: {
  paddingVertical: 10,
  paddingHorizontal: 5,
},
coachScrollItem: {
  alignItems: 'center',
  marginHorizontal: 12,
  
  marginHorizontal: 6, // Réduit de 12 à 6 pour diminuer l'espace entre les coachs
  width: 90, 
},
coachScrollImage: {
  width: 95, // Taille carrée
  height: 95, // Même hauteur que la largeur
  borderRadius: 12, // Coins légèrement arrondis au lieu d'un cercle
  marginBottom: 5,
},
coachName: {
  fontSize: 14,
  textAlign: 'center',
  fontWeight: '500',
},

  // ===== Styles navigation intérieure =====
  innerNavBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
    marginVertical: 15,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  selectedNavItem: {
    borderBottomWidth: 2,
    borderBottomColor: '#111',
  },

  // ===== Styles document section =====
  documentsList: {
    marginTop: 10,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  documentName: {
    marginLeft: 10,
    fontSize: 14,
  },

  // ===== Styles galerie =====
  galleryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    paddingBottom: 80, 
  },
  galleryImage: {
    width: 100,
    height: 100,
    borderRadius: 4,
    marginHorizontal: 2,
  },

  // ===== Styles modal photo =====
  photoModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoModalContent: {
    width: '100%',
    height: '90%',
  },
  photoScrollItem: {
    width: Dimensions.get('window').width,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoModalImage: {
    width: '95%',
    height: '95%',
    borderRadius: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
  },
  fullScreenImage: {
    width: '100%',
    height: '80%',
  },
  scrollViewContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ===== Styles vidéo section =====
  videosContainer: {
    marginTop: 10,
  },
  videoThumbnailContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  videoThumbnail: {
    width: '100%',
    height: 180,
    borderRadius: 8,
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -15 }, { translateY: -15 }],
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 1,
    backgroundColor: 'transparent',
    marginBottom: 80,
  },
  videoGridItem: {
    width: '33%', // Pour une grille 3x3
    aspectRatio: 1, // Pour des carrés parfaits
    padding: 1,
    position: 'relative',
    marginBottom: 2,
    backgroundColor: 'transparent'
  },
  videoGridThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent'
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)', // Overlay sombre
  },
  playIconContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [
      { translateX: -20 },
      { translateY: -20 }
    ],
    zIndex: 2,
  },

  // ===== Styles modal vidéo =====
  videoScrollItem: {
    width: Dimensions.get('window').width,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoScrollViewContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoModalContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayer: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.8,
  },
  videoModalCloseButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 25,
    padding: 10,
  },
  videoModalCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  videoLoadingContainer: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  videoLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 5,
  },
  videoLoadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  videoErrorContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 10,
  },
  videoErrorText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  videoPlayerContainer: {
    width: '100%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoModalContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholder: {
    color: 'white',
    fontSize: 18,
    marginTop: 20,
  },
  videoPageIndicator: {
    position: 'absolute',
    bottom: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 4,
  },
  indicatorDotActive: {
    backgroundColor: '#fff',
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  // ===== Styles états loading/error =====
  loaderContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#555',
  },
  loaderText: {
    color: '#666',
    fontSize: 14,
    marginTop: 10,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    padding: 10,
    color: 'red',
    fontSize: 14,
  },
  centerContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noVideosText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#D4FF00',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 10,
  },
  retryButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },

  // ===== Styles reviews =====
  reviewSummary: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  ratingNumber: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  starsContainer: {
    flexDirection: 'row',
    marginVertical: 5,
  },
  reviewCount: {
    color: '#777',
    fontSize: 14,
  },
  addReviewButton: {
    backgroundColor: '#111',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  addReviewButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  reviewsList: {
    marginTop: 10,
  },
  reviewItem: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewerName: {
    fontWeight: 'bold',
  },
  reviewStars: {
    flexDirection: 'row',
  },
  reviewDate: {
    color: '#777',
    fontSize: 12,
    marginTop: 2,
    marginBottom: 5,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
  },

  // ===== Styles modal review =====
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  ratingContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  starIcon: {
    marginHorizontal: 5,
  },
  commentInput: {
    width: '100%',
    height: 100,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    width: '45%',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#555',
  },
  submitButton: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#111',
    width: '45%',
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  //////////////////////////
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(19, 19, 19, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 24,
  },
  fieldLabel: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 8,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 15,
    padding: 15,
    height: 120,
    marginBottom: 20,
    backgroundColor: '#F8F8F8',
    textAlignVertical: 'top',
  },

  // ==============================
  // Styles des transformations d'images
  // ==============================
  transformationImagesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 30,
  },
  transformationImageWrapper: {
    alignItems: 'center',
    width: '45%',
  },
  uploadImageButton: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F8F8F8',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginBottom: 8,
  },
  imageLabel: {
    fontSize: 14,
    color: '#666',
  },

  // ==============================
  // Styles de la section des avis
  // ==============================
  emojiScrollView: {
    flex: 1,
    marginBottom: 80, 
  },
  shareExperienceButton: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  shareExperienceText: {
    color: '#666',
    textAlign: 'center',
    fontSize: 16,
  },
  existingReviews: {
    marginTop: 20,
  },
  reviewCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  reviewText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  beforeAfterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  beforeAfterImage: {
    width: '48%',
    height: 150,
    borderRadius: 8,
  },

  // ==============================
  // Styles des boutons du modal
  // ==============================
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '500',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  ///////////////////
  scheduleContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  scheduleDay: {
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scheduleDayHeader: {
    backgroundColor: '#000',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  scheduleDayTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scheduleDetails: {
    padding: 15,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  scheduleItemText: {
    marginLeft: 15,
    fontSize: 14,
    flex: 1,
  },
  scheduleItemTime: {
    fontSize: 12,
    color: '#666',
  },
});

export default SAlle;