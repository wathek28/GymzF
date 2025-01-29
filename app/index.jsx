import { Redirect } from 'expo-router';
import { Text } from 'react-native';

export default function Login() {
  return <Text><Redirect href="/login" /></Text>;
}