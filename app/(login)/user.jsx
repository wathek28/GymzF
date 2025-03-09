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

      const [firstName] = name.split(' ');
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
        if (data.token) {
          await AsyncStorage.setItem('authToken', data.token);
        }
        router.push('/home');
      }
    } catch (e) {
      console.error('Connection error:', e);
      Alert.alert('Error', 'Connection error. Please try again.');
    } finally {
      setLoading(false);
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