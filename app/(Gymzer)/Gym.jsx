import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Alert, Platform } from 'react-native';
import { Feather, MaterialIcons, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator'; // Assurez-vous d'installer cette dépendance

const ProfileScreen = () => {
  const router = useRouter();
  
  // Récupération des paramètres via useLocalSearchParams
  const params = useLocalSearchParams();
  const { 
    userId: paramUserId, 
    firstName: paramFirstName,
    phoneNumber: paramPhoneNumber,
    photo: paramPhoto,
    email: paramEmail
  } = params;
  
  // États pour les données utilisateur
  const [userId, setUserId] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [userPhoto, setUserPhoto] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Récupérer les données utilisateur au chargement du composant
  useEffect(() => {
    const getUserData = async () => {
      try {
        console.log('=== RÉCUPÉRATION DES DONNÉES DANS PROFILESCREEN ===');
        
        // Vérification des paramètres reçus
        console.log('Paramètres reçus:', {
          userId: paramUserId || 'non défini',
          firstName: paramFirstName || 'non défini',
          phoneNumber: paramPhoneNumber || 'non défini',
          photo: paramPhoto ? 'présente' : 'non définie',
          email: paramEmail || 'non défini'
        });
        
        let updatedUserId = userId;
        let updatedFirstName = firstName;
        let updatedPhoneNumber = phoneNumber;
        let updatedUserPhoto = userPhoto;
        let updatedUserEmail = userEmail;
        
        // Priorité 1: Utiliser les données des paramètres de navigation si elles existent
        if (paramUserId) {
          console.log('ID utilisateur trouvé dans les paramètres:', paramUserId);
          setUserId(paramUserId);
          updatedUserId = paramUserId;
        }
        
        if (paramFirstName) {
          console.log('FirstName trouvé dans les paramètres:', paramFirstName);
          setFirstName(paramFirstName);
          updatedFirstName = paramFirstName;
        } else {
          // Essayer de récupérer le firstName depuis AsyncStorage
          const storedFirstName = await AsyncStorage.getItem('firstName');
          if (storedFirstName) {
            console.log('FirstName récupéré de AsyncStorage:', storedFirstName);
            setFirstName(storedFirstName);
            updatedFirstName = storedFirstName;
          } else {
            console.warn('Aucun firstName trouvé');
          }
        }
        
        // Récupérer le numéro de téléphone
        if (paramPhoneNumber) {
          console.log('PhoneNumber trouvé dans les paramètres:', paramPhoneNumber);
          setPhoneNumber(paramPhoneNumber);
          updatedPhoneNumber = paramPhoneNumber;
        } else {
          // Essayer de récupérer le phoneNumber depuis AsyncStorage
          const storedPhoneNumber = await AsyncStorage.getItem('phoneNumber');
          if (storedPhoneNumber) {
            console.log('PhoneNumber récupéré de AsyncStorage:', storedPhoneNumber);
            setPhoneNumber(storedPhoneNumber);
            updatedPhoneNumber = storedPhoneNumber;
          } else {
            console.warn('Aucun phoneNumber trouvé');
          }
        }
        
        // Récupérer la photo
        if (paramPhoto) {
          console.log('Photo trouvée dans les paramètres');
          setUserPhoto(paramPhoto);
          updatedUserPhoto = paramPhoto;
        } else {
          // Essayer de récupérer la photo depuis AsyncStorage
          const storedPhoto = await AsyncStorage.getItem('userPhoto');
          if (storedPhoto) {
            console.log('Photo récupérée de AsyncStorage');
            setUserPhoto(storedPhoto);
            updatedUserPhoto = storedPhoto;
          } else {
            console.warn('Aucune photo trouvée');
          }
        }
        
        // Récupérer l'email
        if (paramEmail) {
          console.log('Email trouvé dans les paramètres:', paramEmail);
          setUserEmail(paramEmail);
          updatedUserEmail = paramEmail;
        } else {
          // Essayer de récupérer l'email depuis AsyncStorage
          const storedEmail = await AsyncStorage.getItem('userEmail');
          if (storedEmail) {
            console.log('Email récupéré de AsyncStorage:', storedEmail);
            setUserEmail(storedEmail);
            updatedUserEmail = storedEmail;
          } else {
            console.warn('Aucun email trouvé');
          }
        }
        
        // Priorité 2: Récupérer l'ID de l'AsyncStorage si non présent dans les paramètres
        if (!paramUserId) {
          const storedUserId = await AsyncStorage.getItem('userId');
          if (storedUserId) {
            console.log('ID utilisateur récupéré de AsyncStorage:', storedUserId);
            setUserId(storedUserId);
            updatedUserId = storedUserId;
          } else {
            console.warn('Aucun ID utilisateur trouvé');
          }
        }
        
        // Marquer comme chargé
        setDataLoaded(true);
        
        // Vérification finale des données
        console.log('=== VÉRIFICATION FINALE DES DONNÉES UTILISATEUR ===');
        console.log('userId:', updatedUserId || 'non défini');
        console.log('firstName:', updatedFirstName || 'non défini');
        console.log('phoneNumber:', updatedPhoneNumber || 'non défini');
        console.log('userPhoto:', updatedUserPhoto ? 'présente' : 'non définie');
        console.log('userEmail:', updatedUserEmail || 'non défini');
        
      } catch (error) {
        console.error('Erreur lors de la récupération des données utilisateur:', error);
        setDataLoaded(true);
      }
    };
    
    // Demander les permissions d'accès à la galerie
    const requestPermission = async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission refusée', 'Nous avons besoin de la permission d\'accéder à votre galerie pour changer votre photo de profil.');
        }
      }
    };

    getUserData();
    requestPermission();
  }, [paramUserId, paramFirstName, paramPhoneNumber, paramPhoto, paramEmail]);

  // Utiliser un useEffect pour confirmer quand les états ont été mis à jour
  useEffect(() => {
    if (dataLoaded) {
      console.log('=== ÉTATS MIS À JOUR ===');
      console.log('userId:', userId || 'non défini');
      console.log('firstName:', firstName || 'non défini');
      console.log('phoneNumber:', phoneNumber || 'non défini');
      console.log('userPhoto:', userPhoto ? 'présente' : 'non définie');
      console.log('userEmail:', userEmail || 'non défini');
    }
  }, [dataLoaded, userId, firstName, phoneNumber, userPhoto, userEmail]);

  // Fonction pour compresser une image (nouvelle fonction)
  const compressImage = async (uri) => {
    console.log('===== DÉBUT DE LA COMPRESSION DE L\'IMAGE =====');
    try {
      console.log('Redimensionnement et compression de l\'image:', uri);
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 500 } }], // Redimensionner à 500px de large
        { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
      );
      
      console.log('Image compressée avec succès. Nouvelle taille:', {
        width: result.width,
        height: result.height,
        uri: result.uri.substring(0, 50) + '...'
      });
      console.log('===== FIN DE LA COMPRESSION (SUCCÈS) =====');
      
      return result.uri;
    } catch (error) {
      console.error('===== ERREUR LORS DE LA COMPRESSION =====');
      console.error('Type d\'erreur:', error.name);
      console.error('Message d\'erreur:', error.message);
      console.error('===== FIN DE L\'ERREUR DE COMPRESSION =====');
      return uri; // En cas d'erreur, retourner l'URI original
    }
  };

  // Fonction pour convertir une image en base64 avec logs améliorés
  const convertImageToBase64 = async (uri) => {
    console.log('===== DÉBUT DE LA CONVERSION DE L\'IMAGE EN BASE64 =====');
    console.log('URI de l\'image à convertir:', uri);
    try {
      console.log('Tentative de lecture du fichier...');
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      console.log('Conversion réussie, longueur base64:', base64.length);
      console.log('Taille approximative en KB:', Math.round(base64.length / 1024));
      console.log('===== FIN DE LA CONVERSION DE L\'IMAGE (SUCCÈS) =====');
      return base64;
    } catch (error) {
      console.error('===== ERREUR LORS DE LA CONVERSION DE L\'IMAGE =====');
      console.error('Type d\'erreur:', error.name);
      console.error('Message d\'erreur:', error.message);
      console.error('Stack trace:', error.stack);
      console.error('===== FIN DE L\'ERREUR DE CONVERSION =====');
      return null;
    }
  };

  // Fonction pour envoyer la photo au serveur avec logs de débogage améliorés
  const updateUserPhotoOnServer = async (base64) => {
    if (!phoneNumber) {
      console.error('Numéro de téléphone manquant pour la mise à jour de la photo');
      return false;
    }

    setIsUploading(true);
    console.log('===== DÉBUT DE L\'UPLOAD DE LA PHOTO =====');
    console.log('Taille de l\'image (caractères base64):', base64?.length || 0);
    console.log('Taille approximative en KB:', Math.round((base64?.length || 0) / 1024));
    
    try {
      // Créer un formData pour l'envoi
      const formData = new FormData();
      
      // Ajouter le numéro de téléphone
      formData.append('phoneNumber', phoneNumber);
      console.log('Numéro de téléphone ajouté au formData:', phoneNumber);
      
      // Ajouter la photo si disponible
      if (base64) {
        // Créer un objet blob pour le formData qui simule un fichier
        const photoFile = {
          uri: `data:image/jpeg;base64,${base64}`, // Même format pour Android et iOS
          type: 'image/jpeg',
          name: 'profile-photo.jpg',
        };
        
        console.log('Préparation de l\'objet photoFile:', {
          uriType: typeof photoFile.uri,
          uriLength: photoFile.uri.length,
          type: photoFile.type,
          name: photoFile.name
        });
        
        formData.append('photo', photoFile);
        console.log('Photo ajoutée au formData');
      }
      
      console.log('Envoi de la requête à l\'API...');
      const apiUrl = 'http://192.168.1.194:8082/api/auth/update-photo';
      console.log('URL de l\'API:', apiUrl);
      
      console.log('Début de la requête fetch');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 secondes timeout (augmenté)
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
        // Ne pas définir explicitement le header Content-Type pour FormData
        // Il sera automatiquement défini avec la bonne frontière (boundary)
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log('Réponse reçue du serveur, status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erreur de réponse serveur:', {
          status: response.status,
          text: errorText
        });
        throw new Error(`Erreur ${response.status}: ${errorText}`);
      }
      
      const responseData = await response.json();
      console.log('Réponse de l\'API (succès):', JSON.stringify(responseData).substring(0, 100) + '...');
      console.log('===== FIN DE L\'UPLOAD DE LA PHOTO (SUCCÈS) =====');
      
      setIsUploading(false);
      return true;
    } catch (error) {
      console.error('===== ERREUR DÉTAILLÉE LORS DE L\'ENVOI DE LA PHOTO =====');
      console.error('Type d\'erreur:', error.name);
      console.error('Message d\'erreur:', error.message);
      console.error('Stack trace:', error.stack);
      if (error.name === 'AbortError') {
        console.error('La requête a été abandonnée (timeout)');
      }
      if (error.cause) {
        console.error('Cause de l\'erreur:', error.cause);
      }
      console.error('===== FIN DE L\'ERREUR DÉTAILLÉE =====');
      
      setIsUploading(false);
      return false;
    }
  };

  // Fonction pour mettre à jour la photo de l'utilisateur avec logs améliorés
  const updateUserPhoto = async (base64) => {
    console.log('===== DÉBUT DE LA MISE À JOUR DE LA PHOTO UTILISATEUR =====');
    try {
      // Mettre à jour l'état local
      console.log('Mise à jour de l\'état local (setUserPhoto)');
      setUserPhoto(base64);
      
      // Sauvegarder dans AsyncStorage
      console.log('Tentative de sauvegarde dans AsyncStorage...');
      await AsyncStorage.setItem('userPhoto', base64);
      console.log('Photo de profil mise à jour dans AsyncStorage');
      
      // Envoyer la photo au serveur
      console.log('Tentative d\'envoi au serveur...');
      const success = await updateUserPhotoOnServer(base64);
      
      if (success) {
        console.log('Photo mise à jour avec succès sur le serveur');
        Alert.alert('Succès', 'Votre photo de profil a été mise à jour localement et sur le serveur.');
      } else {
        console.warn('Échec de la mise à jour sur le serveur');
        Alert.alert(
          'Mise à jour partielle', 
          'Votre photo a été mise à jour localement, mais n\'a pas pu être synchronisée avec le serveur.',
          [
            { text: 'OK' },
            { 
              text: 'Réessayer', 
              onPress: () => updateUserPhotoOnServer(base64) 
            }
          ]
        );
      }
      console.log('===== FIN DE LA MISE À JOUR DE LA PHOTO UTILISATEUR =====');
    } catch (error) {
      console.error('===== ERREUR LORS DE LA MISE À JOUR DE LA PHOTO =====');
      console.error('Type d\'erreur:', error.name);
      console.error('Message d\'erreur:', error.message);
      console.error('Stack trace:', error.stack);
      console.error('===== FIN DE L\'ERREUR DE MISE À JOUR =====');
      Alert.alert('Erreur', 'Impossible de mettre à jour votre photo de profil.');
    }
  };

  // Fonction pour sélectionner une image avec logs améliorés (modifiée)
  const pickImage = async () => {
    console.log('===== DÉBUT DE LA SÉLECTION D\'IMAGE =====');
    try {
      console.log('Lancement du sélecteur d\'images...');
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5, // Qualité réduite pour diminuer la taille
        base64: false, // Ne pas demander directement le base64 pour éviter les problèmes de mémoire
      });
      
      console.log('Résultat de la sélection d\'image:', result.canceled ? 'Annulé' : 'Image sélectionnée');
      
      if (result.canceled) {
        console.log('Sélection d\'image annulée par l\'utilisateur');
        console.log('===== FIN DE LA SÉLECTION D\'IMAGE (ANNULÉE) =====');
        return;
      }
      
      if (result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        console.log('Image sélectionnée:', {
          uri: selectedImage.uri ? selectedImage.uri.substring(0, 50) + '...' : 'non disponible',
          width: selectedImage.width,
          height: selectedImage.height,
          fileSize: selectedImage.fileSize,
          type: selectedImage.type
        });
        
        // Compresser l'image avant de la convertir en base64
        const compressedUri = await compressImage(selectedImage.uri);
        
        // Convertir l'image compressée en base64
        if (compressedUri) {
          const base64 = await convertImageToBase64(compressedUri);
          if (base64) {
            console.log('Image traitée avec succès, taille finale en KB:', Math.round(base64.length / 1024));
            await updateUserPhoto(base64);
          } else {
            console.error('Échec de la conversion en base64');
            Alert.alert('Erreur', 'Impossible de traiter l\'image sélectionnée.');
          }
        } else {
          console.error('Échec de la compression de l\'image');
          Alert.alert('Erreur', 'Impossible de traiter l\'image sélectionnée.');
        }
      } else {
        console.error('Aucun asset dans le résultat de la sélection');
      }
      console.log('===== FIN DE LA SÉLECTION D\'IMAGE =====');
    } catch (error) {
      console.error('===== ERREUR LORS DE LA SÉLECTION DE L\'IMAGE =====');
      console.error('Type d\'erreur:', error.name);
      console.error('Message d\'erreur:', error.message);
      console.error('Stack trace:', error.stack);
      console.error('===== FIN DE L\'ERREUR DE SÉLECTION =====');
      Alert.alert('Erreur', 'Un problème est survenu lors de la sélection de l\'image.');
    }
  };

  // Fonction pour naviguer avec tous les paramètres utilisateur
  const navigateWithUserData = (pathname) => {
    console.log(`Navigation vers ${pathname} avec userId: ${userId}`);
    router.push({
      pathname: pathname,
      params: {
        userId: userId,
        firstName: firstName,
        phoneNumber: phoneNumber,
        photo: userPhoto,
        email: userEmail
      }
    });
  };

  // Fonction pour revenir à la page d'accueil
  const goBack = () => {
    navigateWithUserData('/home');
  };

  // Configuration des éléments de navigation
  const navItems = [
    {
      id: "home",
      icon: "home",
      name: "Accueil",
      color: "#666",
      Component: MaterialCommunityIcons,
    },
    {
      id: "heart",
      icon: "heart",
      name: "Mes envies",
      color: "#666",
      Component: Feather,
    },
    {
      id: "calendar",
      icon: "calendar",
      name: "Plans",
      color: "#666",
      Component: Feather,
    },
    {
      id: "user",
      icon: "user",
      name: "Profil",
      color: "#4CAF50",  // Actif par défaut sur la page de profil
      Component: Feather,
    },
  ];

  // Fonction de déconnexion
  const handleLogout = async () => {
    try {
      // Supprimer toutes les données de l'utilisateur de AsyncStorage
      await AsyncStorage.multiRemove([
        'authToken',
        'userId',
        'firstName',
        'phoneNumber',
        'userPhoto',
        'userEmail'
      ]);
      
      // Rediriger vers la page de connexion
      router.push('/');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
      
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Ionicons name="chevron-back" size={24} color="#999" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Mon Profil</Text>
        <View style={styles.placeholderSpace} />
      </View>

      {/* Content ScrollView avec padding bas pour la navbar */}
      <View style={styles.contentContainer}>
        {/* Profile Section avec possibilité de changer la photo */}
        <View style={styles.profileSection}>
          <TouchableOpacity 
            style={styles.avatarContainer} 
            onPress={pickImage}
            activeOpacity={0.7}
            disabled={isUploading}
          >
            {userPhoto ? (
              <Image
                source={{ uri: `data:image/jpeg;base64,${userPhoto}` }}
                style={styles.avatar}
              />
            ) : (
              <Image
                source={require('../../assets/images/b.png')}
                style={styles.avatar}
              />
            )}
            <View style={styles.verifiedBadge}>
              <Feather name={isUploading ? "upload" : "check"} size={18} color="#fff" />
            </View>
            {isUploading && (
              <View style={styles.uploadingOverlay}>
                <Text style={styles.uploadingText}>Envoi...</Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.profileName}>{firstName || 'Utilisateur'}</Text>
          <Text style={styles.profileId}>{phoneNumber || 'Numéro non disponible'}</Text>
          {userEmail && <Text style={styles.profileEmail}>{userEmail}</Text>}
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {/* Informations Personnelles - Navigation vers gyma */}
          <TouchableOpacity style={styles.menuItem} onPress={() => navigateWithUserData('/Gyma')}>
            <View style={styles.menuIconContainer}>
              <Feather name="user" size={22} color="#777" />
            </View>
            <Text style={styles.menuText}>Informations Personnelles</Text>
            <Feather name="chevron-right" size={20} color="#ccc" />
          </TouchableOpacity>

          {/* Modifier le numéro de téléphone - MISE À JOUR: navigation vers gymb */}
          <TouchableOpacity style={styles.menuItem} onPress={() => navigateWithUserData('/Gymb')}>
            <View style={styles.menuIconContainer}>
              <Feather name="phone" size={22} color="#777" />
            </View>
            <Text style={styles.menuText}>Modifier le numéro de téléphone</Text>
            <Feather name="chevron-right" size={20} color="#ccc" />
          </TouchableOpacity>

          {/* Centre d'aide - Navigation vers gymd */}
          <TouchableOpacity style={styles.menuItem} onPress={() => navigateWithUserData('/Gymd')}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="help-circle-outline" size={24} color="#777" />
            </View>
            <Text style={styles.menuText}>Centre d'aide</Text>
            <Feather name="chevron-right" size={20} color="#ccc" />
          </TouchableOpacity>

          {/* Politique de confidentialité */}
          <TouchableOpacity style={styles.menuItem} onPress={() => navigateWithUserData('/policies')}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="time-outline" size={24} color="#777" />
            </View>
            <Text style={styles.menuText}>Politique de confidentialité</Text>
            <Feather name="chevron-right" size={20} color="#ccc" />
          </TouchableOpacity>

          {/* Déconnexion */}
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <View style={styles.menuIconContainer}>
              <Feather name="log-out" size={22} color="#777" />
            </View>
            <Text style={styles.menuText}>Déconnexion</Text>
            <Feather name="chevron-right" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Navigation Bar - Positionnée plus haut */}
      
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    
  },
  contentContainer: {
    flex: 1,
    paddingBottom: 80, // Espace pour la barre de navigation
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerText: {
    fontSize: 18,
    fontWeight: '500',
  },
  placeholderSpace: {
    width: 40,
  },
  profileSection: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 8,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#1e88e5',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  profileId: {
    color: '#888',
    fontSize: 14,
    marginBottom: 4,
  },
  profileEmail: {
    color: '#888',
    fontSize: 14,
  },
  menuContainer: {
    backgroundColor: '#fff',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuIconContainer: {
    width: 24,
    marginRight: 16,
    alignItems: 'center',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  
  // Styles de navigation mis à jour avec position plus haute
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 15,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    position: "absolute",
    bottom: 30, // Positionné plus haut qu'avant (était à bottom: 0)
    left: 0,
    right: 0,
  },
  navItem: {
    alignItems: "center",
  },
  navText: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
  },
  activeNavText: {
    color: "#4CAF50",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(19, 19, 19, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProfileScreen;