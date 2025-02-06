import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import database from '@react-native-firebase/database';
import { useGlobalState } from '../../GlobelStats';
import SignInDrawer from '../../Firebase/SigninDrawer';
import AdminHeader from './AdminHeader';
import MessagesList from './MessagesList';
import MessageInput from './MessageInput';
import { getStyles } from '../Style';
import { AdEventType, BannerAd, BannerAdSize, InterstitialAd } from 'react-native-google-mobile-ads';
import getAdUnitId from '../../Ads/ads';
import { banUser, deleteOldest500Messages, isUserOnline, makeAdmin,  removeAdmin, unbanUser } from '../utils';
import { useNavigation } from '@react-navigation/native';
import ProfileBottomDrawer from './BottomDrawer';
import leoProfanity from 'leo-profanity';
import ConditionalKeyboardWrapper from '../../Helper/keyboardAvoidingContainer';
import { useHaptic } from '../../Helper/HepticFeedBack';
import { useLocalState } from '../../LocalGlobelStats';
leoProfanity.add(['hell', 'shit']);
leoProfanity.loadDictionary('en');

const bannerAdUnitId = getAdUnitId('banner');
const interstitialAdUnitId = getAdUnitId('interstitial');
const interstitial = InterstitialAd.createForAdRequest(interstitialAdUnitId);


