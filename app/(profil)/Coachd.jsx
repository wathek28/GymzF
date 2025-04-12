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
  Linking,
  Image,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration de l'API
const API_BASE_URL = 'http://192.168.0.3:8082';

const ContactForm = () => {
  const navigation = useNavigation();
  const route = useRoute();
  
  // Extract idCoach and user data from route params
  const { 
    idCoach, 
    userId, 
    firstName, 
    email, 
    phoneNumber,
    photo
  } = route.params || {};

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    reason: '',
    message: '',
    idCoach: idCoach,
    userId: userId,
  });

  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  // Reasons list
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

  // Load user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // First, try to use data from route params
        let userData = {
          name: firstName || '',
          email: email || '',
          whatsapp: phoneNumber || ''
        };
        
        // If not found in params, try AsyncStorage
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
        
        // Update form data
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

  // Open WhatsApp function
  // Open WhatsApp function
  // Open WhatsApp function
  // Open WhatsApp function
  const openWhatsApp = async () => {
    // Utilisez le numéro de téléphone fourni si aucun n'est passé dans les paramètres
    const contactNumber = phoneNumber || '+21690306551';

    if (!contactNumber) {
      Alert.alert('Information manquante', 'Les coordonnées du coach ne sont pas disponibles.');
      return;
    }

    // Liste des raisons prédéfinies
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

    // Préparer le message par défaut avec la raison si sélectionnée
    const defaultMessage = formData.reason 
      ? `Bonjour ${firstName || 'Coach'}, je souhaite vous contacter concernant ${formData.reason}.`
      : `Bonjour ${firstName || 'Coach'}, je souhaite vous contacter concernant un coaching.`;

    // Normalize phone number (remove spaces and +)
    const cleanPhoneNumber = contactNumber.replace(/\s+/g, '').replace(/^\+/, '');

    // Construct WhatsApp URLs for different methods
    const whatsappUrls = [
      `whatsapp://send?phone=${cleanPhoneNumber}&text=${encodeURIComponent(defaultMessage)}`, // Default WhatsApp
      `https://wa.me/${cleanPhoneNumber}?text=${encodeURIComponent(defaultMessage)}`, // Web WhatsApp
    ];

    // Try multiple URL methods
    for (const url of whatsappUrls) {
      try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
          return; // Exit if successful
        }
      } catch (error) {
        console.error('Error opening WhatsApp:', error);
      }
    }

    // If all methods fail
    Alert.alert(
      'WhatsApp non disponible',
      'Impossible d\'ouvrir WhatsApp. Veuillez vérifier son installation.',
      [
        { 
          text: 'Copier le numéro', 
          onPress: () => {
            Clipboard.setString(contactNumber);
            Alert.alert('Numéro copié', `Le numéro ${contactNumber} a été copié dans le presse-papiers.`);
          }
        },
        { text: 'Annuler', style: 'cancel' }
      ]
    );
  };

  // Email validation
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  // Handle reason change
  const handleReasonChange = (value) => {
    if (value !== '') {
      setFormData({ ...formData, reason: value });
    }
  };

  // Submit form
  const handleSubmit = async () => {
    // Validation checks
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

    // API URL
    const apiUrl = `${API_BASE_URL}/api/contact/coach/${formData.idCoach}/gymzer/${formData.userId}`;
    
    // Prepare API data
    const apiData = {
      raisonContact: formData.reason,
      message: formData.message,
      email: formData.email,
      nom: formData.name,
      telephone: formData.whatsapp
    };

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

      const responseText = await response.text();
      let responseData;
      
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = { message: responseText };
      }
      
      if (response.ok) {
        Alert.alert(
          'Message envoyé',
          `Votre demande concernant "${formData.reason}" a bien été envoyée au coach. Vous recevrez une réponse prochainement.`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        
        // Reset form
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
        Alert.alert(
          'Erreur',
          responseData.error || 'Une erreur s\'est produite lors de l\'envoi du message.'
        );
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
          <Text style={styles.header}>Contactez {firstName}</Text>
        </View>

        {/* WhatsApp Direct Contact Section */}
        <View style={styles.whatsappSectionContainer}>
          <View style={styles.whatsappSection}>
            <View style={styles.whatsappTextContainer}>
              <Text style={styles.whatsappTitle}>Contactez rapidement {firstName}</Text>
              <Text style={styles.whatsappSubtitle}>Disponible sur WhatsApp</Text>
            </View>
            <TouchableOpacity 
              style={styles.whatsappButton} 
              onPress={openWhatsApp}
            >
              <FontAwesome5 name="whatsapp" size={24} color="black" />
              <Text style={styles.whatsappButtonText}>Chatter</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Form Fields */}
        <View style={styles.formFieldsContainer}>
          {/* Name */}
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

          {/* WhatsApp Number */}
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

          {/* Reason Picker */}
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
                        itemStyle={{ fontSize: 14 }}
                      >
                        <Picker.Item label="Sélectionner une raison" value="" color="#999" />
                        {reasons.map((reason, index) => (
                          <Picker.Item key={index} label={reason} value={reason} />
                        ))}
                      </Picker>
                      <TouchableOpacity 
                        style={styles.modalButton} 
                        onPress={() => setShowPicker(false)}
                      >
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
                  itemStyle={{ fontSize: 14 }}
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

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
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
    width: '100%',
    fontSize: 14 
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
  whatsappSectionContainer: {
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  whatsappSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  whatsappTextContainer: {
    flex: 1,
    marginRight: 15,
  },
  whatsappTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  whatsappSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CBFF06', // WhatsApp green
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    gap: 10,
  },
  whatsappButtonText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 14,
  },
  formFieldsContainer: {
    marginTop: 20,
  },
});

export default ContactForm;