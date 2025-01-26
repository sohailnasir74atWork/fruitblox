import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, set, onValue, get, update, off, onDisconnect, query, orderByChild, equalTo, remove } from 'firebase/database';
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
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0); // Total unread messages
  const [loading, setLoading] = useState(false);
  
  // Track theme changes
  useEffect(() => {
      setTheme(localState.theme); 

  }, [localState.theme]);



  // useEffect(() => {
  //   if (!user?.id) return;
  
  //   const privateChatsRef = database().ref('privateChat');
  //   const lastReadRef = database().ref(`lastseen/${user.id}`);
  //   const bannedRef = database().ref(`bannedUsers/${user.id}`);
  
  //   const fetchUnreadMessages = async (snapshot) => {
  //     try {
  //       // Use the snapshot from the listener if available, otherwise fetch once
  //       const chatsData = snapshot?.val() || 
  //         (await privateChatsRef.orderByChild(`participants/${user.id}`).once('value')).val() || {};
        
  //       // Fetch additional data
  //       const lastReadSnapshot = await lastReadRef.once('value');
  //       const bannedSnapshot = await bannedRef.once('value');
  
  //       const lastReadData = lastReadSnapshot.val() || {};
  //       const bannedData = bannedSnapshot.val() || {};
  
       
  
  //       // Extract banned user IDs
  //       const bannedUserIds = Object.keys(bannedData || {});
  
  //       // Calculate unread messages for the current user
  //       let totalUnread = 0;
  
  //       Object.entries(chatsData || {}).forEach(([chatKey, chatData]) => {
  //         const otherUserId = Object.keys(chatData.participants || {}).find((id) => id !== user.id);
  
  //         if (!otherUserId || bannedUserIds.includes(otherUserId)) return;
  
  //         const unreadCount = Object.entries(chatData.messages || {}).filter(([_, msg]) => {
  //           const isReceiver = msg.receiverId === user.id;
  //           const isUnread = msg.timestamp > (lastReadData[chatKey] || 0);
  //           return isReceiver && isUnread;
  //         }).length;
  
  //         totalUnread += unreadCount;
  //       });
  
  //       setUnreadMessagesCount(totalUnread);
  //     } catch (error) {
  //       console.error('Error fetching unread messages:', error.message);
  //     }
  //   };
  
  //   // Add real-time listeners
  //   const chatsListener = privateChatsRef
  //     .orderByChild(`participants/${user.id}`)
      
  //     .on('value', fetchUnreadMessages);
  
  //   const lastReadListener = lastReadRef.on('value', fetchUnreadMessages);
  //   const bannedListener = bannedRef.once('value', fetchUnreadMessages);
  
  //   return () => {
  //     // Cleanup listeners
  //     privateChatsRef.off('value', chatsListener);
  //     lastReadRef.off('value', lastReadListener);
  //     bannedRef.off('value', bannedListener);
  //   };
  // }, [user?.id]);
  
  


////////////logic for setting online users status////////
useEffect(() => {
  if (!user?.id) return;

  const privateChatsRef = database().ref('private_chat');
  const lastReadRef = database().ref(`lastseen/${user.id}`);
  const bannedRef = database().ref(`bannedUsers/${user.id}`);

  const fetchChatsAndUnreadMessages = async () => {
    try {
      // Fetch all relevant data in a single batch
      const [chatsSnapshot, lastReadSnapshot, bannedSnapshot] = await Promise.all([
        privateChatsRef
          .orderByChild(`participants/${user.id}`)
          .equalTo(true) // Fetch only chats where the user is a participant
          .once('value'),
        lastReadRef.once('value'),
        bannedRef.once('value'),
      ]);

      const chatsData = chatsSnapshot.val() || {};
      const lastReadData = lastReadSnapshot.val() || {};
      const bannedData = bannedSnapshot.val() || {};

      const bannedUserIds = new Set(Object.keys(bannedData)); // Use a Set for faster lookups
      let totalUnread = 0;

      Object.entries(chatsData).forEach(([chatKey, chatData]) => {
        const otherUserId = Object.keys(chatData.participants || {}).find((id) => id !== user.id);

        if (!otherUserId || bannedUserIds.has(otherUserId)) return;

        const lastReadTimestamp = lastReadData[chatKey] || 0;
        const lastMessage = chatData.lastMessage;

        if (lastMessage && lastMessage.timestamp > lastReadTimestamp && lastMessage.senderId !== user.id) {
          totalUnread += 1; // Increment unread count
        }
      });

      setUnreadMessagesCount(totalUnread);
    } catch (error) {
      console.error('Error fetching chats or unread messages:', error.message);
    }
  };

  // Real-time listener for `lastMessage` updates
  const chatsListener = privateChatsRef
    .orderByChild(`participants/${user.id}`)
    .equalTo(true)
    .on('child_changed', (snapshot) => {
      const chatKey = snapshot.key;
      const chatData = snapshot.val();

      if (chatData && chatData.lastMessage) {
        const lastMessage = chatData.lastMessage;

        // Check if the last message is unread
        database()
          .ref(`lastseen/${user.id}/${chatKey}`)
          .once('value')
          .then((lastReadSnapshot) => {
            const lastReadTimestamp = lastReadSnapshot.val() || 0;

            if (lastMessage.timestamp > lastReadTimestamp && lastMessage.senderId !== user.id) {
              setUnreadMessagesCount((prev) => prev + 1);
            }
          })
          .catch((error) => {
            console.error('Error fetching last seen data:', error.message);
          });
      }
    });

  // Listener for updates to last read timestamps
  const lastReadListener = lastReadRef.on('value', fetchChatsAndUnreadMessages);

  // Fetch all required data initially
  fetchChatsAndUnreadMessages();

  return () => {
    // Cleanup listeners
    privateChatsRef.off('child_changed', chatsListener);
    lastReadRef.off('value', lastReadListener);
  };
}, [user?.id]);


useEffect(() => {
  if (!user?.id) return;

  const userOnlineRef = ref(appdatabase, `onlineUsers/${user.id}`);
  const timestamp = Date.now();

  // Set the user as online with status and timestamp
  set(userOnlineRef, {
    status: true,
    timestamp: timestamp,
  })
    .then(() => {
      // console.log('User set as online:', user.id);
    })
    .catch((error) => {
      console.error('Error setting user online:', error);
    });

  // Handle disconnection to remove the user from onlineUsers
  onDisconnect(userOnlineRef)
    .remove()
    .then(() => {
      // console.log('User will be removed from online users on disconnect:', user.id);
    })
    .catch((error) => {
      console.error('Error setting onDisconnect handler:', error);
    });

  return () => {
    // Cleanup: Remove the user from online users when logging out or unmounting
    remove(userOnlineRef)
      .then(() => {
        // console.log('User removed from online users:', user.id);
      })
      .catch((error) => {
        console.error('Error removing user from online users:', error);
      });
  };
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
          setUser({
            ...snapshot.val(),
            id: userId, // Ensure ID persists
          });
        } else {
          const newUser = createNewUser(userId, loggedInUser);
          await set(userRef, newUser);
          setUser(newUser);
        }
  
        await registerForNotifications(userId);
      } else {
        resetUserState();
      }
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


