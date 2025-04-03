import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  StatusBar
  
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Dimensions } from 'react-native';
import { Video } from 'expo-av';
// Pour l'instant, nous utilisons expo-av pour le composant Video
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
const { width, height } = Dimensions.get('window');
//
// Hook pour charger les images de la galerie
//
// Hook pour charger les images de la galerie
const useGalleryImages = (id, selectedTab) => {
  const [galleryImages, setGalleryImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const API_BASE_URL = 'http://192.168.0.3:8082/api';
  const DEFAULT_IMAGE = Image.resolveAssetSource(require('../../assets/images/b.png')).uri;

  useEffect(() => {
    if (selectedTab === 'gallery') {
      loadGalleryImages(id);
    }
  }, [selectedTab, id]);

  const loadGalleryImages = async (coachId) => {
    try {
      setIsLoading(true);
      setError(null);
      setGalleryImages([]);

      const response = await fetch(`${API_BASE_URL}/photos/user/${coachId}`, {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const photos = await response.json();
      
      // Traitement des photos reçues
      if (!Array.isArray(photos) || photos.length === 0) {
        throw new Error('Aucune image trouvée dans la réponse');
      }

      // Création des URI pour chaque photo
      const processedImages = photos.map(photo => ({
        id: photo.id,
        uri: `${API_BASE_URL}/photos/${photo.id}`, // Utilise l'endpoint qui renvoie l'image binaire
        fileName: photo.fileName,
        uploadDate: photo.uploadDate
      }));

      setGalleryImages(processedImages);
    } catch (err) {
      console.error('Erreur lors du chargement des images:', err);
      setError(err.message || "Impossible de charger les images.");
    } finally {
      setIsLoading(false);
    }
  };

  return { galleryImages, isLoading, error };
};

//
// Modal pour publier un avis (ReviewModal)
//
const ReviewModal = ({ 
  isVisible, 
  onClose, 
  rating, 
  setRating, 
  comment, 
  setComment, 
  firstName,
  recepteurId
}) => {
  const [beforeImage, setBeforeImage] = useState(null);
  const [afterImage, setAfterImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Remove these lines that overwrite the recepteurId prop
  // const route = useRoute();
  // const params = route.params || {};
  // const recepteurId = params.idCoach;

  const API_BASE_URL = 'http://192.168.0.3:8082'; // URL de l'API

  const pickImage = async (setImage) => {
    try {
      // Request permission to access the media library
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert("Permission refusée", "La permission d'accéder à la galerie est requise !");
        return;
      }
      
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
      
      if (!result.canceled) {
        // Compress the image before setting it
        try {
          const compressedUri = await compressImage(result.assets[0].uri, {
            maxWidth: 800,
            maxHeight: 800,
            quality: 0.6,
          });
          
          // Set the compressed image
          setImage(compressedUri);
        } catch (compressionError) {
          console.error('Erreur lors de la compression:', compressionError);
          // If compression fails, use the original image
          setImage(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la sélection de l\'image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  const getMimeType = (filename) => {
    if (!filename) return 'image/jpeg'; // Default to jpeg
    
    const extension = filename.split('.').pop().toLowerCase();
    
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      case 'heic':
        return 'image/heic';
      default:
        return 'image/jpeg'; // Default
    }
  };

  const compressImage = async (uri, options = {}) => {
    try {
      // Check if URI is valid
      if (!uri || typeof uri !== 'string') {
        throw new Error('Invalid image URI');
      }
      
      // Get original file info
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error('Image file does not exist');
      }
      
      console.log(`Original image size: ${(fileInfo.size / 1024 / 1024).toFixed(2)} MB`);
      
      // Check if ImageManipulator is available
      if (!ImageManipulator) {
        console.warn('ImageManipulator not available, returning original image');
        return uri;
      }
      
      // Default options
      const imageOptions = {
        maxWidth: options.maxWidth || 1024,
        maxHeight: options.maxHeight || 1024,
        quality: options.quality || 0.7,
        format: options.format || ImageManipulator.SaveFormat.JPEG
      };
      
      // Perform the compression and resizing
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: imageOptions.maxWidth, height: imageOptions.maxHeight } }],
        { compress: imageOptions.quality, format: imageOptions.format }
      );
      
      // Log the results
      const compressedInfo = await FileSystem.getInfoAsync(result.uri);
      console.log(`Compressed image size: ${(compressedInfo.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Compression ratio: ${(compressedInfo.size / fileInfo.size * 100).toFixed(2)}%`);
      
      return result.uri;
    } catch (error) {
      console.error('Image compression error:', error);
      // Return original URI if compression fails
      return uri;
    }
  };

  const submitReview = async () => {
    console.log("Starting review submission with recepteurId:", recepteurId);
    
    // Validation
    if (!rating) {
      Alert.alert("Erreur", "Veuillez donner une évaluation");
      return;
    }
    if (!comment.trim()) {
      Alert.alert("Erreur", "Veuillez ajouter un commentaire");
      return;
    }
    
    // Vérifier que l'ID du coach est disponible
    if (!recepteurId) {
      Alert.alert("Erreur", "Information du coach manquante");
      console.error("ID du coach manquant");
      return;
    }

    setIsSubmitting(true);

    try {
      // Récupérer l'ID utilisateur depuis AsyncStorage
      const storedUserId = await AsyncStorage.getItem('userId');
      console.log("ID utilisateur récupéré depuis AsyncStorage:", storedUserId);
      
      // Utiliser l'ID stocké ou un ID par défaut si non disponible
      const currentUserId = storedUserId ? storedUserId : 2;
      console.log("ID utilisateur utilisé pour la requête:", currentUserId);
      
      // Préparation du FormData
      const formData = new FormData();
      formData.append('evaluation', rating.toString());
      formData.append('commentaire', comment);

      // Traitement de l'image "avant" si disponible
      if (beforeImage) {
        const processedBeforeImage = await compressImage(beforeImage, {
          maxWidth: 800,
          maxHeight: 800,
          quality: 0.5,
        });
        
        const imageNameBefore = processedBeforeImage.split('/').pop();
        const mimeTypeBefore = getMimeType(imageNameBefore);
        
        formData.append('imageAvant', {
          uri: Platform.OS === 'android' ? processedBeforeImage : processedBeforeImage.replace('file://', ''),
          name: imageNameBefore,
          type: mimeTypeBefore
        });
      }

      // Traitement de l'image "après" si disponible
      if (afterImage) {
        const processedAfterImage = await compressImage(afterImage, {
          maxWidth: 800,
          maxHeight: 800,
          quality: 0.5,
        });
        
        const imageNameAfter = processedAfterImage.split('/').pop();
        const mimeTypeAfter = getMimeType(imageNameAfter);
        
        formData.append('imageApres', {
          uri: Platform.OS === 'android' ? processedAfterImage : processedAfterImage.replace('file://', ''),
          name: imageNameAfter,
          type: mimeTypeAfter
        });
      }

      // Log pour le debug
      const apiUrl = `${API_BASE_URL}/api/commentaires/${currentUserId}/${recepteurId}`;
      console.log(`Envoi du commentaire à l'URL: ${apiUrl}`);

      // Appel API
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          // Ne pas définir Content-Type pour un FormData multipart
        },
        body: formData
      });

      // Vérifier le statut HTTP
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
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
      
      // Rafraîchir la liste des commentaires si disponible
      if (typeof fetchComments === 'function') {
        fetchComments(recepteurId);
      }
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
//const handleDiscoverCourses = () => {
  // Naviguer vers la page coura.jsx dans le dossier (cour)


// Modal pour publier un avis (ReviewModal)
//


//
// Composant principal CoachProfile
//
const CoachProfile1 = () => {
  const route = useRoute();
  const router = useRouter();
  const navigation = useNavigation();
  const [selectedTab, setSelectedTab] = useState('document');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  
  // États pour la lecture vidéo
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [selectedVideoUri, setSelectedVideoUri] = useState(null);
  
  // États pour les reels
  const [reels, setReels] = useState([]);
  const [reelsLoading, setReelsLoading] = useState(true);
  const [reelsError, setReelsError] = useState(null);

  // États pour la lecture image 
  const [selectedImage, setSelectedImage] = useState(null);
const [photoModalVisible, setPhotoModalVisible] = useState(false);

  const idCoach = route.params?.idCoach || route.params?.id;
  const userId = route.params?.userId;
  useEffect(() => {
    console.log("IDcoach:", idCoach);
    console.log("UserID:", userId);
  }, [idCoach, userId]);

  const { galleryImages, isLoading, error } = useGalleryImages(route.params?.id, selectedTab);

  const {
    competencesGenerales = [],
    coursSpecifiques = [],
    disciplines = [],
    dureeExperience,
    dureeSeance,
    email,
    entrainementPhysique = [],
    firstName,
    photo,
    prixSeance,
    santeEtBienEtre = [],
    bio,
    typeCoaching,
    poste,
    
  } = route.params || {};

  const handleContactCoach = () => {
    router.push({
      pathname: '/Coachd',
      params: {
        idCoach: idCoach,
        userId: userId
      }
    });
  };
  ////////////
  
  ////////////////

  const handleDiscoverCourses = () => {
    // Naviguer vers la page coura.jsx dans le dossier (cour)
    router.push({
      pathname: '/(cour)/coura',
      params: {
        idCoach: idCoach,
        userId: userId,
        firstName: firstName // Ajout du prénom du coach
      }
    });
  };

  // Fonction helper pour convertir blob/base64 en URI vidéo
  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result
          .replace('data:application/octet-stream;base64,', '')
          .replace('data:video/mp4;base64,', '');
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Fonction pour traiter les données vidéo
  const processVideoData = async (videoData) => {
    if (!videoData) return null;
    
    try {
      // Si c'est une URL directe
      if (typeof videoData === 'string' && (videoData.startsWith('http') || videoData.startsWith('file://'))) {
        const filename = `${FileSystem.cacheDirectory}temp_video_${Date.now()}.mp4`;
        await FileSystem.downloadAsync(videoData, filename);
        return filename;
      }
      
      // Si c'est une data URI (ex: "data:video/mp4;base64,...")
      if (typeof videoData === 'string' && videoData.startsWith('data:')) {
        const filename = `${FileSystem.cacheDirectory}temp_video_${Date.now()}.mp4`;
        const base64Data = videoData.replace(/^data:video\/mp4;base64,/, '');
        await FileSystem.writeAsStringAsync(filename, base64Data, {
          encoding: FileSystem.EncodingType.Base64
        });
        return filename;
      }
      
      // Si ce sont des données en base64 pures
      if (typeof videoData === 'string' && videoData.match(/^[A-Za-z0-9+/=]+$/)) {
        const filename = `${FileSystem.cacheDirectory}temp_video_${Date.now()}.mp4`;
        await FileSystem.writeAsStringAsync(filename, videoData, {
          encoding: FileSystem.EncodingType.Base64
        });
        return filename;
      }
      
      // Pour les blobs ou buffers
      if (videoData instanceof Blob || (videoData.data && Array.isArray(videoData.data))) {
        const filename = `${FileSystem.cacheDirectory}temp_video_${Date.now()}.mp4`;
        const bytes = new Uint8Array(videoData.data || await videoData.arrayBuffer());
        const base64 = btoa(String.fromCharCode.apply(null, bytes));
        
        await FileSystem.writeAsStringAsync(filename, base64, {
          encoding: FileSystem.EncodingType.Base64
        });
        
        return filename;
      }
      
      console.warn('Unsupported video data format:', typeof videoData);
      return null;
    } catch (error) {
      console.error('Error processing video data:', error);
      return null;
    }
  };

  // Fonction pour récupérer et traiter les reels
 // Improved function for fetching and processing reels
// Updated fetchReels function focusing on direct video playback
// Improved fetchReels function with better error handling and debugging
// Improved fetchReels function that correctly uses the video streaming endpoint
const fetchReels = async (coachId) => {
  if (!coachId) {
    console.error('🚨 coachId is required');
    return [];
  }

  try {
    console.log(`🔄 Fetching reels for coach ID: ${coachId}`);
    const response = await fetch(`http://192.168.0.3:8082/api/reels/user/${coachId}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reels = await response.json();
    console.log('Response data structure:', JSON.stringify(reels[0], null, 2));

    if (!Array.isArray(reels)) {
      console.error('⚠️ Invalid response format - expected array');
      return [];
    }

    const processedReels = reels.map(reel => {
      try {
        // IMPORTANT CHANGE: Instead of using the videoPath directly,
        // use the dedicated video streaming endpoint
        const videoUri = `http://192.168.0.3:8082/api/reels/video/${reel.id}`;
        console.log(`Video streaming URI: ${videoUri}`);

        // Process title, defaults to original filename if title is missing
        const title = reel.title || (reel.originalFilename ? 
                               reel.originalFilename.substring(0, 30) : 'Vidéo sans titre');
        
        // We'll use placeholder image for thumbnails
        const defaultThumbnail = require('../../assets/images/b.png');

        const processedReel = {
          id: reel.id,
          videoUri,
          thumbnailUri: defaultThumbnail,
          title,
          description: reel.description || '',
          createdAt: reel.createdAt
        };

        console.log(`Processed reel ${reel.id}:`, {
          id: reel.id,
          hasVideo: !!videoUri,
          title: title.substring(0, 30) + (title.length > 30 ? '...' : '')
        });

        return processedReel;

      } catch (error) {
        console.error(`❌ Error processing reel ${reel.id}:`, error);
        return {
          id: reel.id || Math.random().toString(),
          videoUri: null,
          thumbnailUri: require('../../assets/images/b.png'),
          title: reel.title || 'Vidéo sans titre',
          description: reel.description || 'Erreur de chargement',
          error: true
        };
      }
    });

    console.log(`✅ Processed ${processedReels.length} reels successfully`);
    return processedReels;

  } catch (error) {
    console.error('❌ Error fetching reels:', error);
    throw error;
  }
};

  // Composant VideoModal mis à jour pour utiliser expo-av Video
 // Composant VideoModal mis à jour pour être scrollable