const ChatScreen = ({ selectedTheme, bannedUsers, modalVisibleChatinfo, setChatFocused,
  setModalVisibleChatinfo, unreadMessagesCount  }) => {
  const { user, theme, onlineMembersCount } = useGlobalState();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [lastLoadedKey, setLastLoadedKey] = useState(null);
  const [isSigninDrawerVisible, setIsSigninDrawerVisible] = useState(false);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null); // Store the selected user's details
  const [isOnline, setIsOnline] = useState(false);
  const userId = selectedUser?.senderId || null;
  const [isAdVisible, setIsAdVisible] = useState(true);
  const [isCooldown, setIsCooldown] = useState(false); 
  const [signinMessage, setSigninMessage] = useState(false); 
  const { triggerHapticFeedback } = useHaptic();
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const [isShowingAd, setIsShowingAd] = useState(false);
    const {isPro} = useLocalState()

  useEffect(() => {
    let isMounted = true;

    const checkUserStatus = async () => {
      if (userId) {
        const status = await isUserOnline(userId);
        if (isMounted) {
          setIsOnline(status); // Update state only if component is still mounted
        }
      } else {
        setIsOnline(false);
      }
    };

    checkUserStatus();

    return () => {
      isMounted = false;
    };
  }, [userId]);
  
  const PAGE_SIZE = 50; 

  const navigation = useNavigation()
  const toggleDrawer = (userData = null) => {
    setSelectedUser(userData);
    setIsDrawerVisible(!isDrawerVisible);
  };
  const startPrivateChat = () => {
    showInterstitialAd(() => {
      toggleDrawer();
      navigation.navigate('PrivateChat', { selectedUser, selectedTheme, isOnline });

       })
  
  };

  const chatRef = useMemo(() => database().ref('chat'), []);
  const pinnedMessagesRef = useMemo(() => database().ref('pinnedMessages'), []);

  const isAdmin = user?.isAdmin || false;
  const isOwner = user?.isOwner || false;
  const styles = useMemo(() => getStyles(theme === 'dark'), [theme]);




  const validateMessage = useCallback((message) => {
    const hasText = message?.text?.trim();
    return {
        ...message,
        sender: message.sender?.trim() || 'Anonymous',
        text: hasText || '[No content]',
        timestamp: hasText ? message.timestamp || Date.now() : Date.now() - 1 * 24 * 60 * 60 * 1000,
    };
}, []);

  const loadMessages = useCallback(
    async (reset = false) => {
      try {
        if (reset) {
          // console.log('Resetting messages and loading the latest ones.');
          setLoading(true);
          setLastLoadedKey(null); // Reset pagination key
        }
  
        // console.log(`Fetching messages. Reset: ${reset}, LastLoadedKey: ${lastLoadedKey}`);
  
        const messageQuery = reset
          ? chatRef.orderByKey().limitToLast(PAGE_SIZE)
          : chatRef.orderByKey().endAt(lastLoadedKey).limitToLast(PAGE_SIZE);
  
        const snapshot = await messageQuery.once('value');
        const data = snapshot.val() || {};
  
        // console.log(`Fetched ${Object.keys(data).length} messages from Firebase.`);
  
        const bannedUserIds = bannedUsers?.map((user) => user.id) || [];
        // console.log('Banned User IDs:', bannedUserIds);
  
        const parsedMessages = Object.entries(data)
          .map(([key, value]) => validateMessage({ id: key, ...value }))
          .filter((msg) => !bannedUserIds.includes(msg.senderId))
          .sort((a, b) => b.timestamp - a.timestamp); // Descending order
  
        // console.log('Parsed Messages:', parsedMessages);
  
        if (parsedMessages.length === 0 && !reset) {
          // console.log('No more messages to load.');
          setLastLoadedKey(null);
          return;
        }
  
        if (reset) {
          setMessages(parsedMessages);
          // console.log('Resetting messages:', parsedMessages);
        } else {
          setMessages((prev) => [...prev, ...parsedMessages]);
          // console.log('Appending messages:', parsedMessages);
        }
  
        if (parsedMessages.length > 0) {
          // Use the last key from the newly fetched messages
          setLastLoadedKey(parsedMessages[parsedMessages.length - 1].id);
          // console.log('Updated LastLoadedKey:', parsedMessages[parsedMessages.length - 1].id);
        }
      } catch (error) {
        // console.error('Error loading messages:', error);
      } finally {
        if (reset) setLoading(false);
      }
    },
    [chatRef, lastLoadedKey, validateMessage, bannedUsers]
  );
  
  useEffect(() => {
    // console.log('Initial loading of messages.');
    loadMessages(true); // Reset and load the latest messages
    setChatFocused(false)
  }, []);
  


  useEffect(() => {
    const bannedUserIds = bannedUsers.map((user) => user.id); // Extract IDs from bannedUsers
  
    const listener = chatRef.limitToLast(1).on('child_added', (snapshot) => {
      const newMessage = validateMessage({ id: `chat-${snapshot.key}`, ...snapshot.val() });
      if (!bannedUserIds.includes(newMessage.senderId)) { // Check if senderId is not banned
        setMessages((prev) => {
          const seenKeys = new Set(prev.map((msg) => msg.id));
          if (!seenKeys.has(newMessage.id)) {
            return [newMessage, ...prev];
          }
          return prev;
        });
      }
    });
  
    return () => {
      chatRef.off('child_added'); // ✅ Correct cleanup
    };
  }, [chatRef, bannedUsers, validateMessage]);
  
  

  const handleLoadMore = async () => {
    if (!user.id & !signinMessage) {
      Alert.alert(
        'Login Required',
        'Please log in to load previous messages.',
        [{ text: 'OK', onPress: () => setIsSigninDrawerVisible(true) }]
      );
      setSigninMessage(true)
      return;
    }
  
    if (!loading && lastLoadedKey) {
      await loadMessages(false);
    } else {
      // console.log('No more messages to load or currently loading.');
    }
  };
  


  useEffect(() => {
    const loadPinnedMessages = async () => {
      try {
        const snapshot = await pinnedMessagesRef.once('value');
        if (snapshot.exists()) {
          const data = snapshot.val();
          const parsedPinnedMessages = Object.entries(data).map(([key, value]) => ({
            firebaseKey: key, // Use the actual Firebase key here
            ...value,
          }));
          setPinnedMessages(parsedPinnedMessages); // Store the parsed messages with the Firebase key
        } else {
          setPinnedMessages([]); // No pinned messages
        }
      } catch (error) {
        console.error('Error loading pinned messages:', error);
        Alert.alert('Error', 'Could not load pinned messages. Please try again.');
      }
    };
  
    loadPinnedMessages();
  }, [pinnedMessagesRef]);
  




  const handlePinMessage = async (message) => {
    try {
      const pinnedMessage = { ...message, pinnedAt: Date.now() };
      const newRef = await pinnedMessagesRef.push(pinnedMessage);
  
      // Use the Firebase key for tracking the message
      setPinnedMessages((prev) => [
        ...prev,
        { firebaseKey: newRef.key, ...pinnedMessage },
      ]);
      // console.log('Pinned message added with firebaseKey:', newRef.key);
    } catch (error) {
      console.error('Error pinning message:', error);
      Alert.alert('Error', 'Could not pin the message. Please try again.');
    }
  };
  
  

  const unpinSingleMessage = async (firebaseKey) => {
    try {
      // console.log(`Received firebaseKey for unpinning: ${firebaseKey}`);
  
      // Remove the message from Firebase
      const messageRef = pinnedMessagesRef.child(firebaseKey);
      // console.log(`Firebase reference for removal: ${messageRef.toString()}`);
      await messageRef.remove();
      // console.log(`Message with Firebase key: ${firebaseKey} successfully removed from Firebase.`);
  
      // Update the local state by filtering out the removed message
      setPinnedMessages((prev) => {
        const updatedMessages = prev.filter((msg) => msg.firebaseKey !== firebaseKey);
        // console.log('Updated pinned messages after removal:', updatedMessages);
        return updatedMessages;
      });
    } catch (error) {
      console.error('Error unpinning message:', error);
      Alert.alert('Error', 'Could not unpin the message. Please try again.');
    }
  };
  
  


  const clearAllPinnedMessages = async () => {
    try {
      await pinnedMessagesRef.remove();
      setPinnedMessages([]);
    } catch (error) {
      console.error('Error clearing pinned messages:', error);
      Alert.alert('Error', 'Could not clear pinned messages. Please try again.');
    }
  };

  useEffect(() => {
    interstitial.load();

    const onAdLoaded = () => setIsAdLoaded(true);
    const onAdClosed = () => {
      setIsAdLoaded(false);
      setIsShowingAd(false);
      interstitial.load(); // Reload ad for the next use
    };
    const onAdError = (error) => {
      setIsAdLoaded(false);
      setIsShowingAd(false);
      console.error('Ad Error:', error);
    };

    const loadedListener = interstitial.addAdEventListener(AdEventType.LOADED, onAdLoaded);
    const closedListener = interstitial.addAdEventListener(AdEventType.CLOSED, onAdClosed);
    const errorListener = interstitial.addAdEventListener(AdEventType.ERROR, onAdError);

    return () => {
      loadedListener();
      closedListener();
      errorListener();
    };
  }, []);

  const showInterstitialAd = (callback) => {
    if (isAdLoaded && !isShowingAd && !isPro) {
      setIsShowingAd(true);
      try {
        interstitial.show();
        interstitial.addAdEventListener(AdEventType.CLOSED, callback);
      } catch (error) {
        console.error('Error showing interstitial ad:', error);
        setIsShowingAd(false);
        callback(); // Proceed with fallback in case of error
      }
    } else {
      callback(); // If ad is not loaded, proceed immediately
    }
  };



  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMessages(true);
    setRefreshing(false);
  };

  const handleSendMessage = () => {
    const MAX_WORDS = 100; 
    const MESSAGE_COOLDOWN = 10000; 

    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to send messages.');
      return;
    }

    if (user?.isBlock) {
      Alert.alert('You are blocked by an Admin');
      return;
    }

    const trimmedInput = input.trim();

    if (!trimmedInput) {
      Alert.alert('Error', 'Message cannot be empty.');
      return;
    }

    // Check for profane content
    if (leoProfanity.check(trimmedInput)) {
      Alert.alert('Error', 'Your message contains inappropriate language.');
      return;
    }

    const wordCount = trimmedInput.split(/\s+/).length;
    if (wordCount > MAX_WORDS) {
      Alert.alert(
        'Error',
        `Message cannot exceed ${MAX_WORDS} words. Your message contains ${wordCount} words.`
      );
      return;
    }

    if (isCooldown) {
      Alert.alert('Error', 'You are sending messages too quickly. Please wait a moment.');
      return;
    }

    try {
      // Prepare the message
      const newMessage = {
        text: trimmedInput,
        timestamp: Date.now(),
        sender: user.displayname || user.displayName || 'Anonymous',
        senderId: user.id,
        avatar: user.avatar || 'https://bloxfruitscalc.com/wp-content/uploads/2025/display-pic.png',
        replyTo: replyTo ? { id: replyTo.id, text: replyTo.text } : null,
        isAdmin: user.isAdmin || user.isOwner,
        reportCount: 0,
      };

      // Push the message to Firebase
      database()
        .ref('chat')
        .push(newMessage);

      // Clear the input and reply context
      setInput('');
      setReplyTo(null);

      // Activate the cooldown
      setIsCooldown(true);
      setTimeout(() => setIsCooldown(false), MESSAGE_COOLDOWN); // Reset cooldown after MESSAGE_COOLDOWN
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Could not send your message. Please try again.');
    }
  };

  return (
    <>
    <GestureHandlerRootView>
  
        <View style={styles.container}>
          <AdminHeader
            pinnedMessages={pinnedMessages}
            onClearPin={clearAllPinnedMessages}
            onUnpinMessage={unpinSingleMessage}
            isAdmin={isAdmin}
            selectedTheme={selectedTheme}
            onlineMembersCount={onlineMembersCount}
            isOwner={isOwner}
            modalVisibleChatinfo={modalVisibleChatinfo}
            setModalVisibleChatinfo={setModalVisibleChatinfo}
            triggerHapticFeedback={triggerHapticFeedback}
            unreadMessagesCount={unreadMessagesCount}
          />
                  
                 <ConditionalKeyboardWrapper style={{flex:1}} chatscreen={true}>
          {loading ? (
            <ActivityIndicator size="large" color="#1E88E5" style={{ flex: 1 }} />
          ) : (
            <MessagesList
              messages={messages}
              user={user}
              isDarkMode={theme === 'dark'}
              onPinMessage={handlePinMessage}
              onDeleteMessage={(messageId) => chatRef.child(messageId.replace('chat-', '')).remove()}
              isAdmin={isAdmin}
              refreshing={refreshing}
              onRefresh={handleRefresh}
              handleLoadMore={handleLoadMore}
              onReply={(message) => {setReplyTo(message); triggerHapticFeedback('impactLight');}} // Pass selected message to MessageInput
              banUser={banUser}
              makeadmin={makeAdmin}
              // onReport={onReport}
              removeAdmin={removeAdmin}
              unbanUser={unbanUser}
              isOwner={isOwner}
              toggleDrawer={toggleDrawer}
              setMessages={setMessages}
            />
          )}
          {user.id ? (
            <MessageInput
              input={input}
              setInput={setInput}
              handleSendMessage={handleSendMessage}
              selectedTheme={selectedTheme}
              replyTo={replyTo} // Pass reply context to MessageInput
              onCancelReply={() => setReplyTo(null)} // Clear reply context
            />
          ) : (
            <TouchableOpacity
              style={styles.login}
              onPress={() => {setIsSigninDrawerVisible(true); triggerHapticFeedback('impactLight');}}
            >
              <Text style={styles.loginText}>Login to Start Chat</Text>
            </TouchableOpacity>
          )}
               </ConditionalKeyboardWrapper>  

 <SignInDrawer
            visible={isSigninDrawerVisible}
            onClose={() => setIsSigninDrawerVisible(false)}
            selectedTheme={selectedTheme}
            message='To activite chat, you need to sign in'

          />
        </View>
      <ProfileBottomDrawer
        isVisible={isDrawerVisible}
        toggleModal={toggleDrawer}
        startChat={startPrivateChat}
        selectedUser={selectedUser}
        isOnline={isOnline}
        bannedUsers={bannedUsers}
        showInterstitialAd={showInterstitialAd}
      />
     </GestureHandlerRootView>

     {!isPro && <View style={{ alignSelf: 'center' }}>
  {isAdVisible && (
    <BannerAd
      unitId={bannerAdUnitId}
      size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      onAdLoaded={() => setIsAdVisible(true)} 
      onAdFailedToLoad={() => setIsAdVisible(false)} 
    />
  )}
</View>}
     </>
  );
};

export default ChatScreen;
