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
import { router } from 'expo-router';
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
  
  // Suivre l'onglet actif
  const [activeTab, setActiveTab] = useState('home');
  
  // Animation pour l'indicateur coulissant
  const slideAnimation = useRef(new Animated.Value(0)).current;

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
    const tabIndex = indexMap[activeTab];
    
    Animated.timing(slideAnimation, {
      toValue: tabIndex * TAB_WIDTH,
      duration: 300,
      useNativeDriver: true
    }).start();
  }, [activeTab]);

  // Éléments de la barre de navigation
  const navItems = [
    {
      id: "home",
      icon: "home",
      name: "Accueil",
      Component: MaterialCommunityIcons,
    },
    {
      id: "heart",
      icon: "heart",
      name: "Mes envies",
      Component: Feather,
    },
    {
      id: "reels",
      icon: "play-circle",
      name: "Reels",
      Component: Feather,
    },
    {
      id: "user",
      icon: "user",
      name: "Profil",
      Component: Feather,
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
        
        {navItems.map((item, index) => {
          const isActive = activeTab === item.id;
          
          return (
            <TouchableOpacity
              key={`nav-${item.id}-${index}`}
              style={styles.navItem}
              onPress={() => {
                switch (item.id) {
                  case 'home':
                    navigateWithUserData("/home", 'home');
                    break;
                  case 'user':
                    navigateWithUserData("/(Gymzer)/Gym", 'user');
                    break;
                  case 'heart':
                    navigateWithUserData("favorites", 'heart');
                    break;
                  case 'reels':
                    console.log("Navigation vers Reels");
                    navigateWithUserData("/(Reels)/Reels", 'reels'); 
                    break;
                }
              }}
            >
              <item.Component 
                name={item.icon} 
                size={24} 
                color={isActive ? "#CBFF06" : "#666"} 
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
    bottom: 2, 
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
    color: "#CBFF06",
    fontWeight: "bold",
  },
  slidingIndicator: {
    position: "absolute",
    width: TAB_WIDTH,
    height: 3,
    backgroundColor: "#CBFF06",
    bottom: 0,
    borderRadius: 1.5,
  }
});