// Improved VideoModal component for direct video playback

// Version simplifiée du composant VideoModal
// Improved VideoModal component for direct video playback
// Enhanced VideoModal with better error handling and support for streaming endpoint
// Modal Vidéo avec scroll vertical pour plusieurs vidéos
const VideoModal = ({ visible, onClose, videoUri, allVideos = [] }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const scrollViewRef = useRef(null);
  
  // Trouver l'index de la vidéo sélectionnée
  const selectedVideoIndex = allVideos.findIndex(video => video.videoUri === videoUri);
  const videosToShow = allVideos.length > 0 ? allVideos : [{ id: 'single', videoUri }];
  
  useEffect(() => {
    // Reset state when modal opens
    if (visible) {
      setIsLoading(true);
      setError(null);
      console.log("Opening video modal with streaming URI:", videoUri);
      
      // Scroll to the selected video position after a short timeout
      setTimeout(() => {
        if (scrollViewRef.current && selectedVideoIndex > -1) {
          const yOffset = selectedVideoIndex * Dimensions.get('window').height;
          scrollViewRef.current.scrollTo({ y: yOffset, animated: false });
        }
      }, 100);
    } else {
      // Pause all videos when modal closes
      if (videoRef.current) {
        videoRef.current.pauseAsync().catch(() => {});
      }
    }
  }, [visible, videoUri, selectedVideoIndex]);
  
  if (!visible) return null;
  
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <StatusBar hidden />
        
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 40,
            right: 20,
            zIndex: 100, // Valeur plus élevée pour être au-dessus du ScrollView
            padding: 10,
            backgroundColor: 'rgba(0,0,0,0.5)',
            borderRadius: 20
          }}
          onPress={onClose}
        >
          <MaterialIcons name="close" size={24} color="#FFF" />
        </TouchableOpacity>
        
        <ScrollView
          ref={scrollViewRef}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
        >
          {videosToShow.map((video, index) => (
            <View 
              key={video.id || `video-${index}`}
              style={{ 
                width: '100%',
                height: Dimensions.get('window').height,
                justifyContent: 'center'
              }}
            >
              <Video
                ref={index === selectedVideoIndex ? videoRef : null}
                source={{ 
                  uri: video.videoUri,
                  headers: {
                    'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8',
                    'Range': 'bytes=0-'
                  }
                }}
                style={{ width: '100%', height: '70%' }}
                resizeMode="contain"
                shouldPlay={index === selectedVideoIndex}
                isLooping
                useNativeControls
                onPlaybackStatusUpdate={(status) => {
                  if (status.isLoaded && !status.error && index === selectedVideoIndex) {
                    setIsLoading(false);
                  }
                }}
                onLoadStart={() => {
                  if (index === selectedVideoIndex) {
                    console.log("Video loading started");
                    setIsLoading(true);
                  }
                }}
                onLoad={() => {
                  if (index === selectedVideoIndex) {
                    console.log("Video loaded successfully");
                    setIsLoading(false);
                  }
                }}
                onError={(error) => {
                  if (index === selectedVideoIndex) {
                    console.error("Video playback error:", error);
                    setError(`Error: ${error.error?.message || "Unable to play video"}`);
                    setIsLoading(false);
                  }
                }}
              />
              
              {/* Titre et infos en bas de la vidéo */}
              {video.title && (
                <View style={{
                  padding: 15,
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  borderRadius: 10,
                  margin: 10
                }}>
                  <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 5 }}>
                    {video.title}
                  </Text>
                  {video.description && (
                    <Text style={{ color: '#CCC', fontSize: 14 }}>
                      {video.description}
                    </Text>
                  )}
                </View>
              )}
            </View>
          ))}
        </ScrollView>
        
        {isLoading && (
          <View style={{
            ...StyleSheet.absoluteFillObject,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.7)',
            zIndex: 50
          }}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={{ color: 'white', marginTop: 10 }}>Chargement...</Text>
          </View>
        )}
        
        {error && (
          <View style={{
            position: 'absolute',
            top: '50%',
            left: 20,
            right: 20,
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: 20,
            borderRadius: 10,
            alignItems: 'center',
            zIndex: 50
          }}>
            <Text style={{ color: 'white', marginBottom: 10 }}>{error}</Text>
            <TouchableOpacity
              style={{
                backgroundColor: '#D4FF00',
                padding: 10,
                borderRadius: 20
              }}
              onPress={onClose}
            >
              <Text style={{ fontWeight: 'bold' }}>Fermer</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Indicateur de pagination */}
        <View style={{
          position: 'absolute',
          right: 20,
          top: '50%',
          transform: [{ translateY: -50 }],
          zIndex: 40
        }}>
          {videosToShow.length > 1 && videosToShow.map((_, index) => (
            <View
              key={`dot-${index}`}
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: index === selectedVideoIndex ? '#FFF' : 'rgba(255,255,255,0.5)',
                margin: 4
              }}
            />
          ))}
        </View>
      </View>
    </Modal>
  );
};
  // useEffect pour charger les reels
  useEffect(() => {
    let isActive = true;

    const loadReels = async () => {
      if (!route.params?.id) return;
      
      setReelsLoading(true);
      setReelsError(null);
      
      try {
        const processedReels = await fetchReels(route.params.id);
        if (isActive) {
          setReels(processedReels);
        }
      } catch (error) {
        if (isActive) {
          setReelsError(error.message);
        }
      } finally {
        if (isActive) {
          setReelsLoading(false);
        }
      }
    };

    loadReels();
    
    return () => {
      isActive = false;
    };
  }, [route.params?.id]);

  // Rendu du contenu vidéo
 
 // Improved rendering function for video content
