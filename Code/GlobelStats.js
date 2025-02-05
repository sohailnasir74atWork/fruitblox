import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { firebase } from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import database, { ref, set, update, get, onDisconnect, remove, increment } from '@react-native-firebase/database';
import firestore from '@react-native-firebase/firestore';
import { createNewUser, firebaseConfig, registerForNotifications } from './Globelhelper';
import { useLocalState } from './LocalGlobelStats';
import { requestPermission } from './Helper/PermissionCheck';

// Ensure Firebase is initialized only once
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

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
      isAdmin: false,
      status: null,
      isReminderEnabled: false,
      isSelectedReminderEnabled: false,
      displayname: '',
      avatar: null,
      isOwner: false,
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
    try {
      firestoreDB = firestore();
      // console.log("🔥 Firestore initialized:", firestoreDB);
    } catch (error) {
      // console.error("🚨 Firestore initialization error:", error);
    }
  }, []);

  useEffect(() => {
    if (!user?.id) return;
  
    const userOnlineRef = ref(appdatabase, `onlineUsers/${user.id}`);
    const onlineCountRef = ref(appdatabase, `onlineUsersCount`);
    const timestamp = Date.now();
  
    // Fetch the initial count
    const fetchOnlineCount = async () => {
      try {
        const snapshot = await get(onlineCountRef);
        const count = snapshot.exists() ? snapshot.val().count || 0 : 0;
        setOnlineMembersCount(count);
      } catch (error) {
        console.error("Error fetching online users count:", error);
      }
    };
  
    fetchOnlineCount();
  
    // Set the user as online with status and timestamp
    set(userOnlineRef, {
      status: true,
      timestamp: timestamp,
    })
      .then(() => {
        // Increment the online users count
        update(onlineCountRef, { count: increment(1) });
        // console.log("User set as online and counter updated");
      })
      .catch((error) => {
        console.error("Error setting user online:", error);
      });
  
    // Handle disconnection to remove the user and decrement the counter
    onDisconnect(userOnlineRef)
      .remove()
      .then(() => {
        get(onlineCountRef).then((snapshot) => {
          const currentCount = snapshot.exists() ? snapshot.val().count || 0 : 0;
          if (currentCount > 0) {
            onDisconnect(onlineCountRef).update({ count: increment(-1) });
            // console.log("User will be removed and counter decremented on disconnect");
          }
        });
      })
      .catch((error) => {
        // console.error("Error setting onDisconnect handler:", error);
      });
  
    return () => {
      // Cleanup: Remove the user and decrement the online users count
      remove(userOnlineRef)
        .then(() => {
          get(onlineCountRef).then((snapshot) => {
            const currentCount = snapshot.exists() ? snapshot.val().count || 0 : 0;
            if (currentCount > 0) {
              update(onlineCountRef, { count: increment(-1) });
              // console.log("User removed and counter decremented");
            }
          });
        })
        .catch((error) => {
          console.error("Error removing user or updating counter:", error);
        });
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
      isAdmin: false,
      status: null,
      isReminderEnabled: false,
      isSelectedReminderEnabled: false,
      displayname: '',
      avatar: null,
      isOwner: false,
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
      prenormalStock: preSnapshot.val()?.mirageStock || {},
      premirageStock: preSnapshot.val()?.normalStock || {},
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


