// SplashScreen.js
import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Animated, useColorScheme, StatusBar, Platform } from 'react-native';

const SplashScreen = ({ onAnimationEnd }) => {
  const scheme = useColorScheme();
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Set the StatusBar style based on the theme
    StatusBar.setBarStyle(scheme === 'dark' ? 'light-content' : 'dark-content');
    
    // Only set background color on Android
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(scheme === 'dark' ? 'black' : 'white');
    }

    // Start sliding out after 2.5 seconds
    const timer = setTimeout(() => {
      Animated.timing(translateX, {
        toValue: -400, // Adjust as needed to slide out of view
        duration: 500,
        useNativeDriver: true,
      }).start(() => onAnimationEnd());
    }, 3000);

    return () => clearTimeout(timer);
  }, [translateX, onAnimationEnd, scheme]);

  return (
    <Animated.View style={[styles.container, { transform: [{ translateX }], backgroundColor: scheme === 'dark' ? 'black' : 'white' }]}>
      <Image source={require('../assets/icon.png')} style={styles.icon} />
      <Text style={[styles.title, { color: scheme === 'dark' ? 'white' : 'black' }]}>Blox Fruite Values</Text>
    </Animated.View>
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
fontFamily:'Lato-Bold'  },
});

export default SplashScreen;
