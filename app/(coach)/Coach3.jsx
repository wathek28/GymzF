import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { useNavigation } from '@react-navigation/native'; 

const CoachingProfile = () => {


    const navigation = useNavigation(); 

  const [level, setLevel] = useState('intermediate');
  const [duration, setDuration] = useState('60 min');
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [price, setPrice] = useState('50');
  const [location, setLocation] = useState({
    online: true,
    home: true,
    other: true
  });
  const [address, setAddress] = useState('La marea');
  const [otherAddress, setOtherAddress] = useState('California Gym');

  const durationOptions = ['30 min', '45 min', '60 min', '90 min'];

  const ProgressCircle = ({ current, total }) => (
    <View style={styles.progressContainer}>
      <Text style={styles.progressText}>{`${current}/${total}`}</Text>
    </View>
  );

  const LevelButton = ({ title, isSelected, onPress }) => (
    <TouchableOpacity 
      style={[styles.levelButton, isSelected && styles.levelButtonSelected]}
      onPress={onPress}
    >
      <Text style={[styles.levelButtonText, isSelected && styles.levelButtonTextSelected]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const DurationModal = () => (
    <Modal
      visible={showDurationModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowDurationModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Durée de la séance</Text>
          {durationOptions.map((option) => (
            <TouchableOpacity
              key={option}
              style={styles.modalOption}
              onPress={() => {
                setDuration(option);
                setShowDurationModal(false);
              }}
            >
              <Text style={[
                styles.modalOptionText,
                duration === option && styles.modalOptionSelected
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowDurationModal(false)}
          >
            <Text style={styles.modalCloseButtonText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          
          <View style={styles.headerRight}>
            <Text style={styles.headerTitle}>Séances de coaching</Text>
            <ProgressCircle current={3} total={3} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Niveau du Cours</Text>
          <View style={styles.levelContainer}>
            <LevelButton 
              title="Débutant" 
              isSelected={level === 'beginner'}
              onPress={() => setLevel('beginner')}
            />
            <LevelButton 
              title="Intermédiaire" 
              isSelected={level === 'intermediate'}
              onPress={() => setLevel('intermediate')}
            />
            <LevelButton 
              title="Avancé" 
              isSelected={level === 'advanced'}
              onPress={() => setLevel('advanced')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Durée de la séance</Text>
          <TouchableOpacity 
            style={styles.durationSelector}
            onPress={() => setShowDurationModal(true)}
          >
            <Text>{duration}</Text>
            <MaterialIcons name="keyboard-arrow-down" size={24} color="black" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Prix de la séance à partir de:</Text>
          <TextInput
            style={styles.priceInput}
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
             placeholder="Dt"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Où pouvez-vous coacher?</Text>
          <TouchableOpacity 
            style={styles.locationOption}
            onPress={() => setLocation({...location, online: !location.online})}
          >
            <Text>En ligne</Text>
            <View style={[styles.checkbox, location.online && styles.checkboxSelected]} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.locationOption}
            onPress={() => setLocation({...location, home: !location.home})}
          >
            <Text>À domicile de l'adhérent au alentours de</Text>
            <View style={[styles.checkbox, location.home && styles.checkboxSelected]} />
          </TouchableOpacity>
          
          <TextInput
            style={styles.addressInput}
            value={address}
            onChangeText={setAddress}
            placeholder="Adresse"
          />

          <TouchableOpacity 
            style={styles.locationOption}
            onPress={() => setLocation({...location, other: !location.other})}
          >
            <Text>Autre adresse (exp : salle de sport)</Text>
            <View style={[styles.checkbox, location.other && styles.checkboxSelected]} />
          </TouchableOpacity>
          
          <TextInput
            style={styles.addressInput}
            value={otherAddress}
            onChangeText={setOtherAddress}
            placeholder="Autre adresse"
          />
        </View>

        <View style={styles.buttonContainer}>
        <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}  // Add the onPress handler
          >
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.nextButton}>
            <Text style={styles.nextButtonText}>Suivant</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      <DurationModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 16,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: -15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
   
  },
  progressContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft:10
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'black',
  },
  section: {
    padding: 16,
    fontSize: 14,
    fontWeight: '800',
    color: 'balck',
   
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: 'black',
    
    
  },
  levelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  levelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  levelButtonSelected: {
    backgroundColor: '#CBFF06',
    borderColor: '#CBFF06',
  },
  levelButtonText: {
    color: 'black',
  },
  levelButtonTextSelected: {
    color: 'black',
  },
  durationSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0**',
    borderRadius: 8,
  },
  priceInput: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
  },
  locationOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBFF06',
  },
  checkboxSelected: {
    backgroundColor: '#CBFF06',
    borderColor: '#CBFF06',
  },
  addressInput: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginTop: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    marginTop: 16,
  },
  backButton: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 2, // taille de la bordure
    borderColor: 'black', // couleur de la bordure
    
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    alignItems: 'center'
  },
  backButtonText: {
    color: '#000',
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
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalOptionText: {
    fontSize: 16,
    textAlign: 'center',
  },
  modalOptionSelected: {
    color: '#CBFF06',
    fontWeight: '600',
  },
  modalCloseButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#000',
    borderRadius: 8,
  },
  modalCloseButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CoachingProfile;