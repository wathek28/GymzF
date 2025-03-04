import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CodeC = () => {
  const { phoneNumber, fullPhoneNumber, role } = useLocalSearchParams();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [errorMessage, setErrorMessage] = useState('');
  const inputRefs = useRef([]);
  const router = useRouter();

  // Handle code input change
  const handleCodeChange = (text, index) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Auto-focus next input if digit is entered
    if (text && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  // Handle backspace to move to previous input
  const handleBackspace = (index) => {
    if (index > 0 && !code[index]) {
      inputRefs.current[index - 1].focus();
    }
  };

  // Verify code and navigate
  const handleConnect = async () => {
    const verificationCode = code.join('');
  
    // Validate 6-digit code
    if (verificationCode.length !== 6) {
      setErrorMessage('Veuillez entrer un code à 6 chiffres.');
      return;
    }
  
    try {
      const formattedPhoneNumber = fullPhoneNumber || 
        (phoneNumber.startsWith('+') ? phoneNumber : `+216${phoneNumber}`);
  
      console.log('Formatted Phone Number:', formattedPhoneNumber);
      console.log('Verification Code:', verificationCode);
      console.log('Role:', role?.toUpperCase() || 'USER');
  
      const response = await fetch('http://192.168.0.7:8082/api/auth/verify-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: formattedPhoneNumber, 
          verificationCode,
          role: role?.toUpperCase() || 'USER',
        }),
      });
  
      const data = await response.json();
      console.log('Réponse du serveur:', data);
  
      if (response.ok) {
        const authToken = data.token;
        const userId = data.userId; // Récupération de l'ID utilisateur
        const firstName = data.firstName; // Récupération du prénom de l'utilisateur
        const userPhoneNumber = data.phoneNumber; // Récupération du numéro de téléphone
        const userPhoto = data.photo; // Récupération de la photo
        const userEmail = data.email; // Récupération de l'email
  
        if (authToken && userId) {
          // Stocker le token, l'userId, le firstName, le phoneNumber, la photo et l'email dans AsyncStorage
          await AsyncStorage.setItem('authToken', authToken);
          await AsyncStorage.setItem('userId', userId.toString()); // Stocker l'userId comme chaîne
          
          // Stocker le firstName s'il existe
          if (firstName) {
            await AsyncStorage.setItem('firstName', firstName);
          }

          // Stocker le phoneNumber s'il existe
          if (userPhoneNumber) {
            await AsyncStorage.setItem('phoneNumber', userPhoneNumber);
          }

          // Stocker la photo s'il existe
          if (userPhoto) {
            await AsyncStorage.setItem('userPhoto', userPhoto);
          }
          
          // Stocker l'email s'il existe
          if (userEmail) {
            await AsyncStorage.setItem('userEmail', userEmail);
          }
          
          console.log('userId passé à home:', userId);
          console.log('firstName passé à home:', firstName);
          console.log('phoneNumber passé à home:', userPhoneNumber);
          console.log('photo passée à home:', userPhoto ? 'Disponible' : 'Non disponible');
          console.log('email passé à home:', userEmail || 'Non disponible');
          
          // Naviguer vers la page d'accueil avec tous les paramètres
          router.push({
            pathname: '/home',
            params: { 
              userId: userId,
              firstName: firstName || '', // Passer une chaîne vide si firstName est null/undefined
              phoneNumber: userPhoneNumber || '', // Passer une chaîne vide si phoneNumber est null/undefined
              photo: userPhoto || '', // Passer une chaîne vide si photo est null/undefined
              email: userEmail || '' // Passer une chaîne vide si email est null/undefined
            }
          });
        } else {
          setErrorMessage('Jeton ou identifiant utilisateur non trouvé.');
        }
      } else {
        setErrorMessage(data.message || 'Code incorrect. Veuillez réessayer.');
        Alert.alert(
          'Échec de la connexion', 
          data.message || 'Impossible de vérifier votre compte',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Erreur lors de la vérification:', error);
      setErrorMessage('Une erreur s\'est produite lors de la vérification.');
    }
  };
  

  // Resend verification code
  const handleResendCode = async () => {
    try {
      // Ensure consistent phone number format
      const formattedPhoneNumber = fullPhoneNumber || 
        (phoneNumber.startsWith('+') ? phoneNumber : `+216${phoneNumber}`);

      const response = await fetch('http://192.168.0.7:8082/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: formattedPhoneNumber, 
          role: role?.toUpperCase() || 'USER',
        }),
      });

      const responseData = await response.json();

      if (response.ok) {
        console.log('Nouveau code de vérification:', responseData.code);
        setErrorMessage('Un nouveau code a été envoyé.');
      } else {
        setErrorMessage(responseData.message || 'Erreur lors de l\'envoi du code.');
        
        // Optional: Show an alert with more details
        Alert.alert(
          'Échec de l\'envoi', 
          responseData.message || 'Impossible de renvoyer le code',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error);
      setErrorMessage('Une erreur s\'est produite lors de l\'envoi du code.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>✓</Text>
          </View>
          <Text style={styles.title}>Confirmez votre compte</Text>
        </View>

        <Text style={styles.subtitle}>
          Entrez le code de vérification reçu par SMS à votre numéro de téléphone
        </Text>

        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={styles.codeInput}
              maxLength={1}
              keyboardType="numeric"
              value={digit}
              onChangeText={(text) => handleCodeChange(text, index)}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === 'Backspace') {
                  handleBackspace(index);
                }
              }}
            />
          ))}
        </View>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <TouchableOpacity style={styles.connectButton} onPress={handleConnect}>
          <Text style={styles.connectButtonText}>Se connecter</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resendButton} onPress={handleResendCode}>
          <Text style={styles.resendButtonText}>Renvoyer le code</Text>
        </TouchableOpacity>

        <View style={styles.supportContainer}>
          <Text style={styles.supportText}>
            Vous n'avez pas reçu le code?{' '}
            <Text style={styles.supportLink}>Contacter le support</Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  icon: {
    color: '#fff',
    fontSize: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  codeInput: {
    width: 45,
    height: 45,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginHorizontal: 5,
    fontSize: 24,
    textAlign: 'center',
  },
  connectButton: {
    backgroundColor: '#000',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 30,
    width: '100%',
    marginBottom: 20,
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  resendButton: {
    marginBottom: 20,
  },
  resendButtonText: {
    color: '#000',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginBottom: 10,
  },
  supportContainer: {
    position: 'absolute',
    bottom: 30,
    alignItems: 'center',
  },
  supportText: {
    color: '#666',
    fontSize: 14,
  },
  supportLink: {
    color: '#000',
    fontWeight: 'bold',
  },
});

export default CodeC;