import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, set, onValue, get, update, off, query, orderByKey, limitToLast, remove } from 'firebase/database';
import auth from '@react-native-firebase/auth';
import messaging from '@react-native-firebase/messaging';
import { Appearance } from 'react-native';
import { createNewUser, firebaseConfig, registerForNotifications, saveTokenToDatabase } from './Globelhelper';
import { act } from 'react-test-renderer';

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const database = getDatabase(app);

// Create Global Context
const GlobalStateContext = createContext();

// Custom hook to access global state
export const useGlobalState = () => useContext(GlobalStateContext);

export const GlobalStateProvider = ({ children }) => {
  const [theme, setTheme] = useState(Appearance.getColorScheme());
  const [state, setState] = useState({
    data: {},
    normalStock: [],
    mirageStock: [],
    isAppReady: false,
  });
  const [user, setUser] = useState({
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

  const [onlineMembersCount, setOnlineMembersCount] = useState(0);
  const [activeUser, setActiveUser] = useState([]);
  const [bannedUsers, setBannedUsers] = useState([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0); // Total unread messages

  
  // Track theme changes
  useEffect(() => {
    const listener = Appearance.addChangeListener(({ colorScheme }) => {
      setTheme(colorScheme);
    });
    return () => listener.remove();
  }, []);



  useEffect(() => {
    if (!user?.id) return; // Ensure user is logged in

    const bannedRef = ref(database, `bannedUsers/${user.id}`); // Access current user's ban list

    const unsubscribe = onValue(bannedRef, (snapshot) => {
      const bannedData = snapshot.val() || {};
      const bannedUserIds = Object.keys(bannedData); // Extract banned user IDs
      setBannedUsers(bannedUserIds);
    });

    return () => unsubscribe(); // Clean up listener on component unmount
  }, [user?.id]);


  useEffect(() => {
    if (!user?.id) return;
  
    const privateChatsRef = ref(database, 'privateChats');
    const lastReadRef = ref(database, `lastseen/${user.id}`);
  
    const fetchUnreadMessages = async () => {
      try {
        const [chatsSnapshot, lastReadSnapshot] = await Promise.all([
          get(privateChatsRef),
          get(lastReadRef),
        ]);
  
        const chatsData = chatsSnapshot.val() || {};
        const lastReadData = lastReadSnapshot.val() || {};
  
        // Calculate unread messages for the logged-in user
        const totalUnread = Object.keys(chatsData).reduce((total, chatKey) => {
          const messages = Object.entries(chatsData[chatKey] || {});
  
          const unreadCount = messages.filter(
            ([, msg]) =>
              msg.receiverId === user.id && // Only messages for the current user
              msg.timestamp > (lastReadData[chatKey] || 0) // Messages sent after the last read timestamp
          ).length;
  
          return total + unreadCount;
        }, 0);
  
        setUnreadMessagesCount(totalUnread); // Update unread messages count
      } catch (error) {
        console.error('Error fetching unread messages:', error);
      }
    };
  
    // Real-time listeners for updates
    const handleChatsUpdate = () => fetchUnreadMessages();
    const handleLastReadUpdate = () => fetchUnreadMessages();
  
    const chatsListener = onValue(privateChatsRef, handleChatsUpdate, {
      onlyOnce: false,
    });
    const lastReadListener = onValue(lastReadRef, handleLastReadUpdate, {
      onlyOnce: false,
    });
  
    // Fetch unread messages initially
    fetchUnreadMessages();
  
    return () => {
      off(privateChatsRef, 'value', chatsListener);
      off(lastReadRef, 'value', lastReadListener);
    };
  }, [user?.id]);
  

  useEffect(() => {
    const onlineRef = ref(database, 'onlineUser');
  
    const unsubscribe = onValue(onlineRef, async (snapshot) => {
      const onlineUsers = snapshot.val() || {};
      const activeUsers = Object.values(onlineUsers).filter((user) => user.status);
  
      // Fetch metadata for new users
      const userMetadataPromises = activeUsers.map((active) =>
        get(ref(database, `users/${active.id}`)).then((snap) => snap.val())
      );
  
      const usersWithMetadata = await Promise.all(userMetadataPromises);
  
      const enrichedActiveUsers = activeUsers.map((active, index) => ({
        ...active,
        ...usersWithMetadata[index],
      }));
  
      setActiveUser(enrichedActiveUsers);
      setOnlineMembersCount(enrichedActiveUsers.length);
    });
  
    return () => unsubscribe();
  }, []);
  



  // Unified Update Function
  const updateLocalStateAndDatabase = async (keyOrUpdates, value) => {
    if (!user.id) return; // Prevent updates if user is not logged in

    try {
      const userRef = ref(database, `users/${user.id}`);
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
    });
  };

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (loggedInUser) => {
      if (loggedInUser) {
        const userId = loggedInUser.uid;
        const userRef = ref(database, `users/${userId}`);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
          // console.log('Fetched user data:', snapshot.val());
          setUser((prev) => ({
            ...prev,
            ...snapshot.val(),
            id: userId, // Ensure ID persists
          }));
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

  // Handle FCM token refresh
  useEffect(() => {
    const unsubscribe = messaging().onTokenRefresh(async (newToken) => {
      if (user.id) {
        await saveTokenToDatabase(newToken, user.id);
      }
    });
    return () => unsubscribe();
  }, [user?.id]);
  // Fetch public stock data
  useEffect(() => {
    const fetchStockData = async () => {
      try {
        const [xlsSnapshot, calcSnapshot] = await Promise.all([
          get(ref(database, 'xlsData')),
          get(ref(database, 'calcData')),
        ]);

        setState({
          data: xlsSnapshot.val() || [],
          normalStock: calcSnapshot.val()?.test || [],
          mirageStock: calcSnapshot.val()?.mirage || [],
          isAppReady: true,
        });
      } catch (error) {
        console.error('Error fetching stock data:', error);
      }
    };

    fetchStockData();
  }, []);

  const setOnlineStatus = (() => {
    let lastStatus = null;
    let timeout = null;
  
    return (status) => {
      if (user.id && status !== lastStatus) {
        if (timeout) clearTimeout(timeout);
  
        timeout = setTimeout(() => {
          const userRef = ref(database, `onlineUser/${user.id}`);
          set(userRef, {
            id: user.id,
            status,
            timestamp: Date.now(),
          });
          lastStatus = status;
        }, 1000); // Update status every 1 second if it changes
      }
    };
  })();
  
  
  useEffect(() => {
    if (user.id) {
      setOnlineStatus(true); // Set online status on login
    }
  
    return () => {
      if (user.id) {
        setOnlineStatus(false); // Set offline status on logout or app close
      }
    };
  }, [user?.id]);
  
  
  const contextValue = useMemo(
    () => ({
      state,
      setState,
      user,
      onlineMembersCount,
      theme,
      setUser,
      setOnlineMembersCount,
      activeUser,
      updateLocalStateAndDatabase,bannedUsers, unreadMessagesCount
      
    }),
    [state, user, onlineMembersCount, theme, activeUser, bannedUsers, unreadMessagesCount]
  );

  return (
    <GlobalStateContext.Provider value={contextValue}>
      {children}
    </GlobalStateContext.Provider>
  );
};


