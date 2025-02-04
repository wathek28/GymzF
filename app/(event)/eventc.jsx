import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';

const RegistrationForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    acceptRules: false,
  });

  const rules = [
    'Une confirmation d\'inscription vous sera envoyée par email ou SMS',
    'Conditions de Participation ✅',
    'Avoir au moins 18 ans (ou être accompagné d\'un tuteur légal si mineur).',
    'Équipement Requis ⚠️',
    'Vêtements de sport confortables et respirants.',
    'Baskets adaptées aux entraînements intenses.',
    'Serviette et vêtements de rechange.',
    'Apportez une gourde d\'eau pour rester hydraté.',
    'Respect & Sécurité ⚡️',
    'Respectez les consignes des coachs et du staff.',
    'Récupérez vos affaires et laissez l\'espace propre.',
    'Après l\'événement 🔥',
    'Restez connectés pour les prochaines éditions et offres exclusives !',
    'Prépare-toi à transpirer, t\'amuser et repousser tes limites ! On se retrouve au Workout Gang ! 💪'
  ];

  const handleSubmit = () => {
    // Handle form submission logic here
    console.log('Form submitted:', formData);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Réservez votre place !</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Nom et Prénom</Text>
        <TextInput
          style={styles.input}
          value={formData.name}
          onChangeText={(text) => setFormData({...formData, name: text})}
          placeholder="Ahmed Mahmoud"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Adresse email</Text>
        <TextInput
          style={styles.input}
          value={formData.email}
          onChangeText={(text) => setFormData({...formData, email: text})}
          placeholder="ahmed@gmail.com"
          keyboardType="email-address"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Numéro de téléphone</Text>
        <TextInput
          style={styles.input}
          value={formData.phone}
          onChangeText={(text) => setFormData({...formData, phone: text})}
          placeholder="90306551"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.rulesContainer}>
        <Text style={styles.rulesHeader}>Règles de participation</Text>
        {rules.map((rule, index) => (
          <Text key={index} style={styles.ruleText}>• {rule}</Text>
        ))}
      </View>

      <TouchableOpacity
        style={styles.checkbox}
        onPress={() => setFormData({...formData, acceptRules: !formData.acceptRules})}
      >
        <View style={[styles.checkboxBox, formData.acceptRules && styles.checkboxChecked]} />
        <Text style={styles.checkboxText}>J'ai lu et j'accepte les règles de participation.</Text>
      </TouchableOpacity>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelButton}>
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
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
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