// Updated renderVideoContent function to display videos directly without thumbnails
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
            fetchReels(route.params?.id);
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
      {reels.map((reel) => (
        <TouchableOpacity
          key={reel.id}
          style={styles.videoGridItem}
          onPress={() => {
            if (reel.videoUri) {
              console.log(`Opening video: ${reel.videoUri.substring(0, 50)}...`);
              setSelectedVideoUri(reel.videoUri);
              setVideoModalVisible(true);
            } else {
              console.log('No video URI available for this reel');
              Alert.alert('Erreur', 'Cette vidéo n\'est pas disponible');
            }
          }}
        >
          {/* Direct Video Display instead of Image thumbnail */}
          <View style={styles.videoWrapper}>
            <Video 
              source={{ uri: reel.videoUri }}
              style={styles.directVideo}
              resizeMode="cover"
              shouldPlay={false}  // Don't autoplay to save resources
              isMuted={true}
              isLooping={false}
              useNativeControls={false}
            />
            <View style={styles.videoOverlay} />
            <View style={styles.playIconContainer}>
              <MaterialIcons 
                name="play-circle-outline" 
                size={40} 
                color="#fff" 
              />
            </View>
            <View style={styles.videoTitleOverlay}>
              <Text style={styles.videoTitleText} numberOfLines={1}>
                {reel.title}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};
  const renderStars = (selectedRating, interactive = false) => (
    <View style={styles.starsContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => interactive && setRating(star)}
          disabled={!interactive}
        >
          <MaterialIcons
            name={star <= selectedRating ? "star" : "star-border"}
            size={24}
            color="#FFD700"
          />
        </TouchableOpacity>
      ))}
    </View>
  );
