import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';

const Connect = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  const handleContinue = async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');  // Réinitialise le message d'erreur avant la validation

      // Validation du numéro
      if (phoneNumber.length !== 8) {
        setErrorMessage('Le numéro doit contenir 8 chiffres');
        return;
      }

      if (!/^\d+$/.test(phoneNumber)) {
        setErrorMessage('Le numéro ne doit contenir que des chiffres');
        return;
      }

      // Ajout du code du pays
      const phoneWithCountryCode = `+216${phoneNumber}`;
      console.log('Numéro avec code pays:', phoneWithCountryCode); // Log pour vérifier le numéro

      // Envoi du code de connexion à l'API
      const response = await fetch('http://192.168.1.194:8082/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber: phoneWithCountryCode }),
      });

      const data = await response.json();
      console.log('Réponse de l\'API:', data); // Log pour vérifier la réponse de l'API

      // Vérification de la réponse de l'API
      if (response.ok) {
        // Si la réponse est OK, on redirige l'utilisateur vers la page de saisie du code
        router.push({
          pathname: '/codeC',
          params: { phoneNumber: phoneWithCountryCode },
        });
      } else {
        // Si la réponse contient un message d'erreur, on l'affiche
        setErrorMessage(data.message || "Une erreur est survenue.");
      }
    } catch (error) {
      // Gestion des erreurs de réseau ou autres problèmes
      console.error('Erreur réseau:', error); // Log l'erreur pour le débogage
      setErrorMessage("Une erreur est survenue lors de l'envoi du code.");
    } finally {
      // Réinitialisation de l'état de chargement
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Image source={require('../../assets/images/F.png')} style={styles.backIcon} />
          </TouchableOpacity>
        </View>

        <View style={styles.mainContent}>
          <Text style={styles.title}>Connectez-vous avec votre numéro</Text>
          <Text style={styles.subtitle}>Nous enverrons un code pour sécuriser votre accès</Text>

          <View style={styles.inputContainer}>
            <View style={styles.countryCode}>
              <Image source={require('../../assets/images/R.png')} style={styles.flagIcon} />
              <Text style={styles.countryCodeText}>+216</Text>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Numéro de téléphone"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={(text) => {
                setPhoneNumber(text.trim());
                setErrorMessage('');  // Reset error when the user changes the input
              }}
              maxLength={8}
              editable={!isLoading}
            />
          </View>

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <TouchableOpacity
            style={[
              styles.continueButton,
              phoneNumber.length === 8 ? styles.continueButtonActive : null,
              isLoading && styles.continueButtonDisabled
            ]}
            onPress={handleContinue}
            disabled={phoneNumber.length !== 8 || isLoading}
          >
            <Text style={styles.continueButtonText}>
              {isLoading ? 'Vérification...' : 'Continuer'}
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Pas encore de compte</Text>
            <TouchableOpacity onPress={() => router.push('/inscription')}>
              <Text style={styles.loginText}> S'inscrire</Text>
            </TouchableOpacity>
          </View>
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
  },
  header: {
    marginBottom: 20,
  },
  backButton: {
    padding: 10,
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  mainContent: {
    flex: 1,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: '#E5E5E5',
  },
  flagIcon: {
    width: 24,
    height: 16,
    marginRight: 5,
  },
  countryCodeText: {
    fontSize: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  continueButton: {
    backgroundColor: '#E5E5E5',
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  continueButtonActive: {
    backgroundColor: '#000',
  },
  continueButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#666',
  },
  loginText: {
    color: '#000',
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default Connect;
