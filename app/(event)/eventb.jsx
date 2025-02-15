import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

const EventBScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const eventData = route?.params?.eventData || {};
  
  console.log('Received event data:', eventData);

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
    navigation.navigate('eventc', { eventData });
  };

  return (
    <View style={styles.mainContainer}>
        
      <TouchableOpacity 
                onPress={() => navigation.goBack('/eventa')}
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
          
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar" size={24}  />
              <Text style={styles.infoText}>{getFormattedDate(eventData.date)}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="time" size={24}  />
              <Text style={styles.infoText}>
                {eventData.heureDebut?.slice(0, 5)} - {eventData.heureFin?.slice(0, 5)}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="location" size={24}  />
              <Text style={styles.infoText}>{eventData.adresse || 'Adresse non spécifiée'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="pricetag" size={24}  />
              <Text style={[styles.infoText, eventData.prix === 'Gratuit' && styles.freePrice]}>
                {typeof eventData.prix === 'number'
                  ? `${eventData.prix.toFixed(2)} DT / Pers`
                  : eventData.prix || 'Prix non spécifié'}
              </Text>
            </View>
          </View>

          {/* The Confirm Button placed before the description */}
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmParticipation}>
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
  descriptionContainer: {
    marginBottom: 20,  // Space added to ensure button stays below description
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
    marginBottom: 50, 
    // Ensures space above the button
  },
  confirmButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EventBScreen;
