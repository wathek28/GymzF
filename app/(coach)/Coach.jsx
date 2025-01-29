import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Circle } from 'react-native-svg';

// Composant pour afficher la progression
const CircleProgress = () => {
  const size = 40;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = (1 / 3) * 100;  // Pour afficher 1/3
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
      <Text style={styles.progressText}>1/3</Text>
    </View>
  );
};

// Composant principal
export default function Coach() {
  const [formData, setFormData] = useState({
    name: 'Roland',
    email: 'roland@example.com',
    phone: '90306551',
    bio: '',
    image: null,
    socials: {
      facebook: '',
      instagram: '',
      tiktok: ''
    }
  });

  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Désolé, nous avons besoin des permissions pour accéder à vos photos!');
      }
    })();
  }, []);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setFormData({ ...formData, image: result.assets[0].uri });
      }
    } catch (error) {
      alert('Erreur lors de la sélection de l\'image');
    }
  };

  const handleChange = (field, value) => {
    if (field.startsWith('social_')) {
      const socialField = field.replace('social_', '');
      setFormData({
        ...formData,
        socials: { ...formData.socials, [socialField]: value }
      });
    } else {
      setFormData({ ...formData, [field]: value });
    }
  };

  const handleBack = () => {
    router.back();  // Navigue en arrière (Retour)
  };

  const handleNext = () => {
    const { name, email, phone } = formData;
    if (!name || !email || !phone) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    router.push('/Coach2');
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={styles.container}>
        <View style={styles.headerContainer}>
          {/* Icône de retour */}
          
          {/* Titre et cercle de progression */}
          <Text style={styles.sectionTitle}>Informations Personnelles</Text>
          <CircleProgress />
        </View>

        {/* Contenu restant de ton formulaire */}
        <View style={styles.photoContainer}>
          <TouchableOpacity style={styles.photoPlaceholder} onPress={pickImage}>
            {formData.image ? (
              <Image source={{ uri: formData.image }} style={styles.profileImage} />
            ) : (
              <Ionicons name="person-outline" size={40} color="#666" />
            )}
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={14} color="#666" />
            </View>
          </TouchableOpacity>
          <Text style={styles.photoLabel}>Photo de profil</Text>
        </View>

        {/* Formulaire */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom et Prénom *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(value) => handleChange('name', value)}
              placeholder="Entrez votre nom "
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Adresse email *</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(value) => handleChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="votre address email"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={formData.bio}
              onChangeText={(value) => handleChange('bio', value)}
              multiline
              placeholder="Parlez-nous de vous..."
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Réseaux sociaux</Text>
            <View style={styles.socialInput}>
              <Ionicons name="logo-facebook" size={24} color="#666" />
              <TextInput
                style={styles.socialTextInput}
                value={formData.socials.facebook}
                onChangeText={(value) => handleChange('social_facebook', value)}
                placeholder="Votre profil Facebook"
              />
            </View>
            <View style={styles.socialInput}>
              <Ionicons name="logo-instagram" size={24} color="#666" />
              <TextInput
                style={styles.socialTextInput}
                value={formData.socials.instagram}
                onChangeText={(value) => handleChange('social_instagram', value)}
                placeholder="Votre profil Instagram"
              />
            </View>
            <View style={styles.socialInput}>
              <Ionicons name="logo-tiktok" size={24} color="#666" />
              <TextInput
                style={styles.socialTextInput}
                value={formData.socials.tiktok}
                onChangeText={(value) => handleChange('social_tiktok', value)}
                placeholder="Votre profil TikTok"
              />
            </View>
          </View>
        </View>

        {/* Boutons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBack}
          >
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.nextButton}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>Suivant</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 80
  },
  sectionTitle:{
    fontSize: 18,
    fontWeight: '600',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  progressContainer: {
    marginLeft:5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -8 }], // Ajuste la position du texte
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  cameraIcon: {
    position: 'absolute',
    right: 10,
    bottom: 0,
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  photoLabel: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  bioInput: {
    height: 120,
    padding: 12,
  },
  socialInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  socialTextInput: {
    flex: 1,
    borderColor: '#CBFF06',
    marginLeft: 12,
    fontSize: 16,
  },
  buttonContainer: {
    marginVertical: 20,
    flexDirection: 'row',  // Aligne les boutons sur la même ligne
    justifyContent: 'space-between',

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
  nextButton: {
     flex: 1,
    backgroundColor: 'black',
    borderRadius: 8,
    padding: 12,
    marginLeft: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#333',
    
   
   
    fontWeight: '500',
  },
 
  nextButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
});