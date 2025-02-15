import React, { useState } from 'react';
import { 
  KeyboardAvoidingView, 
  Platform, 
  Alert,
} from 'react-native';
import { 
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
////////////////////////////////////////////////////////////
// Composant ReviewModal extrait pour éviter sa recréation //
////////////////////////////////////////////////////////////
const ReviewModal = ({
  isVisible,
  onClose,
  rating,
  setRating,
  comment,
  setComment,
  firstName,
}) => {
  const [beforeImage, setBeforeImage] = useState(null);
  const [afterImage, setAfterImage] = useState(null);

  const handleModalPress = (e) => {
    e.stopPropagation();
  };

  // Fonction pour choisir l'image "Avant"
  const pickBeforeImage = async () => {
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
    if (!result.cancelled) {
      setBeforeImage(result.uri);
    }
  };

  // Fonction pour choisir l'image "Après"
  const pickAfterImage = async () => {
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
    if (!result.cancelled) {
      setAfterImage(result.uri);
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
            <TouchableWithoutFeedback onPress={handleModalPress}>
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
                        onPress={pickBeforeImage}
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
                        onPress={pickAfterImage}
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
                        console.log("Publishing review:", { rating, comment, beforeImage, afterImage });
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
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

//////////////////////
// Composant CoachProfile
//////////////////////
const CoachProfile = () => {
  const route = useRoute();
   const router = useRouter();
  const navigation = useNavigation();
  const [selectedTab, setSelectedTab] = useState('document');

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);

  const galleryImages = [
    require('../../assets/images/b.png'),
    require('../../assets/images/b.png'),
    require('../../assets/images/b.png'),
    require('../../assets/images/b.png'),
    require('../../assets/images/b.png'),
    require('../../assets/images/b.png'),
    require('../../assets/images/b.png'),
    require('../../assets/images/b.png'),
    require('../../assets/images/b.png'),
  ];

  const {
    competencesGenerales = [],
    coursSpecifiques = [],
    disciplines = [],
    dureeExperience,
    dureeSeance,
    email,
    entrainementPhysique = [],
    fb,
    firstName,
    insta,
    niveauCours,
    phoneNumber,
    photo,
    poste,
    prixSeance,
    santeEtBienEtre = [],
    tiktok,
    typeCoaching,
    bio,
  } = route.params;

  const renderStars = (selectedRating, interactive = false) => {
    return (
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

        <View style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <Text style={styles.reviewerName}>Rami Herzi</Text>
            {renderStars(4)}
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
      case 'video':
        return (
          <View style={styles.galleryContainer}>
            {galleryImages.map((image, index) => (
              <Image key={index} source={image} style={styles.galleryImage} />
            ))}
          </View>
        );
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
      
      {/* Le modal est rendu une seule fois */}
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
// Styles (fusion des styles utilisés)          //
//////////////////////////////////////////////////
const styles = StyleSheet.create({
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
  galleryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 10,
  },
  galleryImage: {
    width: '30%',
    height: 100,
    marginBottom: 10,
    borderRadius: 10,
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
