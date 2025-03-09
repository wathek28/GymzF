import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  Dimensions,
  Alert,
  Modal
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2;

const CoachSearchScreen1 = () => {
  const router = useRouter();
  
  // Récupération correcte de l'ID utilisateur
  const params = useLocalSearchParams();
  const { userId } = params;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [level, setLevel] = useState('');
  const [selectedCompetences, setSelectedCompetences] = useState([]);
  const [gyms, setGyms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

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
    fetchGyms();
  }, []);
  
  const fetchGyms = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://192.168.0.3:8082/api/auth/gyms`);
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des gyms');
      }
      
      const data = await response.json();
      setGyms(data);
      setError(null);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleCompetence = useCallback((id) => {
    setSelectedCompetences(prev => 
      prev.includes(id) 
        ? prev.filter(c => c !== id)
        : [...prev, id]
    );
  }, []);

  // Filtrage et recherche des gyms
  const filteredGyms = useMemo(() => {
    return gyms.filter(gym => {
      // Filtre par recherche (nom ou spécialité)
      const matchesSearch = !searchQuery.trim() || 
        (gym.firstName && gym.firstName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (gym.entrainementPhysique && gym.entrainementPhysique.toLowerCase().includes(searchQuery.toLowerCase()));

      // Filtre par localisation
      const matchesLocation = !location || gym.location === location;

      // Filtre par niveau
      const matchesLevel = !level || gym.level === level;

      // Filtre par compétences
      const matchesCompetences = selectedCompetences.length === 0 || 
        selectedCompetences.some(compId => 
          gym.competences && gym.competences.includes(compId)
        );

      return matchesSearch && matchesLocation && matchesLevel && matchesCompetences;
    });
  }, [gyms, searchQuery, location, level, selectedCompetences]);

  // Réinitialisation des filtres
  const resetFilters = useCallback(() => {
    setLocation('');
    setLevel('');
    setSelectedCompetences([]);
    setSearchQuery('');
  }, []);

  // Fonction pour surligner le texte
  const highlightText = useCallback((text, query) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    
    return text.split(regex).map((part, index) => 
      regex.test(part) ? (
        <Text key={index} style={styles.highlightText}>{part}</Text>
      ) : (
        <Text key={index}>{part}</Text>
      )
    );
  }, []);

  // Rendu du modal de filtres
  const renderFilterModal = useCallback(() => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isFilterModalVisible}
      onRequestClose={() => setIsFilterModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filtres</Text>
            <TouchableOpacity onPress={() => setIsFilterModalVisible(false)}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Emplacement</Text>
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
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Niveau</Text>
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
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Compétences</Text>
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
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={styles.resetButton} 
              onPress={resetFilters}
            >
              <Text style={styles.resetButtonText}>Réinitialiser</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.applyButton} 
              onPress={() => setIsFilterModalVisible(false)}
            >
              <Text style={styles.applyButtonText}>Appliquer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  ), [
    isFilterModalVisible, 
    location, 
    level, 
    selectedCompetences, 
    locationOptions, 
    levelOptions, 
    competences, 
    toggleCompetence, 
    resetFilters
  ]);

  const navigateToGymDetails = useCallback((gym) => {
    if (!userId) {
      console.warn('ID utilisateur manquant');
      Alert.alert('Erreur', 'Impossible de continuer sans identification');
      return;
    }
    
    // Assurez-vous que toutes les propriétés sont des chaînes
    const gymParams = {
      id: gym.id?.toString() || "",
      userId: userId?.toString() || "",
      firstName: gym.firstName || gym.first_name || "",
      entrainementPhysique: gym.entrainementPhysique || "",
      photo: gym.photo || "",
      email: gym.email || "",
      disciplines: gym.disciplines || "",
      typeCoaching: gym.typeCoaching || "",
      niveauCours: gym.niveauCours || "",
      dureeExperience: gym.dureeExperience || "",
      dureeSeance: gym.dureeSeance || "",
      prixSeance: gym.prixSeance?.toString() || "",
      competencesGenerales: gym.competencesGenerales || "",
      coursSpecifiques: gym.coursSpecifiques || "",
      santeEtBienEtre: gym.santeEtBienEtre || "",
      poste: gym.poste || "",
      phoneNumber: gym.phoneNumber || "",
      fb: gym.fb || "",
      insta: gym.insta || "",
      tiktok: gym.tiktok || "",
      bio: gym.bio || ""
    };
    
    console.log('Navigation vers Salleb avec gym ID:', gymParams.id);
    
    router.push({
      pathname: "/Salleb",
      params: gymParams
    });
  }, [userId, router]);

  const renderGyms = useCallback(() => {
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
          <TouchableOpacity style={styles.retryButton} onPress={fetchGyms}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!filteredGyms.length) {
      return (
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>Aucun gym trouvé</Text>
        </View>
      );
    }

    const pairs = [];
    for (let i = 0; i < filteredGyms.length; i += 2) {
      pairs.push(filteredGyms.slice(i, i + 2));
    }

    return (
      <View style={styles.gymsContainer}>
        {pairs.map((pair, index) => (
          <View key={index} style={styles.gymRow}>
            {pair.map((gym) => (
              <TouchableOpacity
                key={`gym-${gym.id || Math.random().toString(36).substr(2, 9)}`}
                style={styles.gymCard}
                onPress={() => navigateToGymDetails(gym)}
              >
                <Image
                  source={gym.photo 
                    ? { uri: `data:image/jpeg;base64,${gym.photo}` }
                    : require('../../assets/images/F.png')
                  }
                  style={styles.gymImage}
                  resizeMode="cover"
                />
                <View style={styles.gymInfo}>
                  <Text style={styles.gymName} numberOfLines={1}>
                    {highlightText(
                      gym.firstName || gym.first_name || "Nom non disponible", 
                      searchQuery
                    )}
                  </Text>
                  <Text style={styles.gymSpecialty} numberOfLines={1}>
                    {highlightText(
                      gym.entrainementPhysique || gym.email || "Spécialité non disponible", 
                      searchQuery
                    )}
                  </Text>
                  {gym.verified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={16} color="#007AFF" />
                      <Text style={styles.verifiedText}>Vérifié</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
            {pair.length === 1 && <View style={[styles.gymCard, styles.emptyCard]} />}
          </View>
        ))}
      </View>
    );
  }, [filteredGyms, navigateToGymDetails, highlightText, searchQuery]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Gyms {userId ? `(ID: ${userId})` : ''}
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher par nom ou spécialité"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#666"
        />
        <TouchableOpacity 
          style={styles.filterButton} 
          onPress={() => setIsFilterModalVisible(true)}
        >
          <Ionicons name="filter" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {renderGyms()}
      </ScrollView>

      {renderFilterModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  highlightText: {
    backgroundColor: '#CBFF06',
    color: 'black',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  filterButton: {
    width: 44,
    height: 44,
    backgroundColor: 'black',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  resetButton: {
    flex: 1,
    marginRight: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  applyButton: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'black',
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
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
  gymsContainer: {
    gap: 16,
  },
  gymRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gymCard: {
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
  gymImage: {
    width: '100%',
    height: cardWidth,
    backgroundColor: '#F5F5F5',
  },
  gymInfo: {
    padding: 12,
  },
  gymName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  gymSpecialty: {
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

export default CoachSearchScreen1;