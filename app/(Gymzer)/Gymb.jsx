import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  Platform,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PhoneVerificationScreen = () => {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // Récupération des paramètres via useLocalSearchParams
  const params = useLocalSearchParams();
  const { 
    userId: paramUserId, 
    firstName: paramFirstName,
    phoneNumber: paramPhoneNumber,
    photo: paramPhoto
  } = params;
  
  // États pour les données utilisateur
  const [userId, setUserId] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [userPhoto, setUserPhoto] = useState("");

  // Récupérer les données utilisateur au chargement du composant
  useEffect(() => {
    const getUserData = async () => {
      try {
        console.log('=== RÉCUPÉRATION DES DONNÉES DANS PHONEVERIFICATIONSCREEN ===');
        
        // Vérification des paramètres reçus
        console.log('Paramètres reçus:', {
          userId: paramUserId || 'non défini',
          firstName: paramFirstName || 'non défini',
          phoneNumber: paramPhoneNumber || 'non défini',
          photo: paramPhoto ? 'présente' : 'non définie'
        });
        
        // Récupérer l'ID utilisateur
        if (paramUserId) {
          console.log('ID utilisateur trouvé dans les paramètres:', paramUserId);
          setUserId(paramUserId);
        } else {
          const storedUserId = await AsyncStorage.getItem('userId');
          if (storedUserId) {
            console.log('ID utilisateur récupéré de AsyncStorage:', storedUserId);
            setUserId(storedUserId);
          }
        }
        
        // Récupérer le prénom
        if (paramFirstName) {
          console.log('FirstName trouvé dans les paramètres:', paramFirstName);
          setFirstName(paramFirstName);
        } else {
          const storedFirstName = await AsyncStorage.getItem('firstName');
          if (storedFirstName) {
            console.log('FirstName récupéré de AsyncStorage:', storedFirstName);
            setFirstName(storedFirstName);
          }
        }
        
        // Récupérer la photo
        if (paramPhoto) {
          console.log('Photo trouvée dans les paramètres');
          setUserPhoto(paramPhoto);
        } else {
          const storedPhoto = await AsyncStorage.getItem('userPhoto');
          if (storedPhoto) {
            console.log('Photo récupérée de AsyncStorage');
            setUserPhoto(storedPhoto);
          }
        }
        
        // Récupérer et définir le numéro de téléphone pour le champ de saisie
        // Supprimer le préfixe +216 s'il est présent
        if (paramPhoneNumber) {
          const formattedNumber = paramPhoneNumber.replace('+216', '');
          console.log('PhoneNumber trouvé dans les paramètres:', paramPhoneNumber);
          console.log('PhoneNumber formatté pour l\'affichage:', formattedNumber);
          setPhoneNumber(formattedNumber);
        } else {
          const storedPhoneNumber = await AsyncStorage.getItem('phoneNumber');
          if (storedPhoneNumber) {
            const formattedNumber = storedPhoneNumber.replace('+216', '');
            console.log('PhoneNumber récupéré de AsyncStorage:', storedPhoneNumber);
            console.log('PhoneNumber formatté pour l\'affichage:', formattedNumber);
            setPhoneNumber(formattedNumber);
          }
        }
        
      } catch (error) {
        console.error('Erreur lors de la récupération des données utilisateur:', error);
      }
    };
    
    getUserData();
  }, [paramUserId, paramFirstName, paramPhoneNumber, paramPhoto]);
  
  const handleSendSMS = () => {
    console.log('Code de vérification envoyé au numéro:', phoneNumber);
    
    // Naviguer vers la page Gymc avec tous les paramètres utilisateur
    router.push({
      pathname: '/Gymc',
      params: {
        userId: userId,
        firstName: firstName,
        phoneNumber: `+216${phoneNumber}`, // Ajouter le préfixe +216
        photo: userPhoto,
        newPhoneNumber: `+216${phoneNumber}` // Ajouter aussi le nouveau numéro comme paramètre spécifique
      }
    });
  };
  
  const handleCancel = () => {
    console.log('Modification annulée');
    navigateBack();
  };
  
  const navigateBack = () => {
    router.push({
      pathname: '/Gym',
      params: {
        userId: userId,
        firstName: firstName,
        phoneNumber: paramPhoneNumber, // Conserver l'ancien numéro
        photo: userPhoto
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
      
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={navigateBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color="#ccc" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Modifier le numéro de téléphone</Text>
        </View>
        
        {/* Description */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionText}>
            Nous enverrons un code de vérification à 4 chiffres à ce numéro.
          </Text>
        </View>
        
        {/* Phone number input */}
        <View style={styles.phoneInputContainer}>
          {/* Country code selector */}
          <View style={styles.countryCodeContainer}>
            <Image 
              source={require('../../assets/images/R.png')} 
              style={styles.flagIcon}
            />
            <Text style={styles.countryCode}>+216</Text>
          </View>
          
          {/* Phone number input field */}
          <TextInput
            style={styles.phoneInput}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            placeholder="Numéro de téléphone"
          />
        </View>
        
        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={[
              styles.sendButton,
              // Désactiver le bouton si le numéro est vide ou trop court
              (!phoneNumber || phoneNumber.length < 8) && styles.disabledButton
            ]} 
            onPress={handleSendSMS}
            activeOpacity={0.8}
            disabled={!phoneNumber || phoneNumber.length < 8}
          >
            <Text style={styles.sendButtonText}>Envoyer le code par SMS</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={handleCancel}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginLeft: 10,
    color: '#333',
  },
  descriptionContainer: {
    marginBottom: 25,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 12,
    marginRight: 10,
    backgroundColor: '#f9f9f9',
  },
  flagIcon: {
    width: 24,
    height: 16,
    marginRight: 5,
  },
  countryCode: {
    fontSize: 16,
    color: '#333',
  },
  phoneInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 10,
    fontSize: 16,
    color: '#333',
  },
  buttonsContainer: {
    marginTop: 10,
  },
  sendButton: {
    backgroundColor: '#222',
    borderRadius: 4,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  disabledButton: {
    backgroundColor: '#aaa',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 15,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
  },
});

export default PhoneVerificationScreen;