import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, set, onValue, get, off, onDisconnect } from 'firebase/database';
import auth from '@react-native-firebase/auth';
import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import { Appearance } from 'react-native';


// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDUXkQcecnhrNmeagvtRsKmDBmwz4AsRC0",
  authDomain: "fruiteblocks.firebaseapp.com",
  databaseURL: "https://fruiteblocks-default-rtdb.firebaseio.com",
  projectId: "fruiteblocks",
  storageBucket: "fruiteblocks.appspot.com",
  messagingSenderId: "409137828081",
  appId: Platform.select({
    ios: "1:409137828081:ios:89f062c9951cd664f39950", // Fixed iOS app ID
    android: "1:409137828081:android:2b2e10b900614979f39950", // Android app ID
  }),
  measurementId: "G-C3T24PS3SF",
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const database = getDatabase(app);

// Create a context for global state
const GlobalStateContext = createContext();

// Custom hook to use global state
export const useGlobalState = () => useContext(GlobalStateContext);

export const GlobalStateProvider = ({ children }) => {
  const [theme, setTheme] = useState(Appearance.getColorScheme());
  const [state, setState] = useState({
    data: null,
    normalStock: [],
    mirageStock: [],
    isAppReady: false,
  });

  const [selectedFruits, setSelectedFruits] = useState(null);
  const [isReminderEnabled, setIsReminderEnabled] = useState(null);
  const [isSelectedReminderEnabled, setIsSelectedReminderEnabled] = useState(null);
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isFetchingUserData, setIsFetchingUserData] = useState(false);
  const [dataloading, setDataLoading] = useState(true);
  const [onlineMembersCount, setOnlineMembersCount] = useState(0);


  useEffect(() => {
    const onlineRef = ref(getDatabase(), 'onlineUser');
  
    const handleOnlineUsers = (snapshot) => {
      const onlineUsers = snapshot.val() || {};
      const activeUsers = Object.keys(onlineUsers).filter(
        (key) => onlineUsers[key]?.status === true
      );
      setOnlineMembersCount(activeUsers.length);
    };
  
    const unsubscribe = onValue(onlineRef, handleOnlineUsers);
  
    return () => {
      // console.log('Removing real-time listener from onlineUser');
      off(onlineRef, 'value', handleOnlineUsers);
    };
  }, []);

  // Helper: Get user reference dynamically
  const getUserRef = (key) => ref(database, `users/${userId}/${key}`);
  // Reset user-specific state
  const resetUserState = () => {
    setSelectedFruits(null);
    setIsReminderEnabled(null);
    setIsSelectedReminderEnabled(null);
  };
  // console.log(userId)

  useEffect(() => {
    const listener = Appearance.addChangeListener(({ colorScheme }) => {
      setTheme(colorScheme);
    });
  
    return () => listener.remove();
  }, []);
  
  const saveTokenToDatabase = async (token, currentUserId) => {
    if (!currentUserId) {
      console.warn('User ID is null. Token not saved.');
      return;
    }
  
    try {
      const tokenRef = ref(database, `users/${currentUserId}/fcmToken`);
      const invalidTokenRef = ref(database, `users/${currentUserId}/isTokenInvalid`);
  
      // Fetch the existing token to check if it matches the new token
      const currentToken = await get(tokenRef);
      if (currentToken.exists() && currentToken.val() === token) {
        // console.log('FCM token is already up-to-date. No action needed.');
        return;
      }
  
      // Reset the invalid token flag and save the new token
      await Promise.all([
        set(tokenRef, token),
        set(invalidTokenRef, false),
      ]);
  
      // console.log('FCM token saved and invalid flag reset successfully:', token);
    } catch (error) {
      console.error('Error saving FCM token to database:', error);
    }
  };
  
  
  // Register for notification
  const registerForNotifications = async (currentUserId) => {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  
      if (enabled) {
        // console.log('Notification permissions granted.');
        const token = await messaging().getToken();
  
        if (currentUserId && token) {
          await saveTokenToDatabase(token, currentUserId);
          // console.log('FCM token saved successfully:', token);
        } else {
          console.warn('User ID is null or token retrieval failed. Token not saved.');
        }
      } else {
        console.error('Notification permissions not granted.');
      }
    } catch (error) {
      console.error('Error registering for notifications:', error);
  
      // Retry logic for recoverable errors
      if (Platform.OS === 'ios' || error.code === 'messaging/permission-blocked') {
        // console.log('Retrying registration in 5 seconds...');
        setTimeout(() => registerForNotifications(currentUserId), 5000);
      }
    }
  };
  
