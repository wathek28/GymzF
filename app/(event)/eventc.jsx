import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const RegistrationForm = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const eventData = route?.params?.eventData || {};

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    acceptRules: false,
  });

  useEffect(() => {
    if (eventData.titre) {
      console.log('Event Data:', eventData);
    }
  }, [eventData]);

  const parseRules = (reglement) => {
    if (!reglement) return [];
    // Diviser le texte par des points et nettoyer les espaces inutiles
    return reglement.split('.').filter(rule => rule.trim().length > 0);
  };
  

  const handleSubmit = () => {
    console.log('Form submitted:', formData);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.header}>Réservez votre place !</Text>
      </View>
      
      <Text style={styles.eventTitle}>Événement: {eventData.titre || 'Non spécifié'}</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Nom et Prénom</Text>
        <TextInput
          style={styles.input}
          value={formData.name}
          onChangeText={(text) => setFormData({...formData, name: text})}
          placeholder="Votre Nom"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Adresse email</Text>
        <TextInput
          style={styles.input}
          value={formData.email}
          onChangeText={(text) => setFormData({...formData, email: text})}
          placeholder="exempl@gmail.com"
          keyboardType="email-address"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Numéro de téléphone</Text>
        <TextInput
          style={styles.input}
          value={formData.phone}
          onChangeText={(text) => setFormData({...formData, phone: text})}
          placeholder="votre numero"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.rulesContainer}>
        <Text style={styles.rulesHeader}>Règles de participation</Text>
        {eventData.reglement ? (
          parseRules(eventData.reglement).map((rule, index) => (
            <Text key={index} style={styles.ruleText}>• {rule}</Text>
          ))
        ) : (
          <Text style={styles.noRulesText}>Aucune règle spécifiée pour cet événement.</Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.checkbox}
        onPress={() => setFormData({...formData, acceptRules: !formData.acceptRules})}
      >
        <View style={[styles.checkboxBox, formData.acceptRules && styles.checkboxChecked]} />
        <Text style={styles.checkboxText}>J'ai lu et j'accepte les règles de participation.</Text>
      </TouchableOpacity>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.submitButton, !formData.acceptRules && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!formData.acceptRules}
        >
          <Text style={styles.submitButtonText}>Réserver</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  backButton: {
    padding: 5,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 15,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#444',
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  rulesContainer: {
    marginVertical: 20,
  },
  rulesHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  ruleText: {
    fontSize: 14,
    marginBottom: 8,
    color: '#444',
  },
  noRulesText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#666',
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#000',
    marginRight: 10,
    borderRadius: 4,
  },
  checkboxChecked: {
    backgroundColor: '#000',
  },
  checkboxText: {
    fontSize: 14,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 30,
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginRight: 10,
  },
  cancelButtonText: {
    textAlign: 'center',
    color: '#000',
  },
  submitButton: {
    flex: 1,
    padding: 15,
    backgroundColor: '#000',
    borderRadius: 8,
    marginLeft: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    textAlign: 'center',
    color: '#fff',
  },
});

export default RegistrationForm;