import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions
} from "react-native";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { router, usePathname } from 'expo-router';
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get('window');
const TAB_WIDTH = width / 4; // 4 onglets dans la barre

export default function _layout() {
  const [userData, setUserData] = useState({
    userId: null,
    firstName: '',
    phoneNumber: '',
    userPhoto: '',
    userEmail: ''
  });
  
  // Récupérer le chemin actuel pour définir l'onglet actif
  const currentPath = usePathname();
  
  // Mettre à jour l'onglet actif en fonction du chemin de navigation
  const getActiveTabFromPath = (path) => {
    if (path.includes('/home')) return 'home';
    if (path.includes('/activitea')) return 'heart';
    if (path.includes('/Reels')) return 'reels';
    if (path.includes('/Gym')) return 'user';
    return 'home'; // Par défaut
  };
  
  // État pour l'onglet actif
  const [activeTab, setActiveTab] = useState(() => getActiveTabFromPath(currentPath));
  
  // Animation pour l'indicateur coulissant
  const slideAnimation = useRef(new Animated.Value(0)).current;

  // Mettre à jour l'onglet actif lorsque le chemin change
  useEffect(() => {
    const newActiveTab = getActiveTabFromPath(currentPath);
    setActiveTab(newActiveTab);
  }, [currentPath]);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        const storedFirstName = await AsyncStorage.getItem('firstName');
        const storedPhoneNumber = await AsyncStorage.getItem('phoneNumber');
        const storedUserPhoto = await AsyncStorage.getItem('userPhoto');
        const storedUserEmail = await AsyncStorage.getItem('userEmail');

        setUserData({
          userId: storedUserId,
          firstName: storedFirstName,
          phoneNumber: storedPhoneNumber,
          userPhoto: storedUserPhoto,
          userEmail: storedUserEmail
        });
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, []);
  
  // Effet pour animer le changement d'onglet
  useEffect(() => {
    const indexMap = { home: 0, heart: 1, reels: 2, user: 3 };
    const tabIndex = indexMap[activeTab] || 0;
    
    Animated.timing(slideAnimation, {
      toValue: tabIndex * TAB_WIDTH,
      duration: 300,
      useNativeDriver: true
    }).start();
    
    console.log('Animation mise à jour pour l\'onglet:', activeTab, 'à l\'index:', tabIndex);
  }, [activeTab]);

  // Éléments de la barre de navigation
  const navItems = [
    {
      id: "home",
      icon: "home",
      name: "Accueil",
      Component: MaterialCommunityIcons,
      route: "/home"
    },
    {
      id: "heart",
      icon: "heart",
      name: "Mes Activités",
      Component: Feather,
      route: "/(envie)/activitea"
    },
    {
      id: "reels",
      icon: "play-circle",
      name: "Reels",
      Component: Feather,
      route: "/(Reels)/Reels"
    },
    {
      id: "user",
      icon: "user",
      name: "Profil",
      Component: Feather,
      route: "/(Gymzer)/Gym"
    },
  ];

  const navigateWithUserData = (route, tabId) => {
    if (!userData.userId) {
      console.warn('No user data available for navigation');
      return;
    }

    console.log('Navigating to', route, 'with user data:', userData);
    setActiveTab(tabId);

    router.push({
      pathname: route,
      params: {
        userId: userData.userId,
        firstName: userData.firstName,
        phoneNumber: userData.phoneNumber,
        photo: userData.userPhoto,
        email: userData.userEmail
      }
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.bottomNav}>
        {/* Indicateur coulissant */}
        <Animated.View
          style={[
            styles.slidingIndicator,
            {
              transform: [{ translateX: slideAnimation }]
            }
          ]}
        />
        
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          
          return (
            <TouchableOpacity
              key={`nav-${item.id}`}
              style={styles.navItem}
              onPress={() => navigateWithUserData(item.route, item.id)}
            >
              <item.Component 
                name={item.icon} 
                size={24} 
                color={isActive ? "black" : "#666"} 
              />
              <Text
                style={[
                  styles.navText,
                  isActive && styles.activeNavText,
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    position: "absolute",
    bottom: 20, 
    width: "100%",
    borderRadius: 25,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    height: 65,
  },
  navItem: {
    flex: 1,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  navText: {
    fontSize: 12, 
    color: "#666",
    marginTop: 5,
  },
  activeNavText: {
    color: 'black',
    fontWeight: "bold",
  },
  slidingIndicator: {
    position: "absolute",
    width: TAB_WIDTH,
    height: 3,
    backgroundColor: "black",
    bottom: 0,
    borderRadius: 1.5,
  }
});