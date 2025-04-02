import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  SafeAreaView, 
  TextInput, 
  ScrollView, 
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FlashList } from '@shopify/flash-list'; // Plus performant que FlatList

// Configuration globale pour l'API
const API_CONFIG = {
  BASE_URL: 'http://192.168.1.194:8082',
  ENDPOINTS: {
    COACH_PROGRAMS: '/api/courses/coach',
    PROGRAM_DETAIL: '/api/courses',
  },
};

// Mémoire cache pour les images
const imageCache = {};

// Composant générique pour gérer les images avec gestion des erreurs et conversion BLOB
const BlobImage = ({ source, style, defaultImage, onLoadStart, onLoadEnd }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // Memoization de la source d'image pour éviter des re-rendus inutiles
  const imageSource = useMemo(() => {
    // Vérifier si l'image est déjà en cache
    if (typeof source === 'string' && imageCache[source]) {
      return imageCache[source];
    }

    if (error || !source) {
      return defaultImage;
    }

    // Si la source est déjà un objet avec uri
    if (typeof source === 'object' && source.uri) {
      return source;
    }

    // Si c'est une chaîne qui peut être une BLOB (base64)
    if (typeof source === 'string') {
      // Si c'est déjà un format data:image/
      if (source.startsWith('data:image/')) {
        const uri = { uri: source };
        imageCache[source] = uri;
        return uri;
      }
      
      // Si c'est un BLOB base64 sans en-tête
      try {
        const uri = { uri: `data:image/jpeg;base64,${source}` };
        imageCache[source] = uri;
        return uri;
      } catch (e) {
        console.error('Erreur lors de la conversion de l\'image:', e);
        setError(true);
        return defaultImage;
      }
    }

    return defaultImage;
  }, [source, error, defaultImage]);

  // Gestion du chargement
  const handleLoadStart = useCallback(() => {
    setLoading(true);
    if (onLoadStart) onLoadStart();
  }, [onLoadStart]);

  // Gestion de la fin du chargement
  const handleLoadEnd = useCallback(() => {
    setLoading(false);
    if (onLoadEnd) onLoadEnd();
  }, [onLoadEnd]);

  // Gestion des erreurs
  const handleError = useCallback(() => {
    setError(true);
    setLoading(false);
  }, []);

  return (
    <View style={[styles.imageContainer, style]}>
      {loading && (
        <View style={[styles.imageLoaderContainer, { width: style.width, height: style.height }]}>
          <ActivityIndicator size="small" color="#ADFF2F" />
        </View>
      )}
      <Image
        source={imageSource}
        style={[style, { opacity: loading ? 0 : 1 }]}
        onLoadStart={handleLoadStart}
        onLoad={() => setLoading(false)}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
      />
    </View>
  );
};

// Composant pour les icônes d'étoile avec coloration variable selon le niveau
const LevelBadge = React.memo(({ level }) => {
  // Déterminer le nombre d'étoiles colorées selon le niveau
  let activeStars = 1; // Par défaut (Débutant)

  if (level === 'INTERMEDIAIRE') {
    activeStars = 2;
  } else if (level === 'AVANCE') {
    activeStars = 3;
  }

  // Obtenir le texte d'affichage du niveau
  const getLevelText = () => {
    switch(level) {
      case 'DEBUTANT': return 'Débutant';
      case 'INTERMEDIAIRE': return 'Intermédiaire';
      case 'AVANCE': return 'Avancé';
      default: return level;
    }
  };

  const activeColor = '#ADFF2F'; // Couleur verte pour les étoiles actives
  const inactiveColor = '#5a5a5a'; // Couleur grise pour les étoiles inactives
  
  return (
    <View style={styles.levelBadge}>
      <View style={styles.starsContainer}>
        <Text style={[styles.star, { color: activeStars >= 1 ? activeColor : inactiveColor }]}>★</Text>
        <Text style={[styles.star, { color: activeStars >= 2 ? activeColor : inactiveColor }]}>★</Text>
        <Text style={[styles.star, { color: activeStars >= 3 ? activeColor : inactiveColor }]}>★</Text>
      </View>
      <Text style={styles.levelText}>{getLevelText()}</Text>
    </View>
  );
});

