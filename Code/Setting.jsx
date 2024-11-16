import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Alert, Platform } from 'react-native';
import Share from 'react-native-share';
import Icon from 'react-native-vector-icons/Ionicons';

export default function SettingsScreen() {
  // Function to get the app download link based on the environment and platform
  const getAppDownloadLink = () => {
    return Platform.OS === 'ios'
      ? 'https://apps.apple.com/us/app/app-name/id6737775801' // Replace with actual iOS app store link
      : 'https://play.google.com/store/apps/details?id=com.bloxfruitevalues'; // Android package link
  };

  // Function to share the app
  const handleShareApp = async () => {
    try {
      const appLink = getAppDownloadLink(); // Get the dynamic link
      const shareOptions = {
        message: `Check out this amazing app! Download it now from ${appLink}.`,
        url: appLink,
        title: 'Share App'
      };
      await Share.open(shareOptions);
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  // Function to open email client for suggestions
  const handleGetSuggestions = () => {
    const email = 'thesolanalabs@gmail.com'; // Replace with your support email
    const subject = 'App Feedback and Suggestions';
    const body = 'Hi team, I would like to share the following suggestions:\n\n';

    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    Linking.openURL(mailtoUrl).catch(() =>
      Alert.alert('Error', 'Unable to open the email client. Please try again later.')
    );
  };

  // Function to open the app store for ratings
  const handleRateApp = () => {
    const appLink = getAppDownloadLink();
    const storeLink = Platform.OS === 'ios'
      ? `itms-apps://itunes.apple.com/app/idYOUR_APP_ID?action=write-review` // Replace YOUR_APP_ID
      : `market://details?id=com.bloxfruitevalues`; // Your app's package name for Android

    Linking.openURL(storeLink).catch(() =>
      Alert.alert('Error', 'Unable to open the app store. Please try again later.')
    );
  };

  // Function to open Facebook page
  const handleOpenFacebook = () => {
    const facebookUrl = 'https://www.facebook.com/share/g/15V1JErjbY/';
    Linking.openURL(facebookUrl).catch(() =>
      Alert.alert('Error', 'Unable to open Facebook. Please try again later.')
    );
  };

  // Function to open the website
  const handleOpenWebsite = () => {
    const websiteUrl = 'https://bloxfruitscalc.com/';
    Linking.openURL(websiteUrl).catch(() =>
      Alert.alert('Error', 'Unable to open the website. Please try again later.')
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.option} onPress={handleShareApp}>
        <Icon name="share-social-outline" size={24} color="#333" />
        <Text style={styles.optionText}>Share App</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.option} onPress={handleGetSuggestions}>
        <Icon name="chatbox-ellipses-outline" size={24} color="#333" />
        <Text style={styles.optionText}>Give Suggestions</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.option} onPress={handleRateApp}>
        <Icon name="star-outline" size={24} color="#333" />
        <Text style={styles.optionText}>Rate Us</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.option} onPress={handleOpenFacebook}>
        <Icon name="logo-facebook" size={24} color="#333" />
        <Text style={styles.optionText}>Visit Facebook Page</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.option} onPress={handleOpenWebsite}>
        <Icon name="globe-outline" size={24} color="#333" />
        <Text style={styles.optionText}>Visit Website</Text>
      </TouchableOpacity>
    </View>
  );
}

// Styles for the Settings Screen
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
    fontFamily: 'Lato-regular',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginBottom: 20,
    backgroundColor: '#FFF',
    borderRadius: 10,
    elevation: 2,
  },
  optionText: {
    fontSize: 18,
    marginLeft: 10,
    fontFamily: 'Lato-Regular',
  },
});
