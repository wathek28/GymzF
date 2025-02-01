import React , {useEffect} from 'react';
import { 
  
  View, 
  Text, 
  Image, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Route } from 'expo-router/build/Route';

const CoachDetailsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  useEffect(() => {
    console.log("samir",router)
      
    }, []);
 

  // Vérifier et parser les paramètres
  const fullName = `${params.firstName || ''} ${params.lastName || ''}`.trim() || "Nom non disponible";
  const experience = params.experience ? `${params.experience} ans` : "5 ans";
  const level = params.level || "Intermédiaire";
  const rating = params.rating || "3.5/5";
  const verified = params.verified === "true"; // Vérifier si le paramètre est bien un booléen
  const specialty = params.specialty ? `Coach ${params.specialty}` : "";
  const workplace = params.workplace ? `à ${params.workplace}` : "";

  // Vérifier si une photo est bien fournie
  const photoSource = params.photo && params.photo.startsWith("/") 
    ? { uri: `data:image/jpeg;base64,${params.photo}` }
    : require('../../assets/images/b.png');

  const renderBadge = (icon, text, value) => (
    <View style={styles.badge}>
      <Ionicons name={icon} size={16} color="#FFF" style={styles.badgeIcon} />
      <Text style={styles.badgeText}>{text}</Text>
      <Text style={styles.badgeValue}>{value}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header Section avec le bouton retour */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Affichage de la photo */}
        <Image
          source={photoSource}
          style={styles.profileImage}
          resizeMode="cover"
        />

        {/* Informations du coach */}
        <View style={styles.infoOverlay}>
          <View style={styles.nameSection}>
            <View style={styles.nameContainer}>
              <Text style={styles.name}>{fullName}</Text>
              {verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#007AFF" />
                </View>
              )}
            </View>
            <TouchableOpacity style={styles.profileButton}>
              <Text style={styles.profileButtonText}>Voir le profil</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.title}>{`${specialty} ${workplace}`.trim()}</Text>

          {/* Badges Section */}
          <View style={styles.badgesContainer}>
            {renderBadge("stats-chart", "Niveau", level)}
            <View style={styles.experienceBadge}>
              {renderBadge("time", "Expérience", experience)}
            </View>
            {renderBadge("star", "Avis", rating)}
          </View>
        </View>
      </ScrollView>

      {/* Navigation en bas */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home" size={24} color="#666" />
          <Text style={styles.navText}>Accueil</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="heart-outline" size={24} color="#666" />
          <Text style={styles.navText}>Messages</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="calendar-outline" size={24} color="#666" />
          <Text style={styles.navText}>Réel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person-outline" size={24} color="#666" />
          <Text style={styles.navText}>Profil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// Styles restent inchangés




const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 45,
    left: 0,
    right: 0,
    zIndex: 1,
    padding: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: '100%',
    height: 500,
    backgroundColor: '#2C2C2C',
  },
  infoOverlay: {
    padding: 20,
    backgroundColor: '#000',
  },
  nameSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  nameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFF',
    marginRight: 8,
    flex: 1,
  },
  verifiedBadge: {
    marginLeft: 4,
  },
  profileButton: {
    backgroundColor: '#CCFF00',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 12,
  },
  profileButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 14,
    color: '#999',
    marginBottom: 20,
  },
  badgesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  badge: {
    backgroundColor: '#2C2C2C',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    flex: 1,
  },
  experienceBadge: {
    flex: 1,
    marginHorizontal: 8,
  },
  badgeIcon: {
    marginBottom: 4,
  },
  badgeText: {
    color: '#999',
    fontSize: 12,
    marginBottom: 2,
  },
  badgeValue: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  locationContainer: {
    marginBottom: 20,
  },
  locationHeader: {
    fontSize: 16,
    color: '#FFF',
    marginBottom: 12,
  },
  locationBox: {
    backgroundColor: '#2C2C2C',
    padding: 16,
    borderRadius: 8,
  },
  locationText: {
    color: '#FFF',
    fontSize: 14,
    lineHeight: 20,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
    backgroundColor: '#000',
    borderTopWidth: 1,
    borderTopColor: '#2C2C2C',
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  }
});


export default CoachDetailsScreen;