import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, StatusBar, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const CoachProfile = () => {
  // Get navigation and route params
  const navigation = useNavigation();
  const route = useRoute();
  const router = useRouter();
  
  // State for all coaches
  const [allCoaches, setAllCoaches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Extract params from the route
  const initialParams = route.params || {};
  
  // State for the currently displayed featured coach
  const [featuredCoach, setFeaturedCoach] = useState({
    id: initialParams.id,
    name: initialParams.firstName || 'Ahmed Mohamed',
    verified: true,
    specialties: initialParams.typeCoaching || 'Fitness Et Yoga',
    description: initialParams.bio || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi vestibulum eros at dolor mollis aliquam at erat mattis. Donec dignissim ultricies mauris, ac tristique.',
    avatar: initialParams.photo 
      ? { uri: `data:image/jpeg;base64,${initialParams.photo}` }
      : require('../../assets/images/b.png'),
    phoneNumber: initialParams.phoneNumber || '+216 00 000 000',
    poste: initialParams.poste || 'Coach personnel',
    photo: initialParams.photo // Keep original photo data
  });
  
  // Fetch coaches from API
  useEffect(() => {
    const fetchCoaches = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('http://192.168.0.3:8082/api/auth/coaches');
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Coaches fetched:", data.length);
        setAllCoaches(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching coaches:", err.message);
        setError(err.message);
        
        // Fallback data
        setAllCoaches([
          { id: '2', firstName: 'Ahmed', photo: null },
          { id: '3', firstName: 'Elena', photo: null },
          { id: '4', firstName: 'Fatima', photo: null },
          { id: '5', firstName: 'Antoine', photo: null },
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCoaches();
  }, []);

  // Handle back button press
  const handleBackPress = () => {
    navigation.goBack();
  };

  // Handle coach selection - update the featured coach
  const handleCoachPress = (coach) => {
    console.log(`Selected coach: ${coach.firstName}`);
    
    // Update the featured coach with the selected coach's details
    setFeaturedCoach({
      id: coach.id,
      name: coach.firstName,
      verified: true,
      specialties: 'Fitness Et Yoga', // Default or use a property from coach if available
      description: coach.bio || "Aucune biographie disponible pour ce coach.",
      avatar: coach.photo 
        ? { uri: `data:image/jpeg;base64,${coach.photo}` }
        : require('../../assets/images/b.png'),
      phoneNumber: coach.phoneNumber,
      poste: 'Coach personnel', // Default or use a property from coach if available
      photo: coach.photo // Keep original photo data
    });
    
    // Optionally scroll to top to show the updated featured coach
    // This requires a ref to the ScrollView which would need to be added
  };

  // Get coaches excluding the currently featured one
  const otherCoaches = allCoaches.filter(coach => coach.id !== featuredCoach.id);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Ionicons name="chevron-back" size={24} color="#AAAAAA" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Coachs</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Featured coach card that exactly matches the design */}
        <View style={styles.featuredCoachContainer}>
          <Image 
            source={featuredCoach.avatar} 
            style={styles.featuredCoachImage} 
            resizeMode="cover"
          />
          
          {/* Text overlay directly on image - no black band */}
          <View style={styles.coachInfoOverlay}>
            <View style={styles.nameContainer}>
              <Text style={styles.coachName}>{featuredCoach.name}</Text>
              {featuredCoach.verified && (
                <Ionicons name="checkmark-circle" size={16} color="#0096FF" />
              )}
            </View>
            <Text style={styles.coachSpecialty}>{featuredCoach.specialties}</Text>
            <Text style={styles.coachDescription}>{featuredCoach.description}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Nos Coachs</Text>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#0096FF" />
            <Text style={styles.loadingText}>Chargement des coachs...</Text>
          </View>
        ) : error ? (
          <Text style={styles.errorText}>Erreur: {error}</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.coachesScrollView}>
            {otherCoaches.map((coach) => (
              <TouchableOpacity 
                key={coach.id} 
                style={styles.coachCard}
                onPress={() => handleCoachPress(coach)}
              >
                <Image 
                  source={
                    coach.photo 
                      ? { uri: `data:image/jpeg;base64,${coach.photo}` }
                      : require('../../assets/images/b.png')
                  } 
                  style={styles.coachAvatar} 
                />
                <Text style={styles.coachCardName}>{coach.firstName}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  featuredCoachContainer: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#222',
  },
  featuredCoachImage: {
    width: '100%',
    aspectRatio: 0.73, // This matches the image aspect ratio in your reference
    borderRadius: 12,
  },
  coachInfoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 18,
    // Gradient-like overlay at the bottom only
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  coachName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 6,
  },
  coachSpecialty: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 6,
  },
  coachDescription: {
    fontSize: 12,
    color: '#EEEEEE',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  coachesScrollView: {
    paddingLeft: 16,
    paddingBottom: 20,
  },
  coachCard: {
    marginRight: 12,
    alignItems: 'center',
    width: 70,
  },
  coachAvatar: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginBottom: 8,
  },
  coachCardName: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  // Loading and error states
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    color: 'red',
    textAlign: 'center',
    padding: 16,
  },
});

export default CoachProfile;