//////
// Composant pour afficher une photo en plein écran
// Enhanced PhotoViewerModal with horizontal scrolling
const PhotoViewerModal = ({ visible, onClose, imageUri, allImages = [] }) => {
  // If there's only the selected image, use it as the only item in the scrollable view
  const imagesToShow = allImages.length > 0 ? allImages : [{ id: 'single', uri: imageUri }];
  const initialScrollIndex = allImages.findIndex(img => img.uri === imageUri);
  
  if (!visible || !imageUri) return null;
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.photoModalContainer}>
        <View style={styles.photoModalContent}>
          <ScrollView 
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={initialScrollIndex > -1 ? initialScrollIndex : 0}
            maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
            contentContainerStyle={styles.scrollViewContent}
          >
            {imagesToShow.map(image => (
              <View key={image.id} style={styles.photoScrollItem}>
                <Image 
                  source={{ uri: image.uri }} 
                  style={styles.photoModalImage}
                  resizeMode="contain"
                />
              </View>
            ))}
          </ScrollView>
          
          <TouchableOpacity 
            style={styles.photoModalCloseButtonBottom}
            onPress={onClose}
          >
            <Text style={styles.photoModalCloseText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
const renderGalleryContent = () => {
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#D4FF00" />
        <Text style={styles.loaderText}>Chargement des images...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.noImagesText}>Aucune photo disponible</Text>
      </View>
    );
  }
  
  if (!galleryImages || galleryImages.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <MaterialIcons name="photo-library" size={50} color="#CCCCCC" />
        <Text style={styles.noImagesText}>Aucune photo disponible</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.galleryContainer1}>
      {galleryImages.map((image) => (
        <TouchableOpacity 
          key={image.id} 
          onPress={() => {
            console.log("Image cliquée:", image.uri);
            setSelectedImage(image.uri);
            setPhotoModalVisible(true);
          }}
          activeOpacity={0.7}
          style={styles.galleryImageWrapper1}
        >
          <Image 
            source={{ uri: image.uri }} 
            style={styles.galleryImage1}
            resizeMode="cover"
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};
////////////////////comentaire
// Ajoutez ces états au début de votre composant CoachProfile1
const [comments, setComments] = useState([]);
const [loadingComments, setLoadingComments] = useState(false);
const [commentsError, setCommentsError] = useState(null);

// Ajoutez cette fonction pour récupérer les commentaires
// Modifiez la fonction fetchComments pour éviter le problème de parsing JSON
const fetchComments = useCallback(async (coachId) => {
  if (!coachId) return;
  
  setLoadingComments(true);
  setCommentsError(null);
  
  try {
    const response = await fetch(`http://192.168.0.3:8082/api/commentaires/recus/${coachId}`);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Commentaires récupérés:", data);
    setComments(data);
  } catch (error) {
    console.error("Erreur lors de la récupération des commentaires:", error);
    setCommentsError(error.message);
  } finally {
    setLoadingComments(false);
  }
}, []);

// Fonction helper pour extraire les informations essentielles et éviter les références circulaires
const parseAndSimplifyComments = (jsonText) => {
  // Recherche d'éléments essentiels par regex pour éviter le parsing complet
  const commentPattern = /"id"\s*:\s*(\d+).*?"evaluation"\s*:\s*(\d+).*?"commentaire"\s*:\s*"([^"]*)".*?"dateCommentaire"\s*:\s*"([^"]*)"/g;
  const userPattern = /"utilisateur"\s*:\s*{[^}]*"id"\s*:\s*(\d+).*?"firstName"\s*:\s*"([^"]*)"/g;
  
  const simplifiedComments = [];
  let match;
  
  // Extraire les données essentielles avec regex 
  // Cette méthode peut être imparfaite, mais elle évite les problèmes de récursion
  let currentIndex = 0;
  let commentText = jsonText;
  
  // Parcourir le texte JSON à la recherche de chaque commentaire
  while (currentIndex < commentText.length) {
    const idMatch = commentText.slice(currentIndex).match(/"id"\s*:\s*(\d+)/);
    if (!idMatch) break;
    
    const commentId = parseInt(idMatch[1]);
    const startPos = commentText.indexOf(idMatch[0], currentIndex);
    
    // Trouver la fin de l'objet
    let objectLevel = 0;
    let endPos = startPos;
    let inString = false;
    let escapeNext = false;
    
    for (let i = startPos; i < commentText.length; i++) {
      const char = commentText[i];
      
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      
      if (char === '"' && !escapeNext) {
        inString = !inString;
        continue;
      }
      
      if (!inString) {
        if (char === '{') objectLevel++;
        if (char === '}') {
          objectLevel--;
          if (objectLevel === 0) {
            endPos = i + 1;
            break;
          }
        }
      }
    }
    
    // Extraire le bloc du commentaire
    const commentBlock = commentText.substring(startPos, endPos);
    
    // Extraire les informations de base
    const evalMatch = commentBlock.match(/"evaluation"\s*:\s*(\d+)/);
    const textMatch = commentBlock.match(/"commentaire"\s*:\s*"([^"]*)"/);
    const dateMatch = commentBlock.match(/"dateCommentaire"\s*:\s*"([^"]*)"/);
    
    // Extraire les infos utilisateur
    const userFirstNameMatch = commentBlock.match(/"firstName"\s*:\s*"([^"]*)"/);
    
    // Vérifier la présence d'images
    const hasImageAvant = commentBlock.includes('"imageAvant"') && !commentBlock.includes('"imageAvant":null');
    const hasImageApres = commentBlock.includes('"imageApres"') && !commentBlock.includes('"imageApres":null');
    
    if (commentId && evalMatch && textMatch) {
      simplifiedComments.push({
        id: commentId,
        evaluation: parseInt(evalMatch[1]),
        commentaire: textMatch[1],
        dateCommentaire: dateMatch ? dateMatch[1] : new Date().toISOString(),
        utilisateur: {
          firstName: userFirstNameMatch ? userFirstNameMatch[1] : "Utilisateur"
        },
        hasImageAvant,
        hasImageApres
      });
    }
    
    currentIndex = endPos;
  }
  
  return simplifiedComments;
};

