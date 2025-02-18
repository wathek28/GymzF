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

//
// Cette fonction sanitizeResponse supprime le champ "content" 
// (qui est très volumineux) de la réponse JSON brute.


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
    const images = new Map(); // Utiliser une Map pour dédupliquer
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

        // Chercher l'ID associé
        const idSearch = text.slice(Math.max(0, startContent - 200), startContent);
        const idMatch = idSearch.match(/"id"\s*:\s*(\d+)/);
        let imageId;

        if (idMatch) {
          imageId = parseInt(idMatch[1]);
        } else {
          imageId = `generated_${Date.now()}_${Math.random()}`;
        }

        // Vérifier si le contenu ressemble à du base64 et n'est pas déjà présent
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
    const seen = new Set(); // Pour suivre les URIs déjà vues

    return photos.map(photo => {
      const uri = photo.url || (photo.content ? `data:image/jpeg;base64,${photo.content}` : DEFAULT_IMAGE);

      // Si l'URI existe déjà, générer un nouvel ID
      if (seen.has(uri)) {
        photo.id = `${photo.id}_${Date.now()}_${Math.random()}`;
      }
      seen.add(uri);

      return {
        id: photo.id,
        uri
      };
    }).filter(img => img.uri !== DEFAULT_IMAGE); // Filtrer les images par défaut
  };

  const loadGalleryImages = async (coachId) => {
    try {
      setIsLoading(true);  // Lancer le chargement
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
      setIsLoading(false);  // Fin du chargement
    }
  };
  

  return {
    galleryImages,
    isLoading,
    error,
  };
};






//
// Hook personnalisé pour la gestion des images de la galerie avec pagination
//



///////////////////////////////////////////////////////////////////////////
// Le reste de votre code (ReviewModal, CoachProfile, styles, etc.) reste inchangé
///////////////////////////////////////////////////////////////////////////

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

const CoachProfile = () => {
  const route = useRoute();
  const router = useRouter();
  const navigation = useNavigation();
  const [selectedTab, setSelectedTab] = useState('document');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);

  const { galleryImages, isLoading, error, loadMoreImages } = useGalleryImages(route.params?.id, selectedTab);

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
  const renderVideoContent = () => {
    const videoThumbnails = [
      { id: 1, thumbnail: require('../../assets/images/b.png'), title: 'Séance de musculation' },
      { id: 2, thumbnail: require('../../assets/images/b.png'), title: 'Exercices de cardio' },
      { id: 3, thumbnail: require('../../assets/images/b.png'), title: 'Yoga débutant' },
      { id: 4, thumbnail: require('../../assets/images/b.png'), title: 'Stretching' },
    ];

    return (
      <View style={styles.videoContainer}>
        {videoThumbnails.map((video) => (
          <TouchableOpacity 
            key={video.id}
            style={styles.videoCard}
            onPress={() => Alert.alert('Vidéo', 'Lecture de la vidéo...')}
          >
            <Image 
              source={video.thumbnail}
              style={styles.videoThumbnail}
              resizeMode="cover"
            />
            <View style={styles.playIconContainer}>
              <MaterialIcons name="play-circle-filled" size={40} color="#FFF" />
            </View>
            <View style={styles.videoInfoContainer}>
              <Text style={styles.videoTitle}>{video.title}</Text>
              <Text style={styles.videoDuration}>10:30</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
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
    </View>
  );
};

//////////////////////////////////////////////////
// Styles                                         //
//////////////////////////////////////////////////
const styles = StyleSheet.create({
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
    marginright: 5,
  
  },
  galleryImage: {
    width: '30%',
    height: 100,
    marginBottom: 5,
    borderRadius: 10,
  },
  // Modal styles
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
  // Main styles
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
  // Ajoutez ici d'autres styles si nécessaire
});

export default CoachProfile;
