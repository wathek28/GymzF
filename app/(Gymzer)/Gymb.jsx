import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';

const PhoneVerificationScreen = () => {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const handleSendSMS = () => {
    console.log('Code de vérification envoyé au numéro:', phoneNumber);
    router.push('/Gymc');
    // Logique pour envoyer le SMS
  };
  
  const handleCancel = () => {
    console.log('Modification annulée');
    router.back();
  };
  
  const navigateBack = () => {
    router.push('/Gym');
    
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
            style={styles.sendButton} 
            onPress={handleSendSMS}
            activeOpacity={0.8}
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