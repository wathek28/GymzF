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

const FitnessGymApp = () => {
  // Récupérer les paramètres passés à la route
  const route = useRoute(); // Utiliser useRoute au lieu de useLocalSearchParams
  const params = route.params || {}; // Récupérer les paramètres de la route
  
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

  // Fonction pour récupérer et traiter les reels du gym
  const fetchReels = async (gymId) => {
    if (!gymId) {
      console.error('🚨 gymId is required');
      return [];
    }

    try {
      console.log(`🔄 Fetching reels for gym ID: ${gymId}`);
      // Add timeout to the fetch to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`http://192.168.0.3:8082/api/reels/user/${gymId}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reels = await response.json();
      console.log(`📊 Received ${reels.length} reels from API`);
      
      // Debug the first reel structure
      if (reels.length > 0) {
        console.log('First reel structure:', Object.keys(reels[0]));
      }

      if (!Array.isArray(reels)) {
        console.error('⚠️ Invalid response format - expected array');
        return [];
      }

      const processedReels = await Promise.all(reels.map(async (reel) => {
        try {
          // Vérifier les différentes possibilités de stockage des données vidéo
          const videoField = reel.video_data || reel.videoData || reel.video;
          let videoUri = null;

          if (videoField) {
            console.log(`Found video data for reel ${reel.id}, type:`, typeof videoField);
            
            // Handle base64 string directly
            if (typeof videoField === 'string') {
              if (videoField.startsWith('data:')) {
                videoUri = videoField;
              } else {
                videoUri = `data:video/mp4;base64,${videoField}`;
              }
              console.log(`Created URI from string for reel ${reel.id}`);
            } 
            // Handle blob object with data property
            else if (videoField.data) {
              if (Array.isArray(videoField.data)) {
                // Convert Uint8Array to base64
                const uint8Array = new Uint8Array(videoField.data);
                let binary = '';
                uint8Array.forEach(byte => {
                  binary += String.fromCharCode(byte);
                });
                const base64 = btoa(binary);
                videoUri = `data:video/mp4;base64,${base64}`;
                console.log(`Created URI from byte array for reel ${reel.id}`);
              } else if (typeof videoField.data === 'string') {
                videoUri = `data:video/mp4;base64,${videoField.data}`;
                console.log(`Created URI from data string for reel ${reel.id}`);
              }
            }
          } else {
            console.warn(`⚠️ No video data found for reel ${reel.id}`);
          }

          // Process thumbnail with fallback
          let thumbnailUri;
          try {
            thumbnailUri = reel.thumbnail 
              ? `data:image/jpeg;base64,${reel.thumbnail}`
              : require('../../assets/images/b.png');
          } catch (thumbnailError) {
            console.warn(`Cannot load thumbnail for reel ${reel.id}:`, thumbnailError);
            thumbnailUri = require('../../assets/images/b.png');
          }

          return {
            ...reel,
            videoUri,
            thumbnailUri,
            title: reel.title || 'Vidéo sans titre',
            duration: reel.duration || ''
          };
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
      }));

      return processedReels;
    } catch (error) {
      console.error('❌ Error fetching reels:', error);
      // Return an empty array instead of throwing to prevent app crash
      return [];
    }
  };

  // useEffect pour charger les reels
  useEffect(() => {
    let isActive = true;

    const loadReels = async () => {
      if (!idGym) return;
      
      setReelsLoading(true);
      setReelsError(null);
      
      try {
        const processedReels = await fetchReels(idGym);
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
  }, [idGym]);

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
  const renderMainContent = () => {
    switch (selectedTab) {
      case 'document':
        return (
          <View>
            <Text style={styles.sectionTitle}>Documents</Text>
            <Text style={styles.aboutText}>
              Tous les documents concernant {firstName || 'notre gym'} se trouvent ici.
            </Text>
            {/* Liste des documents */}
            <View style={styles.documentsList}>
              <TouchableOpacity style={styles.documentItem}>
                <MaterialCommunityIcons name="file-pdf-box" size={24} color="#D32F2F" />
                <Text style={styles.documentName}>Règlement intérieur.pdf</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.documentItem}>
                <MaterialCommunityIcons name="file-document-outline" size={24} color="#1976D2" />
                <Text style={styles.documentName}>Planning des cours.docx</Text>
              </TouchableOpacity>
            </View>
          </View>
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
        return (
          <View>
            <Text style={styles.sectionTitle}>Avis et commentaires</Text>
            <View style={styles.reviewSummary}>
              <Text style={styles.ratingNumber}>4.8</Text>
              <View style={styles.starsContainer}>
                <Ionicons name="star" size={16} color="#FFC107" />
                <Ionicons name="star" size={16} color="#FFC107" />
                <Ionicons name="star" size={16} color="#FFC107" />
                <Ionicons name="star" size={16} color="#FFC107" />
                <Ionicons name="star-half" size={16} color="#FFC107" />
              </View>
              <Text style={styles.reviewCount}>(42 avis)</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.addReviewButton} 
              onPress={() => setIsReviewModalVisible(true)}
            >
              <Text style={styles.addReviewButtonText}>Laisser un avis</Text>
            </TouchableOpacity>
            
            {/* Liste des avis */}
            <View style={styles.reviewsList}>
              <View style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewerName}>Jean Dupont</Text>
                  <View style={styles.reviewStars}>
                    <Ionicons name="star" size={14} color="#FFC107" />
                    <Ionicons name="star" size={14} color="#FFC107" />
                    <Ionicons name="star" size={14} color="#FFC107" />
                    <Ionicons name="star" size={14} color="#FFC107" />
                    <Ionicons name="star" size={14} color="#FFC107" />
                  </View>
                </View>
                <Text style={styles.reviewDate}>2 Mars 2023</Text>
                <Text style={styles.reviewComment}>
                  Super ambiance et coachs très professionnels. Je recommande !
                </Text>
              </View>
            </View>
          </View>
        );
        
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
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
          <TouchableOpacity style={styles.subscriptionButton}>
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
              <View style={styles.coachesGrid}>
                {coaches.map((coach) => (
                  <View key={coach.id} style={styles.coachItem}>
                    <Image 
                      source={
                        coach.photo 
                          ? { uri: `data:image/jpeg;base64,${coach.photo}` }
                          : require('../../assets/images/b.png')
                      } 
                      style={styles.coachImage} 
                    />
                    <Text style={styles.coachName}>{coach.firstName}</Text>
                  </View>
                ))}
              </View>
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
const ReviewModal = ({ isVisible, onClose, rating, setRating, comment, setComment, firstName }) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Évaluer {firstName || 'ce gym'}</Text>
          
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
              >
                <Ionicons
                  name={rating >= star ? "star" : "star-outline"}
                  size={30}
                  color="#FFC107"
                  style={styles.starIcon}
                />
              </TouchableOpacity>
            ))}
          </View>
          
          <TextInput
            style={styles.commentInput}
            placeholder="Partagez votre expérience..."
            multiline
            value={comment}
            onChangeText={setComment}
          />
          
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.submitButton}
              onPress={() => {
                // Ici, vous pourriez envoyer l'avis à votre API
                onClose();
              }}
            >
              <Text style={styles.submitButtonText}>Soumettre</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};




