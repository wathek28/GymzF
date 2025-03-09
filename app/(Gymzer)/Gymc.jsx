import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Keyboard,
  StatusBar,
  Alert
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Service for Phone Number Change Confirmation
class PhoneChangeService {
  static BASE_URL_INITIATE = 'http://192.168.0.3:8082/api/auth/initiate-phone-change';
  static BASE_URL_CONFIRM = 'http://192.168.0.3:8082/api/auth/confirm-phone-change';

  // Méthode pour initier le changement de numéro (réutilisée pour renvoyer le code)
  static async initiatePhoneChange(currentPhoneNumber, newPhoneNumber) {
    try {
      const requestData = {
        currentPhoneNumber: currentPhoneNumber,
        newPhoneNumber: newPhoneNumber
      };

      console.log('(NOBRIDGE) LOG Réinitialisation Code Request:', JSON.stringify(requestData));

      const response = await fetch(this.BASE_URL_INITIATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      // Vérifier la réponse du serveur
      if (!response.ok) {
        const errorText = await response.text();
        console.error('(NOBRIDGE) LOG Erreur de réinitialisation:', errorText);
        throw new Error(errorText || 'Impossible de renvoyer le code');
      }

      // Récupérer et retourner les données de réponse
      const responseData = await response.json();
      console.log('(NOBRIDGE) LOG Réinitialisation Code Response:', JSON.stringify(responseData));
      return responseData;

    } catch (error) {
      console.error('(NOBRIDGE) LOG Erreur de réinitialisation de code:', error);
      throw error;
    }
  }

  static async confirmPhoneChange(currentPhoneNumber, verificationCode) {
    try {
      const requestData = {
        currentPhoneNumber: currentPhoneNumber,
        verificationCode: verificationCode
      };

      console.log('(NOBRIDGE) LOG API Request:', JSON.stringify(requestData));

      const response = await fetch(this.BASE_URL_CONFIRM, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      // Check the response
      if (!response.ok) {
        const errorText = await response.text();
        console.error('(NOBRIDGE) LOG API Error:', errorText);
        throw new Error(errorText || 'Erreur lors de la confirmation du changement de numéro');
      }

      // Parse and return the response data
      const responseData = await response.json();
      console.log('(NOBRIDGE) LOG API Response:', JSON.stringify(responseData));
      return responseData;
    } catch (error) {
      console.error('(NOBRIDGE) LOG Erreur de confirmation de changement de numéro:', error);
      throw error;
    }
  }
}

const VerificationCodeScreen = () => {
  const router = useRouter();
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null)
  ];

  // Récupérer les paramètres de navigation
  const params = useLocalSearchParams();
  const { 
    userId, 
    firstName, 
    currentPhoneNumber, 
    newPhoneNumber, 
    photo,
    verificationCode: navigationVerificationCode 
  } = params;

  // Effet pour logger les informations détaillées
  useEffect(() => {
    const logDetailedInformation = async () => {
      try {
        // Log tous les paramètres bruts
        console.log('(NOBRIDGE) LOG Tous les paramètres:', JSON.stringify(params));

        console.log('(NOBRIDGE) LOG Données de navigation:');
        console.log('(NOBRIDGE) LOG userId:', userId);
        console.log('(NOBRIDGE) LOG firstName:', firstName);
        console.log('(NOBRIDGE) LOG currentPhoneNumber:', currentPhoneNumber);
        console.log('(NOBRIDGE) LOG newPhoneNumber:', newPhoneNumber);
        console.log('(NOBRIDGE) LOG photo:', photo ? 'présente' : 'non présente');
        console.log('(NOBRIDGE) LOG verificationCode:', navigationVerificationCode);

        // Tenter de récupérer les données depuis AsyncStorage si nécessaire
        const storedCurrentPhone = await AsyncStorage.getItem('currentPhoneNumber');
        const storedNewPhone = await AsyncStorage.getItem('newPhoneNumber');
        
        console.log('(NOBRIDGE) LOG Stockage AsyncStorage:');
        console.log('(NOBRIDGE) LOG Stored Current Phone:', storedCurrentPhone);
        console.log('(NOBRIDGE) LOG Stored New Phone:', storedNewPhone);

      } catch (error) {
        console.error('Erreur lors du logging des informations:', error);
      }
    };

    logDetailedInformation();
  }, [params]);

  const handleCodeChange = (text, index) => {
    const newCode = [...verificationCode];
    newCode[index] = text;
    setVerificationCode(newCode);

    // Move to next input when a digit is entered
    if (text.length === 1 && index < 5) {
      inputRefs[index + 1].current.focus();
    }

    // Move back to previous input if current is empty and backspace is pressed
    if (text.length === 0 && index > 0) {
      inputRefs[index - 1].current.focus();
    }
  };

