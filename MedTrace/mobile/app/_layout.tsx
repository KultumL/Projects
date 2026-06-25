import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import {
  useFonts,
  PlayfairDisplay_400Regular,
  PlayfairDisplay_400Regular_Italic,
  PlayfairDisplay_500Medium,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { Colors } from '@/theme';
import { AuthProvider } from '@/context/AuthContext';
import { TourProvider } from '@/context/TourContext';
import CoachmarkOverlay from '@/components/CoachmarkOverlay';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_400Regular_Italic,
    PlayfairDisplay_500Medium,
    PlayfairDisplay_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.backgroundWarm, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.buttonPrimary} />
      </View>
    );
  }

  return (
    <AuthProvider>
      <TourProvider>
        <Stack screenOptions={{ headerShown: false }} />
        <StatusBar style="dark" />
        <CoachmarkOverlay />
      </TourProvider>
    </AuthProvider>
  );
}
