import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  Dimensions 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2;

const CoachSearchScreen = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [level, setLevel] = useState('');
  const [selectedCompetences, setSelectedCompetences] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // Cela affiche l'ID utilisateur
   // Valeur par défaut vide si params est undefined
console.log("User ID:", id); // Cela devrait afficher l'ID si c'est passé correctement
const { id } = useRouter().params || {}; // Valeur par défaut vide si params est undefined

  const competences = [
    { id: '1', label: "Coaching individuel" },
    { id: '2', label: "Coaching en groupe" },
    { id: '3', label: "Développement de programmes sur mesure" },
    { id: '4', label: "Analyse biomécanique" },
  ];

  const levelOptions = [
    { id: 'debutant', label: 'Débutant' },
    { id: 'intermediate', label: 'Intermédiaire' },
    { id: 'advanced', label: 'Avancé' },
  ];

  const locationOptions = [
    { id: 'online', label: 'En ligne' },
    { id: 'home', label: 'À domicile' },
  ];

  useEffect(() => {
    fetchCoaches();
  }, [location, level, selectedCompetences]);
  
  const toggleCompetence = (id) => {
    setSelectedCompetences(prev => 
      prev.includes(id) 
        ? prev.filter(c => c !== id)
        : [...prev, id]
    );
  };

  const fetchCoaches = async () => {
    setIsLoading(true);
    try {
      let query = '?';
      if (location) query += `location=${location}&`;
      if (level) query += `level=${level}&`;
      if (selectedCompetences.length > 0) {
        query += `competences=${selectedCompetences.join(',')}&`;
      }
      
      query = query.slice(0, -1);
  
      const response = await fetch(`http://192.168.0.5:8082/api/auth/coaches${query}`);
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des coachs');
      }
      
      const data = await response.json();
      console.log("Data received:", data);
      setCoaches(data);
      setError(null);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderLocationOptions = () => (
    <View style={styles.optionsContainer}>
      {locationOptions.map((option) => (
        <TouchableOpacity 
          key={option.id}
          style={[ 
            styles.optionButton, 
            location === option.id && styles.optionButtonSelected
          ]}
          onPress={() => {
            const newLocation = location === option.id ? '' : option.id;
            setLocation(newLocation);
          }}
        >
          <Text style={[ 
            styles.optionText, 
            location === option.id && styles.optionTextSelected 
          ]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderLevelOptions = () => (
    <View style={styles.optionsContainer}>
      {levelOptions.map((option) => (
        <TouchableOpacity 
          key={option.id}
          style={[ 
            styles.optionButton, 
            level === option.id && styles.optionButtonSelected
          ]}
          onPress={() => setLevel(level === option.id ? '' : option.id)}
        >
          <Text style={[ 
            styles.optionText, 
            level === option.id && styles.optionTextSelected 
          ]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderCompetences = () => (
    <View style={styles.competencesContainer}>
      {competences.map((comp) => (
        <TouchableOpacity
          key={comp.id}
          style={[ 
            styles.competenceButton, 
            selectedCompetences.includes(comp.id) && styles.competenceButtonSelected
          ]}
          onPress={() => toggleCompetence(comp.id)}
        >
          <Text style={[ 
            styles.competenceText, 
            selectedCompetences.includes(comp.id) && styles.competenceTextSelected
          ]}>
            {comp.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderCoaches = () => {
    if (isLoading) {
      return (
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>Chargement...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.messageContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchCoaches}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!coaches.length) {
      return (
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>Aucun coach trouvé</Text>
        </View>
      );
    }

    const pairs = [];
    for (let i = 0; i < coaches.length; i += 2) {
      pairs.push(coaches.slice(i, i + 2));
    }

    return (
      <View style={styles.coachesContainer}>
        {pairs.map((pair, index) => (
          <View key={index} style={styles.coachRow}>
            {pair.map((coach) => (
              <TouchableOpacity
                key={`coach-${coach.id || Math.random().toString(36).substr(2, 9)}`}
                style={styles.coachCard}
                onPress={() => {
                  const userId = "some-user-id"; // Remplacer par l'ID utilisateur réel
                  if (!userId) {
                    console.log('User ID est manquant');
                    return; // Arrêter la navigation si l'ID n'est pas disponible
                  }
                
                  router.push({
                    pathname: "/Coachb",
                    params: { ...coach, userId },
                  });
                }}
              >
                <Image
                  source={coach.photo 
                    ? { uri: `data:image/jpeg;base64,${coach.photo}` }
                    : require('../../assets/images/F.png')
                  }
                  style={styles.coachImage}
                  resizeMode="cover"
                />
                <View style={styles.coachInfo}>
                  <Text style={styles.coachName} numberOfLines={1}>
                    {coach.firstName || coach.first_name || "Nom non disponible"}
                  </Text>
                  <Text style={styles.coachSpecialty} numberOfLines={1}>
                    {coach.specialty || coach.entrainementPhysique || "Spécialité non disponible"}
                  </Text>
                  {coach.verified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={16} color="#007AFF" />
                      <Text style={styles.verifiedText}>Vérifié</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
            {pair.length === 1 && <View style={[styles.coachCard, styles.emptyCard]} />}
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Coachs</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un coach"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#666"
        />
        <TouchableOpacity style={styles.searchButton} onPress={fetchCoaches}>
          <Ionicons name="search" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Emplacement</Text>
          {renderLocationOptions()}
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Niveau</Text>
          {renderLevelOptions()}
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Compétences</Text>
          {renderCompetences()}
        </View>

        {renderCoaches()}
      </ScrollView>
    </SafeAreaView>
  );
};




const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  searchButton: {
    width: 44,
    height: 44,
    backgroundColor: 'black',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  filterSection: {
    marginBottom: 24,
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
  competencesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  competenceButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  competenceButtonSelected: {
    backgroundColor: '#CBFF06',
    borderColor: '#DDD',
  },
  competenceText: {
    fontSize: 14,
    color: '#333',
  },
  competenceTextSelected: {
    color: 'black',
  },
  coachesContainer: {
    gap: 16,
  },
  coachRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  coachCard: {
    width: cardWidth,
    borderRadius: 12,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  emptyCard: {
    backgroundColor: 'transparent',
    shadowColor: 'transparent',
    elevation: 0,
  },
  coachImage: {
    width: '100%',
    height: cardWidth,
    backgroundColor: '#F5F5F5',
  },
  coachInfo: {
    padding: 12,
  },
  coachName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  coachSpecialty: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: '#007AFF',
    marginLeft: 4,
  },
  messageContainer: {
    padding: 20,
    alignItems: 'center',
  },
  messageText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default CoachSearchScreen;
