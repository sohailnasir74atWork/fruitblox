import { Alert, Linking, Platform } from "react-native";
import config from "../Helper/Environment";
import Share from 'react-native-share';

export const getAppDownloadLink = () => {
    return Platform.OS === 'ios'
      ? config.IOsShareLink
      : config.andriodShareLink;
  };

  export const handleShareApp = async () => {
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
  

  export const handleGetSuggestions = () => {
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

  export const handleRateApp = () => {
    const storeLink =
      Platform.OS === 'ios'
        ? config.IOsShareLink
        : config.andriodShareLink;
    Linking.openURL(storeLink).catch(() =>
      Alert.alert('Error', 'Unable to open the app store. Please try again later.')
    );
  };

  export const handleOpenFacebook = () => {
    const facebookUrl = 'https://www.facebook.com/share/g/15V1JErjbY/';
    Linking.openURL(facebookUrl).catch(() =>
      Alert.alert('Error', 'Unable to open Facebook. Please try again later.')
    );
  };

  export const handleOpenWebsite = () => {
    const websiteUrl = config.webSite;
    Linking.openURL(websiteUrl).catch(() =>
      Alert.alert('Error', 'Unable to open the website. Please try again later.')
    );
  };

  export const imageOptions = [
    'https://bloxfruitscalc.com/wp-content/uploads/2025/display-pic.png',
    'https://bloxfruitscalc.com/wp-content/uploads/2025/eagle.png',
    'https://bloxfruitscalc.com/wp-content/uploads/2025/patch.png',
    'https://bloxfruitscalc.com/wp-content/uploads/2025/pirate1.png',
    'https://bloxfruitscalc.com/wp-content/uploads/2025/pirate2.png',
    'https://bloxfruitscalc.com/wp-content/uploads/2025/pirate3.png',
    'https://bloxfruitscalc.com/wp-content/uploads/2025/pirate-flag.png',
    'https://bloxfruitscalc.com/wp-content/uploads/2025/pirate-hat.png',
    'https://bloxfruitscalc.com/wp-content/uploads/2025/pirate-hat1.png',
    'https://bloxfruitscalc.com/wp-content/uploads/2025/pirate-ship.png',
    'https://bloxfruitscalc.com/wp-content/uploads/2025/pirate-ship2.png',
    'https://bloxfruitscalc.com/wp-content/uploads/2025/pirate-skull.png',
    'https://bloxfruitscalc.com/wp-content/uploads/2025/pirate.png',
    'https://bloxfruitscalc.com/wp-content/uploads/2025/steering-wheel.png',
    'https://bloxfruitscalc.com/wp-content/uploads/2025/woman.png',
  ];
 