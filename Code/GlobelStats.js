import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, set, onValue, get, update, off, onDisconnect, query, orderByChild, equalTo, remove, increment } from 'firebase/database';
import auth from '@react-native-firebase/auth';
import { Appearance } from 'react-native';
import { createNewUser, firebaseConfig, registerForNotifications } from './Globelhelper';
import database from '@react-native-firebase/database';
import { useLocalState } from './LocalGlobelStats';

const app = initializeApp(firebaseConfig);

const appdatabase = getDatabase(app);
appdatabase.persistenceEnabled = true;

// Create Global Context
const GlobalStateContext = createContext();

// Custom hook to access global state
export const useGlobalState = () => useContext(GlobalStateContext);

export const GlobalStateProvider = ({ children }) => {

  const {localState, updateLocalState} = useLocalState()
  const [theme, setTheme] = useState(localState.theme || 'light');

  const [state, setState] = useState({
    data: {},
    codes:{},
    normalStock: [],
    mirageStock: [],
    isAppReady: false,
  });
  const [user, setUser] = useState({
      id: localState.userId,
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
  
  // useEffect(() => {
  //   const onlineRef = ref(appdatabase, "onlineUsers");
  
  //   const unsubscribe = onValue(onlineRef, (snapshot) => {
  //     setOnlineMembersCount(snapshot.size || 0); // Count keys directly
  //   });
  
  //   return () => unsubscribe();
  // }, []);
// console.log(onlineMembersCount)


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
      displayname: 'Anonymous',
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
          if (loggedInUser) {
            const userId = loggedInUser.uid;
            const userRef = ref(appdatabase, `users/${userId}`);
            const snapshot = await get(userRef);
  
            if (snapshot.exists()) {
              // Update user state only if necessary to avoid redundant renders
              setUser((prevUser) => {
                const currentData = snapshot.val();
                if (!prevUser || prevUser.id !== userId || JSON.stringify(prevUser) !== JSON.stringify({ ...currentData, id: userId })) {
                  return { ...currentData, id: userId };
                }
                return prevUser;
              });
            } else {
              const newUser = createNewUser(userId, loggedInUser);
              await set(userRef, newUser);
              setUser(newUser);
            }
  
            // Register for notifications (ensure this happens only once)
            await registerForNotifications(userId);
          } else {
            // Reset user state if logged out
            // resetUserState();
          }
        } catch (error) {
          console.error("Error handling authentication state change:", error);
        }
      };
  
      handleAuthChange(); // Call the async function
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


// Utility: Centralized Error Handler
const handleError = (error) => {
  console.error('Error:', error.message);
  alert(error.message || 'An unexpected error occurred. Please try again.');
};

// Main Function to Fetch Data
const fetchStockData = async () => {
  try {
    setLoading(true);

    // Improved connectivity check
    await checkInternetConnection();

    const [xlsSnapshot, calcSnapshot, codeSnapShot] = await Promise.all([
      get(ref(appdatabase, 'xlsData')),
      get(ref(appdatabase, 'calcData')),
      get(ref(appdatabase, 'codes')),
    ]);

    setState({
      codes: codeSnapShot.val() || {},
      data: xlsSnapshot.val() || {},
      normalStock: calcSnapshot.val()?.test || {},
      mirageStock: calcSnapshot.val()?.mirage || {},
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
      theme,
      setUser,
      setOnlineMembersCount,
      updateLocalStateAndDatabase, fetchStockData, loading
      
    }),
    [state, user, onlineMembersCount, theme, fetchStockData, loading]
  );

  return (
    <GlobalStateContext.Provider value={contextValue}>
      {children}
    </GlobalStateContext.Provider>
  );
};