// Composant pour une carte de programme avec gestion améliorée des images
// Composant pour une carte de programme avec gestion améliorée des images
// Composant pour une carte de programme avec gestion améliorée des images
// Composant pour une carte de programme avec gestion améliorée des images
// Composant pour une carte de programme avec gestion simple des images
const ProgramCard = React.memo(({ program, onPress }) => {
  // État local pour suivre le chargement de l'image
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  
  // Construire l'URL complète de la miniature
  const thumbnailUrl = useMemo(() => {
    if (!program.id) return null;
    return `${API_CONFIG.BASE_URL}/api/courses/${program.id}/thumbnail`;
  }, [program.id]);

  // Fonction pour formater le prix
  const formatPrice = (price) => {
    return `${parseFloat(price).toFixed(0)} DT`;
  };

  // Déterminer si c'est un cours gratuit
  const isFree = !program.price || parseFloat(program.price) === 0 || program.price === '0.00';

  return (
    <TouchableOpacity 
      style={styles.programCardContainer}
      onPress={() => onPress(program.id)}
      activeOpacity={0.8}
    >
      <View style={styles.programCard}>
        {/* Image par défaut toujours affichée en arrière-plan */}
        <Image 
          source={require('../../assets/images/b.png')}
          style={[styles.programImage, { position: 'absolute' }]}
        />
        
        {/* Indicateur de chargement */}
        {imageLoading && (
          <View style={styles.imageLoaderContainer}>
            <ActivityIndicator size="small" color="#ADFF2F" />
          </View>
        )}
        
        {/* Image principale avec gestion du chargement */}
        {thumbnailUrl && !imageError && (
          <Image 
            source={{ uri: thumbnailUrl }}
            style={styles.programImage}
            onLoadStart={() => setImageLoading(true)}
            onLoad={() => setImageLoading(false)}
            onLoadEnd={() => setImageLoading(false)}
            onError={() => {
              setImageLoading(false);
              setImageError(true);
            }}
            // Optimisations supplémentaires
            fadeDuration={300}
          />
        )}
        
        {/* Badge Prix (seulement si c'est payant) */}
        {!isFree && (
          <View style={styles.dtBadge}>
            <Text style={styles.dtText}>{formatPrice(program.price)}</Text>
          </View>
        )}
        
        {/* Badge Pro/Gratuit */}
        <View style={[styles.proBadge, { backgroundColor: isFree ? '#32CD32' : '#FF9900' }]}>
          <Text style={styles.proText}>{isFree ? 'GRATUIT' : 'PRO'}</Text>
        </View>
        
        <View style={styles.programOverlay}>
          <View style={styles.programInfo}>
            <Text style={styles.programTitle} numberOfLines={1} ellipsizeMode="tail">
              {program.title}
            </Text>
            <Text style={styles.programDuration}>
              {program.durationMinutes}min · {program.exerciseCount} exercices
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});
// Composant pour le carrousel horizontal de programmes
const ProgramsCarousel = React.memo(({ programs, onProgramPress }) => {
  return (
    <FlatList
      data={programs}
      keyExtractor={item => item.id.toString()}
      horizontal
      showsHorizontalScrollIndicator={false}
      renderItem={({ item }) => (
        <ProgramCard program={item} onPress={onProgramPress} />
      )}
      initialNumToRender={3}
      maxToRenderPerBatch={5}
      windowSize={5}
      removeClippedSubviews={true}
      getItemLayout={(data, index) => ({
        length: 250, // Largeur de l'élément + marge
        offset: 250 * index,
        index,
      })}
      contentContainerStyle={styles.carouselContainer}
    />
  );
});

// Composant principal
const Fit = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const [idCoach, setIdCoach] = useState(1); // Défaut à 1 
  const [coachName, setCoachName] = useState('Ahmed');
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState([]);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Récupérer les paramètres au chargement du composant
  useEffect(() => {
    if (route.params) {
      // Récupération de l'ID du coach
      if (route.params.idCoach) {
        setIdCoach(route.params.idCoach);
      }
      
      // Récupération du prénom du coach
      if (route.params.firstName) {
        setCoachName(route.params.firstName);
      }
    }
    
    // Charger les recherches récentes
    loadRecentSearches();
  }, []);

  // Charger les programmes quand l'ID du coach change
  useEffect(() => {
    if (idCoach) {
      fetchPrograms();
    }
  }, [idCoach]);

  // Recharger les données quand l'écran redevient actif
  useFocusEffect(
    useCallback(() => {
      if (!dataLoaded) {
        fetchPrograms();
      }
      return () => {}; // Cleanup effect
    }, [dataLoaded])
  );

  // Charger les recherches récentes depuis AsyncStorage
  const loadRecentSearches = async () => {
    try {
      const searches = await AsyncStorage.getItem('recentSearches');
      if (searches) {
        setRecentSearches(JSON.parse(searches));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des recherches récentes:', error);
    }
  };

  // Sauvegarder une recherche récente
  const saveRecentSearch = async (query) => {
    if (!query.trim()) return;
    
    try {
      let searches = [...recentSearches];
      
      // Ajouter la recherche si elle n'existe pas déjà
      if (!searches.includes(query)) {
        searches = [query, ...searches].slice(0, 5); // Garder seulement les 5 dernières recherches
        setRecentSearches(searches);
        await AsyncStorage.setItem('recentSearches', JSON.stringify(searches));
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la recherche:', error);
    }
  };

  // Fonction pour récupérer les programmes depuis l'API avec mémorisation
  const fetchPrograms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const endpoint = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.COACH_PROGRAMS}/${idCoach}/with-exercises`;
      
      // Vérifier s'il y a des données en cache
      const cachedData = await AsyncStorage.getItem(`programs_${idCoach}`);
      const cachedTimestamp = await AsyncStorage.getItem(`programs_${idCoach}_timestamp`);
      
      // Utiliser les données en cache si elles existent et ont moins de 5 minutes
      if (cachedData && cachedTimestamp) {
        const now = new Date().getTime();
        const cacheTime = parseInt(cachedTimestamp);
        
        // Si le cache a moins de 5 minutes (300000 ms)
        if (now - cacheTime < 300000) {
          const data = JSON.parse(cachedData);
          setPrograms(data);
          setLoading(false);
          setRefreshing(false);
          setDataLoaded(true);
          
          // Charger en arrière-plan pour mettre à jour le cache
          updateProgramsCache();
          return;
        }
      }
      
      // Sinon charger depuis l'API
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Mise en cache des données
      await AsyncStorage.setItem(`programs_${idCoach}`, JSON.stringify(data));
      await AsyncStorage.setItem(`programs_${idCoach}_timestamp`, new Date().getTime().toString());
      
      setPrograms(data);
      setLoading(false);
      setRefreshing(false);
      setDataLoaded(true);
    } catch (err) {
      console.error('Erreur lors de la récupération des programmes:', err);
      
      // Messages d'erreur contextuels
      if (!navigator.onLine) {
        setError("Pas de connexion internet. Veuillez vérifier votre connexion.");
      } else if (err.message.includes('404')) {
        setError("Aucun programme trouvé pour ce coach.");
      } else {
        setError(`Une erreur est survenue: ${err.message}`);
      }
      
      setLoading(false);
      setRefreshing(false);
      
      // Si erreur, essayer d'utiliser le cache même s'il est périmé
      try {
        const cachedData = await AsyncStorage.getItem(`programs_${idCoach}`);
        if (cachedData) {
          setPrograms(JSON.parse(cachedData));
          setError(error + " (Données en cache affichées)");
        }
      } catch (cacheErr) {
        console.error('Erreur lors de la récupération du cache:', cacheErr);
      }
    }
  }, [idCoach]);
  
  // Mise à jour en arrière-plan du cache
  const updateProgramsCache = async () => {
    try {
      // Vérification de la connexion avant de faire la requête
      if (!navigator.onLine) {
        console.log('Mise à jour du cache annulée : pas de connexion internet');
        return;
      }
      
      const endpoint = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.COACH_PROGRAMS}/${idCoach}/with-exercises`;
      
      // Ajouter un timeout pour éviter les longues attentes
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 secondes timeout
      
      const response = await fetch(endpoint, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        await AsyncStorage.setItem(`programs_${idCoach}`, JSON.stringify(data));
        await AsyncStorage.setItem(`programs_${idCoach}_timestamp`, new Date().getTime().toString());
      }
    } catch (err) {
      // Ne pas afficher l'erreur pour les mises à jour en arrière-plan
      if (err.name !== 'AbortError') {
        console.error('Erreur silencieuse lors de la mise à jour du cache:', err);
      }
    }
  };

  // Fonction pour gérer le rafraîchissement
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPrograms();
  }, [fetchPrograms]);

  // Fonction pour gérer le changement de recherche
  const handleSearchChange = useCallback((text) => {
    setSearchQuery(text);
    if (text) {
      setShowRecentSearches(false);
    } else {
      setShowRecentSearches(true);
    }
  }, []);

  // Fonction pour soumettre la recherche
  const handleSearchSubmit = useCallback(() => {
    if (searchQuery.trim()) {
      saveRecentSearch(searchQuery.trim());
      setShowRecentSearches(false);
    }
  }, [searchQuery, saveRecentSearch]);

  // Fonction pour sélectionner une recherche récente
  const selectRecentSearch = useCallback((search) => {
    setSearchQuery(search);
    setShowRecentSearches(false);
  }, []);

  // Fonction pour filtrer les programmes selon la recherche
  const filteredPrograms = useMemo(() => 
    programs.filter(program => 
      program.title.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [programs, searchQuery]
  );

  // Regrouper les programmes par niveau
  const groupedPrograms = useMemo(() => ({
    DEBUTANT: filteredPrograms.filter(program => program.level === 'DEBUTANT'),
    INTERMEDIAIRE: filteredPrograms.filter(program => program.level === 'INTERMEDIAIRE'),
    AVANCE: filteredPrograms.filter(program => program.level === 'AVANCE')
  }), [filteredPrograms]);

  // Handler for back button press
  const handleBackPress = useCallback(() => {
    navigation.goBack(); // Navigate to the previous screen
  }, [navigation]);

  // Navigation vers les détails du programme
  const navigateToProgramDetail = useCallback((programId) => {
    // Navigation vers l'écran "courb" avec l'ID du cours en paramètre
    navigation.navigate('courb', { 
      id: programId,  // Paramètre principal 'id' pour identifier le cours
      // Vous pouvez ajouter d'autres paramètres si nécessaire
    });
  }, [navigation]);

  // Fonction pour afficher le message de bienvenue avec le nom du coach coloré
  const renderWelcomeMessage = useCallback(() => (
    <Text style={styles.welcomeText}>
      Coach <Text style={styles.coachNameHighlight}>{coachName}</Text> a conçu des séances efficaces pour{'\n'}des resultats au top.
    </Text>
  ), [coachName]);

  // Afficher un indicateur de chargement
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#ADFF2F" />
        <Text style={styles.loadingText}>Chargement des programmes...</Text>
      </SafeAreaView>
    );
  }

  // Afficher un message d'erreur si nécessaire
  if (error && !refreshing && programs.length === 0) {
    return (
      <SafeAreaView style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorText}>Erreur: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchPrograms}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Partie noire supérieure */}
      <View style={styles.blackSection}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
              <Ionicons name="chevron-back" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          {renderWelcomeMessage()}
          <Text style={styles.welcomeText}>Prêt(e) à relever le défi ?</Text>
          
          {/* Search Bar */}
          <View style={styles.searchBarContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
              <TextInput 
                style={styles.searchInput}
                placeholder="Chercher un cours spécifique"
                placeholderTextColor="#888"
                value={searchQuery}
                onChangeText={handleSearchChange}
                onSubmitEditing={handleSearchSubmit}
                returnKeyType="search"
                onFocus={() => setShowRecentSearches(true)}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#888" />
                </TouchableOpacity>
              ) : null}
            </View>
            
            {/* Recherches récentes */}
            {showRecentSearches && recentSearches.length > 0 && (
              <View style={styles.recentSearchesContainer}>
                <Text style={styles.recentSearchesTitle}>Recherches récentes</Text>
                {recentSearches.map((search, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.recentSearchItem}
                    onPress={() => selectRecentSearch(search)}
                  >
                    <Ionicons name="time-outline" size={16} color="#888" />
                    <Text style={styles.recentSearchText}>{search}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Partie blanche - Contenu principal */}
      <View style={styles.whiteContent}>
        <ScrollView 
          style={styles.programsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#ADFF2F"]} />
          }
        >
          {/* Afficher chaque section de niveau avec ses programmes en carrousel */}
          {Object.entries(groupedPrograms).map(([level, levelPrograms]) => (
            levelPrograms.length > 0 && (
              <View key={level} style={styles.programSection}>
                <LevelBadge level={level} />
                <ProgramsCarousel 
                  programs={levelPrograms} 
                  onProgramPress={navigateToProgramDetail} 
                />
              </View>
            )
          ))}

          {/* Message si aucun programme trouvé */}
          {filteredPrograms.length === 0 && (
            <View style={styles.noResultsContainer}>
              <Ionicons name="search-outline" size={50} color="#ccc" />
              <Text style={styles.noResultsText}>
                Aucun programme ne correspond à votre recherche.
              </Text>
              <TouchableOpacity 
                style={styles.clearSearchButton}
                onPress={() => setSearchQuery('')}
              >
                <Text style={styles.clearSearchText}>Effacer la recherche</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Espace en bas pour le scrolling */}
          <View style={styles.bottomPadding} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

// Obtenir les dimensions de l'écran
const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  imageContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#333',
    fontSize: 16,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#ADFF2F',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  blackSection: {
    backgroundColor: '#222222',
    paddingBottom: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    // Ombre pour la section noire
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 15,
    paddingBottom: 5,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 5,
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingTop: 5,
  },
  welcomeText: {
    color: 'white',
    fontSize: 14,
    lineHeight: 20,
  },
  coachNameHighlight: {
    color: '#CBFF06',
    fontWeight: 'bold',
  },
  searchBarContainer: {
    position: 'relative',
    zIndex: 1,
    marginTop: 15,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 15,
    height: 40,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: '#333',
  },
  recentSearchesContainer: {
    position: 'absolute',
    top: 45,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    zIndex: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  recentSearchesTitle: {
    fontSize: 12,
    color: '#888',
    marginBottom: 5,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  recentSearchText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
  },
  whiteContent: {
    flex: 1,
    backgroundColor: 'white',
    paddingBottom: 20,
  },
  programsList: {
    flex: 1,
    paddingHorizontal: 0, // Enlever le padding horizontal pour maximiser l'espace
    paddingTop: 15,
  },
  programSection: {
    marginBottom: 20,
    paddingLeft: 20, // Déplacer le padding vers la section
  },
  carouselContainer: {
    paddingRight: 20, // Ajouter du padding à droite pour les éléments de carrousel
  },
  noResultsContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    height: height * 0.3,
  },
  noResultsText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 15,
  },
  clearSearchButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  clearSearchText: {
    color: '#333',
    fontSize: 14,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 1,
    paddingVertical: 1,
    marginRight: 5,
  },
  star: {
    fontSize: 16,
    marginRight: 1,
    fontWeight: 'bold',
  },
  levelText: {
    color: '#333',
    fontSize: 14,
    marginLeft: 5,
    fontWeight: 'bold',
  },
  programCardContainer: {
    marginRight: 15, // Marge entre les cartes dans le carrousel
    borderRadius: 12,
    width: 230, // Largeur fixe pour les cartes dans le carrousel
    // Ombre pour les cartes
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  programCard: {
    borderRadius: 12,
    overflow: 'hidden',
    height: 130,
    backgroundColor: '#f5f5f5',
  },
  imageLoaderContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  programImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  dtBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#CBFF06',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  dtText: {
    color: 'black',
    fontSize: 12,
    fontWeight: 'bold',
  },
  proBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#FF9900',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 4,
  },
  proText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  programOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 10,
  },
  programInfo: {
    flex: 1,
  },
  programTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  programDuration: {
    color: 'white',
    fontSize: 12,
    marginTop: 2,
    opacity: 0.8,
  },
  bottomPadding: {
    height: 20,
  }
});

export default Fit;