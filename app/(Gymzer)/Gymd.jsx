import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HelpCenterScreen = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [userId, setUserId] = useState(null);
  const [userPhoto, setUserPhoto] = useState('');

  // Récupération des paramètres via useLocalSearchParams
  const params = useLocalSearchParams();
  const { 
    userId: paramUserId, 
    firstName: paramFirstName,
    phoneNumber: paramPhoneNumber,
    photo: paramPhoto,
    email: paramEmail
  } = params;

  // Récupérer les données utilisateur au chargement du composant
  useEffect(() => {
    const getUserData = async () => {
      try {
        console.log('=== RÉCUPÉRATION DES DONNÉES DANS HELPCENTERDCREEN ===');
        
        // Vérification des paramètres reçus
        console.log('Paramètres reçus:', {
          userId: paramUserId || 'non défini',
          firstName: paramFirstName || 'non défini',
          phoneNumber: paramPhoneNumber || 'non défini',
          photo: paramPhoto ? 'présente' : 'non définie',
          email: paramEmail || 'non défini'
        });
        
        // Récupération de l'ID utilisateur
        if (paramUserId) {
          console.log('ID utilisateur trouvé dans les paramètres:', paramUserId);
          setUserId(paramUserId);
        } else {
          // Essayer de récupérer l'ID depuis AsyncStorage
          const storedUserId = await AsyncStorage.getItem('userId');
          if (storedUserId) {
            console.log('ID utilisateur récupéré de AsyncStorage:', storedUserId);
            setUserId(storedUserId);
          } else {
            console.warn('Aucun ID utilisateur trouvé');
          }
        }
        
        // Récupération du nom
        if (paramFirstName) {
          console.log('FirstName trouvé dans les paramètres:', paramFirstName);
          setName(paramFirstName);
        } else {
          // Essayer de récupérer le firstName depuis AsyncStorage
          const storedFirstName = await AsyncStorage.getItem('firstName');
          if (storedFirstName) {
            console.log('FirstName récupéré de AsyncStorage:', storedFirstName);
            setName(storedFirstName);
          } else {
            console.warn('Aucun firstName trouvé');
          }
        }
        
        // Récupération de l'email
        if (paramEmail) {
          console.log('Email trouvé dans les paramètres:', paramEmail);
          setEmail(paramEmail);
        } else {
          // Essayer de récupérer l'email depuis AsyncStorage
          const storedEmail = await AsyncStorage.getItem('userEmail');
          if (storedEmail) {
            console.log('Email récupéré de AsyncStorage:', storedEmail);
            setEmail(storedEmail);
          } else {
            console.warn('Aucun email trouvé');
          }
        }
        
        // Récupération du numéro de téléphone
        if (paramPhoneNumber) {
          console.log('PhoneNumber trouvé dans les paramètres:', paramPhoneNumber);
          setPhoneNumber(paramPhoneNumber);
        } else {
          // Essayer de récupérer le phoneNumber depuis AsyncStorage
          const storedPhoneNumber = await AsyncStorage.getItem('phoneNumber');
          if (storedPhoneNumber) {
            console.log('PhoneNumber récupéré de AsyncStorage:', storedPhoneNumber);
            setPhoneNumber(storedPhoneNumber);
          } else {
            console.warn('Aucun phoneNumber trouvé');
          }
        }
        
        // Récupération de la photo (pour passer aux écrans suivants)
        if (paramPhoto) {
          console.log('Photo trouvée dans les paramètres');
          setUserPhoto(paramPhoto);
        } else {
          // Essayer de récupérer la photo depuis AsyncStorage
          const storedPhoto = await AsyncStorage.getItem('userPhoto');
          if (storedPhoto) {
            console.log('Photo récupérée de AsyncStorage');
            setUserPhoto(storedPhoto);
          } else {
            console.warn('Aucune photo trouvée');
          }
        }
        
      } catch (error) {
        console.error('Erreur lors de la récupération des données utilisateur:', error);
      }
    };
    
    getUserData();
  }, [paramUserId, paramFirstName, paramPhoneNumber, paramPhoto, paramEmail]);

  const handleSendMessage = () => {
    // Validation
    if (!name || !email || !phoneNumber || !message) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    // Send message logic
    console.log('Message envoyé:', { name, email, phoneNumber, message });
    alert('Votre message a été envoyé avec succès');
    
    // Optionally reset form or navigate back with user data
    navigateBack();
  };

  const navigateBack = () => {
    // Retourner à l'écran précédent avec les données utilisateur
    router.push({
      pathname: '/Gym',
      params: {
        userId: userId,
        firstName: name,
        phoneNumber: phoneNumber,
        photo: userPhoto,
        email: email
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={navigateBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color="#999" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Centre d'aide</Text>
        </View>

        <ScrollView 
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Besoin d'aide ?</Text>
          <Text style={styles.subtitle}>
            Nous sommes là pour vous aider. Contactez notre support en cas de problème ou de question.
          </Text>

          <View style={styles.inputContainer}>
            <View style={styles.iconInputContainer}>
              <Ionicons name="person-outline" size={20} color="#888" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Nom et Prénom"
                placeholderTextColor="#888"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.iconInputContainer}>
              <Ionicons name="mail-outline" size={20} color="#888" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="E-mail"
                placeholderTextColor="#888"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.iconInputContainer}>
              <Ionicons name="call-outline" size={20} color="#888" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Numéro de téléphone"
                placeholderTextColor="#888"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
              />
            </View>

            <TextInput
              style={styles.messageInput}
              placeholder="Votre Message :"
              placeholderTextColor="#888"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={message}
              onChangeText={setMessage}
            />
          </View>

          <TouchableOpacity 
            style={styles.sendButton} 
            onPress={handleSendMessage}
          >
            <Text style={styles.sendButtonText}>Envoyer</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  iconInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  messageInput: {
    height: 120,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#000',
    borderRadius: 5,
    paddingVertical: 15,
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HelpCenterScreen;