  const handleConfirm = async () => {
    // Supprimer les espaces vides du code de vérification
    const fullCode = verificationCode.filter(digit => digit.trim() !== '').join('');
    
    // Récupérer le numéro de téléphone actuel depuis AsyncStorage si nécessaire
    const storedCurrentPhone = await AsyncStorage.getItem('currentPhoneNumber');
    const storedNewPhone = await AsyncStorage.getItem('newPhoneNumber');

    // Utiliser le numéro stocké si les paramètres sont vides
    const phoneToUse = currentPhoneNumber || storedCurrentPhone;
    const newPhoneToUse = newPhoneNumber || storedNewPhone;

    console.log('(NOBRIDGE) LOG Numéro utilisé pour la confirmation:', phoneToUse);
    console.log('(NOBRIDGE) LOG Nouveau numéro:', newPhoneToUse);
    
    // Vérifier si tous les champs sont remplis
    if (fullCode.length === 6) {
      try {
        // Appeler l'API de confirmation de changement de numéro
        const response = await PhoneChangeService.confirmPhoneChange(
          phoneToUse, 
          fullCode
        );

        Keyboard.dismiss();
        console.log('(NOBRIDGE) LOG Code de vérification confirmé');
        
        // Afficher un message de succès
        Alert.alert(
          'Succès', 
          'Votre numéro de téléphone a été modifié avec succès.',
          [{ 
            text: 'OK', 
            onPress: () => {
              // Naviguer vers Gymc avec les informations utilisateur et le profil mis à jour
              router.push({
                pathname: '/Gym',
                params: {
                  userId: userId,
                  firstName: firstName,
                  phoneNumber: response.profile.phoneNumber,
                  photo: photo,
                  email: response.profile.email,
                  role: response.profile.role
                }
              });
            } 
          }]
        );
      } catch (error) {
        // Gérer les erreurs de l'API
        Alert.alert(
          'Erreur', 
          error.message || 'Impossible de confirmer le changement de numéro'
        );
      }
    } else {
      // Tous les champs doivent être remplis
      Alert.alert('Incomplet', 'Veuillez saisir le code complet');
    }
  };

  const handleResendCode = async () => {
    try {
      // Logs détaillés pour déboguer
      console.log('(NOBRIDGE) LOG Données de navigation:');
      console.log('(NOBRIDGE) LOG userId:', userId);
      console.log('(NOBRIDGE) LOG firstName:', firstName);
      console.log('(NOBRIDGE) LOG currentPhoneNumber:', currentPhoneNumber);
      console.log('(NOBRIDGE) LOG newPhoneNumber:', newPhoneNumber);
      console.log('(NOBRIDGE) LOG photo:', photo ? 'présente' : 'non présente');
      console.log('(NOBRIDGE) LOG verificationCode:', navigationVerificationCode);

      // Utiliser directement les paramètres de navigation
      const currentPhone = currentPhoneNumber;
      const newPhone = newPhoneNumber;

      // Vérifier que les numéros sont disponibles
      if (!currentPhone || !newPhone) {
        throw new Error('Impossible de récupérer les numéros de téléphone');
      }

      // Appeler l'API pour réinitialiser le code
      const response = await PhoneChangeService.initiatePhoneChange(
        currentPhone, 
        newPhone
      );

      // Log détaillé du code de vérification
      console.log('(NOBRIDGE) LOG Code de vérification reçu:', response.code);
      console.log('(NOBRIDGE) LOG Détails complets de la réponse:', JSON.stringify(response));

      // Réinitialiser le code de vérification
      setVerificationCode(['', '', '', '', '', '']);

      // Afficher un message de succès
      Alert.alert(
        'Code renvoyé', 
        `Un nouveau code de vérification a été envoyé. Code: ${response.code}`
      );
    } catch (error) {
      // Gérer les erreurs
      console.error('(NOBRIDGE) LOG Erreur de renvoi de code:', error);
      console.error('(NOBRIDGE) LOG Détails de l\'erreur:', error.message);
      
      Alert.alert(
        'Erreur', 
        error.message || 'Impossible de renvoyer le code'
      );
    }
  };

  const handleContactSupport = () => {
    // TODO: Implémenter la logique de contact du support
    Alert.alert('Support', 'Contactez notre support technique');
  };

  const navigateBack = () => {
    // Retour à l'écran précédent avec les informations utilisateur
    router.push({
      pathname: '/Gymb',
      params: {
        userId: userId,
        firstName: firstName,
        phoneNumber: currentPhoneNumber,
        photo: photo
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={navigateBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
           <Ionicons name="chevron-back" size={24} color="#ccc" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>Vérification du numéro de téléphone</Text>
        <Text style={styles.subtitle}>
          Un code de vérification a été envoyé à votre numéro de téléphone
        </Text>

        <Text style={styles.instruction}>Entrez le code ci-dessous</Text>

        <View style={styles.codeContainer}>
          {verificationCode.map((digit, index) => (
            <TextInput
              key={index}
              ref={inputRefs[index]}
              style={[
                styles.codeInput,
                // Add black border when a digit is entered
                digit !== '' && styles.filledInput
              ]}
              keyboardType="numeric"
              maxLength={1}
              value={digit}
              onChangeText={(text) => handleCodeChange(text, index)}
              placeholderTextColor="#999"
              textAlign="center"
            />
          ))}
        </View>

        <TouchableOpacity 
          style={styles.confirmButton} 
          onPress={handleConfirm}
        >
          <Text style={styles.confirmButtonText}>Confirmer</Text>
        </TouchableOpacity>

        <View style={styles.linkContainer}>
          <TouchableOpacity onPress={handleResendCode}>
            <Text style={styles.linkText}>Renvoyer le code</Text>
          </TouchableOpacity>
          <Text style={styles.separator}>•</Text>
          <TouchableOpacity onPress={handleContactSupport}>
            <Text style={styles.linkText}>Contactez le support</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // ... (styles remain the same as in the previous version)
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  content: {
    marginTop: 20,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 15,
  },
  instruction: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 30,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  codeInput: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginHorizontal: 5,
    fontSize: 24,
    color: '#000',
    backgroundColor: '#fff',
  },
  filledInput: {
    borderColor: '#000',
  },
  confirmButton: {
    backgroundColor: '#000',
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#000',
    marginHorizontal: 10,
  },
  separator: {
    color: '#888',
  },
});

export default VerificationCodeScreen;