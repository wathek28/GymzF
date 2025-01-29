import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';

// App.js
export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <ProfileCompletionForm />
    </SafeAreaView>
  );
}
const CircleProgress = () => {
  const size = 40;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  // Progression en fonction de 2/3 (66.67%)
  const progress = (2 / 3) * 100;  
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View style={styles.progressContainer}>
      <Svg width={size} height={size}>
        <Circle
          stroke="#E0E0E0"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <Circle
          stroke="#000"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      {/* Texte centré */}
      <Text style={styles.progressText}>2/3</Text> {/* Affichage du texte 2/3 */}
    </View>
  );
};







// ProfileCompletionForm.js
const ProfileCompletionForm = () => {

  const navigation = useNavigation(); // Hook pour gérer la navigation

  // Fonction pour gérer le bouton retour
  const handleBack = () => {
    navigation.goBack(); // Retourne à la page précédente
  };

  const handleStart = () => {
      router.push('/Coach3');
    };

 

  


  const [formData, setFormData] = useState({
    poste: '',
    dureeExperience: '',
    experiences: [],
    certifications: [],
    competencesGenerales: [],
    entrainementPhysique: [],
    santeBienEtre: [],
    coursSpecifiques: []
  });

  const [modals, setModals] = useState({
    experience: false,
    certification: false,
    duree: false,
    competences: false,
    entrainement: false,
    sante: false,
    cours: false
  });

  const [newExperience, setNewExperience] = useState({
    titre: '',
    entreprise: '',
    dateDebut: '',
    dateFin: ''
  });

  const [newCertification, setNewCertification] = useState({
    titre: '',
    organisation: ''
  });

  // Options arrays...
  const dureeExperienceOptions = [
    "Aucune expérience",
    "Moins d'un an",
    "Entre 1 et 2 ans",
    "Entre 2 et 5 ans",
    "Plus que 5 ans"
  ];

  const competencesGeneralesOptions = [
    "Coaching individuel",
    "Coaching en groupe",
    "Développement de programmes sur mesure",
    "Analyse biomécanique"
  ];

  const entrainementPhysiqueOptions = [
    "Athlétisme", "Natation", "Tennis",
   "Football", "Basketball", "Volleyball",
    "Handball", "Judo", "Karaté", "Taekwondo", "Boxe",
    "Kickboxing", "MMA (Mixed Martial Arts)"
  ];

  const santeBienEtreOptions = [
    "Nutrition sportive",
    "Gestion du poids (perte/prise)",
    "Réhabilitation sportive",
    "Gestion du stress"
  ];

  const coursSpecifiquesOptions = [
    "Entraînement HIIT",
    "Cardio-training",
    "Musculation",
    "Yoga",
    "Pilates",
    "Zumba",
    "CrossFit",
    "Stretching"
  ];

 
  // Handlers
  const handleModalToggle = (modalName, value) => {
    setModals(prev => ({...prev, [modalName]: value}));
  };

  const handleOptionToggle = (option, category) => {
    setFormData(prev => {
      const currentItems = prev[category];
      const updatedItems = currentItems.includes(option)
        ? currentItems.filter(item => item !== option)
        : [...currentItems, option];
      return { ...prev, [category]: updatedItems };
    });
  };

  const handleDureeSelection = (option) => {
    setFormData(prev => ({...prev, dureeExperience: option}));
    handleModalToggle('duree', false);
  };

  const handleAddExperience = () => {
    if (!newExperience.titre || !newExperience.entreprise || !newExperience.dateDebut) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }
    setFormData(prev => ({
      ...prev,
      experiences: [...prev.experiences, newExperience]
    }));
    setNewExperience({ titre: '', entreprise: '', dateDebut: '', dateFin: '' });
    handleModalToggle('experience', false);
  };

  const handleAddCertification = () => {
    if (!newCertification.titre || !newCertification.organisation) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }
    setFormData(prev => ({
      ...prev,
      certifications: [...prev.certifications, newCertification]
    }));
    setNewCertification({ titre: '', organisation: '' });
    handleModalToggle('certification', false);
  };


  
  // Render functions
  const renderModal = (type) => {
    switch(type) {
      case 'experience':
        return (
          <Modal
            visible={modals.experience}
            animationType="slide"
            transparent={true}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Ajouter une expérience</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Titre du poste *"
                  value={newExperience.titre}
                  onChangeText={text => setNewExperience(prev => ({...prev, titre: text}))}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Entreprise *"
                  value={newExperience.entreprise}
                  onChangeText={text => setNewExperience(prev => ({...prev, entreprise: text}))}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Date de début (MM/YYYY) *"
                  value={newExperience.dateDebut}
                  onChangeText={text => setNewExperience(prev => ({...prev, dateDebut: text}))}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Date de fin (MM/YYYY)"
                  value={newExperience.dateFin}
                  onChangeText={text => setNewExperience(prev => ({...prev, dateFin: text}))}
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => handleModalToggle('experience', false)}
                  >
                    <Text style={styles.cancelButtonText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.saveButton]}
                    onPress={handleAddExperience}
                  >
                    <Text style={styles.saveButtonText}>Ajouter</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        );

      case 'certification':
        return (
          <Modal
            visible={modals.certification}
            animationType="slide"
            transparent={true}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Ajouter une certification</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Titre de la certification *"
                  value={newCertification.titre}
                  onChangeText={text => setNewCertification(prev => ({...prev, titre: text}))}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Organisation *"
                  value={newCertification.organisation}
                  onChangeText={text => setNewCertification(prev => ({...prev, organisation: text}))}
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => handleModalToggle('certification', false)}
                  >
                    <Text style={styles.cancelButtonText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.saveButton]}
                    onPress={handleAddCertification}
                  >
                    <Text style={styles.saveButtonText}>Ajouter</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        );

      case 'duree':
        return (
          <Modal
            visible={modals.duree}
            animationType="slide"
            transparent={true}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Durée d'expérience</Text>
                {dureeExperienceOptions.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionItem,
                      formData.dureeExperience === option && styles.optionItemSelected
                    ]}
                    onPress={() => handleDureeSelection(option)}
                  >
                    <Text style={styles.optionText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Modal>
        );

      default:
        return null;
    }
  };

  const renderOptionsModal = (type, options, category) => {
    return (
      <Modal
        visible={modals[type]}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {type === 'entrainement' && 'Entraînement physique et disciplines'}
              {type === 'sante' && 'Santé et bien-être'}
              {type === 'cours' && 'Cours spécifiques'}
              {type === 'competences' && 'Compétences générales'}
            </Text>
            <ScrollView>
              {options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionItem,
                    formData[category].includes(option) && styles.optionItemSelected
                  ]}
                  onPress={() => handleOptionToggle(option, category)}
                >
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity 
              style={[styles.modalButton, styles.saveButton]}
              onPress={() => handleModalToggle(type, false)}
            >
              <Text style={styles.saveButtonText}>Valider</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.headerContainer}>
                  {/* Icône de retour */}
                  
                  {/* Titre et cercle de progression */}
                  <Text style={styles.sectionTitle}>Expériences et compétence </Text>
                  <CircleProgress />
                </View>

        <View style={styles.formSection}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Poste</Text>
            <TextInput
              style={styles.input}
              placeholder="Votre poste actuel"
              value={formData.poste}
              onChangeText={text => setFormData(prev => ({...prev, poste: text}))}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Durée d'expérience</Text>
            <TouchableOpacity
              style={styles.select}
              onPress={() => handleModalToggle('duree', true)}
            >
              <Text style={formData.dureeExperience ? styles.selectValueText : styles.selectPlaceholderText}>
                {formData.dureeExperience || "Sélectionner une durée"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Expériences professionnelles</Text>
            {formData.experiences.map((exp, index) => (
              <View key={index} style={styles.itemCard}>
                <Text style={styles.itemTitle}>{exp.titre}</Text>
                <Text style={styles.itemSubtitle}>{exp.entreprise}</Text>
                <Text style={styles.itemDetails}>
                  {exp.dateDebut} {exp.dateFin ? `- ${exp.dateFin}` : '(En cours)'}
                </Text>
              </View>
            ))}
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => handleModalToggle('experience', true)}
            >
              <Text style={styles.addButtonText}>+ Ajouter une expérience</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Certifications</Text>
            {formData.certifications.map((cert, index) => (
              <View key={index} style={styles.itemCard}>
                <Text style={styles.itemTitle}>{cert.titre}</Text>
                <Text style={styles.itemSubtitle}>{cert.organisation}</Text>
              </View>
            ))}
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => handleModalToggle('certification', true)}
            >
              <Text style={styles.addButtonText}>+ Ajouter une certification</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Compétences générales</Text>
            <TouchableOpacity
              style={styles.select}
              onPress={() => handleModalToggle('competences', true)}
            >
              <Text style={styles.selectPlaceholderText}>
                Sélectionner vos compétences
              </Text>
            </TouchableOpacity>
            {formData.competencesGenerales.map((comp, index) => (
              <View key={index} style={styles.competenceTag}>
                <Text style={styles.competenceTagText}>{comp}</Text>
              </View>
            ))}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Entraînement physique et disciplines</Text>
            <TouchableOpacity
              style={styles.select}
              onPress={() => handleModalToggle('entrainement', true)}
            >
              <Text style={styles.selectPlaceholderText}>
                Sélectionner vos disciplines
              </Text>
            </TouchableOpacity>
            {formData.entrainementPhysique.map((item, index) => (
              <View key={index} style={styles.competenceTag}>
                <Text style={styles.competenceTagText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Santé et bien-être</Text>
            <TouchableOpacity
              style={styles.select}
              onPress={() => handleModalToggle('sante', true)}
            >
              <Text style={styles.selectPlaceholderText}>
                Sélectionner vos spécialités
              </Text>
            </TouchableOpacity>
            {formData.santeBienEtre.map((item, index) => (
              <View key={index} style={styles.competenceTag}>
                <Text style={styles.competenceTagText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Cours spécifiques</Text>
            <TouchableOpacity
              style={styles.select}
              onPress={() => handleModalToggle('cours', true)}
            >
              <Text style={styles.selectPlaceholderText}>
                Sélectionner vos cours
              </Text>
            </TouchableOpacity>
            {formData.coursSpecifiques.map((item, index) => (
              <View key={index} style={styles.competenceTag}>
                <Text style={styles.competenceTagText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.navigationButtons}>
          
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextButton} onPress={handleStart} >
            <Text style={styles.nextButtonText}>Suivant</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {renderModal('experience')}
      {renderModal('certification')}
      {renderModal('duree')}
      {renderOptionsModal('competences', competencesGeneralesOptions, 'competencesGenerales')}
      {renderOptionsModal('entrainement', entrainementPhysiqueOptions, 'entrainementPhysique')}
      {renderOptionsModal('sante', santeBienEtreOptions, 'santeBienEtre')}
      {renderOptionsModal('cours', coursSpecifiquesOptions, 'coursSpecifiques')}
    </View>
  );
          
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 20,
   
  },
  scrollView: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
   
    justifyContent: 'flex-end',
    marginRight:10,
    marginBottom: 20,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  sectionTitle:{
    fontSize: 18,
    fontWeight: '600',
  },
  stepIndicator: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  stepText: {
    color: '#2E7D32',
    fontWeight: '500',
  },
  formSection: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: 'black',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 8,
  },
  select: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    padding: 12,
  },
  selectPlaceholderText: {
    color: '#999999',
  },
  selectValueText: {
    color: '#333333',
  },
  addButton: {
    borderWidth: 1,
    borderColor: 'black',
    backgroundColor: 'black',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  itemCard: {
    backgroundColor: 'black',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#CBFF06',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 13,
    color: '#CBFF06',
    marginBottom: 2,
  },
  itemDetails: {
    fontSize: 12,
    color: '#CBFF06',
  },
  competenceTag: {
    backgroundColor: '#CBFF06',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  competenceTagText: {
    color: 'black',
    fontSize: 12,
    fontWeight: '500',
  },
  navigationButtons: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  backButton: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 2, // taille de la bordure
    borderColor: 'black', // couleur de la bordure
    
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: 'black',
    fontWeight: '500',
  },
  nextButton: {
    flex: 1,
    backgroundColor: 'black',
    borderRadius: 8,
    padding: 12,
    marginLeft: 8,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#EEEEEE',
  },
  cancelButtonText: {
    color: '#666666',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: 'black',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  optionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  optionItemSelected: {
    backgroundColor: '#CBFF06',
  },
  optionText: {
    fontSize: 14,
    color: '#333333',
  },
  progressText: {
    position: 'absolute',
    top: '50%',  // Place le texte au centre vertical
    left: '50%', // Place le texte au centre horizontal
    transform: [{ translateX: -10 }, { translateY: -10 }], // Ajuste légèrement pour centrer parfaitement le texte
    fontSize: 12,
    fontWeight: 'bold',
    color: 'black',
  },
  
});

