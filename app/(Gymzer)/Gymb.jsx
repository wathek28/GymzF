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
  StatusBar,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Service pour l'API de changement de numéro
class PhoneService {
  static BASE_URL = 'http://192.168.0.3:8082/api/auth/initiate-phone-change';

  // Méthode pour initier le changement de numéro
  static async initiatePhoneChange(currentPhoneNumber, newPhoneNumber) {
    try {
      // Préparer les données pour l'API
      const requestData = {
        currentPhoneNumber: currentPhoneNumber,
        newPhoneNumber: newPhoneNumber
      };

      console.log('Données envoyées:', requestData);

      // Effectuer la requête
      const response = await fetch(this.BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      // Vérifier la réponse du serveur
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erreur de réponse:', errorText);
        throw new Error(errorText || 'Erreur lors de l\'initiation du changement de numéro');
      }

      // Récupérer et retourner les données de réponse
      const responseData = await response.json();
      console.log('Réponse reçue:', responseData);
      return responseData;

    } catch (error) {
      console.error('Erreur d\'initiation de changement de numéro:', error);
      throw error;
    }
  }
}

const PhoneVerificationScreen = () => {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
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
  const [currentPhoneNumber, setCurrentPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");

  // Récupérer les données utilisateur au chargement du composant
  useEffect(() => {
    const getUserData = async () => {
      try {
        // Récupérer l'ID utilisateur
        if (paramUserId) {
          setUserId(paramUserId);
        } else {
          const storedUserId = await AsyncStorage.getItem('userId');
          if (storedUserId) {
            setUserId(storedUserId);
          }
        }
        
        // Récupérer le prénom
        if (paramFirstName) {
          setFirstName(paramFirstName);
        } else {
          const storedFirstName = await AsyncStorage.getItem('firstName');
          if (storedFirstName) {
            setFirstName(storedFirstName);
          }
        }
        
        // Récupérer la photo
        if (paramPhoto) {
          setUserPhoto(paramPhoto);
        } else {
          const storedPhoto = await AsyncStorage.getItem('userPhoto');
          if (storedPhoto) {
            setUserPhoto(storedPhoto);
          }
        }
        
        // Récupérer et définir le numéro de téléphone actuel
        if (paramPhoneNumber) {
          setCurrentPhoneNumber(paramPhoneNumber);
          const formattedNumber = paramPhoneNumber.replace('+216', '');
          setPhoneNumber(formattedNumber);
        } else {
          const storedPhoneNumber = await AsyncStorage.getItem('phoneNumber');
          if (storedPhoneNumber) {
            setCurrentPhoneNumber(storedPhoneNumber);
            const formattedNumber = storedPhoneNumber.replace('+216', '');
            setPhoneNumber(formattedNumber);
          }
        }
        
      } catch (error) {
        console.error('Erreur lors de la récupération des données utilisateur:', error);
        Alert.alert('Erreur', 'Impossible de charger les données utilisateur');
      }
    };
    
    getUserData();
  }, [paramUserId, paramFirstName, paramPhoneNumber, paramPhoto]);
  
  const handleSendSMS = async () => {
    // Validation du numéro de téléphone
    if (!phoneNumber || phoneNumber.length < 8) {
      Alert.alert('Erreur', 'Veuillez saisir un numéro de téléphone valide');
      return;
    }

    // Construire le nouveau numéro avec le préfixe
    const newPhoneNumber = `+216${phoneNumber}`;

    try {
      setIsLoading(true);
      
      // Appeler le service pour initier le changement de numéro
      const response = await PhoneService.initiatePhoneChange(
        currentPhoneNumber, 
        newPhoneNumber
      );

      // Naviguer vers la page de vérification du code
      router.push({
        pathname: '/Gymc',
        params: {
          userId: userId,
          firstName: firstName,
          currentPhoneNumber: currentPhoneNumber,
          newPhoneNumber: newPhoneNumber,
          photo: userPhoto,
          verificationCode: response.code // Ajouter le code de vérification
        }
      });
    } catch (error) {
      // Gérer les erreurs
      Alert.alert(
        'Erreur', 
        error.message || 'Impossible d\'envoyer le code de vérification'
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCancel = () => {
    navigateBack();
  };
  
  const navigateBack = () => {
    router.push({
      pathname: '/Gym',
      params: {
        userId: userId,
        firstName: firstName,
        phoneNumber: currentPhoneNumber,
        photo: userPhoto,
        // Ajouter le code de vérification comme nouveau paramètre
        verificationCode: verificationCode
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
              (isLoading || !phoneNumber || phoneNumber.length < 8) && styles.disabledButton
            ]} 
            onPress={handleSendSMS}
            activeOpacity={0.8}
            disabled={isLoading || !phoneNumber || phoneNumber.length < 8}
          >
            <Text style={styles.sendButtonText}>
              {isLoading ? 'Envoi en cours...' : 'Envoyer le code par SMS'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={handleCancel}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  // Les styles restent identiques à la version précédente
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