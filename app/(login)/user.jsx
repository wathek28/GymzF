import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  Image,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';


const ProfileCompletionForm = () => {
  const { fullPhoneNumber = '', role = '' } = useLocalSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const checkAuthToken = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          router.push('/login');
        }
      } catch (error) {
        console.error('Token check error:', error);
      }
    };
  
    checkAuthToken();
  }, []); 

 

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Gallery access is required');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        if (selectedImage && selectedImage.uri) {
          // Optional: Add file size validation
          const fileSize = await FileSystem.getInfoAsync(selectedImage.uri);
          if (fileSize.size > 5 * 1024 * 1024) { // 5MB limit
            Alert.alert('Error', 'Image size exceeds 5MB');
            return;
          }
          setPhoto(selectedImage.uri);
        } else {
          Alert.alert('Error', 'No image selected');
        }
      }
    } catch (error) {
      console.error('Image selection error:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const getImageFileSize = async (uri) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      return fileInfo.size;
    } catch (error) {
      console.error('Error getting file size:', error);
      return 0;
    }
  };

const validateEmail = (email) => {
   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Fonction pour extraire userId du token JWT
  const extractUserIdFromToken = (token) => {
    try {
      // Extraire la partie payload du token (la deuxième partie séparée par des points)
      const base64Payload = token.split('.')[1];
      // Décoder la charge utile Base64 avec atob (disponible nativement)
      const decodedPayload = atob(base64Payload);
      const payload = JSON.parse(decodedPayload);
      console.log('Payload du token:', payload);
      // Renvoyer l'ID utilisateur si disponible dans le payload
      return payload.userId || payload.user_id || payload.id || null;
    } catch (e) {
      console.error('Erreur d\'extraction de l\'ID utilisateur du token:', e);
      return null;
    }
  };

  // Fonction pour obtenir l'ID utilisateur de l'API ou générer un ID temporaire si nécessaire
  const getUserId = async (phoneNumber, token) => {
    try {
      // Vérifier d'abord le token
      const tokenUserId = extractUserIdFromToken(token);
      if (tokenUserId) {
        console.log('ID utilisateur extrait du token:', tokenUserId);
        return tokenUserId;
      }
      
      // Si aucun ID n'a pu être extrait, générer un ID temporaire
      const tempId = 'temp_' + Date.now();
      console.log('Génération d\'un ID temporaire:', tempId);
      return tempId;
    } catch (e) {
      console.error('Erreur lors de la récupération de l\'ID utilisateur:', e);
      // Générer un ID temporaire si tout échoue
      return 'temp_' + Date.now();
    }
  };

  const handleSubmit = async () => {
    if (!name || !email) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Invalid email format');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        router.push('/login');
        return;
      }

      const firstName = name.split(' ')[0];
      const formData = new FormData();
      formData.append('phoneNumber', fullPhoneNumber);
      formData.append('firstName', firstName);
      formData.append('email', email);
      formData.append('role', role);

      if (photo) {
        formData.append('photo', {
          uri: photo,
          type: 'image/jpeg',
          name: 'profile_photo.jpg',
        });
      }

      const response = await fetch('http://192.168.0.3:8082/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Error', data.message || 'Profile update failed');
      } else {
        // Si un nouveau token est fourni, le sauvegarder
        if (data.token) {
          await AsyncStorage.setItem('authToken', data.token);
        }
        
        // Obtenir l'ID utilisateur, soit de la réponse, soit par d'autres moyens
        let userId = data.id || data.userId;
        
        // Si aucun ID n'est disponible dans la réponse, essayer de l'extraire du token
        if (!userId) {
          console.log('ID utilisateur non trouvé dans la réponse, tentative d\'extraction du token');
          userId = await getUserId(fullPhoneNumber, token);
        }
        
        console.log('ID utilisateur obtenu:', userId);
        
        // Sauvegarde des données utilisateur dans AsyncStorage
        await saveUserDataToAsyncStorage(firstName, email, fullPhoneNumber, photo, role, userId);
        
        // Navigation vers la page home avec les paramètres 
        // Utiliser les mêmes noms de paramètres que dans _layout
        router.push({
          pathname: '/home',
          params: {
            userId: userId,
            firstName: firstName,
            phoneNumber: fullPhoneNumber,
            photo: photo,
            email: email
          }
        });
      }
    } catch (e) {
      console.error('Connection error:', e);
      Alert.alert('Error', 'Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Fonction pour sauvegarder les données utilisateur dans AsyncStorage
  const saveUserDataToAsyncStorage = async (firstName, email, phoneNumber, photo, role, userId) => {
    try {
      // Stocker les éléments avec les mêmes noms de clés que dans _layout
      await AsyncStorage.setItem('firstName', firstName);
      await AsyncStorage.setItem('userEmail', email);
      await AsyncStorage.setItem('phoneNumber', phoneNumber);
      
      if (photo) {
        await AsyncStorage.setItem('userPhoto', photo);
      }
      
      await AsyncStorage.setItem('userRole', role);
      
      if (userId) {
        await AsyncStorage.setItem('userId', userId.toString());
      }
      
      // Également stocker avec les anciens noms de clés pour compatibilité avec le reste de l'app
      await AsyncStorage.setItem('userFirstName', firstName);
      await AsyncStorage.setItem('userPhoneNumber', phoneNumber);
      
      // Stocker également un objet complet pour faciliter la récupération
      const userProfile = {
        firstName,
        email,
        phoneNumber,
        photo,
        role,
        id: userId
      };
      
      await AsyncStorage.setItem('userProfile', JSON.stringify(userProfile));
      
      console.log('Données utilisateur sauvegardées dans AsyncStorage:', userProfile);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des données utilisateur:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>Complete Profile</Text>

        <TouchableOpacity onPress={handlePickImage} style={styles.photoContainer}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.photo} />
          ) : (
            <Icon name="camera-outline" size={48} color="#666" />
          )}
        </TouchableOpacity>

        <View style={styles.inputContainer}>
          <Icon name="account-outline" size={24} color="#666" style={styles.icon} />
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Full Name"
            style={styles.input}
          />
        </View>

        <View style={styles.inputContainer}>
          <Icon name="email-outline" size={24} color="#666" style={styles.icon} />
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email Address"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
        </View>

        <Text style={styles.infoText}>
          Add an email to secure access in case of phone number change.
        </Text>

        <TouchableOpacity 
          style={[styles.submit, (!name || !email) && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={loading || !name || !email}
        >
          <Text style={styles.submitText}>
            {loading ? 'Loading...' : 'Finalize'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f4f4f4', 
  },
  form: { 
    flex: 1, 
    justifyContent: 'center', 
    backgroundColor: '#fff',
    borderRadius: 0,
    padding: 20,
  },
  title: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 20, 
    textAlign: 'center',
    color: '#333',
  },
  photoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    height: 120,
    width: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
    backgroundColor: '#f9f9f9',
    alignSelf: 'center',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 8, 
    backgroundColor: '#fff', 
    marginBottom: 15, 
    paddingHorizontal: 10,
  },
  icon: { 
    marginRight: 10, 
  },
  input: { 
    flex: 1, 
    height: 50,
    fontSize: 16, 
    color: '#000',
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  submit: { 
    backgroundColor: '#000', 
    padding: 15, 
    borderRadius: 25, 
    alignItems: 'center',
    marginBottom: 10,
  },
  submitDisabled: {
    backgroundColor: '#ccc',
  },
  submitText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '600',
  },
  cancelButton: {
    alignItems: 'center',
  },
  cancelText: {
    color: '#000',
    fontSize: 14,
  },
});

export default ProfileCompletionForm;