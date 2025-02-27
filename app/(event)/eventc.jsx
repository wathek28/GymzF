import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const RegistrationForm = () => {
  const navigation = useNavigation();
  const route = useRoute();
  
  // Récupération des paramètres
  const eventData = route?.params?.eventData || {};
  const userId = route?.params?.userId;
  const eventId = route?.params?.eventId || eventData?.id;
  
  // États pour l'affichage et le formulaire
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(true);
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);
  
  // Ajout des IDs aux données du formulaire
  const [formData, setFormData] = useState({
    firstName: '',
    email: '',
    phoneNumber: '',
    acceptRules: false,
    userId: userId,
    eventId: eventId,
  });

  // Vérifier si l'utilisateur est déjà inscrit à l'événement
  useEffect(() => {
    const checkRegistration = async () => {
      if (!userId || !eventId) {
        setIsCheckingRegistration(false);
        return;
      }
      
      try {
        const response = await fetch(`http://192.168.0.6:8082/api/events/${eventId}/participation/${userId}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data) {
            // L'utilisateur est déjà inscrit
            setIsAlreadyRegistered(true);
            
            // Pré-remplir le formulaire avec les données existantes
            if (data.firstName && data.email && data.phoneNumber) {
              setFormData(prev => ({
                ...prev,
                firstName: data.firstName,
                email: data.email,
                phoneNumber: data.phoneNumber
              }));
            }
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification d\'inscription:', error);
      } finally {
        setIsCheckingRegistration(false);
      }
    };
    
    checkRegistration();
  }, [userId, eventId]);

  // Vérifier la présence des IDs au chargement du composant
  useEffect(() => {
    console.log('RegistrationForm - userId récupéré:', userId);
    console.log('RegistrationForm - eventId récupéré:', eventId);
    console.log('RegistrationForm - eventData:', eventData);
    
    if (!userId) {
      console.warn('Attention: userId est manquant ou null dans RegistrationForm');
    }
    
    if (!eventId) {
      console.warn('Attention: eventId est manquant ou null dans RegistrationForm');
    }
    
    // Mettre à jour les IDs dans formData si changés
    setFormData(prevState => ({
      ...prevState,
      userId: userId,
      eventId: eventId
    }));
  }, [userId, eventId, eventData]);

  const parseRules = (reglement) => {
    if (!reglement) return [];
    // Diviser le texte par des points et nettoyer les espaces inutiles
    return reglement.split('.').filter(rule => rule.trim().length > 0);
  };
  
  const handleSubmit = async () => {
    // Si l'utilisateur est déjà inscrit, ne pas continuer
    if (isAlreadyRegistered) {
      Alert.alert("Déjà inscrit", "Vous êtes déjà inscrit à cet événement !");
      return;
    }
    
    // Vérifier que tous les champs sont remplis
    if (!formData.firstName || !formData.email || !formData.phoneNumber) {
      Alert.alert("Formulaire incomplet", "Veuillez remplir tous les champs du formulaire");
      return;
    }
    
    // Vérifier la validité de l'email avec une regex simple
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert("Email invalide", "Veuillez entrer une adresse email valide");
      return;
    }
    
    // Suppression de la validation du numéro de téléphone - accepte n'importe quel format
    // Le format attendu est maintenant +216230310 ou similaire
    
    console.log('Form submitted with IDs:', {
      userId: formData.userId,
      eventId: formData.eventId,
      formData: formData
    });
    
    // Vérifier à nouveau les IDs avant d'envoyer
    if (!formData.userId) {
      console.warn('Soumission du formulaire sans userId');
      Alert.alert("Erreur", "Identifiant utilisateur manquant");
      return;
    }
    
    if (!formData.eventId) {
      console.warn('Soumission du formulaire sans eventId');
      Alert.alert("Erreur", "Identifiant de l'événement manquant");
      return;
    }
    
    // Préparer les données pour l'API (format attendu par le backend)
    const apiData = {
      firstName: formData.firstName,
      email: formData.email,
      phoneNumber: formData.phoneNumber
    };
    
    setIsLoading(true);
    
    try {
      // Appel à l'API
      const response = await fetch(`http://192.168.0.6:8082/api/events/${formData.eventId}/participate/${formData.userId}/form`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData)
      });
      
      // Récupérer le texte brut de la réponse d'abord
      const responseText = await response.text();
      
      // Tenter de parser en JSON si possible
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        // Si ce n'est pas du JSON, utiliser le texte brut
        responseData = { message: responseText };
      }
      
      if (response.ok) {
        // Inscription réussie
        Alert.alert(
          "Inscription réussie",
          "Votre place a été réservée avec succès !",
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      } else {
        // Erreur côté serveur
        const errorMessage = responseData.message || responseText || "Une erreur est survenue. Veuillez réessayer.";
        
        // Vérifier si le message d'erreur indique que l'utilisateur est déjà inscrit
        // Recherche plus large pour détecter différentes variantes de messages
        if (
          errorMessage.toLowerCase().includes("déjà inscrit") || 
          errorMessage.toLowerCase().includes("already registered") ||
          errorMessage.toLowerCase().includes("êtes déjà") ||
          errorMessage === "Vous êtes déjà inscrit à cet événement !"
        ) {
          setIsAlreadyRegistered(true);
          Alert.alert("Déjà inscrit", "Vous êtes déjà inscrit à cet événement !");
        } else {
          Alert.alert("Erreur lors de l'inscription", errorMessage);
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'appel API:', error);
      Alert.alert(
        "Erreur de connexion",
        "Impossible de se connecter au serveur. Veuillez vérifier votre connexion internet."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Afficher un message et désactiver le formulaire si déjà inscrit
  const renderAlreadyRegisteredMessage = () => {
    if (isAlreadyRegistered) {
      return (
        <View style={styles.alreadyRegisteredContainer}>
          <Ionicons name="checkmark-circle" size={40} color="green" />
          <Text style={styles.alreadyRegisteredText}>
            Vous êtes déjà inscrit à cet événement !
          </Text>
        </View>
      );
    }
    return null;
  };

  // Afficher un chargement pendant la vérification d'inscription
  if (isCheckingRegistration) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Vérification de votre inscription...</Text>
      </View>
    );
  }

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
      
      {renderAlreadyRegisteredMessage()}
      
      {/* Section de débogage pour afficher les IDs (à retirer en production) */}
      <View style={styles.debugSection}>
        <Text style={styles.debugText}>User ID: {userId || 'Non disponible'}</Text>
        <Text style={styles.debugText}>Event ID: {eventId || 'Non disponible'}</Text>
      </View>

      <View style={[styles.formContainer, isAlreadyRegistered && styles.disabledForm]}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Nom et Prénom</Text>
          <TextInput
            style={styles.input}
            value={formData.firstName}
            onChangeText={(text) => setFormData({...formData, firstName: text})}
            placeholder="Votre Nom"
            editable={!isAlreadyRegistered}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Adresse email</Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(text) => setFormData({...formData, email: text})}
            placeholder="exemple@gmail.com"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isAlreadyRegistered}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Numéro de téléphone</Text>
          <TextInput
            style={styles.input}
            value={formData.phoneNumber}
            onChangeText={(text) => setFormData({...formData, phoneNumber: text})}
            placeholder="+216230310"
            keyboardType="phone-pad"
            editable={!isAlreadyRegistered}
          />
          <Text style={styles.inputHint}>Format: +216230310</Text>
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
          onPress={() => !isAlreadyRegistered && setFormData({...formData, acceptRules: !formData.acceptRules})}
          disabled={isAlreadyRegistered}
        >
          <View style={[
            styles.checkboxBox, 
            (formData.acceptRules || isAlreadyRegistered) && styles.checkboxChecked
          ]} />
          <Text style={styles.checkboxText}>J'ai lu et j'accepte les règles de participation.</Text>
        </TouchableOpacity>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>
              {isAlreadyRegistered ? "Retour" : "Annuler"}
            </Text>
          </TouchableOpacity>
          
          {!isAlreadyRegistered && (
            <TouchableOpacity 
              style={[
                styles.submitButton, 
                (!formData.acceptRules || isLoading) && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={!formData.acceptRules || isLoading || isAlreadyRegistered}
            >
              <Text style={styles.submitButtonText}>
                {isLoading ? "Envoi en cours..." : "Réserver"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
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
  debugSection: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#444',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  alreadyRegisteredContainer: {
    backgroundColor: '#e8f5e9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alreadyRegisteredText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'green',
    marginLeft: 10,
    flex: 1,
  },
  formContainer: {
    opacity: 1,
  },
  disabledForm: {
    opacity: 0.7,
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
  inputHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
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