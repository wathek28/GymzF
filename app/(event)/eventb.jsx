import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';

const EventBScreen = () => {
  // Récupérer les paramètres avec Expo Router
  const params = useLocalSearchParams();
  
  // Extraire les paramètres
  const userId = params?.userId;
  const eventId = params?.eventId;
  
  // Analyser les données de l'événement
  let eventData = {};
  try {
    eventData = params?.eventData ? JSON.parse(params.eventData) : {};
  } catch (error) {
    console.error('Error parsing eventData:', error);
  }
  
  // État pour l'acceptation du règlement
  const [reglementAccepte, setReglementAccepte] = useState(false);
  
  // Journal des paramètres pour débogage
  useEffect(() => {
    console.log('EventBScreen - userId récupéré:', userId);
    console.log('EventBScreen - eventId récupéré:', eventId);
    console.log('EventBScreen - eventData complet:', eventData);
    
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
  
  const handleConfirmParticipation = () => {
    // Vérifier si le règlement est accepté
    if (!reglementAccepte) {
      Alert.alert(
        "Règlement non accepté",
        "Veuillez accepter le règlement de l'événement pour continuer.",
        [{ text: "OK", style: "default" }]
      );
      return;
    }
    
    console.log('Confirmation de participation - userId:', userId, 'eventId:', eventId);
    console.log('Règlement accepté:', reglementAccepte);
    
    // Vérification des IDs avant la navigation
    if (!userId) {
      console.warn('Navigation vers eventc avec userId manquant');
    }
    if (!eventId) {
      console.warn('Navigation vers eventc avec eventId manquant');
    }
    
    // Naviguer vers eventc avec router.push
    router.push({
      pathname: "/(event)/eventc",
      params: { 
        userId: userId,
        eventId: eventId,
        eventData: params.eventData,
        reglementAccepte: reglementAccepte.toString() // Convertir le booléen en chaîne
      }
    });
    
    // Journal après navigation
    console.log('Navigation vers eventc effectuée avec les paramètres:', {
      userId, 
      eventId, 
      eventDataId: eventData?.id,
      reglementAccepte
    });
  };

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
            eventData.photo
              ? { uri: `data:image/jpeg;base64,${eventData.photo}` }
              : require("../../assets/images/F.png")
          }
          style={styles.image}
        />
        
        <View style={styles.content}>
          <Text style={styles.title}>{eventData.titre || 'Événement'}</Text>
          
          {/* Affichage des IDs (à des fins de débogage) */}
          <View style={styles.debugSection}>
            <Text style={styles.debugText}>User ID: {userId || 'Non disponible'}</Text>
            <Text style={styles.debugText}>Event ID: {eventId || 'Non disponible'}</Text>
          </View>
          
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar" size={24} color="#666" />
              <Text style={styles.infoText}>{getFormattedDate(eventData.date)}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="time" size={24} color="#666" />
              <Text style={styles.infoText}>
                {eventData.heureDebut?.slice(0, 5)} - {eventData.heureFin?.slice(0, 5)}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="location" size={24} color="#666" />
              <Text style={styles.infoText}>{eventData.adresse || 'Adresse non spécifiée'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="pricetag" size={24} color="#666" />
              <Text style={[styles.infoText, eventData.prix === 'Gratuit' && styles.freePrice]}>
                {typeof eventData.prix === 'number'
                  ? `${eventData.prix.toFixed(2)} DT / Pers`
                  : eventData.prix || 'Prix non spécifié'}
              </Text>
            </View>
          </View>

          {/* Section règlement */}
          <View style={styles.reglementSection}>
            <Text style={styles.reglementTitle}>Règlement de l'événement</Text>
            <Text style={styles.reglementText}>
              En participant à cet événement, vous acceptez les conditions suivantes:
            </Text>
            <Text style={styles.reglementPoint}>• Être ponctuel et respecter les horaires indiqués</Text>
            <Text style={styles.reglementPoint}>• Respecter les autres participants et le lieu de l'événement</Text>
            <Text style={styles.reglementPoint}>• Suivre les instructions des organisateurs pendant l'événement</Text>
            <Text style={styles.reglementPoint}>• Tout comportement inapproprié pourra entraîner une exclusion</Text>
            
            <View style={styles.reglementAcceptContainer}>
              <Switch
                value={reglementAccepte}
                onValueChange={setReglementAccepte}
                trackColor={{ false: '#767577', true: '#CBFF06' }}
                thumbColor={reglementAccepte ? '#fff' : '#f4f3f4'}
              />
              <Text style={styles.reglementAcceptText}>
                J'accepte le règlement de l'événement
              </Text>
            </View>
          </View>

          <TouchableOpacity 
            style={[
              styles.confirmButton,
              !reglementAccepte && styles.confirmButtonDisabled
            ]} 
            onPress={handleConfirmParticipation}
          >
            <Text style={styles.confirmButtonText}>Confirmer la participation</Text>
          </TouchableOpacity>

          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionTitle}>Description</Text>
            <Text style={styles.description}>
              {eventData.description || "Aucune description disponible"}
            </Text>
          </View>
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
  reglementSection: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  reglementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  reglementText: {
    fontSize: 14,
    marginBottom: 10,
    color: '#333',
  },
  reglementPoint: {
    fontSize: 14,
    marginBottom: 5,
    color: '#333',
    paddingLeft: 5,
  },
  reglementAcceptContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },
  reglementAcceptText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '600',
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
  },
  confirmButton: {
    backgroundColor: '#CBFF06',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  confirmButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  confirmButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EventBScreen;