import React, { useState, useEffect } from 'react';
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
  Modal,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';




// ... rest of your app code

//
// Hook pour charger les images de la galerie
//
const useGalleryImages = (id, selectedTab) => {
  const [galleryImages, setGalleryImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const API_BASE_URL = 'http://192.168.0.5:8082/api';
  const DEFAULT_IMAGE = Image.resolveAssetSource(require('../../assets/images/b.png')).uri;

  useEffect(() => {
    if (selectedTab === 'gallery' ) {
      loadGalleryImages(id);
    }
  }, [selectedTab, id]);

  const extractBase64Content = (text) => {
    const images = new Map(); // Pour dédupliquer
    let position = 0;

    while (position < text.length) {
      const contentKey = '"content"';
      const startContent = text.indexOf(contentKey, position);
      if (startContent === -1) break;

      const startQuote = text.indexOf('"', startContent + contentKey.length);
      if (startQuote === -1) break;

      let endQuote = startQuote + 1;
      let escape = false;

      while (endQuote < text.length) {
        const char = text[endQuote];
        if (escape) {
          escape = false;
        } else if (char === '\\') {
          escape = true;
        } else if (char === '"' && !escape) {
          break;
        }
        endQuote++;
      }

      if (endQuote < text.length) {
        const base64Content = text.slice(startQuote + 1, endQuote);

        // Recherche d'un ID associé
        const idSearch = text.slice(Math.max(0, startContent - 200), startContent);
        const idMatch = idSearch.match(/"id"\s*:\s*(\d+)/);
        let imageId;

        if (idMatch) {
          imageId = parseInt(idMatch[1]);
        } else {
          imageId = `generated_${Date.now()}_${Math.random()}`;
        }

        if (/^[A-Za-z0-9+/=]+$/.test(base64Content) && !images.has(base64Content)) {
          images.set(base64Content, {
            id: imageId,
            content: base64Content
          });
        }
      }

      position = endQuote + 1;
    }

    return Array.from(images.values());
  };

  const processImages = (photos) => {
    const seen = new Set();
    return photos.map(photo => {
      const uri = photo.url || (photo.content ? `data:image/jpeg;base64,${photo.content}` : DEFAULT_IMAGE);
      if (seen.has(uri)) {
        photo.id = `${photo.id}_${Date.now()}_${Math.random()}`;
      }
      seen.add(uri);
      return { id: photo.id, uri };
    }).filter(img => img.uri !== DEFAULT_IMAGE);
  };

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
  
      const data = await response.json();
      const foundImages = extractBase64Content(JSON.stringify(data));
  
      if (foundImages.length === 0) {
        throw new Error('Aucune image trouvée dans la réponse');
      }
  
      const processedImages = processImages(foundImages);
      setGalleryImages(processedImages);
  
    } catch (err) {
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
const ReviewModal = ({ isVisible, onClose, rating, setRating, comment, setComment, firstName }) => {
  const [beforeImage, setBeforeImage] = useState(null);
  const [afterImage, setAfterImage] = useState(null);

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
        setImage(result.uri);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection de l\'image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
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
                  Vous avez récemment travaillé avec{'\n'}
                  COACH {firstName?.toUpperCase()},{'\n'}
                  Partagez votre expérience !
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
                  >
                    <Text style={styles.cancelButtonText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.submitButton}
                    onPress={() => {
                      if (!rating) {
                        Alert.alert("Erreur", "Veuillez donner une évaluation");
                        return;
                      }
                      if (!comment.trim()) {
                        Alert.alert("Erreur", "Veuillez ajouter un commentaire");
                        return;
                      }
                      console.log("Publication de l'avis:", { rating, comment, beforeImage, afterImage });
                      onClose();
                      setRating(0);
                      setComment('');
                      setBeforeImage(null);
                      setAfterImage(null);
                    }}
                  >
                    <Text style={styles.submitButtonText}>Publier</Text>
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

//
// Modal pour la lecture de vidéo via expo-av
//
const VideoModal = ({ visible, onClose, videoUri }) => {
  const videoRef = React.useRef(null);
  const [status, setStatus] = React.useState({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let isMounted = true;

    const loadVideo = async () => {
      if (!visible || !videoUri) {
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Validate video URI format
        if (!videoUri.startsWith('data:video/') && 
            !videoUri.startsWith('file://') && 
            !videoUri.startsWith('http')) {
          throw new Error('Format vidéo non supporté');
        }

        // Unload any existing video
        if (videoRef.current) {
          await videoRef.current.unloadAsync();
        }

        // Load the new video
        if (isMounted) {
          await videoRef.current?.loadAsync(
            { uri: videoUri },
            { shouldPlay: false, isLooping: true },
            false
          );
        }
      } catch (err) {
        console.error('Erreur de chargement vidéo:', err);
        if (isMounted) {
          setError(`Impossible de charger la vidéo: ${err.message}`);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadVideo();

    return () => {
      isMounted = false;
      if (videoRef.current) {
        videoRef.current.unloadAsync();
      }
    };
  }, [visible, videoUri]);

  // Handle video playback status updates
  const handlePlaybackStatusUpdate = (playbackStatus) => {
    if (playbackStatus.isLoaded) {
      setStatus(playbackStatus);
      setIsLoading(false);
    } else if (playbackStatus.error) {
      console.error('Erreur de lecture:', playbackStatus.error);
      setError(`Erreur de lecture: ${playbackStatus.error}`);
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.videoModalContainer}>
        <TouchableOpacity 
          style={styles.videoModalCloseButton}
          onPress={onClose}
        >
          <Text style={styles.videoModalCloseText}>Fermer</Text>
        </TouchableOpacity>

        {isLoading && (
          <View style={styles.videoLoadingContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.videoLoadingText}>Chargement...</Text>
          </View>
        )}

        {error ? (
          <View style={styles.videoErrorContainer}>
            <Text style={styles.videoErrorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setError(null);
                setIsLoading(true);
                // Attempt to reload the video
                if (videoRef.current) {
                  videoRef.current.loadAsync(
                    { uri: videoUri },
                    { shouldPlay: true },
                    false
                  );
                }
              }}
            >
              <Text style={styles.retryButtonText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Video
            ref={videoRef}
            style={styles.videoPlayer}
            resizeMode={ResizeMode.CONTAIN}
            useNativeControls
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
            onError={(error) => {
              console.error('Erreur vidéo:', error);
              setError('Échec de la lecture vidéo');
              setIsLoading(false);
            }}
          />
        )}
      </View>
    </Modal>
  );
};

//
// Composant principal CoachProfile
//
const CoachProfile = () => {
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
  } = route.params || {};

  // Fonction pour récupérer les reels depuis l'API
 
  
  // Fonction optimisée pour récupérer et convertir les vidéos avec des logs détaillés
  // Helper function to convert blob or base64 to video URI
// Helper function to convert blob or base64 to video URI
// Helper function to convert blob to base64
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

// Updated processVideoData function
const processVideoData = async (videoData) => {
  if (!videoData) return null;
  
  try {
    // Case 1: URI string
    if (typeof videoData === 'string') {
      if (videoData.startsWith('http') || videoData.startsWith('file://')) {
        return videoData;
      }
      // Case 2: Base64 string
      if (videoData.match(/^[A-Za-z0-9+/=]+$/)) {
        return `data:video/mp4;base64,${videoData}`;
      }
    }
    
    // Case 3: Blob/Buffer data
    if (videoData instanceof Blob || (videoData.data && Array.isArray(videoData.data))) {
      const bytes = new Uint8Array(videoData.data || await videoData.arrayBuffer());
      const base64 = btoa(String.fromCharCode.apply(null, bytes));
      return `data:video/mp4;base64,${base64}`;
    }
    
    console.warn('Unsupported video data format:', typeof videoData);
    return null;
  } catch (error) {
    console.error('Error processing video data:', error);
    return null;
  }
};

// Updated fetchReels function
const fetchReels = async (coachId) => {
  if (!coachId) {
    console.error('🚨 coachId is required');
    return [];
  }

  try {
    console.log(`🔄 Fetching reels for coach ID: ${coachId}`);
    const response = await fetch(`http://192.168.0.5:8082/api/reels/user/${coachId}`, {
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
        // Vérifier les différentes possibilités de stockage des données vidéo
        const videoData = reel.videoData || reel.video_data || reel.video;
        let videoUri = null;

        if (videoData) {
          // Si les données vidéo sont en base64
          if (typeof videoData === 'string' && videoData.match(/^[A-Za-z0-9+/=]+$/)) {
            videoUri = `data:video/mp4;base64,${videoData}`;
          }
          // Si les données vidéo sont un objet avec une propriété data
          else if (videoData.data) {
            if (Array.isArray(videoData.data)) {
              // Convertir le tableau de bytes en base64
              const bytes = new Uint8Array(videoData.data);
              const binary = bytes.reduce((data, byte) => data + String.fromCharCode(byte), '');
              const base64 = btoa(binary);
              videoUri = `data:video/mp4;base64,${base64}`;
            } else if (typeof videoData.data === 'string') {
              videoUri = `data:video/mp4;base64,${videoData.data}`;
            }
          }
        }

        // Traitement de la miniature
        let thumbnailUri;
        try {
          thumbnailUri = reel.thumbnail 
            ? `data:image/jpeg;base64,${reel.thumbnail}`
            : require('../../assets/images/b.png');
        } catch (thumbnailError) {
          console.warn(`Cannot load thumbnail for reel ${reel.id}:`, thumbnailError);
          thumbnailUri = require('../../assets/images/b.png');
        }

        const processedReel = {
          ...reel,
          videoUri,
          thumbnailUri,
          title: reel.title || 'Vidéo sans titre',
          duration: reel.duration || ''
        };

        console.log(`Processed reel ${reel.id}:`, {
          hasVideo: !!videoUri,
          hasThumb: !!thumbnailUri
        });

        return processedReel;

      } catch (error) {
        console.error(`❌ Error processing reel ${reel.id}:`, error);
        return {
          ...reel,
          videoUri: null,
          error: true,
          errorMessage: error.message,
          thumbnailUri: require('../../assets/images/b.png'),
          title: reel.title || 'Vidéo sans titre',
          duration: reel.duration || ''
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

// Mise à jour du composant VideoModal pour gérer différents formats de vidéo
const VideoModal = ({ visible, onClose, videoUri }) => {
  const videoRef = React.useRef(null);
  const [status, setStatus] = React.useState({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (!visible || !videoUri) {
      // Reset state when modal closes
      setError(null);
      setIsLoading(true);
      if (videoRef.current) {
        videoRef.current.unloadAsync();
      }
      return;
    }

    let isMounted = true;

    const loadVideo = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Validate video URI
        if (!videoUri.startsWith('data:video/') && !videoUri.startsWith('file://') && !videoUri.startsWith('http')) {
          throw new Error('Invalid video format');
        }

        // Prepare video for playback
        await videoRef.current?.unloadAsync();
        await videoRef.current?.loadAsync(
          { uri: videoUri },
          { shouldPlay: true },
          false
        );

        if (isMounted) {
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Video loading error:', err);
        if (isMounted) {
          setError('Cannot load video. Please try again.');
          setIsLoading(false);
        }
      }
    };

    loadVideo();

    return () => {
      isMounted = false;
      if (videoRef.current) {
        videoRef.current.unloadAsync();
      }
    };
  }, [visible, videoUri]);

  const onPlaybackStatusUpdate = (playbackStatus) => {
    if (playbackStatus.isLoaded) {
      setStatus(playbackStatus);
    } else if (playbackStatus.error) {
      console.error('Playback error:', playbackStatus.error);
      setError(`Playback error: ${playbackStatus.error}`);
    }
  };

  // Handle video errors gracefully
  const handleVideoError = (error) => {
    console.error('Video error:', error);
    setError('Failed to play video. Please try again.');
    setIsLoading(false);
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.videoModalContainer}>
        <TouchableOpacity 
          style={styles.videoModalCloseButton}
          onPress={onClose}
        >
          <Text style={styles.videoModalCloseText}>Close</Text>
        </TouchableOpacity>

        {isLoading && (
          <View style={styles.videoLoadingContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.videoLoadingText}>Loading video...</Text>
          </View>
        )}

        {error ? (
          <View style={styles.videoErrorContainer}>
            <Text style={styles.videoErrorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setError(null);
                setIsLoading(true);
                // Attempt to reload the video
                if (videoRef.current) {
                  videoRef.current.loadAsync(
                    { uri: videoUri },
                    { shouldPlay: true },
                    false
                  );
                }
              }}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Video
            ref={videoRef}
            style={styles.videoPlayer}
            resizeMode="contain"
            useNativeControls
            shouldPlay={visible}
            isLooping
            onPlaybackStatusUpdate={onPlaybackStatusUpdate}
            onError={handleVideoError}
          />
        )}
      </View>
    </Modal>
  );
};

// Updated useEffect hook for fetching reels
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

// Updated renderVideoContent with better error handling
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
    <View style={styles.galleryContainer}>
      {reels.map((reel) => (
        <TouchableOpacity
          key={reel.id}
          style={styles.videoContainer}
          onPress={() => {
            console.log('Video data for reel', reel.id, ':', reel.videoUri ? 'Available' : 'Not available');
            if (reel.videoUri) {
              setSelectedVideoUri(reel.videoUri);
              setVideoModalVisible(true);
            } else {
              Alert.alert('Erreur', 'Vidéo non disponible');
            }
          }}
        >
          <Image 
            source={{ uri: reel.thumbnailUri }} 
            style={styles.videoThumbnail} 
            resizeMode="cover"
          />
          <View style={styles.playIconContainer}>
            <MaterialIcons name="play-circle-filled" size={40} color="white" />
          </View>
          <View style={styles.videoInfoContainer}>
            <Text style={styles.videoTitle}>{reel.title}</Text>
            {reel.duration && (
              <Text style={styles.videoDuration}>{reel.duration}</Text>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};
  
  
  
  
   
  // Dans le renderVideoContent, assurez-vous que la vérification se fait sur videoUri
  

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

  const renderGalleryContent = () => {
    if (isLoading) return <ActivityIndicator size="large" color="#000" />;
    if (error) return <Text style={styles.errorText}>{error}</Text>;
    if (!galleryImages || galleryImages.length === 0) return <Text style={styles.noImagesText}>Aucune image disponible</Text>;
    return (
      <View style={styles.galleryContainer}>
        {galleryImages.map((image) => (
          <Image 
            key={image.id} 
            source={{ uri: image.uri }} 
            style={styles.galleryImage}
            resizeMode="cover"
          />
        ))}
      </View>
    );
  };

  const renderEmojiContent = () => (
    <ScrollView style={styles.emojiScrollView}>
      <TouchableOpacity 
        style={styles.shareExperienceButton}
        onPress={() => setIsReviewModalVisible(true)}
      >
        <Text style={styles.shareExperienceText}>Partagez votre expérience</Text>
      </TouchableOpacity>
      <View style={styles.existingReviews}>
        <View style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <Text style={styles.reviewerName}>Malek Raouff</Text>
            {renderStars(3)}
          </View>
          <Text style={styles.reviewText}>
            J'ai suivi des séances de musculation avec Coach Ahmed pendant 3 mois et les résultats sont incroyables ! Il est très professionnel, toujours à l'écoute.
          </Text>
          <View style={styles.beforeAfterContainer}>
            <Image source={require('../../assets/images/b.png')} style={styles.beforeAfterImage} />
            <Image source={require('../../assets/images/b.png')} style={styles.beforeAfterImage} />
          </View>
        </View>
      </View>
    </ScrollView>
  );

  // Rendu du contenu vidéo avec ouverture de la modal de lecture
 
  
  // Dans le renderVideoContent, modifiez la vérification du video_data
 
  
  // Modification du renderVideoContent pour utiliser videoUri
  

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
            <Text style={styles.tag}>
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
          <Text style={styles.title}>Coach sportif à {disciplines}</Text>
          <Text style={styles.price}>Séance de {dureeSeance} min à partir de {prixSeance} DT</Text>
          <Text style={styles.location}>
            📍 En ligne - {email}
          </Text>
          <TouchableOpacity style={styles.buttonYellow}>
            <Text style={styles.buttonText}>Découvrez mes cours</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonBlack}
            onPress={() => router.push('/Coachd')}
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
      />
      <VideoModal 
        visible={videoModalVisible}
        onClose={() => {
          setVideoModalVisible(false);
          setSelectedVideoUri(null);
        }}
        videoUri={selectedVideoUri}
      />
    </View>
  );
};

//////////////////////////////////////////////////
// Styles                                         //
//////////////////////////////////////////////////
const styles = StyleSheet.create({
  
  ///// Styles pour la lecture vidéo
  videoModalContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  videoPlayer: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoModalCloseButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 2,
    padding: 10,
  },
  videoModalCloseText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  videoLoadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  videoLoadingText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 14,
  },
  videoErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  videoErrorText: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: '#D4FF00',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Autres styles
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#D4FF00',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  retryButtonText: {
    color: 'black',
    fontWeight: 'bold',
  },
  noImagesText: {
    color: '#666',
    textAlign: 'center',
  },
  galleryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  galleryImage: {
    width: '33%',
    height: 110,
    marginBottom: 2,
    borderRadius: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
  mainContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 30,
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
    color: 'gray',
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
  socialIcons: {
    flexDirection: 'row',
    marginVertical: 10,
    gap: 15,
  },
  about: {
    width: '90%',
    marginTop: 10,
    marginBottom: 20,
  },
  emojiScrollView: {
    flex: 1,
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
  tabContent: {
    padding: 20,
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
    marginRight: 8,
    marginBottom: 8,
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
});

export default CoachProfile;