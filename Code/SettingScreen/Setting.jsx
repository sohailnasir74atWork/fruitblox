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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useGlobalState } from '../GlobelStats';
import { getStyles } from './settingstyle';
import { handleGetSuggestions, handleOpenFacebook, handleOpenWebsite, handleRateApp, handleShareApp, imageOptions } from './settinghelper';
import { logoutUser } from '../Firebase/UserLogics';
import SignInDrawer from '../Firebase/SigninDrawer';

import { RewardedAd, RewardedAdEventType } from 'react-native-google-mobile-ads';
import getAdUnitId from '../Ads/ads';
import { appleAuth } from '@invertase/react-native-apple-authentication';

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
  const { user, theme,  updateLocalStateAndDatabase, setUser} = useGlobalState()
  const isDarkMode = theme === 'dark';

async function onAppleButtonPress() {
  // performs login request
  const appleAuthRequestResponse = await appleAuth.performRequest({
    requestedOperation: appleAuth.Operation.LOGIN,
    // Note: it appears putting FULL_NAME first is important, see issue #293
    requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
  });

  // get current authentication state for user
  // /!\ This method must be tested on a real device. On the iOS simulator it always throws an error.
  const credentialState = await appleAuth.getCredentialStateForUser(appleAuthRequestResponse.user);

  // use credentialState response to ensure the user is authenticated
  if (credentialState === appleAuth.State.AUTHORIZED) {
    // user is authenticated
  }
}
  // Fetch user data on component mount
  useEffect(() => {
    if (user && user.id) {
      setNewDisplayName(user.displayName || 'Anonymous');
      setSelectedImage(user.avatar || 'https://bloxfruitscalc.com/wp-content/uploads/2025/display-pic.png');
    } else {
      setNewDisplayName('Guest User');
      setSelectedImage('https://bloxfruitscalc.com/wp-content/uploads/2025/display-pic.png');
    }
  }, [user]);

  const handleSaveChanges = async () => {
    if (user.id) {
      
      try {

        await updateLocalStateAndDatabase({'displayName': newDisplayName, 'avatar' : selectedImage})
        alert('Profile updated successfully!');
        setDrawerVisible(false)
      } catch (error) {
        console.error('Error updating profile:', error);
        alert('Failed to update profile. Please try again.');
      }
    }
  };
  
  const displayName = user.id ? newDisplayName || user.displayName || 'Anonymous' : 'Guest User';
  
  const handleLogout = async () => {
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
  const handleProfileUpdate = () => {
    if (user.id) {
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
        const newPoints = (user.points || 0) + reward.amount;
        // console.log(newPoints)
        updateLocalStateAndDatabase('points', newPoints);
        const now = new Date().getTime(); // Current time in milliseconds
        updateLocalStateAndDatabase('lastRewardtime', now);
    
        alert('Reward Granted', `You earned ${reward.amount} points!`);
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
    const lastRewardTime = user.lastRewardtime;
  
    if (!lastRewardTime) {
      return true; // No reward claimed yet, eligible
    }
  
    const oneHourInMs = 1 * 30 * 1000; // 1 hour in milliseconds
    const timeDifference = now - lastRewardTime;
  
    return timeDifference >= oneHourInMs; // Eligible if more than 1 hour has passed
  };
// console.log(user)
  const showAd = async () => {
    try {
      if (!canClaimReward()) {
        const remainingTime = 60 - Math.floor((new Date().getTime() - user.lastRewardtime) / 60000);
        Alert.alert('Not Eligible', `Please wait ${remainingTime} minutes to claim the next reward.`);
        return;
      }
  
      if (loaded) {
        await rewarded.show(); // Attempt to show the ad
        setLoaded(false); // Reset ad availability
        // console.log('Ad displayed successfully.');
      } else {
        Alert.alert('Ad not ready', 'Please wait until the ad is loaded.');
      }
    } catch (error) {
      console.error('Error displaying ad:', error);
      const newPoints = (user.points || 0) + 100;
      updateLocalStateAndDatabase('points', newPoints);
  
      // Update the last reward time
      const now = new Date().getTime(); // Current time in milliseconds
      updateLocalStateAndDatabase('lastRewardtime', now);
  
      Alert.alert('Reward Granted', `You earned 100 points!`);
    }
  };
  
  

  const handleGetPoints = () => {
    if (!user.id) {
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
            <TouchableOpacity onPress={user.id ? ()=>{} : ()=>{setOpenSignin(true)}}>
              <Text style={styles.userName}>
                {!user.id ? 'Login / Register' : (newDisplayName || displayName)}
              </Text>
              <Text style={styles.reward}>My Points: {user.points}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handleProfileUpdate}>
           {user.id && <Icon name="create-outline" size={24} color={'#566D5D'} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* Options Section */}
      <View style={styles.cardContainer}>
        <TouchableOpacity style={styles.option} onPress={handleGetPoints}>
          <Icon name="trophy-outline" size={24} color={'#4B4453'} />
          <Text style={styles.optionText}>Get Points</Text>
        </TouchableOpacity>
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
        <TouchableOpacity style={user.id ? styles.option :styles.optionLast }onPress={handleOpenWebsite}>
          <Icon name="link-outline" size={24} color={'#4B4453'} />
          <Text style={styles.optionText}>Visit Website</Text>
        </TouchableOpacity>
        {user.id && <TouchableOpacity style={styles.optionLast}onPress={()=>{handleLogout()}} >
          <Icon name="person-outline" size={24} color={'#4B4453'} />
          <Text style={styles.optionText}>Logout</Text>
        </TouchableOpacity>}
        
      </View>

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
                  <Image  source={{
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

