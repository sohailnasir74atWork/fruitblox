import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { firebase, getApp, getApps } from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import database, { ref, set, update, get, onDisconnect } from '@react-native-firebase/database';
import firestore from '@react-native-firebase/firestore';
import { createNewUser, firebaseConfig, registerForNotifications } from './Globelhelper';
import { useLocalState } from './LocalGlobelStats';
import { requestPermission } from './Helper/PermissionCheck';

// Ensure Firebase is initialized only once
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const appdatabase = database();
let firestoreDB = firestore();
// Create Global Context
const GlobalStateContext = createContext();

// Custom hook to access global state
export const useGlobalState = () => useContext(GlobalStateContext);

export const GlobalStateProvider = ({ children }) => {
// console.log(user)
  const {localState, updateLocalState} = useLocalState()
  const [theme, setTheme] = useState(localState.theme || 'light');

  const [state, setState] = useState({
    data: {},
    codes:{},
    normalStock: [],
    mirageStock: [],
    prenormalStock: [],
    premirageStock: [],
    isAppReady: false,
  });
  const [user, setUser] = useState({
      id: localState.userId,
      selectedFruits: [],
      admin: false,
      status: null,
      isReminderEnabled: false,
      isSelectedReminderEnabled: false,
      displayname: '',
      avatar: null,
      owner: false,
      isPro: false,
      points: 0, 
      lastRewardtime:null,
      isBlock:false,
      fcmToken:null


  });

  const [onlineMembersCount, setOnlineMembersCount] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Track theme changes
  useEffect(() => {
      setTheme(localState.theme); 

  }, [localState.theme]);

  const updateOnlineCount = (incrementValue) => {
    runTransaction(onlineCountRef, (current) => {
      return (current || 0) + incrementValue;
    }).catch((error) => {
      console.error("Error updating online count:", error);
    });
  };
 

  
  useEffect(() => {
    if (!user?.id) return;
  
    const userOnlineRef = ref(appdatabase, `onlineUsers/${user.id}`);
    const timestamp = Date.now();
  
    // Mark user as online (efficient update)
    update(userOnlineRef, {
      status: true,
      timestamp,
    })
      .then(() => console.log('User marked as online.'))
      .catch((error) => console.error('Error setting user online:', error));
  
    // Handle disconnection - Mark user as offline instead of removing
    onDisconnect(userOnlineRef)
      .update({ status: false, timestamp: Date.now() })
      .catch((error) => console.error('Error setting onDisconnect:', error));
  
    return () => {
      // Cleanup: Mark user offline when component unmounts
      update(userOnlineRef, { status: false, timestamp: Date.now() })
        .catch((error) => console.error('Error updating user status on cleanup:', error));
    };
  }, [user?.id]);
  
  



// console.log(onlineMembersCount)
  const updateLocalStateAndDatabase = async (keyOrUpdates, value) => {
    if (!user.id) return; // Prevent updates if user is not logged in

    try {
      const userRef = ref(appdatabase, `users/${user.id}`);
      if (typeof keyOrUpdates === 'string') {
        // Single update
        const updates = { [keyOrUpdates]: value };

        // Update local state
        setUser((prev) => ({
          ...prev,
          ...updates,
        }));

        // Update database
        await update(userRef, updates); // `update` will merge or set if the property doesn't exist
        // console.log(`Updated ${keyOrUpdates} to ${value} successfully.`);
      } else if (typeof keyOrUpdates === 'object') {
        // Batch update
        const updates = keyOrUpdates;

        // Update local state
        setUser((prev) => ({
          ...prev,
          ...updates,
        }));

        // Update database
        await update(userRef, updates); // `update` will handle both existing and new properties
        // console.log('Batch update successful:', updates);
      } else {
        throw new Error('Invalid arguments for update.');
      }
    } catch (error) {
      console.error('Error updating user state or database:', error);
    }
  };



// console.log(user)



  // Reset user state
  const resetUserState = () => {
    setUser({
      id: null,
      selectedFruits: [],
      admin: false,
      status: null,
      isReminderEnabled: false,
      isSelectedReminderEnabled: false,
      displayname: '',
      avatar: null,
      owner: false,
      isPro: false,
      points: 0, 
      lastRewardtime:null,
      isBlock:false,
      fcmToken:null


    });
  };

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((loggedInUser) => {
      const handleAuthChange = async () => {
        try {
          if (!loggedInUser) {
            resetUserState(); // Reset on logout
            return;
          }
  
          const userId = loggedInUser.uid;
          const userRef = ref(appdatabase, `users/${userId}`);
  
          // Fetch user data efficiently
          get(userRef).then(async (snapshot) => {
            if (snapshot.exists()) {
              setUser((prevUser) => {
                const currentData = snapshot.val();
                return (!prevUser || prevUser.id !== userId || JSON.stringify(prevUser) !== JSON.stringify({ ...currentData, id: userId }))
                  ? { ...currentData, id: userId }
                  : prevUser;
              });
            } else {
              const newUser = createNewUser(userId, loggedInUser);
              await set(userRef, newUser);
              setUser(newUser);
            }
  
            // Register notifications only when necessary
            await registerForNotifications(userId);
  
            // 🔹 Request permission after login
            const permissionGranted = await requestPermission();
            if (!permissionGranted) {
              // console.warn("User denied permissions.");
            }
          }).catch((error) => {
            console.error("Firebase fetch error:", error);
          });
        } catch (error) {
          console.error("Auth state change error:", error);
        }
      };
  
      handleAuthChange(); // Execute async logic
    });
  
    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);
  


  
 const checkInternetConnection = async () => {
  try {
    const response = await fetch('https://www.google.com/favicon.ico', { method: 'HEAD', cache: 'no-store' });
    if (!response.ok) {
      throw new Error('Unable to reach the internet. Please check your connection.');
    }
  } catch {
    throw new Error('No internet connection. Please check your network.');
  }
};



// Main Function to Fetch Data
const fetchStockData = async () => {
  try {
    setLoading(true);
    // Improved connectivity check
    await checkInternetConnection();

    const [xlsSnapshot, calcSnapshot, preSnapshot, codeSnapShot ] = await Promise.all([
      get(ref(appdatabase, 'testing')),
      get(ref(appdatabase, 'calcData')),
      get(ref(appdatabase, 'previousStock')),
      get(ref(appdatabase, 'codes')),
    ]);
    setState({
      codes: codeSnapShot.val() || {},
      data: xlsSnapshot.val() || {},
      normalStock: calcSnapshot.val()?.test || {},
      mirageStock: calcSnapshot.val()?.mirage || {},
      prenormalStock: preSnapshot.val()?.normalStock || {},
      premirageStock: preSnapshot.val()?.mirageStock || {},
      isAppReady: true,
    });
  } catch (error) {
    console.error('Error fetching stock data:', error);
    alert(error.message || 'An unexpected error occurred. Please try again.');
  } finally {
    setLoading(false);
  }
};


useEffect(() => {
  fetchStockData();
}, []);


  const contextValue = useMemo(
    () => ({
      state,
      setState,
      user,
      onlineMembersCount,
      firestoreDB,
    appdatabase,
      theme,
      setUser,
      setOnlineMembersCount,
      updateLocalStateAndDatabase, fetchStockData, loading,
      
    }),
    [state, user, onlineMembersCount, theme, fetchStockData, loading]
  );

  return (
    <GlobalStateContext.Provider value={contextValue}>
      {children}
    </GlobalStateContext.Provider>
  );
};