// Ajoutez cet useEffect pour charger les commentaires quand la page est chargée
// ou quand l'onglet emoji est sélectionné
useEffect(() => {
  if (selectedTab === 'emoji' && idCoach) {
    fetchComments(idCoach);
  }
}, [selectedTab, idCoach, fetchComments]);

// Remplacez votre fonction renderEmojiContent par celle-ci
const CommentImage = ({ imageUrl, label }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // L'URL complète de l'image
  const fullImageUrl = `http://192.168.0.3:8082${imageUrl}`;
  
  return (
    <View style={styles.imageContainer}>
      {error ? (
        <View style={styles.emptyImagePlaceholder}>
          <Text style={styles.emptyImageText}>Erreur d'image</Text>
          <Text style={styles.imageLabel}>{label}</Text>
        </View>
      ) : (
        <>
          <Image 
            source={{ uri: fullImageUrl }} 
            style={styles.beforeAfterImage} 
            resizeMode="cover"
            onLoadStart={() => setLoading(true)}
            onLoad={() => setLoading(false)}
            onError={() => {
              console.error(`Erreur chargement image: ${fullImageUrl}`);
              setError(true);
              setLoading(false);
            }}
          />
          {loading && (
            <View style={styles.imageLoadingOverlay}>
              <ActivityIndicator size="small" color="#FFF" />
            </View>
          )}
          <Text style={styles.imageLabel}>{label}</Text>
        </>
      )}
    </View>
  );
};