/////////////////////////
const VideoModal = ({ visible, onClose, videoUri, allVideos = [] }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [localVideoUris, setLocalVideoUris] = useState({});
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const scrollViewRef = useRef(null);
  const videoRefs = useRef({});

  // Détermine les vidéos à afficher
  const videosToShow = allVideos.length > 0 && videoUri 
    ? allVideos 
    : videoUri ? [{ id: 'single', videoUri }] : [];

  // Trouve l'index de la vidéo sélectionnée
  const initialIndex = videoUri && allVideos.length > 0
    ? allVideos.findIndex(video => video.videoUri === videoUri) 
    : 0;

  // URL de secours en cas d'échec
  const getFallbackVideoUrl = () => {
    return 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4';
  };

  // Fonction pour traiter les données vidéo (convertit base64/blob en URI compatible)
  const processVideoData = async (videoData) => {
    if (!videoData) return null;
    
    try {
      console.log("Type de vidéo reçu:", typeof videoData);
      if (typeof videoData === 'string') {
        console.log("Début des données vidéo:", videoData.substring(0, 30) + '...');
      }
      
      // Si c'est déjà une URL directe (http ou file)
      if (typeof videoData === 'string' && (videoData.startsWith('http') || videoData.startsWith('file://'))) {
        return videoData;
      }
      
      // Pour iOS, on doit convertir les données base64 en fichier temporaire
      
      // Créer un nom de fichier temporaire unique
      const filename = `${FileSystem.cacheDirectory}temp_video_${Date.now()}.mp4`;
      
      // Si c'est une data URI (ex: "data:video/mp4;base64,...")
      if (typeof videoData === 'string' && videoData.startsWith('data:')) {
        try {
          // Extraire la partie base64
          const base64Data = videoData.split(',')[1];
          
          // Écrire les données dans un fichier
          await FileSystem.writeAsStringAsync(filename, base64Data, {
            encoding: FileSystem.EncodingType.Base64
          });
          
          console.log("✅ Fichier temporaire créé:", filename);
          return filename;
        } catch (err) {
          console.error("❌ Erreur lors de l'écriture du fichier temporaire:", err);
          return getFallbackVideoUrl();
        }
      }
      
      // Si ce sont des données en base64 pures
      if (typeof videoData === 'string' && videoData.match(/^[A-Za-z0-9+/=]+$/)) {
        try {
          // Écrire les données dans un fichier
          await FileSystem.writeAsStringAsync(filename, videoData, {
            encoding: FileSystem.EncodingType.Base64
          });
          
          console.log("✅ Fichier temporaire créé:", filename);
          return filename;
        } catch (err) {
          console.error("❌ Erreur lors de l'écriture du fichier temporaire:", err);
          return getFallbackVideoUrl();
        }
      }
      
      console.log('❓ Format vidéo non supporté, utilisation d\'une vidéo de test');
      return getFallbackVideoUrl();
    } catch (error) {
      console.error('❌ Error processing video data:', error);
      return getFallbackVideoUrl();
    }
  };

  // Prépare toutes les vidéos
  const prepareVideos = useCallback(async () => {
    if (videosToShow.length === 0) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Prépare seulement la vidéo actuelle et les adjacentes pour optimiser les performances
      const videosToProcess = videosToShow.filter((_, index) => {
        return Math.abs(index - initialIndex) <= 1;
      });

      const processedUris = {};
      
      for (const video of videosToProcess) {
        const videoData = video.videoUri;
        if (videoData) {
          try {
            const processedUri = await processVideoData(videoData);
            if (processedUri) {
              processedUris[video.id] = processedUri;
            }
          } catch (err) {
            console.error(`Error processing video ${video.id}:`, err);
          }
        }
      }
      
      setLocalVideoUris(processedUris);
      
    } catch (err) {
      console.error('Error preparing videos:', err);
      setError('Erreur lors de la préparation des vidéos');
    } finally {
      setIsLoading(false);
    }
  }, [videosToShow, initialIndex]);

  // Gère le changement de vidéo lors du défilement
  const handleScroll = useCallback((event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const width = Dimensions.get('window').width;
    const newIndex = Math.round(offsetX / width);
    
    if (newIndex !== currentVideoIndex) {
      // Pause toutes les vidéos
      Object.keys(videoRefs.current).forEach(id => {
        if (videoRefs.current[id]) {
          videoRefs.current[id].pauseAsync().catch(console.error);
        }
      });
      
      setCurrentVideoIndex(newIndex);
      
      // Lecture de la vidéo courante
      const currentVideo = videosToShow[newIndex];
      if (currentVideo && videoRefs.current[currentVideo.id]) {
        videoRefs.current[currentVideo.id].playAsync().catch(console.error);
      }
    }
  }, [currentVideoIndex, videosToShow]);

  // Initialisation au montage du composant
  useEffect(() => {
    if (visible) {
      prepareVideos();
      
      // Définir l'index initial
      if (initialIndex >= 0) {
        setCurrentVideoIndex(initialIndex);
      }
    }
    
    return () => {
      // Nettoyage des fichiers temporaires
      Object.values(localVideoUris).forEach(uri => {
        if (uri && uri.startsWith(FileSystem.cacheDirectory)) {
          FileSystem.deleteAsync(uri, { idempotent: true })
            .catch(error => console.log("Erreur lors du nettoyage:", error));
        }
      });
      // Nettoyage des références
      videoRefs.current = {};
    };
  }, [visible, prepareVideos, initialIndex]);

  // Effet pour lecture automatique de la vidéo courante
  useEffect(() => {
    if (visible && videosToShow.length > 0) {
      const currentVideo = videosToShow[currentVideoIndex];
      if (currentVideo && videoRefs.current[currentVideo.id]) {
        // Pause toutes les autres vidéos d'abord
        Object.keys(videoRefs.current).forEach(id => {
          if (id !== currentVideo.id && videoRefs.current[id]) {
            videoRefs.current[id].pauseAsync().catch(console.error);
          }
        });
        
        // Lecture de la vidéo courante
        videoRefs.current[currentVideo.id].playAsync().catch(console.error);
      }
    }
  }, [visible, currentVideoIndex, videosToShow, localVideoUris]);

  // Débogage - log des informations clés
  useEffect(() => {
    if (visible) {
      console.log(`VideoModal visible with ${videosToShow.length} videos`);
      console.log(`VideoUri: ${videoUri ? 'exists' : 'missing'}`);
      console.log(`Initial index: ${initialIndex}`);
      if (videosToShow.length > 0 && videosToShow[0].videoUri) {
        console.log(`First video URI type: ${typeof videosToShow[0].videoUri}`);
        console.log(`First video URI starts with: ${videosToShow[0].videoUri.substring(0, 30)}...`);
      }
    }
  }, [visible, videosToShow, videoUri, initialIndex]);

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
                    ref={ref => { videoRefs.current[video.id] = ref; }}
                    style={styles.videoPlayer}
                    source={{ uri: localVideoUris[video.id] }}
                    resizeMode="contain"
                    useNativeControls
                    shouldPlay={index === currentVideoIndex}
                    isLooping
                    onLoadStart={() => {
                      if (index === currentVideoIndex) setIsLoading(true);
                    }}
                    onLoad={() => {
                      if (index === currentVideoIndex) setIsLoading(false);
                    }}
                    onError={(error) => {
                      console.error(`Video playback error:`, error);
                      if (index === currentVideoIndex) {
                        // En cas d'erreur, utiliser la vidéo de fallback
                        setLocalVideoUris(prev => ({
                          ...prev,
                          [video.id]: getFallbackVideoUrl()
                        }));
                        setError('Erreur de lecture de la vidéo originale, chargement d\'une vidéo de test.');
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

        {isLoading && currentVideoIndex >= 0 && (
          <View style={styles.videoLoadingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.videoLoadingText}>Chargement de la vidéo...</Text>
          </View>
        )}

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
        
        {/* Indicateur de position */}
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

const styles = StyleSheet.create({
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
  coachesSection: {
    marginBottom: 20,
  },
  coachesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  coachItem: {
    alignItems: 'center',
    width: '25%',
    marginBottom: 15,
  },
  coachImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 5,
  },
  coachName: {
    fontSize: 12,
    textAlign: 'center',
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
    backgroundColor: 'transparent'
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
});

export default FitnessGymApp;