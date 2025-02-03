import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';

const ProfileScreen = () => {
  const SocialIcon = () => (
    <View style={styles.iconWrapper}>
      <View style={styles.iconSquare} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header avec l'icône personnalisée */}
        <View style={styles.header}>
          {/* Icône personnalisée verte */}
          <View style={styles.customIcon}>
            <View style={styles.iconEars} />
            <View style={styles.iconFace}>
              <View style={styles.iconEyes} />
            </View>
          </View>

          {/* Photo de profil avec bordure verte */}
          <View style={styles.profileContainer}>
            <Image
              source={require('../../assets/images/b.png')}
              style={styles.profileImage}
            />
          </View>

          {/* Informations du profil */}
          <Text style={styles.name}>Mohammed Mostafa Ben Ali</Text>
          <Text style={styles.title}>Coach sportif</Text>
          <Text style={styles.price}>Séance de 30min à partir de 30 DT</Text>
          <Text style={styles.location}>En ligne, à domicile ou en extérieur sur «l'Ariana»</Text>

          {/* Icônes sociales */}
          <View style={styles.socialRow}>
            <SocialIcon />
            <SocialIcon />
            <SocialIcon />
          </View>

          {/* Boutons */}
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Découvrez mes cours</Text>
            <Feather name="chevron-right" size={20} color="black" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Contactez-moi</Text>
          </TouchableOpacity>
        </View>

        {/* Section À propos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>À propos :</Text>
          <Text style={styles.aboutText}>
            Étant moi-même une personne très sportive et ayant pratiqué toutes sortes de sports toute ma vie, je propose des séances de coaching à toute personne souhaitant perdre de la graisse corporelle, devenir plus athlétique ou simplement retrouver une meilleure forme physique.
          </Text>
        </View>

        {/* Navigation du bas */}
        <View style={styles.bottomNav}>
          <View style={styles.navItem}>
            <Feather name="home" size={24} color="#666" />
          </View>
          <View style={styles.navItem}>
            <Feather name="search" size={24} color="#666" />
          </View>
          <View style={styles.navItem}>
            <Feather name="user" size={24} color="#666" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    backgroundColor: '#000',
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  customIcon: {
    width: 40,
    height: 40,
    position: 'absolute',
    top: 10,
    right: 10,
    alignItems: 'center',
  },
  iconEars: {
    width: 30,
    height: 15,
    backgroundColor: '#9FE870',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  iconFace: {
    width: 30,
    height: 25,
    backgroundColor: '#9FE870',
    borderRadius: 8,
    marginTop: -5,
  },
  iconEyes: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 5,
  },
  profileContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#9FE870',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  title: {
    fontSize: 16,
    color: 'white',
    marginBottom: 5,
  },
  price: {
    fontSize: 14,
    color: 'white',
    marginBottom: 5,
  },
  location: {
    fontSize: 12,
    color: 'white',
    textAlign: 'center',
    marginBottom: 15,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconWrapper: {
    marginHorizontal: 10,
  },
  iconSquare: {
    width: 24,
    height: 24,
    backgroundColor: '#333',
    marginHorizontal: 10,
  },
  primaryButton: {
    backgroundColor: '#9FE870',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    width: '100%',
    marginBottom: 10,
  },
  primaryButtonText: {
    color: 'black',
    fontWeight: '600',
    marginRight: 5,
  },
  secondaryButton: {
    borderColor: 'white',
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    width: '100%',
    marginBottom: 20,
  },
  secondaryButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  section: {
    padding: 20,
    backgroundColor: 'white',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  aboutText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  navItem: {
    padding: 10,
  },
});

export default ProfileScreen;