// Fonction pour rendre le contenu Emoji (commentaires)
const renderEmojiContent = () => (
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
        <ActivityIndicator size="large" color="#D4FF00" />
      ) : commentsError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{commentsError}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => fetchComments(idCoach)}
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
              <View style={styles.reviewerInfo}>
                <Text style={styles.reviewerName}>
                  {comment.utilisateur?.firstName || "Utilisateur"}
                </Text>
                <Text style={styles.reviewDate}>
                  {new Date(comment.dateCommentaire).toLocaleDateString()}
                </Text>
              </View>
              {renderStars(comment.evaluation)}
            </View>
            <Text style={styles.reviewText}>
              {comment.commentaire}
            </Text>
            {(comment.hasImageAvant || comment.hasImageApres) && (
              <View style={styles.beforeAfterContainer}>
                {comment.hasImageAvant ? (
                  <CommentImage 
                    imageUrl={comment.imageAvantUrl} 
                    label="Avant" 
                  />
                ) : (
                  <View style={styles.emptyImagePlaceholder}>
                    <Text style={styles.emptyImageText}>Pas d'image</Text>
                    <Text style={styles.imageLabel}>Avant</Text>
                  </View>
                )}
                {comment.hasImageApres ? (
                  <CommentImage 
                    imageUrl={comment.imageApresUrl} 
                    label="Après" 
                  />
                ) : (
                  <View style={styles.emptyImagePlaceholder}>
                    <Text style={styles.emptyImageText}>Pas d'image</Text>
                    <Text style={styles.imageLabel}>Après</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        ))
      )}
    </View>
  </ScrollView>
);

//////////////////////////////

  const renderMainContent = () => {
    switch (selectedTab) {
      case 'document':
        return (
          <>
            <Text style={styles.competencesTitle}>Compétences générales</Text>
            <View style={styles.tagContainer}>
              <Text style={styles.tag}>
                {competencesGenerales.length ? `${competencesGenerales}` : "Aucune compétence disponible"}
              </Text>
            </View>
            <Text style={styles.competencesTitle}>Santé et bien-être</Text>
            <View style={styles.tagContainer}>
              <Text style={styles.tag}>
                {santeEtBienEtre.length ? `${santeEtBienEtre}` : "Aucune santé disponible"}
              </Text>
            </View>
            <Text style={styles.competencesTitle}>Entraînement physique</Text>
            <Text style={styles.tag1}>
              {entrainementPhysique.length ? `${entrainementPhysique}` : "Coach non spécifié"}
            </Text>
            <Text style={styles.competencesTitle}>Cours spécifiques</Text>
            <View style={styles.tagContainer}>
              <Text style={styles.tag}>
                {coursSpecifiques.length ? `${coursSpecifiques}` : "Aucun cours disponible"}
              </Text>
            </View>
            <Text style={styles.competencesTitle}>Expériences :</Text>
            <View style={styles.tagContainer}>
              <Text style={styles.tag}>
                {dureeExperience ? `${dureeExperience} d'expérience` : "Expérience non spécifiée"}
              </Text>
            </View>
          </>
        );
      case 'gallery':
        return renderGalleryContent();
      case 'video':
        return renderVideoContent();
      case 'emoji':
        return renderEmojiContent();
      default:
        return null;
    }
  };

  return (
    <View style={styles.mainContainer}>
      <ScrollView style={styles.container}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.coverImage}>
          <Image source={require('../../assets/images/a.png')} style={styles.cover} />
        </View>
        <View style={styles.profileContainer}>
          <Image
            source={
              photo
                ? { uri: `data:image/jpeg;base64,${photo}` }
                : require('../../assets/images/b.png')
            }
            style={styles.profileImage}
            resizeMode="cover"
          />
          <Text style={styles.name}>{firstName}</Text>
          <Text style={styles.title}> {poste}</Text>
          <Text style={styles.price}>
    Séance de <Text style={styles.highlight}>{dureeSeance}</Text> min à partir de 
    <Text style={styles.highlight}> {prixSeance}</Text> DT
</Text>
          <Text style={styles.locationText}>
    En ligne, à domicile aux alentours de{' '}
    <Text style={styles.highlight}>{typeCoaching || 'N/A'}</Text>, Ou à{' '}
    <Text style={styles.highlight}>{disciplines || 'N/A'}</Text>
</Text>
<TouchableOpacity 
  style={styles.buttonYellow}
  onPress={handleDiscoverCourses}
>
  <Text style={styles.buttonText}>Découvrez mes cours</Text>
</TouchableOpacity>
          <TouchableOpacity style={styles.buttonBlack}
             onPress={handleContactCoach}
          >
            <Text style={styles.buttonText1}>Contactez-moi</Text>
          </TouchableOpacity>
          <View style={styles.socialIcons}>
            <Icon name="facebook" size={24} color="#1877F2" />
            <Icon name="instagram" size={24} color="#E4405F" />
            <Icon name="tiktok" size={24} color="black" />
          </View>
          <View style={styles.about}>
            <Text style={styles.sectionTitle}>À propos :</Text>
            <Text style={styles.description}>{bio || "Aucune description disponible"}</Text>
          </View>
        </View>
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
      </ScrollView>
      <ReviewModal 
  isVisible={isReviewModalVisible}
  onClose={() => setIsReviewModalVisible(false)}
  rating={rating}
  setRating={setRating}
  comment={comment}
  setComment={setComment}
  firstName={firstName}
  utilisateurId={userId} // ID de l'utilisateur connecté
  recepteurId={idCoach} // ID du coach qui reçoit le commentaire
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
    </View>
  );
};





