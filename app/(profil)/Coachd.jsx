import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration de l'API
const API_BASE_URL = 'http://192.168.0.6:8082';

const ContactForm = () => {
  const navigation = useNavigation();
  const route = useRoute();
  
  // Extract idCoach and user data from route params
  const { 
    idCoach, 
    userId, 
    firstName, 
    email, 
    phoneNumber 
  } = route.params || {};

  // Log the parameters as soon as the component mounts
  useEffect(() => {
    console.log("Route params received:", {
      idCoach,
      userId,
      firstName,
      email,
      phoneNumber
    });
  }, [idCoach, userId, firstName, email, phoneNumber]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    reason: '',
    message: '',
    idCoach: idCoach, // Include idCoach in the form data
    userId: userId,   // Include userId in the form data
  });

  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  // Effect to pre-populate form fields with user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // First priority: Use data from route params
        let userData = {
          name: firstName || '',
          email: email || '',
          whatsapp: phoneNumber || ''
        };
        
        // Second priority: Try to get data from AsyncStorage if not present in params
        if (!userData.name) {
          const storedName = await AsyncStorage.getItem('firstName');
          if (storedName) userData.name = storedName;
        }
        
        if (!userData.email) {
          const storedEmail = await AsyncStorage.getItem('userEmail');
          if (storedEmail) userData.email = storedEmail;
        }
        
        if (!userData.whatsapp) {
          const storedPhone = await AsyncStorage.getItem('phoneNumber');
          if (storedPhone) userData.whatsapp = storedPhone;
        }
        
        // Log what we found
        console.log("User data for form:", userData);
        
        // Update form data with user information
        setFormData(prevData => ({
          ...prevData,
          name: userData.name,
          email: userData.email,
          whatsapp: userData.whatsapp
        }));
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };
    
    loadUserData();
  }, [firstName, email, phoneNumber]);

  const reasons = [
    'Réservation d\'une séance individuelle',
    'Organisation d\'une session en groupe',
    'Coaching personnalisé',
    'Programme d\'entraînement sur mesure',
    'Perte de poids (objectif fitness)',
    'Gain de poids ou prise de masse musculaire',
    'Demande d\'informations sur les cours',
    'Questions sur les tarifs et abonnements',
    'Planification alimentaire et nutrition',
    'Autre (à préciser dans le message)',
  ];

  // Fonction de validation d'email simple
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const handleReasonChange = (value) => {
    if (value !== '') {
      setFormData({ ...formData, reason: value });
    }
    setShowPicker(false);
  };

  const handleSubmit = async () => {
    // Form validation
    if (!formData.name.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre nom');
      return;
    }
    if (!formData.email.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre email');
      return;
    }
    if (!validateEmail(formData.email)) {
      Alert.alert('Erreur', 'Veuillez entrer une adresse email valide');
      return;
    }
    if (!formData.whatsapp.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre numéro WhatsApp');
      return;
    }
    if (!formData.reason) {
      Alert.alert('Erreur', 'Veuillez sélectionner une raison de contact');
      return;
    }
    if (!formData.message.trim() || formData.message.length < 10) {
      Alert.alert('Erreur', 'Veuillez entrer un message d\'au moins 10 caractères');
      return;
    }
    if (!formData.idCoach || !formData.userId) {
      Alert.alert('Erreur', 'Information de coach ou d\'utilisateur manquante');
      return;
    }

    // Construction de l'URL avec les IDs du coach et du gymzer
    const apiUrl = `${API_BASE_URL}/api/contact/coach/${formData.idCoach}/gymzer/${formData.userId}`;
    
    // Formatez les données exactement comme dans votre test Postman réussi
    const apiData = {
      raisonContact: formData.reason,
      message: formData.message,
      email: formData.email,
      nom: formData.name,
      telephone: formData.whatsapp
    };

    console.log('Sending data to API:', apiData);
    console.log('Request URL:', apiUrl);
    
    try {
      setLoading(true);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Response text:', responseText);
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
        console.log('Response data:', responseData);
      } catch (e) {
        console.log('Response is not JSON:', e);
        responseData = { message: responseText };
      }
      
      if (response.ok) {
        Alert.alert(
          'Message envoyé',
          `Votre demande concernant "${formData.reason}" a bien été envoyée au coach. Vous recevrez une réponse prochainement.`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        
        setFormData({
          name: '',
          email: '',
          whatsapp: '',
          reason: '',
          message: '',
          idCoach: formData.idCoach,
          userId: formData.userId,
        });
      } else {
        if (responseData && responseData.error) {
          Alert.alert('Erreur', `${responseData.error || 'Une erreur s\'est produite'}`);
        } else {
          Alert.alert('Erreur', 'Une erreur s\'est produite lors de l\'envoi du message.');
        }
      }
    } catch (error) {
      console.error('Error details:', error);
      Alert.alert(
        'Erreur de connexion',
        `Impossible de se connecter au serveur: ${error.message}. Veuillez vérifier votre connexion internet et réessayer.`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formContainer}>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}  
          >
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.header}>Contactez-moi</Text>
        </View>

        {/* ID information - Debug only */}
        {__DEV__ && (
          <View style={styles.idInfoContainer}>
            <Text style={styles.idInfoText}>Coach ID: {formData.idCoach}</Text>
            <Text style={styles.idInfoText}>User ID: {formData.userId}</Text>
          </View>
        )}

        {/* Nom et prénom */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nom et Prénom<Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="Ahmed Mahmoud"
            placeholderTextColor="#999"
          />
        </View>

        {/* Email */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Adresse email<Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            placeholder="ahmed@gmail.com"
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#999"
          />
        </View>

        {/* Numéro WhatsApp */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Numéro WhatsApp<Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={formData.whatsapp}
            onChangeText={(text) => setFormData({ ...formData, whatsapp: text })}
            placeholder="90306551"
            keyboardType="phone-pad"
            placeholderTextColor="#999"
          />
        </View>

        {/* Raison de contact */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Raison de contact<Text style={styles.required}>*</Text></Text>
          {Platform.OS === 'ios' ? (
            <>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowPicker(true)}
              >
                <Text style={styles.pickerButtonText}>
                  {formData.reason || 'Sélectionner une raison'}
                </Text>
              </TouchableOpacity>
              <Modal visible={showPicker} transparent animationType="slide">
                <View style={styles.modalContainer}>
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={formData.reason}
                      onValueChange={handleReasonChange}
                    >
                      <Picker.Item label="Sélectionner une raison" value="" color="#999" />
                      {reasons.map((reason, index) => (
                        <Picker.Item key={index} label={reason} value={reason} />
                      ))}
                    </Picker>
                    <TouchableOpacity style={styles.modalButton} onPress={() => setShowPicker(false)}>
                      <Text style={styles.modalButtonText}>Fermer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
            </>
          ) : (
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.reason}
                onValueChange={handleReasonChange}
                style={styles.picker}
              >
                <Picker.Item label="Sélectionner une raison" value="" color="#999" />
                {reasons.map((reason, index) => (
                  <Picker.Item key={index} label={reason} value={reason} />
                ))}
              </Picker>
            </View>
          )}
        </View>

        {/* Message */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Message<Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[styles.input, styles.messageInput]}
            value={formData.message}
            onChangeText={(text) => setFormData({ ...formData, message: text })}
            multiline
            numberOfLines={4}
            placeholder="Votre message..."
            placeholderTextColor="#999"
            textAlignVertical="top"
          />
        </View>

        {/* Boutons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              // Reset the form but keep personal information and IDs
              setFormData(prev => ({
                ...prev,
                reason: '',
                message: ''
              }));
            }}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.submitButtonText}>Envoi en cours...</Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>Envoyer</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff',
  },
  formContainer: { 
    padding: 20 
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 40, 
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  header: { 
    fontSize: 24, 
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
  },
  idInfoContainer: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  idInfoText: {
    fontSize: 14,
    color: '#666',
  },
  inputGroup: { 
    marginBottom: 20 
  },
  label: { 
    fontSize: 16, 
    marginBottom: 8, 
    color: '#333', 
    fontWeight: '500' 
  },
  required: { 
    color: 'red' 
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 8, 
    padding: 12, 
    fontSize: 16, 
    backgroundColor: '#fff', 
    color: '#000' 
  },
  messageInput: { 
    height: 120 
  },
  pickerContainer: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 8, 
    backgroundColor: '#fff' 
  },
  picker: { 
    height: 50, 
    width: '100%' 
  },
  pickerButton: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 8, 
    padding: 12, 
    backgroundColor: '#f5f5f5' 
  },
  pickerButtonText: { 
    fontSize: 16, 
    color: '#333' 
  },
  modalContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    backgroundColor: 'rgba(0,0,0,0.5)' 
  },
  pickerWrapper: { 
    backgroundColor: '#fff', 
    padding: 20, 
    borderRadius: 10 
  },
  modalButton: { 
    marginTop: 10, 
    padding: 10, 
    backgroundColor: '#000', 
    borderRadius: 5 
  },
  modalButtonText: { 
    textAlign: 'center', 
    color: '#fff', 
    fontSize: 16 
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#000',
  },
  cancelButtonText: {
    textAlign: 'center',
    color: '#000',
    fontSize: 16,
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 8,
  },
  submitButtonText: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: '#666',
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
});

export default ContactForm;