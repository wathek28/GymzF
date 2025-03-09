import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { router } from 'expo-router';
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function _layout() {
  const [userData, setUserData] = useState({
    userId: null,
    firstName: '',
    phoneNumber: '',
    userPhoto: '',
    userEmail: ''
  });

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
      color: "#666",
      Component: Feather,
    },
  ];

  const navigateWithUserData = (route) => {
    if (!userData.userId) {
      console.warn('No user data available for navigation');
      return;
    }

    console.log('Navigating with user data:', userData);

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
        {navItems.map((item, index) => (
          <TouchableOpacity
            key={`nav-${item.id}-${index}`}
            style={styles.navItem}
            onPress={() => {
              switch (item.id) {
                case 'home':
                  navigateWithUserData("/home");
                  console.log('Staying on home page');
                  break;
                case 'user':
                  navigateWithUserData("/(Gymzer)/Gym");
                  break;
                case 'calendar':
                  navigateWithUserData("/(event)");
                  break;
                case 'heart':
                  navigateWithUserData("favorites");
                  break;
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
 flex:1,
   
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 15,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    position: "absolute",
    bottom: 2, 
    width: "100%",
    borderRadius: 25, // Ajout d'un borderRadius pour arrondir les coins
   // Ajout de marges horizontales
    
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
    color: "#CBFF06",
  }
});
