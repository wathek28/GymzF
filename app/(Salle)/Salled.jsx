import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

const API_BASE_URL = 'http://192.168.1.194:8082'; // Remplacez par votre adresse IP locale

const SubscriptionCard = ({ titre, description, prix, ancienPrix, duree, uniteDuree }) => {
  // Fonction pour personnaliser la couleur de bordure en fonction de la durée
  const getBorderColor = () => {
    // Vous pouvez personnaliser les couleurs selon vos préférences
    if (uniteDuree === 'MOIS') {
      if (duree <= 3) return '#CCDE3A'; // Vert-jaune pour les abonnements courts
      if (duree <= 6) return '#3A9BDE'; // Bleu pour les abonnements moyens
      return '#DE3A9B'; // Rose pour les abonnements longs
    }
    if (uniteDuree === 'JOUR') return '#FF8A00'; // Orange pour les journaliers
    if (uniteDuree === 'AN') return '#9B3ADE'; // Violet pour les annuels
    
    return '#CCDE3A'; // Couleur par défaut
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.textContainer}>
          <Text style={styles.passType}>{titre}</Text>
          <Text style={styles.price}>{prix} DT</Text>
          {ancienPrix && (
            <Text style={styles.oldPrice}>{ancienPrix} DT</Text>
          )}
          <Text style={styles.description}>
            {description || "Description non disponible"}
          </Text>
        </View>
        
        {/* Badge circulaire avec bordure colorée */}
        <View style={[styles.monthBadge, { borderColor: getBorderColor() }]}>
          <View style={styles.innerCircle}>
            <Text style={styles.durationNumber}>{duree}</Text>
            <Text style={styles.durationUnit}>{uniteDuree.toLowerCase()}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.subscribeButton}>
        <Text style={styles.subscribeText}>Souscrire</Text>
      </TouchableOpacity>
    </View>
  );
};

const SubscriptionsScreen = () => {
  const { idGym } = useLocalSearchParams();
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSubscriptions = async () => {
    try {
      console.log(`Récupération des abonnements pour le gym ID: ${idGym}`);
      setLoading(true);
      
      // Vérifier que l'ID du gym est bien défini
      if (!idGym) {
        throw new Error("ID du gym non spécifié");
      }

      const response = await fetch(`${API_BASE_URL}/api/abonnements/user/${idGym}`);
      
      // Vérifier si la réponse est OK
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Données reçues:', data);
      setSubscriptions(data);
      setError(null);
    } catch (err) {
      console.error('Erreur lors de la récupération des abonnements:', err);
      setError("Impossible de charger les abonnements. Veuillez réessayer plus tard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [idGym]);

  const handleBack = () => {
    router.back();
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#CCDE3A" />
          <Text style={styles.loadingText}>Chargement des abonnements...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              setError(null);
              fetchSubscriptions();
            }}
          >
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (subscriptions.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.noDataText}>Aucun abonnement disponible pour le moment</Text>
        </View>
      );
    }

    return (
      <View style={styles.cardsContainer}>
        {subscriptions.map((subscription) => (
          <SubscriptionCard
            key={subscription.id}
            titre={subscription.titre}
            description={subscription.description}
            prix={subscription.prix}
            ancienPrix={subscription.ancienPrix}
            duree={subscription.duree}
            uniteDuree={subscription.uniteDuree}
          />
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Abonnements</Text>
      </View>
      <ScrollView style={styles.scrollView}>
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  cardsContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    marginRight: 10,
  },
  passType: {
    color: 'white',
    fontSize: 16,
    marginBottom: 4,
  },
  price: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  oldPrice: {
    color: '#999999',
    fontSize: 16,
    textDecorationLine: 'line-through',
    marginBottom: 6,
  },
  description: {
    color: '#AAAAAA',
    fontSize: 12,
    lineHeight: 18,
    maxWidth: '100%',
  },
  // Nouveau style pour le badge circulaire avec bordure
  monthBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  innerCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationNumber: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  durationUnit: {
    color: '#CCCCCC',
    fontSize: 12,
    marginTop: 2,
  },
  subscribeButton: {
    backgroundColor: '#1A1A1A',
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 6,
  },
  subscribeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 300,
  },
  loadingText: {
    color: '#CCCCCC',
    marginTop: 12,
    fontSize: 16,
  },
  errorText: {
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 16,
  },
  noDataText: {
    color: '#CCCCCC',
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#CCDE3A',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#333333',
    fontWeight: 'bold',
  },
});

export default SubscriptionsScreen;