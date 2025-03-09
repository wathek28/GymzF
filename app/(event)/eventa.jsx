import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EventsScreen = () => {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedPriceType, setSelectedPriceType] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // D'abord récupérer l'ID utilisateur
    getUserId();
  }, []);
  
  // Effet séparé qui s'exécute quand userId change
  useEffect(() => {
    fetchEvents();
  }, [userId]);

  const getUserId = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('userId');
      console.log('ID utilisateur récupéré:', storedUserId);
      setUserId(storedUserId);
      return storedUserId; // Retourne l'ID pour utilisation immédiate si nécessaire
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'ID utilisateur:', error);
      return null;
    }
  };

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://192.168.0.3:8082/api/events');
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des événements");
      }
      const data = await response.json();
      console.log('Événements récupérés, utilisateur actuel ID:', userId);
      setEvents(data);
      setError(null);
    } catch (err) {
      console.error("Erreur:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEvents = events.filter((event) => {
    // Si un filtre de prix est sélectionné
    if (selectedPriceType === 'gratuit' && event.prix !== 'Gratuit') {
      return false;
    }
    if (selectedPriceType === 'payant' && event.prix === 'Gratuit') {
      return false;
    }
    // Filtre de recherche par titre
    return event.titre.toLowerCase().includes(search.toLowerCase());
  });

  const getFormattedDate = (dateString) => {
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      month: date.toLocaleString('default', { month: 'short' }).toUpperCase(),
    };
  };

  const navigateToEventB = (item) => {
    console.log('Navigation vers eventb avec userId:', userId, 'eventId:', item.id, 'reglement:', item.reglement);
    
    // Utiliser router.push de expo-router avec le paramètre reglement ajouté
    router.push({
      pathname: "/(event)/eventb",
      params: { 
        userId: userId,
        eventId: item.id,
        eventData: JSON.stringify(item), // Convertir l'objet en chaîne JSON
        reglement: item.reglement || '' // Ajout du paramètre reglement
      }
    });
  };

  const renderPriceFilters = () => (
    <View style={styles.filterSection}>
      <Text style={styles.filterTitle}>Prix</Text>
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[
            styles.optionButton,
            selectedPriceType === 'payant' && styles.optionButtonSelected
          ]}
          onPress={() => setSelectedPriceType(selectedPriceType === 'payant' ? null : 'payant')}
        >
          <Text style={[
            styles.optionText,
            selectedPriceType === 'payant' && styles.optionTextSelected
          ]}>Payant</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.optionButton,
            selectedPriceType === 'gratuit' && styles.optionButtonSelected
          ]}
          onPress={() => setSelectedPriceType(selectedPriceType === 'gratuit' ? null : 'gratuit')}
        >
          <Text style={[
            styles.optionText,
            selectedPriceType === 'gratuit' && styles.optionTextSelected
          ]}>Gratuit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#000" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchEvents}
        >
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Événements</Text>
        {userId && (
          <Text style={styles.userIdText}>User ID: {userId}</Text>
        )}
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Nom de l'événement"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
          placeholderTextColor="#666"
        />
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {renderPriceFilters()}

      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const { day, month } = getFormattedDate(item.date);
          return (
            <TouchableOpacity 
              style={styles.eventCard}
              onPress={() => navigateToEventB(item)}
            >
              <ImageBackground
                source={
                  item.photo
                    ? { uri: `data:image/jpeg;base64,${item.photo}` }
                    : require("../../assets/images/F.png")
                }
                style={styles.backgroundImage}
                imageStyle={styles.backgroundImageStyle}
              >
                <View style={styles.overlay}>
                  <View style={styles.header}>
                    <View style={styles.dateContainer}>
                      <Text style={styles.dateNumber}>{day}</Text>
                      <Text style={styles.dateMonth}>{month}</Text>
                    </View>
                  </View>
                  <View style={styles.content}>
                    <Text style={styles.eventTitle}>{item.titre}</Text>
                    <Text style={styles.eventLocation}>{item.adresse}</Text>
                    {item.heureDebut && item.heureFin && (
                      <Text style={styles.eventTime}>
                        {item.heureDebut.slice(0, 5)} - {item.heureFin.slice(0, 5)}
                      </Text>
                    )}
                    <Text
                      style={[
                        styles.eventPrice,
                        item.prix === 'Gratuit' && { color: 'green' },
                      ]}
                    >
                      {typeof item.prix === 'number'
                        ? item.prix.toFixed(2) + ' DT / Pers'
                        : item.prix}
                    </Text>
                    <TouchableOpacity
                      style={styles.participateButton}
                      onPress={() => navigateToEventB(item)}
                    >
                      <Text style={styles.participateButtonText}>Participer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ImageBackground>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucun événement trouvé</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  userIdText: {
    marginLeft: 'auto',
    fontSize: 12,
    color: '#666',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#CBFF06',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignSelf: 'center',
  },
  retryButtonText: {
    color: 'black',
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginHorizontal: 20,
  },
  searchInput: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderColor: '#DDD',
  },
  searchButton: {
    backgroundColor: 'black',
    padding: 10,
    borderRadius: 10,
    marginLeft: 15,
  },
  filterSection: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  optionButtonSelected: {
    backgroundColor: '#CBFF06',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
  },
  optionTextSelected: {
    color: 'black',
  },
  eventCard: {
    height: 200,
    width: 350,
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 20,
    marginLeft: 15,
  },
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  backgroundImageStyle: {
    borderRadius: 15,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 20,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  dateContainer: {
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    width: 50,
  },
  dateNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#c5ff00',
  },
  dateMonth: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#c5ff00',
  },
  content: {},
  eventTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: 'white',
    marginBottom: 5,
  },
  eventLocation: {
    color: 'white',
    marginBottom: 5,
  },
  eventTime: {
    color: 'white',
    marginBottom: 5,
  },
  eventPrice: {
    fontWeight: 'bold',
    marginBottom: 10,
    color: 'white',
  },
  participateButton: {
    backgroundColor: '#CBFF06',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
    position: 'absolute',
    top: 60,
    right: 10,
  },
  participateButtonText: {
    textAlign: 'center',
    color: 'black',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

export default EventsScreen;