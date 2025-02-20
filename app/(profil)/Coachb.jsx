import React from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { useNavigation, useLocalSearchParams, useRouter } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

const CoachDetailsScreen = () => {
  const navigation = useNavigation();
  const router = useRouter(); 
  const params = useLocalSearchParams();
  const coach = params;


  console.log("Coach object:", coach);
  console.log("User ID:", coach.id);
  
  
  

  const renderBadge = (icon, text, value) => (
    <View style={styles.badge}>
      <Ionicons name={icon} size={16} color="#FFF" style={styles.badgeIcon} />
      <Text style={styles.badgeText}>{text}</Text>
      <Text style={styles.badgeValue}>{value}</Text>
    </View>
  );

  const renderLocationInfo = () => (
    <View style={styles.locationContainer}>
      
      <View style={styles.locationBox}>
      
      <Text style={styles.locationText}>Des Cours : En ligne, à domicile aux alentours de {coach.typeCoaching}, ou à {coach.disciplines}</Text>

        
      </View>
    </View>
  );
  const handleProfilePress = () => {
    // Pass the coach data as params when navigating
    router.push({
      pathname: '/Coachc',
      params: {
        
        id: coach.id, 
      competencesGenerales: coach.competencesGenerales,
      coursSpecifiques: coach.coursSpecifiques,
      disciplines: coach.disciplines,
      dureeExperience: coach.dureeExperience,
      dureeSeance: coach.dureeSeance,
      email: coach.email,
      entrainementPhysique: coach.entrainementPhysique,
      fb: coach.fb,
      firstName: coach.firstName,
      insta: coach.insta,
      niveauCours: coach.niveauCours,
      phoneNumber: coach.phoneNumber,
      photo: coach.photo,
      poste: coach.poste,
      prixSeance: coach.prixSeance,
      santeEtBienEtre: coach.santeEtBienEtre,
      tiktok: coach.tiktok,
      typeCoaching: coach.typeCoaching,
      bio:coach.bio,
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header Section with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()} 
          >
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Profile Image */}
        <Image
          source={
            coach.photo 
              ? { uri: `data:image/jpeg;base64,${coach.photo}` }
              : require('../../assets/images/b.png')
          }
          style={styles.profileImage}
          resizeMode="cover"
        />

        {/* Coach Info Overlay */}
        <View style={styles.infoOverlay}>
          <View style={styles.nameSection}>
            <View style={styles.nameContainer}>
            <Text style={styles.name}>{coach.firstName}</Text>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#007AFF" />
              </View>
            </View>
            <TouchableOpacity style={styles.profileButton } onPress={handleProfilePress} >
              <Text style={styles.profileButtonText}>Voir le profil</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.title}>Coach sportif de {coach.entrainementPhysique}</Text>


          {/* Badges Section */}
          <View style={styles.badgesContainer}>
          {renderBadge("stats-chart", "Niveau", coach.niveauCours)}
          <View style={styles.experienceBadge}>
          {renderBadge("time", "Expérience", coach.dureeExperience)}
          </View>
          {renderBadge("star", "Avis", "3.5/5")}
          </View>

          {renderLocationInfo()}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
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
    top: 20,
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
    height: 450,
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