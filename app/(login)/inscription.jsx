import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Image, Alert, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

const API_URL = 'http://192.168.1.194:8082/api/auth/register';

const Inscription = () => {
 const [phoneNumber, setPhoneNumber] = useState('');
 const [loading, setLoading] = useState(false);
 const router = useRouter();
 const { role } = useLocalSearchParams();

 useEffect(() => {
   console.log('Role reçu:', role);
 }, [role]);

 const handleContinue = async () => {
  // Validation for phone number
  if (phoneNumber.length !== 8) {
    return Alert.alert('Erreur', 'Veuillez entrer un numéro de téléphone valide de 8 chiffres');
  }
  
  setLoading(true);
  try {
    const fullPhoneNumber = `+216${phoneNumber}`;
    const data = {
      phoneNumber: fullPhoneNumber,
      role: role?.toUpperCase() || 'USER'
    };
    
    console.log('Envoi données:', data);
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const responseData = await response.json();
    console.log('Réponse:', responseData);

    if (response.ok) {
      router.push({
        pathname: '/Code',
        params: {
          phoneNumber: phoneNumber,
          fullPhoneNumber: fullPhoneNumber,
          role: role?.toUpperCase() || 'USER',
          verificationCode: responseData.code // Le code provenant du backend
        }
      });
    } else {
      // Handle API errors
      Alert.alert('Erreur', responseData.message || 'Une erreur est survenue');
    }
  } catch (error) {
    console.error('Erreur de connexion:', error);
    Alert.alert('Erreur', 'Problème de connexion. Veuillez réessayer');
  } finally {
    setLoading(false);
  }
};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Image
              source={require('../../assets/images/F.png')}
              style={styles.backIcon}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.mainContent}>
          <Text style={styles.title}>Inscrivez-vous avec le numéro de téléphone</Text>

          <Text style={styles.subtitle}>
            Recevez un code de confirmation pour sécuriser votre compte
          </Text>

          <View style={styles.inputContainer}>
            <View style={styles.countryCode}>
              <Image
                source={require('../../assets/images/R.png')}
                style={styles.flagIcon}
              />
              <Text style={styles.countryCodeText}>+216</Text>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Numéro de téléphone"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={(text) => setPhoneNumber(text.replace(/[^0-9]/g, ''))}
              maxLength={8}
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.continueButton,
              phoneNumber.length === 8 && styles.continueButtonActive,
            ]}
            onPress={handleContinue}
            disabled={phoneNumber.length !== 8 || loading}
          >
            <Text style={styles.continueButtonText}>
              {loading ? 'Chargement...' : 'Continuer'}
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>J'ai déjà un compte ? </Text>
            <TouchableOpacity onPress={() => router.push('/connect')}>
              <Text style={styles.loginText}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Styles remain the same as in previous version
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
});

export default Inscription;