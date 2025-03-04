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
  StatusBar,
  Modal,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

// Configuration de base
const API_BASE_URL = 'http://192.168.0.7:8082/api/auth';

// Service de gestion des utilisateurs
class UserService {
  // Formater la date au format JJ/MM/AAAA
  static formatDateForBackend(date) {
    if (!(date instanceof Date)) {
      date = new Date(date);
    }
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Méthode de mise à jour du profil utilisateur
  static async updateUserProfile(userId, userData) {
    try {
      // Récupérer le token d'authentification
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('Aucun token d\'authentification trouvé');
      }

      // Préparer les données pour l'API
      const formattedData = {
        ...userData,
        birthDate: this.formatDateForBackend(userData.birthDate)
      };

      // Construire l'URL de mise à jour
      const url = `${API_BASE_URL}/modifier-user?userId=${userId}`;

      // Effectuer la requête de mise à jour
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formattedData)
      });

      // Vérifier la réponse du serveur
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Erreur lors de la mise à jour du profil');
      }

      // Récupérer et retourner les données de réponse
      const responseData = await response.json();

      // Sauvegarder les informations localement
      await AsyncStorage.setItem('userEmail', userData.email);
      await AsyncStorage.setItem('firstName', userData.firstName);
      await AsyncStorage.setItem('birthDate', formattedData.birthDate);

      return responseData;

    } catch (error) {
      console.error('Erreur de mise à jour du profil:', error);
      throw error;
    }
  }
}

// Composant de formulaire de profil
const PersonalInfoForm = () => {
  // États et hooks
  const router = useRouter();
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));
  const params = useLocalSearchParams();

  // États du formulaire
  const [userId, setUserId] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    birthDate: '',
    address: '',
    phoneNumber: '',
    photo: ''
  });

  // Charger les données initiales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Définir l'ID utilisateur
        setUserId(params.userId);

        // Initialiser les données du formulaire
        setFormData(prev => ({
          ...prev,
          fullName: params.firstName || '',
          email: params.email || '',
          phoneNumber: params.phoneNumber || '',
          photo: params.photo || ''
        }));

        // Récupérer la date de naissance stockée
        const storedBirthDate = await AsyncStorage.getItem('birthDate');
        if (storedBirthDate) {
          const parsedDate = parseStoredDate(storedBirthDate);
          setSelectedDate(parsedDate);
          setFormData(prev => ({
            ...prev,
            birthDate: formatDisplayDate(parsedDate)
          }));
        }
      } catch (error) {
        console.error('Erreur de chargement des données:', error);
        Alert.alert('Erreur', 'Impossible de charger les données');
      }
    };

    loadInitialData();

    // Gestion des dimensions d'écran
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });

    return () => subscription.remove();
  }, []);

  // Formater une date pour l'affichage
  const formatDisplayDate = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Parser une date stockée
  const parseStoredDate = (dateString) => {
    const [day, month, year] = dateString.split('/').map(Number);
    return new Date(year, month - 1, day);
  };

  // Gérer les changements de formulaire
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Gestion du changement de date
  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || new Date();
    setShowDatePicker(Platform.OS === 'ios');
    setSelectedDate(currentDate);
    setFormData(prev => ({
      ...prev,
      birthDate: formatDisplayDate(currentDate)
    }));
  };

  // Soumettre le formulaire
  const handleSubmit = async () => {
    // Validation de base
    if (!formData.fullName || !formData.email || !formData.birthDate) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      // Préparer les données pour l'API
      const updateData = {
        firstName: formData.fullName,
        email: formData.email,
        birthDate: selectedDate,
        address: formData.address,
        phoneNumber: formData.phoneNumber,
        photo: formData.photo
      };

      // Mettre à jour le profil
      await UserService.updateUserProfile(userId, updateData);
      
      // Message de succès
      Alert.alert('Succès', 'Profil mis à jour avec succès');
      
      // Naviguer vers la page Gym
      navigateToGym();
    } catch (error) {
      // Gérer les erreurs
      Alert.alert('Erreur', error.message || 'Impossible de mettre à jour le profil');
    }
  };

  // Annuler et retourner à la page Gym
  const handleCancel = () => {
    navigateToGym();
  };

  // Navigation vers la page Gym
  const navigateToGym = () => {
    router.push({
      pathname: '/Gym',
      params: {
        userId: userId,
        firstName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        photo: formData.photo,
        email: formData.email
      }
    });
  };

  // Déterminer l'orientation de l'écran
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
          {/* En-tête */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={navigateToGym}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chevron-back" size={24} color="#999" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Informations personnelles</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Formulaire */}
          <View style={[
            styles.formContainer,
            isLandscape && styles.formContainerLandscape
          ]}>
            {/* Champ Nom et Prénom */}
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

            {/* Champ E-mail */}
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
              
              <TouchableOpacity 
                style={styles.datePickerButton} 
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {formData.birthDate || "Sélectionner votre date de naissance"}
                </Text>
                <Ionicons name="calendar" size={22} color="#555" />
              </TouchableOpacity>
              
              {/* Sélecteur de date */}
              {showDatePicker && (
                Platform.OS === 'ios' ? (
                  <Modal
                    transparent={true}
                    animationType="slide"
                    visible={showDatePicker}
                  >
                    <View style={styles.modalContainer}>
                      <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                          <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                            <Text style={styles.modalCancelButton}>Annuler</Text>
                          </TouchableOpacity>
                          <Text style={styles.modalTitle}>Sélectionner une date</Text>
                          <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                            <Text style={styles.modalDoneButton}>OK</Text>
                          </TouchableOpacity>
                        </View>
                        <DateTimePicker
                          value={selectedDate}
                          mode="date"
                          display="spinner"
                          onChange={onDateChange}
                          style={styles.datePicker}
                        />
                      </View>
                    </View>
                  </Modal>
                ) : (
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                  />
                )
              )}
            </View>

            {/* Champ Adresse */}
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
  datePickerButton: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '500',
  },
  modalCancelButton: {
    fontSize: 16,
    color: '#999',
  },
  modalDoneButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  datePicker: {
    height: 200,
    width: '100%',
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