// console.log(userId)
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (loggedInUser) => {
      if (loggedInUser) {
        setUser(loggedInUser);
        setUserId(loggedInUser.uid);
        await registerForNotifications(loggedInUser.uid);
      } else {
        setUser(null);
        setUserId(null);
        resetUserState();
      }
    });

    return () => unsubscribe(); // Clean up listener on unmount
  }, []);


  // Handle FCM token refresh
  useEffect(() => {
    const handleTokenRefresh = async (newToken) => {
      try {
        if (userId) {
          await saveTokenToDatabase(newToken, userId);
        } else {
          console.warn('User ID is null during token refresh. Token not saved.');
        }
      } catch (error) {
        console.error('Error updating refreshed FCM token:', error);
      }
    };

    const unsubscribe = messaging().onTokenRefresh(handleTokenRefresh);

    return () => unsubscribe();
  }, [userId]);





  // Load user-specific data
  useEffect(() => {
    if (!userId) {
      setIsFetchingUserData(false);
      return;
    }

    setIsFetchingUserData(true);

    const userRef = ref(database, `users/${userId}`);
    
    const unsubscribe = onValue(userRef, (snapshot) => {
      const userData = snapshot.val();
      if (userData) {
        setSelectedFruits(userData.selectedFruits || []);
        setIsReminderEnabled(userData.isReminderEnabled || false);
        setIsSelectedReminderEnabled(userData.isSelectedReminderEnabled || false);
      } else {
        resetUserState();
      }
      setIsFetchingUserData(false);
    });

    return () => unsubscribe();
  }, [userId]);
  useEffect(() => {
    if (!user) return;
  
    const onlineRef = ref(database, `onlineUser/${userId}`);
  
    // Set the user's online status
    set(onlineRef, { id: userId, status: true, timestamp: Date.now() })
      .then(() => console.log())
      .catch((error) => console.error('Error setting online status:', error));
  
    // Ensure the user is marked offline on disconnect
    const onDisconnectRef = onDisconnect(onlineRef);
    onDisconnectRef
      .set(null)
      .then(() => console.log())
      .catch((error) => console.error('Error setting onDisconnect:', error));
  
    // Cleanup function to remove online status
    return () => {
      console.log();
      set(onlineRef, null).catch((error) =>
        console.error('Error removing online status on unmount:', error)
      );
    };
  }, [user]);
  

  // Fetch public stock data
  useEffect(() => {

    const fetchStockData = async () => {
      try {
        const [xlsSnapshot, calcSnapshot] = await Promise.all([
          get(ref(database, 'xlsData')),
          get(ref(database, 'calcData')),
        ]);

        const xlsData = xlsSnapshot.exists() ? xlsSnapshot.val() : [];
        const calcData = calcSnapshot.exists() ? calcSnapshot.val() : {};

        setState({
          data: xlsData,
          normalStock: calcData.test || [],
          mirageStock: calcData.mirage || [],
          isAppReady: true,
        });
        setDataLoading(false)
        // console.log('Stock data loaded successfully.');
      } catch (error) {
        console.error('Error fetching stock data:', error);
        setState((prevState) => ({ ...prevState, isAppReady: true }));
      }
    };

    fetchStockData();
  }, []);

  // Update user-specific data in Firebase
  const updateUserData = async (key, value) => {
    if (!userId) {
      console.error('No authenticated user. Skipping update.');
      return;
    }


    try {
      const userRef = getUserRef(key);
      await set(userRef, value);
      // console.log(`Successfully updated ${key} in Firebase.`);
    } catch (error) {
      console.error(`Error updating ${key} in Firebase:`, error);
    }
  };

  // Sync selectedFruits to Firebase
  useEffect(() => {
    if (userId && selectedFruits !== null && !isFetchingUserData) {
      updateUserData('selectedFruits', selectedFruits);

    }
  }, [selectedFruits, userId, isFetchingUserData]);

  // Sync isReminderEnabled to Firebase
  useEffect(() => {
    if (userId && isReminderEnabled !== null && !isFetchingUserData) {
      updateUserData('isReminderEnabled', isReminderEnabled);
    }
  }, [isReminderEnabled, userId, isFetchingUserData]);

  // Sync isSelectedReminderEnabled to Firebase
  useEffect(() => {
    if (userId && isSelectedReminderEnabled !== null && !isFetchingUserData) {
      updateUserData('isSelectedReminderEnabled', isSelectedReminderEnabled);
    }
  }, [isSelectedReminderEnabled, userId, isFetchingUserData]);
  const contextValue = useMemo(
    () => ({
      ...state,
      selectedFruits: selectedFruits || [], // Default to empty array
      setSelectedFruits,
      isReminderEnabled: isReminderEnabled ?? false, // Default to false
      setIsReminderEnabled,
      isSelectedReminderEnabled: isSelectedReminderEnabled ?? false, // Default to false
      setIsSelectedReminderEnabled,
      user,
      isFetchingUserData,
      theme, dataloading, onlineMembersCount, setOnlineMembersCount
    }),
    [state, selectedFruits, isReminderEnabled, isSelectedReminderEnabled, user, isFetchingUserData, theme, onlineMembersCount, setOnlineMembersCount, dataloading]
  );


  return (
    <GlobalStateContext.Provider value={contextValue}>
      {children}
    </GlobalStateContext.Provider>
  );
};