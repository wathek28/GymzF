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
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

const PersonalInfoForm = () => {
  const router = useRouter();
  const [screenDimensions, setScreenDimensions] = useState({ width, height });
  const [formData, setFormData] = useState({
    
  });

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

  const handleSubmit = () => {
    console.log('Données enregistrées:', formData);
    // Enregistrer les données et retourner à la page précédente
    router.push('/Gym');
  };

  const handleCancel = () => {
    console.log('Formulaire annulé');
    
  };
  
  const navigateToGym = () => {
    router.push('/Gym');
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