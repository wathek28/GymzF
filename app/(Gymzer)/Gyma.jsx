import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const PersonalInfoForm = () => {
  const router = useRouter();
  const [screenDimensions, setScreenDimensions] = useState({ width, height });
  
  // Récupération des paramètres via useLocalSearchParams
  const params = useLocalSearchParams();
  const { 
    userId: paramUserId, 
    firstName: paramFirstName,
    phoneNumber: paramPhoneNumber,
    photo: paramPhoto,
    email: paramEmail // Ajout de la récupération de l'email depuis les paramètres
  } = params;
  
  // États pour les données utilisateur
  const [userId, setUserId] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [userPhoto, setUserPhoto] = useState("");
  const [userEmail, setUserEmail] = useState(""); // Ajout d'un état pour l'email
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    birthDate: "",
    address: ""
  });

  // Récupérer les données utilisateur et initialiser le formulaire
  useEffect(() => {
    const getUserData = async () => {
      try {
        console.log('=== RÉCUPÉRATION DES DONNÉES DANS PERSONALINFOFORM ===');
        
        // Vérification des paramètres reçus
        console.log('Paramètres reçus:', {
          userId: paramUserId || 'non défini',
          firstName: paramFirstName || 'non défini',
          phoneNumber: paramPhoneNumber || 'non défini',
          photo: paramPhoto ? 'présente' : 'non définie',
          email: paramEmail || 'non défini' // Log de l'email reçu
        });
        
        // Priorité 1: Utiliser les données des paramètres de navigation si elles existent
        if (paramUserId) {
          console.log('ID utilisateur trouvé dans les paramètres:', paramUserId);
          setUserId(paramUserId);
        }
        
        let userFirstName = "";
        let userEmail = ""; // Variable pour stocker l'email récupéré
        
        if (paramFirstName) {
          console.log('FirstName trouvé dans les paramètres:', paramFirstName);
          userFirstName = paramFirstName;
          setFirstName(paramFirstName);
        } else {
          // Essayer de récupérer le firstName depuis AsyncStorage
          const storedFirstName = await AsyncStorage.getItem('firstName');
          if (storedFirstName) {
            console.log('FirstName récupéré de AsyncStorage:', storedFirstName);
            userFirstName = storedFirstName;
            setFirstName(storedFirstName);
          } else {
            console.warn('Aucun firstName trouvé');
          }
        }
        
        // Récupérer l'email
        if (paramEmail) {
          console.log('Email trouvé dans les paramètres:', paramEmail);
          userEmail = paramEmail;
          setUserEmail(paramEmail);
        } else {
          // Essayer de récupérer l'email depuis AsyncStorage
          const storedEmail = await AsyncStorage.getItem('userEmail');
          if (storedEmail) {
            console.log('Email récupéré de AsyncStorage:', storedEmail);
            userEmail = storedEmail;
            setUserEmail(storedEmail);
          } else {
            console.warn('Aucun email trouvé');
          }
        }
        
        // Mettre à jour le formulaire avec le nom et l'email récupérés
        setFormData(prevData => ({
          ...prevData,
          fullName: userFirstName,
          email: userEmail // Initialiser le champ email avec l'email récupéré
        }));
        
        // Récupérer le numéro de téléphone
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
        
        // Récupérer la photo
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
        
        // Priorité 2: Récupérer l'ID de l'AsyncStorage si non présent dans les paramètres
        if (!paramUserId) {
          const storedUserId = await AsyncStorage.getItem('userId');
          if (storedUserId) {
            console.log('ID utilisateur récupéré de AsyncStorage:', storedUserId);
            setUserId(storedUserId);
          } else {
            console.warn('Aucun ID utilisateur trouvé');
          }
        }
        
      } catch (error) {
        console.error('Erreur lors de la récupération des données utilisateur:', error);
      }
    };
    
    getUserData();
  }, [paramUserId, paramFirstName, paramPhoneNumber, paramPhoto, paramEmail]);

  // Mettre à jour les dimensions lors de la rotation de l'écran
  useEffect(() => {
    const subscription = Dimensions.addEventListener(
      'change',
      ({ window }) => {
        setScreenDimensions({ width: window.width, height: window.height });
      }
    );
    return () => subscription?.remove();
  }, []);

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const handleSubmit = async () => {
    console.log('Données enregistrées:', formData);
    
    // Stocker l'email mis à jour dans AsyncStorage
    if (formData.email) {
      try {
        await AsyncStorage.setItem('userEmail', formData.email);
        console.log('Email mis à jour dans AsyncStorage:', formData.email);
        setUserEmail(formData.email);
      } catch (error) {
        console.error('Erreur lors de la sauvegarde de l\'email:', error);
      }
    }
    
    // Enregistrer les données et retourner à la page précédente avec les paramètres utilisateur
    navigateToGym();
  };

  const handleCancel = () => {
    console.log('Formulaire annulé');
    navigateToGym();
  };
  
  const navigateToGym = () => {
    router.push({
      pathname: '/Gym',
      params: {
        userId: userId,
        firstName: firstName,
        phoneNumber: phoneNumber,
        photo: userPhoto,
        email: userEmail // Passer l'email en paramètre
      }
    });
  };

  // Déterminer si l'appareil est en mode paysage
  const isLandscape = screenDimensions.width > screenDimensions.height;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={navigateToGym}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chevron-back" size={24} color="#999" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Information personnelles</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={[
            styles.formContainer,
            isLandscape && styles.formContainerLandscape
          ]}>
            {/* Nom et prénom */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="person-outline" size={20} color="#555" />
                <Text style={styles.label}>Nom et prénom</Text>
              </View>
              <TextInput
                style={styles.input}
                value={formData.fullName}
                onChangeText={(text) => handleChange('fullName', text)}
                returnKeyType="next"
                autoCapitalize="words"
                placeholder="Votre nom et prénom"
              />
            </View>

            {/* E-mail */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="mail-outline" size={20} color="#555" />
                <Text style={styles.label}>E-mail</Text>
              </View>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => handleChange('email', text)}
                keyboardType="email-address"
                returnKeyType="next"
                autoCapitalize="none"
                autoComplete="email"
                placeholder="Votre adresse e-mail"
              />
            </View>

            {/* Date de naissance */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="calendar-outline" size={20} color="#555" />
                <Text style={styles.label}>Date de naissance</Text>
              </View>
              <TextInput
                style={styles.input}
                value={formData.birthDate}
                onChangeText={(text) => handleChange('birthDate', text)}
                returnKeyType="next"
                keyboardType={Platform.OS === 'ios' ? 'default' : 'numeric'}
                placeholder="JJ/MM/AAAA"
              />
            </View>

            {/* Adresse */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="location-outline" size={20} color="#555" />
                <Text style={styles.label}>Adresse</Text>
              </View>
              <TextInput
                style={styles.input}
                value={formData.address}
                onChangeText={(text) => handleChange('address', text)}
                returnKeyType="done"
                placeholder="Votre adresse complète"
              />
            </View>

            {/* Boutons */}
            <View style={[
              styles.buttonContainer,
              isLandscape && styles.buttonContainerLandscape
            ]}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={handleCancel}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.submitButton} 
                onPress={handleSubmit}
                activeOpacity={0.7}
              >
                <Text style={styles.submitButtonText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  formContainer: {
    padding: 16,
    backgroundColor: '#fff',
    flex: 1,
  },
  formContainerLandscape: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  inputGroup: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    marginLeft: 8,
    color: '#333',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 16,
  },
  buttonContainerLandscape: {
    width: '80%',
    alignSelf: 'center',
  },
  cancelButton: {
    flex: 1,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  submitButton: {
    flex: 1,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    marginLeft: 8,
    backgroundColor: '#222',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#333',
  },
  submitButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
});

export default PersonalInfoForm;