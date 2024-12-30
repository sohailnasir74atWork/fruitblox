import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  Platform,
  Image,
  useColorScheme,
} from 'react-native';
import Share from 'react-native-share';
import Icon from 'react-native-vector-icons/Ionicons';
import { useGlobalState } from '../GlobelStats';
import { logoutUser } from '../Firebase/UserLogics';
import config from '../Helper/Environment';
export default function SettingsScreen({ selectedTheme }) {
  const { user } = useGlobalState();
  const colorScheme = useColorScheme(); // Returns 'light' or 'dark'
  const isDarkMode = colorScheme === 'dark';

  const getAppDownloadLink = () => {
    return Platform.OS === 'ios'
      ? config.IOsShareLink
      : config.andriodShareLink;
  };

  const handleShareApp = async () => {
    try {
      const appLink = getAppDownloadLink();
      const shareOptions = {
        message: `Explore the ultimate Blox Fruits value calculator! Learn about Blox Fruits, check values, and make smarter trades. Download now: ${appLink}`,
        title: 'Share App',
      };
      await Share.open(shareOptions);
    } catch (error) {
      // console.error('Share error:', error);
    }
  };
  

  const handleGetSuggestions = () => {
    const email = config.supportEmail;
    const subject = 'App Feedback and Suggestions (Blox Fruits Values)';
    const body = 'Hi team, I would like to share the following suggestions:\n\n';
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      body
    )}`;
    Linking.openURL(mailtoUrl).catch(() =>
      Alert.alert('Error', 'Unable to open the email client. Please try again later.')
    );
  };

  const handleRateApp = () => {
    const storeLink =
      Platform.OS === 'ios'
        ? config.IOsShareLink
        : config.andriodShareLink;
    Linking.openURL(storeLink).catch(() =>
      Alert.alert('Error', 'Unable to open the app store. Please try again later.')
    );
  };

  const handleOpenFacebook = () => {
    const facebookUrl = 'https://www.facebook.com/share/g/15V1JErjbY/';
    Linking.openURL(facebookUrl).catch(() =>
      Alert.alert('Error', 'Unable to open Facebook. Please try again later.')
    );
  };

  const handleOpenWebsite = () => {
    const websiteUrl = config.webSite;
    Linking.openURL(websiteUrl).catch(() =>
      Alert.alert('Error', 'Unable to open the website. Please try again later.')
    );
  };

  const capitalizeDisplayName = (name) => {
    if (!name) return '';
    return name
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const styles = getStyles(isDarkMode);

  return (
    <View style={styles.container}>
      <View style={styles.userInfoContainer}>
        {user?.photoURL ? (
          <Image source={{ uri: user.photoURL }} style={styles.profileImage} />
        ) : (
<Image 
  source={require('../../assets/icon.png')} 
  style={styles.profileImage} 
/>
        )}
        <Text style={styles.userName}>
          {user == null ? 'Guest User' : capitalizeDisplayName(user?.displayName || 'Anonymous')}
        </Text>
        {user && (
          <TouchableOpacity style={styles.logoutButton} onPress={logoutUser}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.cardContainer}>
        <TouchableOpacity style={styles.option} onPress={handleShareApp}>
          <Icon name="share-social-outline" size={24} color={'#B76E79'} />
          <Text style={styles.optionText}>Share App</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={handleGetSuggestions}>
          <Icon name="mail-outline" size={24} color={'#566D5D'} />
          <Text style={styles.optionText}>Give Suggestions</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={handleRateApp}>
          <Icon name="star-outline" size={24} color={'#A2B38B'} />
          <Text style={styles.optionText}>Rate Us</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={handleOpenFacebook}>
          <Icon name="logo-facebook" size={24} color={'#566D5D'} />
          <Text style={styles.optionText}>Visit Facebook Group</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionlast} onPress={handleOpenWebsite}>
          <Icon name="link-outline" size={24} color={'#4B4453'} />
          <Text style={styles.optionText}>Visit Website</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getStyles = (isDarkMode) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#f2f2f7',
      padding: 20,
    },
    userInfoContainer: {
      alignItems: 'center',
      marginBottom: 20,
    },
    profileImage: {
      width: 80,
      height: 80,
      borderRadius: 40,
      marginBottom: 10,
    },
    userName: {
      fontSize: 18,
      fontWeight: '600',
      color: isDarkMode ? '#fff' : '#000',
    },
    logoutButton: {
      marginTop: 10,
      backgroundColor: '#007BFF',
      paddingVertical: 5,
      paddingHorizontal: 15,
      borderRadius: 5,
    },
    logoutButtonText: {
      color: '#fff',
      fontSize: 14,
    },
    cardContainer: {
      backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
      borderRadius: 10,
      padding: 10,
      // elevation: 2,
      // borderTopWidth: 0,
      // borderBottomWidth: 1,
      borderColor: isDarkMode ? '#333333' : '#cccccc',
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 15,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#333333' : '#cccccc',
    },
    optionlast:{
      flexDirection: 'row',
      alignItems: 'center',
      padding: 15,
    },
    optionText: {
      fontSize: 16,
      marginLeft: 10,
      color: isDarkMode ? '#fff' : '#000',
    },
    iconColor: isDarkMode ? '#fff' : '#000',
  });
