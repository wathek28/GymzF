import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Code = () => {
  const { phoneNumber, fullPhoneNumber, role, verificationCode: initialVerificationCode } = useLocalSearchParams();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [errorMessage, setErrorMessage] = useState('');
  const inputRefs = useRef([]);
  const router = useRouter();

  useEffect(() => {
    if (initialVerificationCode) {
      const codeArray = initialVerificationCode.split('').slice(0, 6);
      setCode(codeArray);
    }
  }, [initialVerificationCode]);

  // Nouvelle fonction pour gérer le changement de code
  const handleCodeChange = (text, index) => {
    if (text.length > 1) return; // Empêcher plus d'un caractère

    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Si un chiffre est entré et ce n'est pas le dernier champ, passer au champ suivant
    if (text.length === 1 && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Nouvelle fonction pour gérer la touche retour arrière
  const handleBackspace = (index) => {
    if (index === 0) return;

    const newCode = [...code];
    // Si le champ actuel est vide, effacer le champ précédent et y déplacer le focus
    if (newCode[index] === '') {
      newCode[index - 1] = '';
      setCode(newCode);
      inputRefs.current[index - 1]?.focus();
    } else {
      // Si le champ actuel n'est pas vide, simplement l'effacer
      newCode[index] = '';
      setCode(newCode);
    }
  };

  const handleConnect = async () => {
    const verificationCode = code.join('');
  
    if (verificationCode.length !== 6) {
      setErrorMessage('Veuillez entrer un code à 6 chiffres.');
      return;
    }
  
    try {
      const response = await fetch('http://192.168.0.6:8082/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: fullPhoneNumber || `+216${phoneNumber}`,
          verificationCode,
          role: role?.toUpperCase() || 'USER',
        }),
      });
  
      const data = await response.json();
      console.log('Réponse du serveur:', data);
  
      if (response.ok) {
        console.log('Vérification réussie:', data.message);
  
        const authToken = data.token;
  
        if (authToken) {
          await AsyncStorage.setItem('authToken', authToken);
          console.log('Jeton stocké :', authToken);
  
          router.push({
            pathname: '/user',
            query: { authToken },
          });
        } else {
          setErrorMessage('Jeton non trouvé dans la réponse.');
        }
      } else {
        setErrorMessage(data.message || 'Échec de la vérification');
      }
    } catch (error) {
      console.error('Erreur lors de la vérification:', error);
      setErrorMessage('Une erreur s\'est produite lors de la vérification.');
    }
  };

  const handleResendCode = async () => {
    try {
      const response = await fetch('http://192.168.0.6:8082/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: fullPhoneNumber || `+216${phoneNumber}`,
          role: role?.toUpperCase() || 'USER',
        }),
      });

      const responseData = await response.json();

      if (response.ok) {
        console.log('Code de vérification renvoyé:', responseData.code);
        setErrorMessage('Un nouveau code a été envoyé.');
      } else {
        setErrorMessage(responseData.message || 'Erreur lors de l\'envoi du code.');
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

export default Code;