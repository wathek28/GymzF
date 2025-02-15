import React, { useEffect, useState } from "react";
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
} from "react-native";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import * as Location from "expo-location";
import { Modal } from "react-native";
import { useNavigation } from "@react-navigation/native";

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
  // États
  const [searchText, setSearchText] = useState("");
  const [offers2, setOffers] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [gyms, setGyms] = useState([]);
  const [events, setEvents] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  

  // Effet pour charger les données
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [offersRes, coachesRes, gymsRes, eventsRes] = await Promise.all([
        fetch("http://192.168.0.5:8082/api/offres"),
        fetch("http://192.168.0.5:8082/api/auth/coaches"),
        fetch("http://192.168.0.5:8082/api/auth/gyms"),
        fetch("http://192.168.0.5:8082/api/events")
      ]);

      if (!offersRes.ok || !coachesRes.ok || !gymsRes.ok || !eventsRes.ok) {
        throw new Error("Erreur lors de la récupération des données");
      }

      const [offersData, coachesData, gymsData, eventsData] = await Promise.all([
        offersRes.json(),
        coachesRes.json(),
        gymsRes.json(),
        eventsRes.json()
      ]);

      const validGyms = gymsData.filter((gym) => gym && gym.role === "GYM");

      setOffers(offersData);
      setCoaches(coachesData);
      setGyms(validGyms);
      setEvents(eventsData);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Erreur:", err);
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Image source={require("../../assets/images/G.png")} />
              <View>
                <Text style={styles.headerText}>Hey</Text>
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
            {offers2.map((offer, index) => (
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
            ))}
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
        {/* Section Coachs */}{" "}
{/* Section Coachs */}
<View style={styles.section}>
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>Coachs</Text>
    <TouchableOpacity
      style={styles.seeMoreButton}
      onPress={() => navigation.navigate('(profil)')}
    >
      <Feather name="chevron-right" size={24} color="#666" />
    </TouchableOpacity>
  </View>

  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
    {isLoading ? (
      <Text>Chargement...</Text>
    ) : error ? (
      <Text>Erreur: {error}</Text>
    ) : filteredItems.coaches.length > 0 ? (
      filteredItems.coaches.map((coach, index) => (
        <TouchableOpacity key={`coach-${coach.id || index}`} style={styles.coachCard} onPress={() => navigation.navigate('(profil)/coachb', { coach })}>
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
      <Text>Aucun coach trouvé</Text>
    )}
  </ScrollView>
</View>


<View style={styles.section}>
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>Gym</Text>
    <TouchableOpacity style={styles.seeMoreButton}>
      <Feather name="chevron-right" size={24} color="#666" />
    </TouchableOpacity>
  </View>

  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
    {isLoading ? (
      <Text>Chargement...</Text>
    ) : error ? (
      <Text>Erreur: {error}</Text>
    ) : filteredItems.gyms.length > 0 ? (
      filteredItems.gyms.map((gym, index) => (
        <TouchableOpacity key={`gym-${gym.id || index}`} style={styles.gymCard}>
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
      <Text>Aucun gym trouvé</Text>
    )}
  </ScrollView>
</View>

        {/* Événements */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Événements</Text>
            <TouchableOpacity
      style={styles.seeMoreButton}
      onPress={() => navigation.navigate('(event)')}
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
                <TouchableOpacity key={event.id} style={styles.container1}>
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
        <TouchableOpacity style={styles.participateButton1}>
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
  eventCard: {
    width: 200,
    marginRight: 15,
    backgroundColor: "white",
    borderRadius: 15,
    overflow: "hidden",
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
