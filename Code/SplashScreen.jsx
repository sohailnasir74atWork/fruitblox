import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet, useColorScheme, StatusBar, Platform } from 'react-native';

const SplashScreen = ({ onAnimationEnd }) => {
  const scheme = useColorScheme();

  useEffect(() => {
    StatusBar.setBarStyle(scheme === 'dark' ? 'light-content' : 'dark-content');
    
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(scheme === 'dark' ? 'black' : 'white');
    }

    const timer = setTimeout(() => {
      onAnimationEnd();
    }, 1000);

    return () => clearTimeout(timer); 
  }, [scheme, onAnimationEnd]);

  return (
    <View style={[styles.container, { backgroundColor: scheme === 'dark' ? 'black' : 'white' }]}>
      <Image source={require('../assets/icon.png')} style={styles.icon} />
      <Text style={[styles.title, { color: scheme === 'dark' ? 'white' : 'black' }]}>Blox Fruite Values</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 150,
    height: 150,
    marginBottom: 20,
    borderRadius: 10,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Lato-Bold',
  },
});

export default SplashScreen;