//////////////////////////////////////////////////
// Styles                                         //
//////////////////////////////////////////////////
const styles = StyleSheet.create({
  /////////////////


  // Styles pour les images et leur affichage
imageContainer: {
  width: '50%', // Exactement 50% de la largeur
  height: 150,
  position: 'relative',
  borderRadius: 8,
  overflow: 'hidden',
  margin: 0,
  padding: 0

},
imageLoadingOverlay: {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: 'rgba(0,0,0,0.3)',
  justifyContent: 'center',
  alignItems: 'center',
},
beforeAfterImage: {
  width: '100%',
  height: '100%',
  borderRadius: 8,
},
imageLabel: {
  position: 'relative', // Au lieu de 'absolute'
  width: '100%',
  backgroundColor: 'transparent', // Fond transparent
  color: '#666', // Couleur de texte plus foncée
  textAlign: 'center',
  padding: 4,
  fontSize: 12,
  fontWeight: 'bold',
  marginTop: 15
  
},
emptyImagePlaceholder: {
  width: '50%', // Exactement 50% de la largeur
  height: 150,
  borderRadius: 8,
  backgroundColor: '#f0f0f0',
  justifyContent: 'center',
  alignItems: 'center',
  margin: 0,
  padding: 0
},
emptyImageText: {
  color: '#777',
  fontSize: 14,
},
reviewsSectionTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  marginBottom: 15,
},

noCommentsText: {
  textAlign: 'center',
  color: '#777',
  fontSize: 16,
  marginVertical: 20,
},
  /////////////////////////
  reviewsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  reviewDate: {
    color: '#777',
    fontSize: 12,
    marginBottom: 8,
  },
  noCommentsText: {
    textAlign: 'center',
    color: '#777',
    fontSize: 16,
    marginVertical: 20,
  },
  emptyImagePlaceholder: {
    width: '48%',
    height: 150,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyImageText: {
    color: '#777',
    fontSize: 14,
  },












  ///////////////////////////////


  uploadedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
  },
  /////////vedio 
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollViewContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoContainer: {
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  playButtonOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 5,
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 16,
  },
  errorOverlay: {
    position: 'absolute',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#D4FF00',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#FFFFFF',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  /////////
  //////////////photo 
  galleryContainer1: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginBottom: 80,
  },
  galleryImageWrapper1: {
    width: '32.5%',
    height: 110,
    marginBottom: 4,
    borderRadius: 10,
    overflow: 'hidden',
  },
  galleryImage1: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  // Pour améliorer le modal d'affichage d'image
  photoModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(56, 51, 51, 0.9)',
    
    
  },
  photoModalContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
 
  photoModalCloseButtonBottom: {
    position: 'absolute',
    bottom: 40,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#000',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  photoModalCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  photoModalImage1: {
    width: '90%',
    height: '70%',
    borderRadius: 10,
  },
//////
photoScrollItem: {
  width: Dimensions.get('window').width,
  height: '100%',
  justifyContent: 'center',
  alignItems: 'center',
},
scrollViewContent: {
  alignItems: 'center',
  justifyContent: 'center',
},
photoModalImage: {
  width: Dimensions.get('window').width * 0.9,
  height: '70%',
  borderRadius: 10,
},
photoModalContainer: {
  flex: 1,
  backgroundColor: 'rgba(56, 51, 51, 0.9)',
  justifyContent: 'center',
  alignItems: 'center',
},
photoModalContent: {
  width: '100%',
  height: '100%',
  justifyContent: 'center',
  alignItems: 'center',
},
photoModalCloseButtonBottom: {
  position: 'absolute',
  bottom: 40,
  paddingVertical: 10,
  paddingHorizontal: 20,
  backgroundColor: '#000',
  borderRadius: 25,
  borderWidth: 1,
  borderColor: '#FFF',
},
photoModalCloseText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: 'bold',
},










  ///////
  locationText: {
   
    maxWidth: 310, 
    lineHeight: 20,
    textAlign: 'center',
    fontSize: 14,
      fontWeight: 'bold',
      color: '#000',
  },
  highlight: {
    color: 'red',
  },
  // Dans StyleSheet.create, ajoutez/modifiez ces styles :
