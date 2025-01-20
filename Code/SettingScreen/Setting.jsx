import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  Modal,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useGlobalState } from '../GlobelStats';
import { getStyles } from './settingstyle';
import { handleGetSuggestions, handleOpenFacebook, handleOpenWebsite, handleRateApp, handleShareApp, imageOptions } from './settinghelper';
import { logoutUser } from '../Firebase/UserLogics';
import SignInDrawer from '../Firebase/SigninDrawer';
import auth from '@react-native-firebase/auth';

import { RewardedAd, RewardedAdEventType } from 'react-native-google-mobile-ads';
import getAdUnitId from '../Ads/ads';
import { appleAuth } from '@invertase/react-native-apple-authentication';
import { deleteUser } from '@react-native-firebase/auth';
import { resetUserState } from '../Globelhelper';
import ConditionalKeyboardWrapper from '../Helper/keyboardAvoidingContainer';
import { useHaptic } from '../Helper/HepticFeedBack';
import { useLocalState } from '../LocalGlobelStats';

const adUnitId = getAdUnitId('rewarded')

const rewarded = RewardedAd.createForAdRequest(adUnitId, {
  keywords: ['fashion', 'clothing'],
});


export default function SettingsScreen({ selectedTheme }) {
  const [isDrawerVisible, setDrawerVisible] = useState(false);
  const [isAdsDrawerVisible, setIsAdsDrawerVisible] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [openSingnin, setOpenSignin] = useState(false);
  const { user, theme, updateLocalStateAndDatabase, setUser } = useGlobalState()
  const {updateLocalState, localState} = useLocalState()
  const { triggerHapticFeedback } = useHaptic();
  const themes = ['system', 'light', 'dark'];


  const toggleTheme = () => {
    const currentIndex = themes.indexOf(localState.theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    updateLocalState('theme', themes[nextIndex]); // Update global state
  };



  const handleToggle = (value) => {
    updateLocalState('isHaptic', value); // Update isHaptic state globally
  };
  const isDarkMode = theme === 'dark';
  // Fetch user data on component mount
  useEffect(() => {
    if (user && user?.id) {
      setNewDisplayName(user?.displayName?.trim() || user?.displayname?.trim() || 'Anonymous');
      setSelectedImage(user?.avatar?.trim() || 'https://bloxfruitscalc.com/wp-content/uploads/2025/display-pic.png');
    } else {
      setNewDisplayName('Guest User');
      setSelectedImage('https://bloxfruitscalc.com/wp-content/uploads/2025/display-pic.png');
    }

  }, [user]);



  const handleSaveChanges = async () => {
    triggerHapticFeedback('impactLight');
    const MAX_NAME_LENGTH = 20;

    if (!user?.id) return;

    if (newDisplayName.length > MAX_NAME_LENGTH) {
      Alert.alert(
        'Error',
        `Display name cannot exceed ${MAX_NAME_LENGTH} characters.`
      );
      return;
    }

    try {
      await updateLocalStateAndDatabase({
        displayName: newDisplayName.trim(),
        displayname: newDisplayName.trim(), // Sync both properties
        avatar: selectedImage.trim(),
      });

      setDrawerVisible(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };



  const displayName = user?.id
    ? newDisplayName?.trim() || user?.displayName?.trim() || user?.displayname?.trim() || 'Anonymous'
    : 'Guest User';




  const handleLogout = async () => {
    triggerHapticFeedback('impactLight');
    try {
      await logoutUser(setUser); // Await the logout process
      // setSelectedImage('https://bloxfruitscalc.com/wp-content/uploads/2025/display-pic.png');
      // setNewDisplayName('Guest User');
      Alert.alert('Success', 'You have been logged out successfully.');
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };
  const handleDeleteUser = async () => {
    triggerHapticFeedback('impactLight');
    try {
      if (!user || !user?.id) {
        Alert.alert('Error', 'No user is currently logged in.');
        return;
      }

      // Step 1: Acknowledge the irreversible action
      const showAcknowledgment = () =>
        new Promise((resolve, reject) => {
          Alert.alert(
            'Delete Account',
            'Deleting your account will permanently erase all your data, including chat history, points, and profile details. This action is irreversible.',
            [
              { text: 'Cancel', style: 'cancel', onPress: reject },
              { text: 'Proceed', style: 'destructive', onPress: resolve },
            ]
          );
        });

      // Step 2: Confirm the action again
      const showFinalConfirmation = () =>
        new Promise((resolve, reject) => {
          Alert.alert(
            'Confirm Deletion',
            'Are you sure you want to delete your account? This action cannot be undone.',
            [
              { text: 'Cancel', style: 'cancel', onPress: reject },
              { text: 'Delete', style: 'destructive', onPress: resolve },
            ]
          );
        });

      // Await acknowledgment and confirmation
      await showAcknowledgment();
      await showFinalConfirmation();

      // Proceed to delete the user account
      const currentUser = auth().currentUser;
      if (currentUser) {
        await currentUser.delete(); // Delete the user account
        await resetUserState(setUser); // Reset the user state
        Alert.alert('Success', 'Your account and all associated data have been permanently deleted.');
      } else {
        Alert.alert('Error', 'User not found. Please log in again.');
      }
    } catch (error) {
      console.error('Error deleting user:', error.message);
      if (error.code === 'auth/requires-recent-login') {
        Alert.alert(
          'Session Expired',
          'Please log in again to delete your account.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Failed to delete account. Please try again.');
      }
    }
  };


  const handleProfileUpdate = () => {
    triggerHapticFeedback('impactLight');
    if (user?.id) {
      setDrawerVisible(true); // Open the profile drawer if the user is logged in
    } else {
      Alert.alert('Notice', 'Please log in to customize your profile.'); // Show alert if user is not logged in
    }
  };

  useEffect(() => {
    const unsubscribeLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
      setLoaded(true);
    });
    const unsubscribeEarned = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      reward => {
        // console.log('User earned reward of ', reward);
        const newPoints = (user?.points || 0) + 100;
        // console.log(newPoints)
        updateLocalStateAndDatabase('points', newPoints);
        const now = new Date().getTime(); // Current time in milliseconds
        updateLocalStateAndDatabase('lastRewardtime', now);

        Alert.alert('Reward Granted', `You earned ${reward.amount} points!`);
      },
    );

    // Start loading the rewarded ad straight away
    rewarded.load();

    // Unsubscribe from events on unmount
    return () => {
      unsubscribeLoaded();
      unsubscribeEarned();
    };
  }, []);
  const canClaimReward = () => {
    const now = new Date().getTime();
    const lastRewardTime = user?.lastRewardtime;

    if (!lastRewardTime) return true;

    const timeDifference = now - lastRewardTime;
    return timeDifference >=   2 * 60 * 1000; // 30 seconds as defined
  };
  // console.log(user)
  const showAd = async () => {
    try {
      if (!canClaimReward()) {
        const remainingTime = 2 - Math.floor((new Date().getTime() - user?.lastRewardtime) / 60000);
        Alert.alert('Not Eligible', `Please wait ${remainingTime} minutes to claim the next reward.`);
        return;
      }

      if (loaded) {
        await rewarded.show(); // Attempt to show the ad
        setLoaded(false); // Reset ad availability
        // console.log('Ad displayed successfully.');
      } else {

        const newPoints = (user?.points || 0) + 100;
        // console.log(newPoints)
        updateLocalStateAndDatabase('points', newPoints);
        const now = new Date().getTime(); // Current time in milliseconds
        updateLocalStateAndDatabase('lastRewardtime', now);

        Alert.alert('Ad not ready', 'However reward granted');
      }
    } catch (error) {
      console.error('Error displaying ad:', error);
    }
  };



  const handleGetPoints = () => {
    triggerHapticFeedback('impactLight');
    if (!user?.id) {
      setOpenSignin(true);
    } else {
      setIsAdsDrawerVisible(true)
    }
  };

  const styles = getStyles(isDarkMode);
  return (
    <View style={styles.container}>
      {/* User Profile Section */}
      <View style={styles.cardContainer}>
        <View style={styles.optionuserName}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image
              source={
                typeof selectedImage === 'string' && selectedImage.trim()
                  ? { uri: selectedImage }
                  : { uri: 'https://bloxfruitscalc.com/wp-content/uploads/2025/display-pic.png' }
              }
              style={styles.profileImage}
            />
            <TouchableOpacity onPress={user?.id ? () => { } : () => { setOpenSignin(true) }}>
              <Text style={styles.userName}>
                {!user?.id ? 'Login / Register' : displayName}
              </Text>

              <Text style={styles.reward}>My Points: {user?.points}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handleProfileUpdate}>
            {user?.id && <Icon name="create-outline" size={24} color={'#566D5D'} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* Options Section */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>APP SETTINGS</Text>
      <View style={styles.cardContainer}>
        <View style={styles.option} onPress={()=>{handleShareApp(); triggerHapticFeedback('impactLight');
}}>
  <View style={{flexDirection:'row', justifyContent:'space-between', width:'100%'}}>
    <TouchableOpacity style={{flexDirection:'row', alignItems:'center'}}>
          <Icon name="radio-outline" size={24} color={'#B76E79'} />
          <Text style={styles.optionText}>Heptic Feedback</Text></TouchableOpacity>
          <Switch value={localState.isHaptic} onValueChange={handleToggle} />
          </View>
        </View>
        <View style={styles.optionLast} onPress={()=>{handleShareApp(); triggerHapticFeedback('impactLight');
}}>
  <View style={{flexDirection:'row', justifyContent:'space-between', width:'100%'}}>
    <TouchableOpacity style={{flexDirection:'row', alignItems:'center'}}>
          <Icon name="contrast-outline" size={24} color={'#4A90E2'} />
          <Text style={styles.optionText}>Theme</Text></TouchableOpacity>
          <View style={styles.containertheme}>
      {themes.map((theme) => (
        <TouchableOpacity
          key={theme}
          style={[
            styles.box,
            localState.theme === theme.toLowerCase() && styles.selectedBox, // Highlight selected box
          ]}
          onPress={() => updateLocalState('theme', theme.toLowerCase())}
        >
          <Text
            style={[
              styles.text,
              localState.theme === theme.toLowerCase() && styles.selectedText, // Highlight selected text
            ]}
          >
                       {theme.toUpperCase()}

          </Text>
        </TouchableOpacity>
      ))}
    </View>
          </View>
        </View>
      </View>
      <Text style={styles.subtitle}>REWARD SETTINGS</Text>
      <View style={styles.cardContainer}>
        
        <TouchableOpacity style={styles.optionLast} onPress={handleGetPoints}>
          <Icon name="trophy-outline" size={24} color={'#4B4453'} />
          <Text style={styles.optionText}>Get Points</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.subtitle}>OTHER SETTINGS</Text>

      <View style={styles.cardContainer}>
  
     
        <TouchableOpacity style={styles.option} onPress={()=>{handleShareApp(); triggerHapticFeedback('impactLight');
}}>
          <Icon name="share-social-outline" size={24} color={'#B76E79'} />
          <Text style={styles.optionText}>Share App</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option} onPress={()=>{handleGetSuggestions();        triggerHapticFeedback('impactLight');
}}>
          <Icon name="mail-outline" size={24} color={'#566D5D'} />
          <Text style={styles.optionText}>Give Suggestions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option} onPress={()=>{handleRateApp(); triggerHapticFeedback('impactLight');}
}>
          <Icon name="star-outline" size={24} color={'#A2B38B'} />
          <Text style={styles.optionText}>Rate Us</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option} onPress={()=>{handleOpenFacebook();         triggerHapticFeedback('impactLight');
}}>
          <Icon name="logo-facebook" size={24} color={'#566D5D'} />
          <Text style={styles.optionText}>Visit Facebook Group</Text>
        </TouchableOpacity>
        <TouchableOpacity style={user?.id ? styles.option : styles.optionLast} onPress={()=>{handleOpenWebsite();         triggerHapticFeedback('impactLight');
}}>
          <Icon name="link-outline" size={24} color={'#4B4453'} />
          <Text style={styles.optionText}>Visit Website</Text>
        </TouchableOpacity>
        {user?.id && <TouchableOpacity style={styles.option} onPress={handleLogout} >
          <Icon name="person-outline" size={24} color={'#4B4453'} />
          <Text style={styles.optionTextLogout}>Logout</Text>
        </TouchableOpacity>}
        {user?.id && <TouchableOpacity style={styles.optionDelete} onPress={handleDeleteUser} >
          <Icon name="warning-outline" size={24} color={'#4B4453'} />
          <Text style={styles.optionTextDelete}>Delete My Account</Text>
        </TouchableOpacity>}

      </View>
      </ScrollView>

      {/* Bottom Drawer */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isDrawerVisible}
        onRequestClose={() => setDrawerVisible(false)}
      >

        <Pressable
          style={styles.overlay}
          onPress={() => setDrawerVisible(false)}
        />
      <ConditionalKeyboardWrapper>
          <View style={{ backgroundColor: 'rgba(0,0,0,0.5)', }}>
            <View style={styles.drawer}>

              {/* Name Input */}
              <Text style={styles.drawerSubtitle}>Change Display Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter new display name"
                value={newDisplayName}
                onChangeText={setNewDisplayName}
              />

              {/* Profile Image Selection */}
              <Text style={styles.drawerSubtitle}>Select Profile Icon</Text>
              <FlatList
                data={imageOptions}
                keyExtractor={(item, index) => item.toString()}
                horizontal
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedImage(item);
                    }}
                  >
                    <Image source={{
                      uri: item,
                    }} style={styles.imageOption} />
                  </TouchableOpacity>
                )}
              />

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveChanges}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
          </ConditionalKeyboardWrapper>
      </Modal>
      <Modal
        animationType="slide"
        transparent={true}
        visible={isAdsDrawerVisible}
        onRequestClose={() => setIsAdsDrawerVisible(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setIsAdsDrawerVisible(false)}
        />
        <View style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={styles.drawer}>
            {/* Explanation of Rewards */}
            <Text style={styles.drawerSubtitle}>
              Watch an ad to earn rewards!
            </Text>
            <Text style={styles.rewardDescription}>
              Earn points by watching ads. These points can be used to participate in app contests and unlock special features.
            </Text>

            {/* Button to Show Ad */}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={showAd}
            >
              <Text style={styles.saveButtonText}>Earn Reward</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <SignInDrawer
        visible={openSingnin}
        onClose={() => setOpenSignin(false)}
        selectedTheme={selectedTheme}
        message='To collect points, you need to sign in'
      />
    </View>
  );
}