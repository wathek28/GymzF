import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Keyboard,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

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

  const handleConfirm = () => {
    const fullCode = verificationCode.join('');
    
    if (fullCode.length === 6 && !fullCode.includes('')) {
      // Verification logic here
      console.log('Verification code:', fullCode);
      Keyboard.dismiss();
      // Navigate to next screen or verify code
      router.push('/gymc');
    } else {
      // Show error that all digits must be filled
      alert('Veuillez saisir le code complet');
    }
  };

  const handleResendCode = () => {
    // Logic to resend verification code
    alert('Un nouveau code a été envoyé');
  };

  const handleContactSupport = () => {
    // Logic to contact support
    alert('Contactez le support');
  };

  const navigateBack = () => {
    // Navigate back to previous screen
    router.push('/Gymb');
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
    fontWeight: 'bold',
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