import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Modal,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';  // Utilisation correcte du hook

const ContactForm = () => {
  const navigation = useNavigation();  // Utilisation du hook à l'intérieur du composant

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    reason: '',
    message: '',
  });

  const [showPicker, setShowPicker] = useState(false);

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

  const handleReasonChange = (value) => {
    if (value !== '') {
      setFormData({ ...formData, reason: value });
    }
    setShowPicker(false);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      alert('Veuillez entrer votre nom');
      return;
    }
    if (!formData.email.trim()) {
      alert('Veuillez entrer votre email');
      return;
    }
    if (!formData.whatsapp.trim()) {
      alert('Veuillez entrer votre numéro WhatsApp');
      return;
    }
    if (!formData.reason) {
      alert('Veuillez sélectionner une raison de contact');
      return;
    }

    console.log('Form submitted:', formData);
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
            onPress={() => setFormData({
              name: '',
              email: '',
              whatsapp: '',
              reason: '',
              message: '',
            })}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
          >
            <Text style={styles.submitButtonText}>Envoyer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff' ,
    
  },
  formContainer: { 
    padding: 20 
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    
    marginBottom: 30,  // Augmenter l'espacement sous l'en-tête
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
});

export default ContactForm;
