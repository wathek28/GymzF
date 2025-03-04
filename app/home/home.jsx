import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  TextInput,
  Linking,
  Platform,
  Alert,
  ImageBackground,
  ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import * as Location from "expo-location";
import { Modal } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from 'expo-router';

const { width } = Dimensions.get("window");

const navItems = [
  {
    id: "home",
    icon: "home",
    name: "Accueil",
    color: "#4CAF50",
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
    color: "#666",
    Component: Feather,
  },
];

const FitnessApp = () => {
  const navigation = useNavigation();
  
  // Récupération des paramètres de navigation
  const params = useLocalSearchParams();
  const { 
    userId: paramUserId, 
    firstName: paramFirstName,
    phoneNumber: paramPhoneNumber,
    photo: paramPhoto,
    email: paramEmail
  } = params;
  
  // États
  const [searchText, setSearchText] = useState("");
  const [offers2, setOffers] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [gyms, setGyms] = useState([]);
  const [events, setEvents] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eventsError, setEventsError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [userPhoto, setUserPhoto] = useState("");
  const [userEmail, setUserEmail] = useState("");

  // Fonction pour récupérer les événements
  const fetchEvents = async () => {
    try {
      console.log('Fetching events from API...');
      setEventsLoading(true);
      setEventsError(null);
      
      const eventsRes = await fetch("http://192.168.0.7:8082/api/events", {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log('Events Response Status:', eventsRes.status);
      
      if (!eventsRes.ok) {
        const errorText = await eventsRes.text();
        console.error('Events Fetch Error:', errorText);
        throw new Error(`Failed to fetch events: ${errorText}`);
      }

      const eventsData = await eventsRes.json();
      console.log('Raw Events Data:', JSON.stringify(eventsData, null, 2));
      
      if (!Array.isArray(eventsData)) {
        console.error('Events data is not an array:', typeof eventsData);
        throw new Error('Events data format is invalid');
      }

      const validEvents = eventsData.filter(event => {
        const isValid = event && 
          typeof event === 'object' &&
          event.titre && 
          event.date;
        
        if (!isValid) {
          console.warn('Skipping invalid event:', event);
        }
        
        return isValid;
      });

      console.log('Valid Events Count:', validEvents.length);
      setEvents(validEvents);
    } catch (error) {
      console.error('Events Fetch Error:', error);
      setEventsError(error.message);
    } finally {
      setEventsLoading(false);
    }
  };

  // Récupérer les données utilisateur à chaque fois que le composant est monté ou reçoit le focus
  useFocusEffect(
    useCallback(() => {
      const getUserData = async () => {
        try {
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
        } catch (error) {
          console.error('Erreur lors de la récupération des données utilisateur:', error);
        }
      };
      
      getUserData();
    }, [paramUserId, paramFirstName, paramPhoneNumber, paramPhoto, paramEmail])
  );

  // Effet pour charger les données
  useEffect(() => {
    if (userId) {
      console.log('Chargement des données avec userId:', userId);
      fetchAllData();
      fetchEvents(); // Charger les événements séparément
    }
  }, [userId]);

  // Fonction modifiée pour éviter les problèmes de parsing JSON
  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      console.log('Début des requêtes API avec userId:', userId);
      
      // Effectuer les requêtes séparément pour mieux gérer les erreurs
      try {
        const offersRes = await fetch("http://192.168.0.7:8082/api/offres");
        if (offersRes.ok) {
          const offersData = await offersRes.json();
          setOffers(offersData);
        } else {
          console.log('Erreur lors de la récupération des offres');
        }
      } catch (err) {
        console.error("Erreur offres:", err.message);
      }
      
      try {
        const coachesRes = await fetch("http://192.168.0.7:8082/api/auth/coaches");
        if (coachesRes.ok) {
          const coachesData = await coachesRes.json();
          setCoaches(coachesData);
        } else {
          console.log('Erreur lors de la récupération des coaches');
        }
      } catch (err) {
        console.error("Erreur coaches:", err.message);
      }
      
      try {
        const gymsRes = await fetch("http://192.168.0.7:8082/api/auth/gyms");
        if (gymsRes.ok) {
          const gymsData = await gymsRes.json();
          const validGyms = gymsData.filter((gym) => gym && gym.role === "GYM");
          setGyms(validGyms);
        } else {
          console.log('Erreur lors de la récupération des gyms');
        }
      } catch (err) {
        console.error("Erreur gyms:", err.message);
      }
      
      setError(null);
      console.log('Données chargées avec succès');
    } catch (err) {
      setError(err.message);
      console.error("Erreur générale:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const openMapsWithNearbyGyms = async () => {
    try {
      let { status: existingStatus } =
        await Location.getForegroundPermissionsAsync();

      if (existingStatus !== "granted") {
        const { status: newStatus } =
          await Location.requestForegroundPermissionsAsync();

        if (newStatus !== "granted") {
          Alert.alert(
            "Permission requise",
            "Pour trouver les salles près de chez vous, l'application a besoin d'accéder à votre position.",
            [
              {
                text: "Ouvrir les paramètres",
                onPress: () =>
                  Platform.OS === "ios"
                    ? Linking.openURL("app-settings:")
                    : Linking.openSettings(),
              },
              { text: "Annuler", style: "cancel" },
            ]
          );
          return;
        }
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      const query = encodeURIComponent("salles de sport");
      const mapsUrl =
        Platform.OS === "android"
          ? `geo:${latitude},${longitude}?q=${query}`
          : `maps://search?q=${query}&near=${latitude},${longitude}`;

      const canOpenMaps = await Linking.canOpenURL(mapsUrl);
      if (canOpenMaps) {
        await Linking.openURL(mapsUrl);
      } else {
        await Linking.openURL(
          `https://www.google.com/maps/search/${query}/@${latitude},${longitude},15z`
        );
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible d'accéder à votre position");
    }
  };

  // Filtrage
  const filteredItems = {
    gyms: gyms.filter((gym) =>
      gym.firstName?.toLowerCase().includes(searchText.toLowerCase())
    ),
    coaches: coaches.filter((coach) =>
      coach.firstName?.toLowerCase().includes(searchText.toLowerCase())
    ),
  };

  // Fonction pour naviguer avec toutes les données utilisateur
  const navigateWithUserData = (routeName, additionalParams = {}) => {
    console.log(`Navigation vers ${routeName} avec userId: ${userId}, firstName: ${firstName}, email: ${userEmail}`);
    
    // Utiliser uniquement les données de base pour éviter les problèmes de sérialisation
    const baseParams = { 
      userId: userId,
      firstName: firstName,
      phoneNumber: phoneNumber,
      photo: userPhoto,
      email: userEmail
    };
    
    // Si additionalParams contient des objets complexes, extraire seulement les ID ou informations simples
    let safeParams = { ...baseParams };
    
    // Pour gérer les objets complexes comme gym ou event
    if (additionalParams.gym) {
      safeParams.gymId = additionalParams.gym.id;
    }
    
    if (additionalParams.event) {
      safeParams.eventId = additionalParams.event.id;
    }
    
    // Ajouter d'autres paramètres simples
    Object.keys(additionalParams).forEach(key => {
      if (key !== 'gym' && key !== 'event' && typeof additionalParams[key] !== 'object') {
        safeParams[key] = additionalParams[key];
      }
    });
    
    navigation.navigate(routeName, safeParams);
  };
  
  // Fonction pour naviguer vers la page coachd avec les paramètres utilisateur
  const navigateToCoachd = () => {
    console.log('Navigation vers coachd avec:', {
      userId: userId,
      firstName: firstName,
      phoneNumber: phoneNumber,
      email: userEmail
    });
    
    router.push({
      pathname: "/(profil)/Coachd",
      params: {
        userId: userId,
        firstName: firstName,
        phoneNumber: phoneNumber,
        photo: userPhoto,
        email: userEmail
      }
    });
  };

  // Fonction pour rafraîchir les événements
  const refreshEvents = () => {
    setEventsError(null);
    fetchEvents();
  };

  // Formatage de la date pour les événements
  const formatEventDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return { day: "N/A", month: "N/A" };
      }
      
      const day = date.getDate();
      const month = date.toLocaleString('fr-FR', {month: 'short'});
      return { day, month };
    } catch (error) {
      console.error('Error formatting date:', error);
      return { day: "N/A", month: "N/A" };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header avec le firstName et potentiellement une photo */}
        <View style={styles.headerContainer}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              
            <Image source={require("../../assets/images/G.png")} />
              <View>
                <Text style={styles.headerText}>Hey {firstName || 'utilisateur'}</Text>
                <Text style={styles.subHeaderText}>Que cherchez-vous?</Text>
              </View>
            </View>
            <TouchableOpacity>
              <Ionicons name="notifications-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Feather name="search" size={20} color="#666" />
              <TextInput
                style={styles.searchInput}
                placeholder="Que cherchez-vous?"
                placeholderTextColor="#666"
                value={searchText}
                onChangeText={setSearchText}
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={() => setSearchText("")}>
                  <Feather name="x" size={20} color="#666" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={styles.locationBar}
              onPress={openMapsWithNearbyGyms}
            >
              <Feather name="map-pin" size={20} color="#CCFF00" />
              <Text style={styles.locationText}>Salle proche de moi</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Offres Spéciales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Offres Spéciales</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.offersScroll3}
          >
            {offers2.length > 0 ? (
              offers2.map((offer, index) => (
                <TouchableOpacity
                  key={`offer-${offer.id || index}`}
                  style={styles.container3}
                >
                  <View style={styles.header3}>
                    <View style={styles.logoContainer3}>
                      <Text style={styles.brandName3}>{offer.titre}</Text>
                    </View>
                    <View style={styles.discountBadge3}>
                      <Text style={styles.discountText3}>
                        {offer.pourcentageReduction
                          ? `${offer.pourcentageReduction}%`
                          : "0%"}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.description3}>{offer.description}</Text>

                  <TouchableOpacity
                    style={styles.button3}
                    onPress={() => {
                      setSelectedOffer(offer);
                      setModalVisible(true);
                    }}
                  >
                    <Text style={styles.buttonText3}>Profiter</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>Aucune offre disponible</Text>
              </View>
            )}
          </ScrollView>

          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalContainer3}>
              <View style={styles.modalContent3}>
                <Text style={styles.modalTitle3}>Votre code promo</Text>
                <Text style={styles.promoCode3}>
                  {selectedOffer?.codePromo}
                </Text>
                <Text style={styles.modalDescription3}>
                  Utilisez ce code lors de votre inscription pour bénéficier de{" "}
                  {selectedOffer?.pourcentageReduction}% de réduction
                </Text>
                <TouchableOpacity
                  style={styles.closeButton3}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.closeButtonText3}>Fermer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
        
        {/* Section Coachs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Coachs</Text>
            <TouchableOpacity
              style={styles.seeMoreButton}
              onPress={() => {
                if (!userId) {
                  console.warn('ID utilisateur manquant pour la navigation');
                  return;
                }
                
                console.log('Navigation vers profil avec userId:', userId);
                
                // Utiliser router.push d'expo-router avec toutes les données utilisateur
                router.push({
                  pathname: "/(profil)/Coacha",
                  params: { 
                    userId: userId,
                    firstName: firstName,
                    phoneNumber: phoneNumber,
                    photo: userPhoto,
                    email: userEmail
                  }
                });
              }}
            >
              <Feather name="chevron-right" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingText}>Chargement des coachs...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Erreur: {error}</Text>
                <TouchableOpacity style={styles.refreshButton} onPress={fetchAllData}>
                  <Text style={styles.refreshButtonText}>Réessayer</Text>
                </TouchableOpacity>
              </View>
            ) : filteredItems.coaches.length > 0 ? (
              filteredItems.coaches.map((coach, index) => (
                <TouchableOpacity 
                  key={`coach-${coach.id || index}`} 
                  style={styles.coachCard} 
                  onPress={() => {
                    if (!userId) {
                      console.warn('ID utilisateur manquant pour la navigation');
                      return;
                    }
                    
                    console.log(`Navigation vers coach detail avec userId: ${userId}, coachId: ${coach.id}`);
                    
                    // Extraire seulement les propriétés nécessaires pour éviter les problèmes de sérialisation
                    router.push({
                      pathname: "/(profil)/Coachb",
                      params: { 
                        userId: userId,
                        firstName: firstName,
                        phoneNumber: phoneNumber,
                        photo: userPhoto,
                        email: userEmail,
                        coachId: coach.id,
                        coachFirstName: coach.firstName,
                        coachEmail: coach.email,
                        coachPhone: coach.phoneNumber,
                        coachPoste: coach.poste
                      }
                    });
                  }}
                >
                  <Image
                    source={coach.photo ? { uri: `data:image/jpeg;base64,${coach.photo}` } : require("../../assets/images/F.png")}
                    style={styles.coachImage}
                  />
                  <View style={styles.coachInfo}>
                    <Text style={styles.coachName}>{coach.firstName || "Nom non disponible"}</Text>
                    <Text style={styles.coachSpecialty}>{coach.poste || "Email non disponible"}</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>Aucun coach trouvé</Text>
              </View>
            )}
          </ScrollView>
          
          {/* Bouton pour naviguer vers Coachd avec les paramètres utilisateur */}
          <TouchableOpacity 
            style={styles.coachDButton}
            onPress={navigateToCoachd}
          >
            <Text style={styles.coachDButtonText}>Voir tous les coachs</Text>
          </TouchableOpacity>
        </View>

        {/* Section Gym */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Gym</Text>
            <TouchableOpacity 
              style={styles.seeMoreButton}
              onPress={() => navigateWithUserData('(gym)')}
            >
              <Feather name="chevron-right" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingText}>Chargement des gyms...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Erreur: {error}</Text>
                <TouchableOpacity style={styles.refreshButton} onPress={fetchAllData}>
                  <Text style={styles.refreshButtonText}>Réessayer</Text>
                </TouchableOpacity>
              </View>
            ) : filteredItems.gyms.length > 0 ? (
              filteredItems.gyms.map((gym, index) => (
                <TouchableOpacity 
                  key={`gym-${gym.id || index}`} 
                  style={styles.gymCard}
                  onPress={() => {
                    // Envoyer uniquement l'ID du gym plutôt que l'objet entier
                    navigateWithUserData('(gym)/detail', { gymId: gym.id });
                  }}
                >
                  <Image
                    source={gym.photo ? { uri: `data:image/jpeg;base64,${gym.photo}` } : require("../../assets/images/F.png")}
                    style={styles.gymImage}
                  />
                  <View style={styles.gymInfo}>
                    <Text style={styles.gymName}>{gym.firstName || "Nom non disponible"}</Text>
                    <Text style={styles.gymLocation}>{gym.email || "Email non disponible"}</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>Aucun gym trouvé</Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Événements - Section corrigée */}
{/* Événements */}
<View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Événements</Text>
            <TouchableOpacity
              style={styles.seeMoreButton}
              onPress={() => navigateWithUserData('(event)')}
            >
              <Feather name="chevron-right" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
          >
            {isLoading ? (
              <Text>Chargement...</Text>
            ) : error ? (
              <Text>Erreur: {error}</Text>
            ) : events.length > 0 ? (
              events.map((event) => (
                <TouchableOpacity 
                  key={event.id} 
                  style={styles.container1}
                  onPress={() => navigateWithUserData('(event)/eventb', { event })}
                >
                  <ImageBackground
                    source={
                      event.photo
                        ? { uri: `data:image/jpeg;base64,${event.photo}` }
                        : require("../../assets/images/F.png")
                    }
                    style={styles.backgroundImage1}
                    imageStyle={styles.backgroundImageStyle1}
                  >
                    <View style={styles.overlay1}>
                      <View style={styles.header1}>
                        <View style={styles.dateContainer1}>
                          <Text style={styles.dateNumber1}>
                            {new Date(event.date).getDate()}
                          </Text>
                          <Text style={styles.dateMonth1}>
                            {new Date(event.date)
                              .toLocaleString("default", { month: "short" })
                              .toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.content1}>
                        <Text style={styles.title1}>{event.titre}</Text>
                        <Text style={styles.location1}>{event.adresse}</Text>
                        <Text style={styles.time1}>
                          {event.heureDebut.slice(0, 5)} - {event.heureFin.slice(0, 5)}
                        </Text>
                        <Text style={styles.price1}>
                          {event.prix.toFixed(2)} DT / Pers
                        </Text>
                        <TouchableOpacity 
  style={styles.participateButton1}
  onPress={() => {
    console.log(`Navigation vers eventb avec userId: ${userId}, eventId: ${event.id}`);
    
    // Use router.push from expo-router
    router.push({
      pathname: "/(event)/eventb",
      params: { 
        userId: userId,
        eventId: event.id,
        eventData: JSON.stringify(event)
      }
    });
  }}
>
  <Text style={styles.participateButtonText1}>Participer</Text>
</TouchableOpacity>
                      </View>
                    </View>
                  </ImageBackground>
                </TouchableOpacity>
              ))
            ) : (
              <Text>Aucun événement disponible</Text>
            )}
          </ScrollView>
        </View>

      </ScrollView>

      {/* Navigation */}
      <View style={styles.bottomNav}>
      {navItems.map((item, index) => (
        <TouchableOpacity
          key={`nav-${item.id}-${index}`}
          style={styles.navItem}
          onPress={() => {
            if (item.id === 'home') {
              // Rester sur la page actuelle ou rafraîchir
              console.log('Restez sur la page d\'accueil avec userId:', userId);
            } else if (item.id === 'user') {
              // Vérifier les données avant navigation
              console.log('=== NAVIGATION VERS GYM ===');
              console.log('userId à transmettre:', userId);
              console.log('firstName à transmettre:', firstName);
              console.log('phoneNumber à transmettre:', phoneNumber);
              console.log('photo à transmettre:', userPhoto ? `présente (longueur: ${userPhoto.length})` : 'non définie');
              console.log('email à transmettre:', userEmail || 'non défini');
              
              // Rediriger vers la page Gym avec toutes les données utilisateur, y compris l'email
              router.push({
                pathname: "/(Gymzer)/Gym",
                params: { 
                  userId: userId,
                  firstName: firstName,
                  phoneNumber: phoneNumber,
                  photo: userPhoto,
                  email: userEmail
                }
              });
            } else if (item.id === 'calendar') {
              navigateWithUserData('(event)');
            } else if (item.id === 'heart') {
              navigateWithUserData('favorites');
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
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
  },
  seeMoreButton: {
    padding: 5,
  },
  
  headerContainer: {
    backgroundColor: "#1a1a1a",
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  subHeaderText: {
    color: "#999",
    fontSize: 14,
  },
  searchContainer: {
    paddingHorizontal: 20,
    gap: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderColor: "black",
    borderWidth: 2,
  },
  locationBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderColor: "#CCFF00",
    borderWidth: 2,
    width: "100%",
    justifyContent: "center",
  },
  locationText: {
    color: "#CCFF00",
    fontSize: 14,
    textAlign: "center",
    marginLeft: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: "#000",
    paddingVertical: 8,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 15,
    color: "#000",
  },
  gymCard: {
    width: 200,
    marginRight: 15,
    backgroundColor: "white",
    borderRadius: 15,
    overflow: "hidden",
  },
  gymImage: {
    width: "100%",
    height: 120,
  },
  gymInfo: {
    padding: 10,
  },
  gymName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  gymLocation: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  coachCard: {
    width: 150,
    marginRight: 15,
    backgroundColor: "white",
    borderRadius: 15,
    overflow: "hidden",
  },
  coachImage: {
    width: "100%",
    height: 180,
  },
  coachInfo: {
    padding: 10,
  },
  coachName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  coachSpecialty: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
  },

  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 15,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  navItem: {
    alignItems: "center",
  },
  navText: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
  },

  offersScroll: {
    marginTop: 10,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "#111111",
    borderRadius: 30,
    padding: 20,
    width: 355, // Largeur de la carte
    marginRight: 5, // Espacement entre les cartes
    alignSelf: "center",
    position: "relative",
  },
  logo: {
    color: "#A0FF00",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  description: {
    color: "#FFFFFF",
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#A0FF00",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  buttonText: {
    color: "#111111",
    fontSize: 16,
    fontWeight: "bold",
  },
  eventCard: {
    width: 200,
    marginRight: 15,
    backgroundColor: "white",
    borderRadius: 15,
    overflow: "hidden",
  },
  eventImage: {
    width: "100%",
    height: 120,
  },
  eventInfo: {
    padding: 10,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  eventDate: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },

  ////offer
  offersScroll3: {
    flexGrow: 0,
  },
  container3: {
    backgroundColor: "#1E1E1E",
    padding: 20,
    borderRadius: 20,
    width: 360,
    height: 200,
    marginRight: 10,
  },
  header3: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 0,
  },
  logoContainer3: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandName3: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  discountBadge3: {
    borderRadius: 70,
    width: 55,
    height: 55,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3, // Ajout de l'épaisseur de la bordure
    borderColor: "#CCFF00",
    backgroundColor: "rgba(132, 204, 22, 0.1)",
  },
  discountText3: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  description3: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },

  button3: {
    backgroundColor: "#CBFF06",
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonText3: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "bold",
  },

  /////
  modalContainer3: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent3: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
  },
  modalTitle3: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  promoCode3: {
    fontSize: 24,
    color: "#84CC16",
    fontWeight: "bold",
    marginVertical: 10,
  },
  modalDescription3: {
    textAlign: "center",
    marginBottom: 20,
  },
  closeButton3: {
    backgroundColor: "#1E1E1E",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  closeButtonText3: {
    color: "white",
    fontWeight: "bold",
  },
  /////////// event //////

  container1: {
    height: 250,
    width:340,
    borderRadius: 15,
    overflow: 'hidden',
    margin: 2,
  },
  backgroundImage1: {
    flex: 1,
    resizeMode: 'cover',
  },
  backgroundImageStyle1: {
    borderRadius: 15,
  },
  overlay1: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 20,
  },
  header1: {
    // Alignement des éléments horizontalement
   // Espace entre les éléments, cela mettra la date à droite
   // Aligne verticalement les éléments
  width: '100%',
  },
  logoContainer1: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 8,
    borderRadius: 10,
  },
  logoText1: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dateContainer1: {
    justifyContent: 'center',
    alignItems: 'flex-end', 
  },
  dateNumber1: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#c5ff00',
  },
  dateMonth1: {
    fontSize: 16,
    color: '#c5ff00',
    fontWeight: 'bold',
  },
  content1: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  title1: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  location1: {
    fontSize: 16,
    color: 'white',
    marginBottom: 4,
  },
  time1: {
    fontSize: 16,
    color: 'white',
    marginBottom: 4,
  },
  price1: {
    fontSize: 16,
    color: 'white',
    marginBottom: -30,
  },
  participateButton1: {
    backgroundColor: '#c5ff00',
    padding: 12,
    borderRadius: 25,
    alignItems: 'center',
    width: '40%',
    alignSelf: 'flex-end',
  },
  participateButtonText1: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FitnessApp;