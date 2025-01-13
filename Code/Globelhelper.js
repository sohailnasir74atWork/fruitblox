import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, get, set } from 'firebase/database'; // Correct Firebase imports
import messaging from '@react-native-firebase/messaging'; // React Native Firebase Messaging
import { Platform } from 'react-native'; // Platform detection (iOS/Android)
import { generateOnePieceUsername } from './Helper/RendomNamegen';
export const firebaseConfig = {
    apiKey: "AIzaSyDUXkQcecnhrNmeagvtRsKmDBmwz4AsRC0",
    authDomain: "fruiteblocks.firebaseapp.com",
    databaseURL: "https://fruiteblocks-default-rtdb.firebaseio.com",
    projectId: "fruiteblocks",
    storageBucket: "fruiteblocks.appspot.com",
    messagingSenderId: "409137828081",
    appId: Platform.select({
      ios: "1:409137828081:ios:89f062c9951cd664f39950",
      android: "1:409137828081:android:2b2e10b900614979f39950",
    }),
    measurementId: "G-C3T24PS3SF",
  };
  
  export const saveTokenToDatabase = async (token, currentUserId) => {
    if (!currentUserId || !token) {
      console.warn('Invalid inputs: Cannot save FCM token. User ID or token is null.');
      return;
    }
  
    try {
      const tokenRef = ref(getDatabase(), `users/${currentUserId}/fcmToken`);
      const invalidTokenRef = ref(getDatabase(), `users/${currentUserId}/isTokenInvalid`);
  
      // Fetch and compare existing token
      const currentToken = await get(tokenRef);
      if (currentToken.exists() && currentToken.val() === token) {
        // console.log('Token already up-to-date. No action needed.');
        return;
      }
  
      // Save token and reset invalid flag
      await Promise.all([
        set(tokenRef, token),
        set(invalidTokenRef, false),
      ]);
    //   console.log('FCM token saved successfully.');
    } catch (error) {
      console.error(`Error saving FCM token: ${error.message || error}`);
    }
  };
  

  export const registerForNotifications = async (currentUserId, retryCount = 0) => {
    // console.log('Starting notification registration...');
    if (!currentUserId) {
      console.warn('User ID is null. Cannot register for notifications.');
      return;
    }
  
    try {
    //   console.log('Requesting notification permissions...');
      const authStatus = await messaging().requestPermission();
    //   console.log('Auth Status:', authStatus);
  
      const isAuthorized =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  
      if (!isAuthorized) {
        console.warn('Notification permissions not granted.');
        return;
      }
  
      if (Platform.OS === 'ios') {
        // console.log('Fetching APNS Token...');
        const apnsToken = await messaging().getAPNSToken();
        // console.log('APNS Token:', apnsToken);
  
        if (!apnsToken) {
          console.error('APNS token is not available. Ensure APNS is configured correctly.');
          return;
        }
      }
  
    //   console.log('Fetching FCM Token...');
      const fcmToken = await messaging().getToken();
      // console.log('FCM Token:', fcmToken);
  
      if (!fcmToken) {
        console.error('Failed to fetch FCM token. Token is null or undefined.');
        return;
      }
  
    //   console.log('Saving token to database...');
      await saveTokenToDatabase(fcmToken, currentUserId);
    //   console.log('FCM token registered successfully.');
    } catch (error) {
      console.error(`Error registering for notifications: ${error.message || error}`);
    }
  };
  
  

  export const createNewUser = (userId, loggedInUser) => ({
    id: userId,
    selectedFruits: [],
    isAdmin: false,
    status: 'active',
    isReminderEnabled: false,
    isSelectedReminderEnabled: false,
    displayname: generateOnePieceUsername() || 'Anonymous',
    avatar:
      loggedInUser?.photoURL ||
      'https://bloxfruitscalc.com/wp-content/uploads/2025/display-pic.png',
    isOwner: false,
    isPro: false,
    points: 0,
    photoURL:loggedInUser?.photoURL
  });
  


export const resetUserState = (setUser) => {
    setUser({
      id: null,
      selectedFruits: [],
      isAdmin: false,
      status: null,
      isReminderEnabled: false,
      isSelectedReminderEnabled: false,
      displayname: 'Anonymous',
      avatar: null,
      isOwner: false,
      isPro: false,
      points: 0,
    });
  };

