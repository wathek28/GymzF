import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { Feather, MaterialIcons, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const ProfileScreen = () => {
  const router = useRouter();

  const goBack = () => {
    router.push('/home');
  };

  // Configuration des éléments de navigation identique à FitnessApp
  const navItems = [
    {
      id: "home",
      icon: "home",
      name: "Accueil",
      color: "#666",
      Component: MaterialCommunityIcons,
    },
    {
      id: "heart",
      icon: "heart",
      name: "Mes envies",
      color: "#666",
      Component: Feather,
    },
    {
      id: "calendar",
      icon: "calendar",
      name: "Plans",
      color: "#666",
      Component: Feather,
    },
    {
      id: "user",
      icon: "user",
      name: "Profil",
      color: "#4CAF50",  // Actif par défaut sur la page de profil
      Component: Feather,
    },
  ];

  // Fonction pour naviguer vers la page gyma
  const navigateToGyma = () => {
    router.push('/Gyma');
  };
  
  // Fonction pour naviguer vers la page gymb
  const navigateToGymb = () => {
    router.push('/Gymb');
  };

  // Fonction pour naviguer vers la page gymd (Centre d'aide)
  const navigateToGymd = () => {
    router.push('/Gymd');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
      
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Ionicons name="chevron-back" size={24} color="#999" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Mon Profil</Text>
        <View style={styles.placeholderSpace} />
      </View>

      {/* Content ScrollView avec padding bas pour la navbar */}
      <View style={styles.contentContainer}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image
              source={require('../../assets/images/b.png')}
              style={styles.avatar}
            />
            <View style={styles.verifiedBadge}>
              <Feather name="check" size={18} color="#fff" />
            </View>
          </View>
          <Text style={styles.profileName}>Mohamed ben Mohamed</Text>
          <Text style={styles.profileId}>2158745659</Text>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {/* Informations Personnelles - Navigation vers gyma */}
          <TouchableOpacity style={styles.menuItem} onPress={navigateToGyma}>
            <View style={styles.menuIconContainer}>
              <Feather name="user" size={22} color="#777" />
            </View>
            <Text style={styles.menuText}>Informations Personnelles</Text>
            <Feather name="chevron-right" size={20} color="#ccc" />
          </TouchableOpacity>

          {/* Modifier le numéro de téléphone - MISE À JOUR: navigation vers gymb */}
          <TouchableOpacity style={styles.menuItem} onPress={navigateToGymb}>
            <View style={styles.menuIconContainer}>
              <Feather name="phone" size={22} color="#777" />
            </View>
            <Text style={styles.menuText}>Modifier le numéro de téléphone</Text>
            <Feather name="chevron-right" size={20} color="#ccc" />
          </TouchableOpacity>

          {/* Centre d'aide - Navigation vers gymd */}
          <TouchableOpacity style={styles.menuItem} onPress={navigateToGymd}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="help-circle-outline" size={24} color="#777" />
            </View>
            <Text style={styles.menuText}>Centre d'aide</Text>
            <Feather name="chevron-right" size={20} color="#ccc" />
          </TouchableOpacity>

          {/* Politique de confidentialité */}
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="time-outline" size={24} color="#777" />
            </View>
            <Text style={styles.menuText}>Politique de confidentialité</Text>
            <Feather name="chevron-right" size={20} color="#ccc" />
          </TouchableOpacity>

          {/* Déconnexion */}
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <Feather name="log-out" size={22} color="#777" />
            </View>
            <Text style={styles.menuText}>Déconnexion</Text>
            <Feather name="chevron-right" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Navigation Bar - Positionnée plus haut */}
      <View style={styles.bottomNav}>
        {navItems.map((item, index) => (
          <TouchableOpacity
            key={`nav-${item.id}-${index}`}
            style={styles.navItem}
            onPress={() => {
              if (item.id === 'home') {
                router.push('/home');
              } else if (item.id === 'user') {
                // Déjà sur la page profil, ne rien faire
              } else if (item.id === 'calendar') {
                router.push({
                  pathname: "/(event)",
                });
              } else if (item.id === 'heart') {
                router.push({
                  pathname: "/favorites",
                });
              }
            }}
          >
            <item.Component name={item.icon} size={24} color={item.color} />
            <Text
              style={[
                styles.navText,
                item.color === "#4CAF50" && styles.activeNavText,
              ]}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    flex: 1,
    paddingBottom: 80, // Espace pour la barre de navigation
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerText: {
    fontSize: 18,
    fontWeight: '500',
  },
  placeholderSpace: {
    width: 40,
  },
  profileSection: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 8,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#1e88e5',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  profileId: {
    color: '#888',
    fontSize: 14,
  },
  menuContainer: {
    backgroundColor: '#fff',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuIconContainer: {
    width: 24,
    marginRight: 16,
    alignItems: 'center',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  
  // Styles de navigation mis à jour avec position plus haute
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 15,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    position: "absolute",
    bottom: 30, // Positionné plus haut qu'avant (était à bottom: 0)
    left: 0,
    right: 0,
  },
  navItem: {
    alignItems: "center",
  },
  navText: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
  },
  activeNavText: {
    color: "#4CAF50",
  },
});

export default ProfileScreen;