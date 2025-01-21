import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, set, onValue, get, update, off, onDisconnect, query, orderByChild, equalTo } from 'firebase/database';
import auth from '@react-native-firebase/auth';
import { Appearance } from 'react-native';
import { createNewUser, firebaseConfig, registerForNotifications } from './Globelhelper';
import database from '@react-native-firebase/database';
import { useLocalState } from './LocalGlobelStats';

const app = initializeApp(firebaseConfig);

const appdatabase = getDatabase(app);

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
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0); // Total unread messages
  const [loading, setLoading] = useState(false);
  
  // Track theme changes
  useEffect(() => {
      setTheme(localState.theme); 

  }, [localState.theme]);
  useEffect(() => {
    if (!user?.id) return;
  
    const privateChatsRef = database().ref('privateChat');
    const lastReadRef = database().ref(`lastseen/${user.id}`);
    const bannedRef = database().ref(`bannedUsers/${user.id}`);
  
    const fetchUnreadMessages = async (snapshot) => {
      try {
        // Use the snapshot from the listener if available, otherwise fetch once
        const chatsData = snapshot?.val() || 
          (await privateChatsRef.orderByChild(`participants/${user.id}`).once('value')).val() || {};
        
        // Fetch additional data
        const lastReadSnapshot = await lastReadRef.once('value');
        const bannedSnapshot = await bannedRef.once('value');
  
        const lastReadData = lastReadSnapshot.val() || {};
        const bannedData = bannedSnapshot.val() || {};
  
       
  
        // Extract banned user IDs
        const bannedUserIds = Object.keys(bannedData || {});
  
        // Calculate unread messages for the current user
        let totalUnread = 0;
  
        Object.entries(chatsData || {}).forEach(([chatKey, chatData]) => {
          const otherUserId = Object.keys(chatData.participants || {}).find((id) => id !== user.id);
  
          if (!otherUserId || bannedUserIds.includes(otherUserId)) return;
  
          const unreadCount = Object.entries(chatData.messages || {}).filter(([_, msg]) => {
            const isReceiver = msg.receiverId === user.id;
            const isUnread = msg.timestamp > (lastReadData[chatKey] || 0);
            return isReceiver && isUnread;
          }).length;
  
          totalUnread += unreadCount;
        });
  
        setUnreadMessagesCount(totalUnread);
      } catch (error) {
        console.error('Error fetching unread messages:', error.message);
      }
    };
  
    // Add real-time listeners
    const chatsListener = privateChatsRef
      .orderByChild(`participants/${user.id}`)
      
      .on('value', fetchUnreadMessages);
  
    const lastReadListener = lastReadRef.on('value', fetchUnreadMessages);
    const bannedListener = bannedRef.on('value', fetchUnreadMessages);
  
    return () => {
      // Cleanup listeners
      privateChatsRef.off('value', chatsListener);
      lastReadRef.off('value', lastReadListener);
      bannedRef.off('value', bannedListener);
    };
  }, [user?.id]);
  
  
  

////////////logic for setting online users status////////

  useEffect(() => {
    if (!user?.id) return;
  
    const connectedRef = ref(appdatabase, ".info/connected");
  
    const handlePresence = onValue(connectedRef, (snapshot) => {
      if (snapshot.val() === true) {
        const userRef = ref(appdatabase, `onlineUsers/${user.id}`);
  
        // Set user as online
        set(userRef, {
          status: true,
          timestamp: Date.now(),
        });
  
        // Automatically remove user from onlineUser node on disconnect
        onDisconnect(userRef).remove();
      }
    });
  
    return () => off(connectedRef, "value", handlePresence);
  }, [user?.id]);
  
  
  useEffect(() => {
    const onlineRef = ref(appdatabase, "onlineUsers");
  
    const unsubscribe = onValue(onlineRef, (snapshot) => {
      setOnlineMembersCount(snapshot.size || 0); // Count keys directly
    });
  
    return () => unsubscribe();
  }, []);
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

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (loggedInUser) => {
      if (loggedInUser) {
        const userId = loggedInUser.uid;
        const userRef = ref(appdatabase, `users/${userId}`);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
          // console.log('Fetched user data:', snapshot.val());
          setUser((prev) => ({
            ...prev,
            ...snapshot.val(),
            id: userId, // Ensure ID persists
          }));
          updateLocalState('userId', userId);
        } else {
          // console.log('Creating new user...');
          const newUser = createNewUser(userId, loggedInUser);
          await set(userRef, newUser);
          setUser(newUser);
        }

        await registerForNotifications(userId);
      } else {
        // console.log('User logged out');
        resetUserState(); // Reset user state on logout
      }
    });

    return () => unsubscribe();
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
      updateLocalStateAndDatabase, unreadMessagesCount, fetchStockData, loading
      
    }),
    [state, user, onlineMembersCount, theme,  unreadMessagesCount, fetchStockData, loading]
  );

  return (
    <GlobalStateContext.Provider value={contextValue}>
      {children}
    </GlobalStateContext.Provider>
  );
};


