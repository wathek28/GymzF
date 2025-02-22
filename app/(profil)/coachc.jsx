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
  Keyboard
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

// Pour l'instant, nous utilisons expo-av pour le composant Video
import { Video } from 'expo-av';
import * as FileSystem from 'expo-file-system';

//
// Hook pour charger les images de la galerie
//
const useGalleryImages = (id, selectedTab) => {
  const [galleryImages, setGalleryImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const API_BASE_URL = 'http://192.168.0.6:8082/api';
  const DEFAULT_IMAGE = Image.resolveAssetSource(require('../../assets/images/b.png')).uri;

  useEffect(() => {
    if (selectedTab === 'gallery') {
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
  const fetchReels = async (coachId) => {
    if (!coachId) {
      console.error('🚨 coachId is required');
      return [];
    }

    try {
      console.log(`🔄 Fetching reels for coach ID: ${coachId}`);
      const response = await fetch(`http://192.168.0.6:8082/api/reels/user/${coachId}`, {
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

  // Composant VideoModal mis à jour pour utiliser expo-av Video
  const VideoModal = ({ visible, onClose, videoUri }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [localVideoUri, setLocalVideoUri] = useState(null);
    const videoRef = useRef(null);

    // Définition de prepareVideo accessible depuis le retry
    const prepareVideo = useCallback(async () => {
      if (!videoUri) return;
      setIsLoading(true);
      setError(null);
      try {
        const processedUri = await processVideoData(videoUri);
        if (processedUri) {
          setLocalVideoUri(processedUri);
        } else {
          setError('Format vidéo non supporté');
        }
      } catch (err) {
        console.error('Error preparing video:', err);
        setError('Erreur lors de la préparation de la vidéo');
      } finally {
        setIsLoading(false);
      }
    }, [videoUri]);

    useEffect(() => {
      prepareVideo();
      return () => {
        // Cleanup des fichiers temporaires
        if (localVideoUri?.startsWith(FileSystem.cacheDirectory)) {
          FileSystem.deleteAsync(localVideoUri, { idempotent: true })
            .catch(console.error);
        }
      };
    }, [videoUri, prepareVideo]);

    if (!visible) return null;

    return (
      <Modal
        visible={visible}
        animationType="slide"
        onRequestClose={onClose}
        transparent={false}
      >
        <View style={styles.videoModalContainer}>
          <TouchableOpacity 
            style={styles.videoModalCloseButton}
            onPress={onClose}
          >
            <Text style={styles.videoModalCloseText}>Fermer</Text>
          </TouchableOpacity>

          {localVideoUri && !error && (
            <Video
              ref={videoRef}
              style={styles.videoPlayer}
              source={{ uri: localVideoUri }}
              resizeMode="contain"
              useNativeControls
              shouldPlay
              isLooping
              onLoadStart={() => setIsLoading(true)}
              onLoad={() => setIsLoading(false)}
              onError={(error) => {
                console.error('Video playback error:', error);
                setError('Erreur de lecture de la vidéo');
                setIsLoading(false);
              }}
            />
          )}

          {isLoading && (
            <View style={styles.videoLoadingContainer}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.videoLoadingText}>Chargement de la vidéo...</Text>
            </View>
          )}

          {error && (
            <View style={styles.videoErrorContainer}>
              <Text style={styles.videoErrorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={prepareVideo}
              >
                <Text style={styles.retryButtonText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          )}
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
  
    // ==============================
    // Styles de base et conteneurs
    // ==============================
    mainContainer: {
      flex: 1,
      backgroundColor: '#f5f5f5',
    },
    container: {
      flex: 1,
    },
    tabContent: {
      padding: 20,
    },
  
    // ==============================
    // Styles de l'en-tête du profil
    // ==============================
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
      backgroundColor: '#fff',
      borderRadius: 10,
      overflow: 'hidden',
    },
    videoThumbnail: {
      width: '100%',
      height: '100%',
      borderRadius: 10,
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
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
  
    // ==============================
    // Styles du modal vidéo
    // ==============================
    videoModalContainer: {
      flex: 1,
      backgroundColor: '#000',
      justifyContent: 'center',
      alignItems: 'center',
    },
    videoPlayer: {
      width: '100%',
      height: '100%',
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
      marginRight: 8,
      marginBottom: 8,
    },
  
    // ==============================
    // Styles du modal des avis
    // ==============================
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
  });


export default CoachProfile1;