videoGridContainer: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  padding: 1,
  backgroundColor: 'transparent'  ,
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
  
  ///// Styles pour la lecture vidéo
  
    // ==============================
    // Styles de base et conteneurs
    // ==============================
    mainContainer: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    container: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    tabContent: {
      padding: 20,
      backgroundColor: 'transparent' 
    },
  
    // ==============================
    // Styles de l'en-tête du profil
    // ==============================
    backButton: {
      position: 'absolute',
      top: 80,
      left: 10,
      padding: 10,
      zIndex: 1,
    },
    coverImage: {
      width: '100%',
      height: 250,
      backgroundColor: '#000',
    },
    cover: {
      width: '100%',
      height: '100%',
    },
    profileContainer: {
      alignItems: 'center',
      marginTop: -90,
    },
    profileImage: {
      width: 200,
      height: 200,
      borderRadius: 120,
      borderWidth: 3,
      borderColor: '#fff',
    },
    name: {
      fontSize: 20,
      fontWeight: 'bold',
      marginTop: 10,
    },
    title: {
      fontSize: 14,
      color: 'red', 
      marginBottom: 5,
    },
    price: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#000',
    },
    location: {
      fontSize: 12,
      textAlign: 'center',
      color: 'gray',
      marginVertical: 5,
    },
  
    // ==============================
    // Styles des boutons
    // ==============================
    buttonYellow: {
      backgroundColor: '#CBFF06',
      padding: 10,
      width: '80%',
      borderRadius: 8,
      marginVertical: 5,
      alignItems: 'center',
    },
    buttonBlack: {
      backgroundColor: '#000',
      padding: 10,
      width: '80%',
      borderRadius: 8,
      marginVertical: 5,
      alignItems: 'center',
    },
    buttonText: {
      color: 'black',
      fontWeight: 'bold',
    },
    buttonText1: {
      color: '#fff',
      fontWeight: 'bold',
    },
  
    // ==============================
    // Styles des réseaux sociaux
    // ==============================
    socialIcons: {
      flexDirection: 'row',
      marginVertical: 10,
      gap: 15,
    },
  
    // ==============================
    // Styles de la section À propos
    // ==============================
    about: {
      width: '90%',
      marginTop: 10,
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 10,
      textAlign: 'left',
      width: '100%',
    },
    description: {
      fontSize: 14,
      color: 'gray',
      textAlign: 'left',
    },
  
    // ==============================
    // Styles de la barre de navigation
    // ==============================
    innerNavBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 10,
      borderTopWidth: 1,
      borderColor: '#ddd',
      marginTop: 20,
    },
    navItem: {
      flex: 1,
      padding: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    selectedNavItem: {
      backgroundColor: '#f8f8f8',
    },
  
    // ==============================
    // Styles de la galerie et vidéos
    // ==============================
    galleryContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      paddingHorizontal: 2,
    },
    galleryImage: {
      width: '32.5%',
      height: 110,
      marginBottom: 2,
      borderRadius: 10,
    },
    videoContainer: {
      width: '32.5%',
      height: 110,
      marginBottom: 2,
      backgroundColor: 'transparent',
      borderRadius: 10,
      overflow: 'hidden',
    },
    videoThumbnail: {
      width: '100%',
      height: '100%',
      borderRadius: 10,
      backgroundColor: 'transparent',
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
    videoInfoContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'transparent',
      padding: 4,
      borderBottomLeftRadius: 10,
      borderBottomRightRadius: 10,

    },
    videoTitle: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '500',
    },
    videoDuration: {
      color: '#FFFFFF',
      fontSize: 8,
    },

    /////
    videoItemContainer: {
      width: '32%',
      aspectRatio: 16/9,
      marginBottom: 8,
      borderRadius: 8,
      overflow: 'hidden',
      backgroundColor: 'transparent',
    },
    thumbnailContainer: {
      width: '100%',
      height: '100%',
      position: 'relative',
      backgroundColor: 'transparent',
    },
    videoThumbnail: {
      width: '100%',
      height: '100%',
      backgroundColor: 'transparent',
    },
    playButtonOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    playButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#fff',
      justifyContent: 'center',
      alignItems: 'center',
    },
    videoDurationBadge: {
      position: 'absolute',
      right: 8,
      bottom: 24,
      backgroundColor: 'transparent',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    videoDurationText: {
      color: '#fff',
      fontSize: 10,
    },
    videoTitleOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: 8,
      backgroundColor: 'transparent',
    },
    videoTitleText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '500',
    },
    videoWrapper: {
      width: '100%',
      height: '100%',
      position: 'relative',
      borderRadius: 8,
      overflow: 'hidden',
      backgroundColor: '#000',
    },
    directVideo: {
      width: '100%',
      height: '100%',
      borderRadius: 8,
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
      width: '33%', // For a 3x3 grid
      aspectRatio: 1, // For perfect squares
      padding: 1,
      position: 'relative',
      marginBottom: 2,
      backgroundColor: 'transparent'
    },
    videoOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.3)', // Darker overlay for better visibility
      borderRadius: 8,
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
    videoTitleOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: 8,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      borderBottomLeftRadius: 8,
      borderBottomRightRadius: 8,
    },
    videoTitleText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '500',
    },
    // ==============================
    // Styles du modal vidéo
    // ==============================
    videoModalContainer: {
      flex: 1,
      backgroundColor: '#000',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'transparent',
    },
    videoPlayer: {
      width: '100%',
      height: '100%',
      backgroundColor: 'transparent',
    },
    videoModalCloseButton: {
      position: 'absolute',
      top: 40,
      right: 20,
      zIndex: 2,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      borderRadius: 25,
      padding: 10,
    },
    videoModalCloseText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
    },
  
    // ==============================
    // Styles des états de chargement et d'erreur
    // ==============================
    loaderContainer: {
      padding: 20,
      alignItems: 'center',
      justifyContent: 'center',
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
      color: 'red',
      textAlign: 'center',
      marginBottom: 10,
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
    noImagesText: {
      color: '#666',
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
  
    // ==============================
    // Styles des compétences et tags
    // ==============================
    competencesTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      marginTop: 15,
      marginBottom: 10,
      color: '#666',
      textAlign: 'left',
    },
    tagContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 10,
    },
    tag: {
      backgroundColor: '#EAEAEA',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      fontSize: 13,
      color: '#666',
      marginRight: 10,
      marginBottom: 8,
    },
    tag1: {
      backgroundColor: '#EAEAEA',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 220,
      fontSize: 13,
      color: '#666',
      marginRight: 250,
      marginBottom: 8,
    },
  
    // ==============================
    // Styles du modal des avis
    // ==============================
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
    reviewerInfo: {
      flexDirection: 'column',    // Disposition verticale pour le nom et la date
    alignItems: 'flex-start',
      gap: 5, // Petit espace entre le nom et la date
    },
    reviewerName: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    reviewDate: {
      color: '#777',
      fontSize: 12,
    },
    reviewHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
   
    
    reviewText: {
      fontSize: 14,
      color: '#666',
      marginBottom: 15,
      lineHeight: 20,
    },
    beforeAfterContainer: {
      flexDirection: 'row',
      width: '100%',
      padding: 0,
      margin: 0,
      gap: 0,
      // Remplacer justifyContent: 'space-between' par:
      justifyContent: 'center' 
    },
    beforeAfterImage: {
      width: '80%',
      height: '80%',
      borderRadius: 8
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
  });


export default CoachProfile1; 