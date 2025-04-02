import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Image, Alert
} from 'react-native';
import { useRouter } from 'expo-router';

const Singup = () => {
  const profileTypes = [
    { id: 1, title: 'GYMZER' },
    { id: 2, title: 'COACH' },
    { id: 3, title: 'GYM' },
  ];
  const [selectedProfile, setSelectedProfile] = useState(null);
  const router = useRouter();

  const handleProfileSelect = (profileType) => {
    setSelectedProfile(profileType);
    
    if (profileType === 'GYMZER') {
      console.log('Role avant envoi:', profileType);
      router.replace({
        pathname: '/inscription',
        params: { role: profileType }
      });
    } else {
      // Show an alert for non-GYMZER profiles
      Alert.alert(
        "Accès limité",
        "Seul le profil GYMZER est disponible pour le moment.",
        [{ text: "OK", onPress: () => console.log("Alert closed") }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity
          style={styles.backButtonContainer}
          onPress={() => router.push('/')}
        >
          <Image 
            source={require('../../assets/images/F.png')}
            style={styles.backIcon} 
          />
        </TouchableOpacity>

        <Text style={styles.title}>
          Choisissez votre type du profil
        </Text>
        <Text style={styles.subtitle}>
          Sélectionnez le profil que vous voulez utiliser pour bénéficier de nos services.
        </Text>

        {profileTypes.map((profile) => (
          <TouchableOpacity
            key={profile.id}
            style={[
              styles.profileButton,
              selectedProfile === profile.title && styles.selectedButton,
              profile.title !== 'GYMZER' && styles.disabledButton,
            ]}
            onPress={() => handleProfileSelect(profile.title)}
          >
            <Text
              style={[
                styles.buttonText,
                selectedProfile === profile.title && styles.selectedText,
                profile.title !== 'GYMZER' && styles.disabledText,
              ]}
            >
              {profile.title}
              {profile.title !== 'GYMZER' && " (Bientôt disponible)"}
            </Text>
            <View
              style={[
                styles.iconContainer,
                selectedProfile === profile.title && styles.selectedCircle,
              ]}
            >
              <Text
                style={[
                  styles.arrowIcon,
                  selectedProfile === profile.title && styles.selectedIcon,
                ]}
              >
                ›
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>J'ai déjà un compte? </Text>
          <TouchableOpacity onPress={() => router.push('/connect')}>
            <Text style={styles.loginText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
    flex: 1,
    justifyContent: 'center',
  },
  backButtonContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 1,
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
  },
  profileButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedButton: {
    borderWidth: 2,
    borderColor: '#CCFF00',
  },
  disabledButton: {
    opacity: 0.7,
    backgroundColor: '#333',
  },
  buttonText: {
    color: '#CCFF00',
    fontSize: 18,
    fontWeight: 'bold',
  },
  selectedText: {
    color: '#CCFF00',
  },
  disabledText: {
    color: '#999',
    fontSize: 16,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  selectedCircle: {
    backgroundColor: '#CCFF00',
  },
  arrowIcon: {
    color: '#CCFF00',
    fontSize: 24,
  },
  selectedIcon: {
    color: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#666',
  },
  loginText: {
    color: '#000',
    fontWeight: 'bold',
  },
});

export default Singup;