// app/cour/PaymentForm.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
  Image,
  Animated,
  Dimensions,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const cardWidth = width * 0.85;

// Définir les cartes autorisées
const VALID_CARD_NUMBERS = [
  '1234 5678 9012 3456',
  '5678 1234 9012 3456'
];

// Fonction pour formater le prix
const formatPrice = (price) => {
  if (!price || parseFloat(price) === 0 || price === '0.00') {
    return 'GRATUIT';
  }
  return `${parseFloat(price).toFixed(0)} DT`;
};

// Composant pour la carte de crédit visuelle
const CreditCardPreview = ({ cardNumber, expiryDate, cardName }) => {
  // Formater le numéro de carte pour l'affichage
  const formattedCardNumber = cardNumber 
    ? cardNumber.padEnd(19, '• ').substring(0, 19) 
    : '•••• •••• •••• ••••';
  
  // Formater la date d'expiration
  const formattedExpiry = expiryDate || '••/••';
  
  // Formater le nom
  const formattedName = cardName || 'VOTRE NOM';

  return (
    <View style={styles.creditCardContainer}>
      <View style={styles.creditCard}>
        <View style={styles.creditCardTop}>
          <Text style={styles.cardType}>CREDIT CARD</Text>
        </View>
        
        <View style={styles.cardChip}>
          <View style={styles.chipLines}>
            <View style={styles.chipLine} />
            <View style={styles.chipLine} />
            <View style={styles.chipLine} />
          </View>
        </View>
        
        <Text style={styles.cardNumber}>{formattedCardNumber}</Text>
        
        <View style={styles.cardBottom}>
          <View>
            <Text style={styles.cardInfoLabel}>NOM</Text>
            <Text style={styles.cardInfoValue}>{formattedName.toUpperCase()}</Text>
          </View>
          
          <View>
            <Text style={styles.cardInfoLabel}>VALABLE</Text>
            <Text style={styles.cardInfoValue}>{formattedExpiry}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// Composant pour un champ de saisie avec label
const FormInput = ({ label, placeholder, value, onChangeText, keyboardType, secureTextEntry, maxLength, editable = true }) => {
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <View style={styles.formGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          isFocused ? styles.inputFocused : null,
          !editable ? styles.inputDisabled : null
        ]}
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        maxLength={maxLength}
        editable={editable}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
    </View>
  );
};

