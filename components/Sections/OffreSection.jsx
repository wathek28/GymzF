import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useOffers } from '../../hooks/useOffers';

const OfferCard = ({ offer }) => (
  <TouchableOpacity style={styles.card}>
    <Text style={styles.logo}>{offer.name}</Text>
    <Text style={styles.description}>{offer.description}</Text>
    <TouchableOpacity 
      style={styles.button} 
      onPress={() => alert(`Vous avez choisi l'offre: ${offer.name}`)}
    >
      <Text style={styles.buttonText}>Profitez</Text>
    </TouchableOpacity>
  </TouchableOpacity>
);

const OfferSection = () => {
  const { offers, isLoading, error } = useOffers();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Chargement des offres...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Offres Spéciales</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.offersScroll}>
        {offers.map((offer) => (
          <OfferCard key={offer.id} offer={offer} />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 15,
    color: '#000',
  },
  offersScroll: {
    marginTop: 10,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#111111',
    borderRadius: 30,
    padding: 20,
    width: 355,
    marginRight: 5,
    alignSelf: 'center',
  },
  logo: {
    color: '#A0FF00',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#A0FF00',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: '#111111',
    fontSize: 16,
    fontWeight: 'bold',
  },
  container: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
  }
});

export default OfferSection;