import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LabProvider } from '../context/LabContext';

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.lang = 'ar';
      document.documentElement.dir = 'rtl';
    }
  }, []);

  return (
    <SafeAreaProvider>
      <LabProvider>
        <StatusBar style="light" />
        <Slot />
      </LabProvider>
    </SafeAreaProvider>
  );
}