const PaymentFormScreen = () => {
  // États pour le formulaire de paiement
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState(1); // 1: informations carte, 2: confirmation
  const [userId, setUserId] = useState(null);
  
  // États pour le modal de succès ou déjà acheté
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [alreadyPurchased, setAlreadyPurchased] = useState(false);
  
  // Animation pour la transition entre les étapes - simplifiée
  const fadeAnim = useState(new Animated.Value(1))[0];
  
  // Récupérer les paramètres de navigation
  const params = useLocalSearchParams();
  const router = useRouter();
  
  const courseId = params.courseId;
  const price = params.price;
  const courseTitle = params.courseTitle || 'Cours';

  const exerciseIdsString = params.exerciseIds;
  const exerciseIds = exerciseIdsString ? exerciseIdsString.split(',') : [];
  useEffect(() => {
    console.log('Received exerciseIds:', exerciseIds);
  }, [exerciseIds]);
  
  // Formater le prix pour l'affichage
  const formattedPrice = formatPrice(price);
  
  // Récupérer l'ID utilisateur depuis AsyncStorage
  useEffect(() => {
    const getUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        if (storedUserId) {
          setUserId(storedUserId);
          console.log('User ID récupéré:', storedUserId);
        } else {
          console.warn('Aucun ID utilisateur trouvé dans AsyncStorage');
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'ID utilisateur:', error);
      }
    };
    
    getUserId();
  }, []);
  
  // Animation lors du changement d'étape - Simplifiée pour éviter des problèmes d'affichage
  useEffect(() => {
    if (paymentStep === 2) {
      // Animation plus simple pour la transition vers l'étape 2
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Animation plus simple pour la transition vers l'étape 1
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [paymentStep, fadeAnim]);
  
  // Fonction pour revenir en arrière
  const handleGoBack = useCallback(() => {
    if (paymentStep === 2) {
      setPaymentStep(1);
    } else {
      router.back();
    }
  }, [paymentStep, router]);
  
  // Formatage automatique du numéro de carte
  const handleCardNumberChange = (text) => {
    // Supprimer tous les caractères non numériques
    const cleaned = text.replace(/\D/g, '');
    // Ajouter automatiquement un espace tous les 4 chiffres
    let formatted = '';
    for (let i = 0; i < cleaned.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formatted += ' ';
      }
      formatted += cleaned[i];
    }
    // Limiter à 19 caractères (16 chiffres + 3 espaces)
    setCardNumber(formatted.substring(0, 19));
  };

  // Formatage automatique de la date d'expiration (MM/YY)
  const handleExpiryChange = (text) => {
    // Supprimer tous les caractères non numériques
    const cleaned = text.replace(/\D/g, '');
    // Formater en MM/YY
    let formatted = cleaned;
    if (cleaned.length > 2) {
      formatted = cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    setExpiryDate(formatted);
  };
  
  // Validation du formulaire et passage à l'étape de confirmation
  const handleContinue = useCallback(() => {
    // Vérification des champs
    if (!cardName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer le nom du titulaire de la carte');
      return;
    }
    
    // Vérifier si la carte fait partie des cartes autorisées
    if (!VALID_CARD_NUMBERS.includes(cardNumber)) {
      Alert.alert('Erreur', 'Numéro de carte non valide. Veuillez utiliser une carte autorisée pour ce test.');
      return;
    }
    
    if (expiryDate.length !== 5 || !expiryDate.includes('/')) {
      Alert.alert('Erreur', 'Date d\'expiration invalide (format: MM/YY)');
      return;
    }
    
    if (cvv.length !== 3) {
      Alert.alert('Erreur', 'Code CVV invalide');
      return;
    }
    
    // Passer à l'étape de confirmation avec une pause pour éviter les problèmes d'affichage
    setTimeout(() => {
      setPaymentStep(2);
    }, 100);
  }, [cardName, cardNumber, expiryDate, cvv]);
  
  // Fermer le modal et naviguer vers la page de cours
  const handleStartCourse = useCallback(() => {
    setShowSuccessModal(false);
    
    // Vérifier qu'il y a au moins un exercice disponible
    if (exerciseIds && exerciseIds.length > 0) {
      // Rediriger vers la page du cours avec l'exercice débloqué
      router.push({
        pathname: '/courc',
        params: { 
          courseId: courseId,
          exerciseId: exerciseIds[0],            // ID du premier exercice
          allExerciseIds: exerciseIds.join(',')  // Tous les IDs pour navigation
        }
      });
    } else {
      // Cas où aucun exercice n'est disponible
      Alert.alert(
        'Information',
        'Aucun exercice n\'est disponible pour ce cours.',
        [
          { 
            text: 'OK', 
            onPress: () => router.back()
          }
        ]
      );
    }
  }, [exerciseIds, courseId, router]);
  
  // Fonction pour soumettre le paiement
  const handleSubmitPayment = useCallback(async () => {
    try {
      setIsProcessing(true);
      
      // Vérifier que l'ID utilisateur est disponible
      if (!userId) {
        const storedUserId = await AsyncStorage.getItem('userId');
        if (!storedUserId) {
          throw new Error('Impossible de récupérer votre ID utilisateur. Veuillez vous reconnecter.');
        }
        setUserId(storedUserId);
      }
      
      console.log(`Tentative de paiement pour le cours ${courseId} par l'utilisateur ${userId}`);
      console.log('Exercices associés:', exerciseIds);
      
      // Appel à l'API pour créer une intention de paiement
      const response = await fetch('http://192.168.0.3:8082/api/payments/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `courseId=${courseId}&userId=${userId}`,
      });
      
      // Si l'utilisateur a déjà acheté le cours (code 400)
      if (response.status === 400) {
        setAlreadyPurchased(true);
        setShowSuccessModal(true);
        return;
      }
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const paymentData = await response.json();
      console.log('Réponse de l\'API:', paymentData);
      
      if (!paymentData.paymentIntentId || !paymentData.clientSecret) {
        throw new Error('Données de paiement invalides');
      }
      
      // Simuler un délai de traitement
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Afficher le modal de succès
      setAlreadyPurchased(false);
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error('Erreur de paiement:', error);
      Alert.alert('Erreur de paiement', error.message || 'Une erreur est survenue lors du paiement');
    } finally {
      setIsProcessing(false);
    }
  }, [courseId, router, userId, exerciseIds]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleGoBack}
          disabled={isProcessing}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {paymentStep === 1 ? 'Informations de paiement' : 'Confirmation'}
        </Text>
        
        {/* Indicateur d'étape */}
        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, styles.stepActive]} />
          <View style={[styles.stepConnector, paymentStep === 2 ? styles.stepActive : null]} />
          <View style={[styles.stepDot, paymentStep === 2 ? styles.stepActive : null]} />
        </View>
      </View>
      
      <Animated.ScrollView 
        style={[
          styles.content,
          {
            opacity: fadeAnim
          }
        ]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {paymentStep === 1 ? (
          /* Étape 1: Informations de carte */
          <>
            {/* Résumé du cours */}
            <View style={styles.courseSummary}>
              <View style={styles.courseIconContainer}>
                <Ionicons name="fitness" size={24} color="#333" />
              </View>
              <View style={styles.courseSummaryContent}>
                <Text style={styles.courseSummaryTitle}>{courseTitle}</Text>
                <Text style={styles.courseSummaryPrice}>{formattedPrice}</Text>
              </View>
            </View>
            
            {/* Prévisualisation de la carte */}
            <CreditCardPreview 
              cardNumber={cardNumber}
              expiryDate={expiryDate}
              cardName={cardName}
            />
            
            {/* Formulaire */}
            <View style={styles.formContainer}>
              <FormInput
                label="Nom du titulaire"
                placeholder="Entrez le nom figurant sur la carte"
                value={cardName}
                onChangeText={setCardName}
                editable={!isProcessing}
              />
              
              <FormInput
                label="Numéro de carte"
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChangeText={handleCardNumberChange}
                keyboardType="numeric"
                maxLength={19}
                editable={!isProcessing}
              />
              
              <View style={styles.formRow}>
                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={styles.inputLabel}>Date d'expiration</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="MM/YY"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    value={expiryDate}
                    onChangeText={handleExpiryChange}
                    maxLength={5}
                    editable={!isProcessing}
                  />
                </View>
                
                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={styles.inputLabel}>CVV</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="123"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    value={cvv}
                    onChangeText={setCvv}
                    maxLength={3}
                    secureTextEntry
                    editable={!isProcessing}
                  />
                </View>
              </View>
            </View>
            
            {/* Information sur les cartes de test */}
            <View style={styles.testCardsInfo}>
              <Text style={styles.testCardsTitle}>Cartes de test acceptées:</Text>
              {VALID_CARD_NUMBERS.map((card, index) => (
                <Text key={index} style={styles.testCardNumber}>{card}</Text>
              ))}
            </View>
            
            {/* Bouton de continuation */}
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinue}
              disabled={isProcessing}
            >
              <Text style={styles.continueButtonText}>Continuer</Text>
              <Ionicons name="arrow-forward" size={18} color="black" />
            </TouchableOpacity>
          </>
        ) : (
          /* Étape 2: Confirmation */
          <>
            <View style={styles.confirmationContainer}>
              {/* Icône de succès */}
              <View style={styles.confirmationIconContainer}>
                <Ionicons name="checkmark-circle" size={60} color="black" />
              </View>
              
              <Text style={styles.confirmationTitle}>Confirmer votre achat</Text>
              
              {/* Récapitulatif des informations */}
              <View style={styles.confirmationCard}>
                {/* Cours */}
                <View style={styles.confirmationItem}>
                  <Text style={styles.confirmationLabel}>Cours</Text>
                  <Text style={styles.confirmationValue}>{courseTitle}</Text>
                </View>
                
                {/* Prix */}
                <View style={styles.confirmationItem}>
                  <Text style={styles.confirmationLabel}>Prix</Text>
                  <Text style={styles.confirmationValueHighlight}>{formattedPrice}</Text>
                </View>
                
                {/* Méthode de paiement */}
                <View style={styles.confirmationItem}>
                  <Text style={styles.confirmationLabel}>Méthode de paiement</Text>
                  <View style={styles.confirmationCardInfo}>
                    <Ionicons name="card" size={18} color="black" />
                    <Text style={styles.confirmationValue}>
                      •••• •••• •••• {cardNumber.slice(-4)}
                    </Text>
                  </View>
                </View>
              </View>
              
              {/* Conditions d'utilisation */}
              <View style={styles.termsContainer}>
                <Text style={styles.termsText}>
                  En confirmant votre paiement, vous acceptez nos{' '}
                  <Text style={styles.termsLink}>conditions d'utilisation</Text>{' '}
                  et notre{' '}
                  <Text style={styles.termsLink}>politique de confidentialité</Text>.
                </Text>
              </View>
              
              {/* Bouton de paiement */}
              <TouchableOpacity
                style={styles.payButton}
                onPress={handleSubmitPayment}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Text style={styles.payButtonText}>Payer {formattedPrice}</Text>
                    <Ionicons name="lock-closed" size={18} color="black" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </Animated.ScrollView>
      
      {/* Modal de succès ou déjà acheté */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModal}>
            <View style={styles.successModalHeader}>
              <View style={styles.successIconContainer}>
                {alreadyPurchased ? (
                  <Ionicons name="information-circle" size={60} color="#CBFF06" />
                ) : (
                  <Ionicons name="checkmark-circle" size={60} color="#CBFF06" />
                )}
              </View>
              
              <Text style={styles.successModalTitle}>
                {alreadyPurchased 
                  ? "Vous avez déjà acheté ce cours"
                  : "Félicitations!"
                }
              </Text>
              
              <Text style={styles.successModalSubtitle}>
                {alreadyPurchased
                  ? "Ce cours est déjà disponible dans votre compte"
                  : "Votre paiement a été traité avec succès"
                }
              </Text>
            </View>
            
            <View style={styles.successModalContent}>
              <View style={styles.courseBadge}>
                <Ionicons name="fitness" size={24} color="#fff" />
                <Text style={styles.courseBadgeText}>{courseTitle}</Text>
              </View>
              
              <Text style={styles.successDescription}>
                {alreadyPurchased
                  ? "Vous pouvez accéder immédiatement à ce cours et à tout son contenu. Aucun paiement supplémentaire n'est nécessaire."
                  : "Votre cours a été débloqué avec succès. Vous pouvez maintenant accéder à tout le contenu du cours."
                }
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.startCourseButton}
              onPress={handleStartCourse}
            >
              <Text style={styles.startCourseButtonText}>
                Commencer le cours
              </Text>
              <Ionicons name="arrow-forward" size={18} color="black" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f5f5f5',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  headerTitle: {
    color: '#333',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 15,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    right: 20,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#e0e0e0',
  },
  stepConnector: {
    width: 20,
    height: 2,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 5,
  },
  stepActive: {
    backgroundColor: 'black',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  courseSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  courseIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  courseSummaryContent: {
    flex: 1,
  },
  courseSummaryTitle: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  courseSummaryPrice: {
    color: 'black',
    fontSize: 14,
    fontWeight: 'bold',
  },
  creditCardContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  creditCard: {
    width: cardWidth,
    height: cardWidth * 0.6,
    backgroundColor: '#3f51b5',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  creditCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  cardLogo: {
    width: 50,
    height: 30,
    resizeMode: 'contain',
  },
  cardType: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardChip: {
    width: 40,
    height: 30,
    backgroundColor: '#ffd700',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  chipLines: {
    width: '80%',
  },
  chipLine: {
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    marginVertical: 2,
    borderRadius: 2,
  },
  cardNumber: {
    color: 'white',
    fontSize: 20,
    fontWeight: '500',
    letterSpacing: 2,
    marginBottom: 15,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardInfoLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    marginBottom: 5,
  },
  cardInfoValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  formContainer: {
    marginBottom: 10,
  },
  formGroup: {
    marginBottom: 15,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  formGroupHalf: {
    width: '48%',
  },
  inputLabel: {
    color: '#555',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#f9f9f9',
    color: '#333',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputFocused: {
    borderColor: 'black',
    backgroundColor: '#fff',
  },
  inputDisabled: {
    opacity: 0.6,
  },
  testCardsInfo: {
    marginTop: 10,
    padding: 15,
    backgroundColor: '#f0f7ff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#c5dbff',
    marginBottom: 20,
  },
  testCardsTitle: {
    color: '#0056b3',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  testCardNumber: {
    color: '#0056b3',
    fontSize: 13,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  continueButton: {
    backgroundColor: '#CBFF06',
    borderRadius: 30,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
    marginBottom: 30,
  },
  continueButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  confirmationContainer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  confirmationIconContainer: {
    marginBottom: 20,
  },
  confirmationTitle: {
    color: '#333',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  confirmationCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  confirmationItem: {
    marginBottom: 15,
  },
  confirmationLabel: {
    color: '#666',
    fontSize: 14,
    marginBottom: 5,
  },
  confirmationValue: {
    color: '#333',
    fontSize: 16,
  },
  confirmationValueHighlight: {
    color: 'black',
    fontSize: 18,
    fontWeight: 'bold',
  },
  confirmationCardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  termsContainer: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  termsText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: 'black',
    textDecorationLine: 'underline',
  },
  payButton: {
    backgroundColor: '#CBFF06',
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  payButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  
  // Styles pour le modal de succès
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  successModal: {
    width: '90%',
    backgroundColor: '#222',
    borderRadius: 15,
    padding: 20,
    position: 'relative',
  },
  successModalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(203, 255, 6, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  successModalTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  successModalSubtitle: {
    color: '#CBFF06',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  successModalContent: {
    marginBottom: 25,
  },
  courseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignSelf: 'center',
    marginBottom: 15,
  },
  courseBadgeText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  successDescription: {
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  startCourseButton: {
    backgroundColor: '#CBFF06',
    borderRadius: 30,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startCourseButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
});

  export default PaymentFormScreen;