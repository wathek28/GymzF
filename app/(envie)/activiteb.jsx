import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';

const EventScreen = () => {
  // Use Expo Router's useLocalSearchParams instead of useRoute
  const params = useLocalSearchParams();
  
  // Extract parameters 
  const userId = params?.userId;
  const eventId = params?.eventId;
  
  // État pour stocker les données complètes de l'événement
  const [fullEventData, setFullEventData] = useState(null);
  // État spécifique pour le reglement
  const [reglement, setReglement] = useState(null);
  
  // Parse the stringified eventData back to an object
  let eventData = {};
  try {
    eventData = params?.eventData ? JSON.parse(params.eventData) : {};
  } catch (error) {
    console.error('Error parsing eventData:', error);
  }
  
  // Récupérer les données complètes de l'événement depuis l'API
  useEffect(() => {
    const fetchEventData = async () => {
      if (eventId) {
        try {
          const response = await fetch(`http://192.168.0.3:8082/api/events/${eventId}`);
          if (response.ok) {
            const data = await response.json();
            setFullEventData(data);
            
            // Extraire et stocker le reglement séparément
            if (data && data.reglement) {
              setReglement(data.reglement);
              console.log('EventScreen - Reglement récupéré depuis l\'API:', data.reglement);
            } else {
              console.warn('EventScreen - Reglement non disponible dans les données API');
            }
          }
        } catch (error) {
          console.error('Erreur lors de la récupération des données de l\'événement:', error);
        }
      }
    };
    
    fetchEventData();
  }, [eventId]);
  
  // Log parameters for debugging
  useEffect(() => {
    console.log('EventScreen - userId récupéré:', userId);
    console.log('EventScreen - eventId récupéré:', eventId);
    console.log('EventScreen - eventData initial:', eventData);
    
    // Vérification des IDs
    if (!userId) {
      console.warn('Attention: userId est manquant ou null');
    }
    
    if (!eventId) {
      console.warn('Attention: eventId est manquant ou null');
    }
  }, [userId, eventId, eventData]);

  const getFormattedDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Utiliser les données complètes si disponibles, sinon utiliser les données initiales
  const displayEventData = fullEventData || eventData;

  return (
    <View style={styles.mainContainer}>
        
      <TouchableOpacity 
        onPress={() => router.back()}
        style={styles.backButton}
      >
        <Ionicons name="chevron-back" size={24} color="#000" />
      </TouchableOpacity>

      <ScrollView style={styles.container}>
        <Image
          source={
            displayEventData.photo
              ? { uri: `data:image/jpeg;base64,${displayEventData.photo}` }
              : require("../../assets/images/F.png")
          }
          style={styles.image}
        />
        
        <View style={styles.content}>
          <Text style={styles.title}>{displayEventData.titre || 'Événement'}</Text>
          
          {/* Affichage des IDs et reglement (à des fins de débogage) - Peut être supprimé en production */}
          <View style={styles.debugSection}>
            <Text style={styles.debugText}>User ID: {userId || 'Non disponible'}</Text>
            <Text style={styles.debugText}>Event ID: {eventId || 'Non disponible'}</Text>
            <Text style={styles.debugText}>Reglement présent: {reglement ? 'Oui' : 'Non'}</Text>
          </View>
          
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar" size={24} color="#333" />
              <Text style={styles.infoText}>{getFormattedDate(displayEventData.date)}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="time" size={24} color="#333" />
              <Text style={styles.infoText}>
                {displayEventData.heureDebut?.slice(0, 5)} - {displayEventData.heureFin?.slice(0, 5)}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="location" size={24} color="#333" />
              <Text style={styles.infoText}>{displayEventData.adresse || 'Adresse non spécifiée'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="pricetag" size={24} color="#333" />
              <Text style={[styles.infoText, displayEventData.prix === 'Gratuit' && styles.freePrice]}>
                {typeof displayEventData.prix === 'number'
                  ? `${displayEventData.prix.toFixed(2)} DT / Pers`
                  : displayEventData.prix || 'Prix non spécifié'}
              </Text>
            </View>
          </View>

          {/* Badge "Déjà réservé" */}
          <View style={styles.reservedBadge}>
            <Ionicons name="checkmark-circle" size={20} color="#333" />
            <Text style={styles.reservedText}>Événement déjà réservé</Text>
          </View>

          {/* Description de l'événement */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>
              {displayEventData.description || "Aucune description disponible"}
            </Text>
          </View>

          {/* Règlement de l'événement */}
          {reglement && (
            <View style={styles.reglementContainer}>
              <Text style={styles.sectionTitle}>Règlement</Text>
              <Text style={styles.reglementText}>{reglement}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 1,
    backgroundColor: '#C0C0C0',
    borderRadius: 20,
    padding: 8,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  image: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
    borderRadius: 20,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  debugSection: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
  },
  infoSection: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoText: {
    marginLeft: 10,
    fontSize: 16,
  },
  freePrice: {
    color: 'green',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  descriptionContainer: {
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  reglementContainer: {
    marginBottom: 30,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#CBFF06',
  },
  reglementText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
  },
  reservedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CBFF06',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 20,
    justifyContent: 'center',
  },
  reservedText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  }
});

export default EventScreen;