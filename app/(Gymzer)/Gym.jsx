import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Alert, Platform } from 'react-native';
import { Feather, MaterialIcons, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

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
        
        // Priorité 1: Utiliser les données des paramètres de navigation si elles existent
        if (paramUserId) {
          console.log('ID utilisateur trouvé dans les paramètres:', paramUserId);
          setUserId(paramUserId);
        }
        
        if (paramFirstName) {
          console.log('FirstName trouvé dans les paramètres:', paramFirstName);
          setFirstName(paramFirstName);
        } else {
          // Essayer de récupérer le firstName depuis AsyncStorage
          const storedFirstName = await AsyncStorage.getItem('firstName');
          if (storedFirstName) {
            console.log('FirstName récupéré de AsyncStorage:', storedFirstName);
            setFirstName(storedFirstName);
          } else {
            console.warn('Aucun firstName trouvé');
          }
        }
        
        // Récupérer le numéro de téléphone
        if (paramPhoneNumber) {
          console.log('PhoneNumber trouvé dans les paramètres:', paramPhoneNumber);
          setPhoneNumber(paramPhoneNumber);
        } else {
          // Essayer de récupérer le phoneNumber depuis AsyncStorage
          const storedPhoneNumber = await AsyncStorage.getItem('phoneNumber');
          if (storedPhoneNumber) {
            console.log('PhoneNumber récupéré de AsyncStorage:', storedPhoneNumber);
            setPhoneNumber(storedPhoneNumber);
          } else {
            console.warn('Aucun phoneNumber trouvé');
          }
        }
        
        // Récupérer la photo
        if (paramPhoto) {
          console.log('Photo trouvée dans les paramètres');
          setUserPhoto(paramPhoto);
        } else {
          // Essayer de récupérer la photo depuis AsyncStorage
          const storedPhoto = await AsyncStorage.getItem('userPhoto');
          if (storedPhoto) {
            console.log('Photo récupérée de AsyncStorage');
            setUserPhoto(storedPhoto);
          } else {
            console.warn('Aucune photo trouvée');
          }
        }
        
        // Récupérer l'email
        if (paramEmail) {
          console.log('Email trouvé dans les paramètres:', paramEmail);
          setUserEmail(paramEmail);
        } else {
          // Essayer de récupérer l'email depuis AsyncStorage
          const storedEmail = await AsyncStorage.getItem('userEmail');
          if (storedEmail) {
            console.log('Email récupéré de AsyncStorage:', storedEmail);
            setUserEmail(storedEmail);
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
          } else {
            console.warn('Aucun ID utilisateur trouvé');
          }
        }
        
        // Vérification finale des données
        setTimeout(() => {
          console.log('=== VÉRIFICATION FINALE DES DONNÉES UTILISATEUR ===');
          console.log('userId:', userId || 'non défini');
          console.log('firstName:', firstName || 'non défini');
          console.log('phoneNumber:', phoneNumber || 'non défini');
          console.log('userPhoto:', userPhoto ? 'présente' : 'non définie');
          console.log('userEmail:', userEmail || 'non défini');
        }, 500);
        
      } catch (error) {
        console.error('Erreur lors de la récupération des données utilisateur:', error);
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

  // Fonction pour sélectionner une image de la galerie
  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });
      
      console.log('Résultat de la sélection d\'image:', result.canceled ? 'Annulé' : 'Image sélectionnée');

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        
        // Vérifier si la base64 est disponible directement
        if (selectedImage.base64) {
          console.log('Image en base64 récupérée directement');
          await updateUserPhoto(selectedImage.base64);
        } 
        // Sinon, convertir le fichier en base64
        else if (selectedImage.uri) {
          console.log('Conversion de l\'image en base64');
          const base64 = await convertImageToBase64(selectedImage.uri);
          if (base64) {
            await updateUserPhoto(base64);
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la sélection de l\'image:', error);
      Alert.alert('Erreur', 'Un problème est survenu lors de la sélection de l\'image.');
    }
  };

  // Fonction pour convertir une image en base64
  const convertImageToBase64 = async (uri) => {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    } catch (error) {
      console.error('Erreur lors de la conversion de l\'image en base64:', error);
      return null;
    }
  };

  // Fonction pour mettre à jour la photo de l'utilisateur
  const updateUserPhoto = async (base64) => {
    try {
      // Mettre à jour l'état local
      setUserPhoto(base64);
      
      // Sauvegarder dans AsyncStorage
      await AsyncStorage.setItem('userPhoto', base64);
      console.log('Photo de profil mise à jour dans AsyncStorage');
      
      // Ici, vous pourriez ajouter une requête API pour mettre à jour la photo côté serveur
      // par exemple: await updateUserPhotoOnServer(userId, base64);
      
      Alert.alert('Succès', 'Votre photo de profil a été mise à jour.');
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la photo:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour votre photo de profil.');
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
              <Feather name="check" size={18} color="#fff" />
            </View>
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
      <View style={styles.bottomNav}>
        {navItems.map((item, index) => (
          <TouchableOpacity
            key={`nav-${item.id}-${index}`}
            style={styles.navItem}
            onPress={() => {
              if (item.id === 'home') {
                navigateWithUserData('/home');
              } else if (item.id === 'user') {
                // Déjà sur la page profil, ne rien faire
              } else if (item.id === 'calendar') {
                navigateWithUserData('/(event)');
              } else if (item.id === 'heart') {
                navigateWithUserData('/favorites');
              }
            }}
          >
            <item.Component name={item.icon} size={24} color={item.color} />
            <Text
              style={[
                styles.navText,
                item.color === "#4CAF50" && styles.activeNavText,
              ]}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
});

export default ProfileScreen;