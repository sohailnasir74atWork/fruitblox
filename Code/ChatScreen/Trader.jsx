import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  RefreshControl,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import database from '@react-native-firebase/database';
import { useGlobalState } from '../GlobelStats';
import SignInDrawer from '../Firebase/SigninDrawer';
import AdminHeader from './AdminHeader';
import MessagesList from './MessagesList';
import MessageInput from './MessageInput';
import { getStyles } from './Style';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import getAdUnitId from '../Ads/ads';
import { banUser, makeAdmin, markMessagesAsSeen, removeAdmin, unbanUser } from './utils';
import { useNavigation } from '@react-navigation/native';
const bannerAdUnitId = getAdUnitId('banner');
const PAGE_SIZE = 250; // Number of messages to fetch per load
let lastMessageTimestamp = 0; // To track the time of the last sent message

const ChatComponent = ({ selectedTheme, setChatFocused,   modalVisibleChatinfo, 
  setModalVisibleChatinfo }) => {
  const { user, theme, onlineMembersCount, updateLocalStateAndDatabase } = useGlobalState();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [lastLoadedKey, setLastLoadedKey] = useState(null);
  const [isSigninDrawerVisible, setIsSigninDrawerVisible] = useState(false);
  const chatRef = useMemo(() => database().ref('chat'), []);
  const pinnedMessagesRef = useMemo(() => database().ref('pinnedMessages'), []);
  const isAdmin = user?.isAdmin || false;
  const isOwner = user?.isOwner || false;
  const styles = useMemo(() => getStyles(theme === 'dark'), [theme]);
  const navigation = useNavigation()
  const validateMessage = useCallback((message) => {
    const defaultSender = 'Anonymous';
    const defaultText = '[No content]';
    return {
      ...message,
      sender: message.sender?.trim() || defaultSender,
      text: message.text?.trim() || defaultText,
      timestamp: message.timestamp || Date.now(),
    };
  }, []);

  const loadMessages = useCallback(async (reset = false) => {
    try {
      setLoading(true);

      const query = reset
        ? chatRef.orderByKey().limitToLast(PAGE_SIZE)
        : chatRef.orderByKey().endAt(lastLoadedKey).limitToLast(PAGE_SIZE);

      const snapshot = await query.once('value');
      const data = snapshot.val() || {};
      const parsedMessages = Object.entries(data)
        .map(([key, value]) => validateMessage({ id: `chat-${key}`, ...value }))
        .sort((a, b) => b.timestamp - a.timestamp);

      if (parsedMessages.length > 0) {
        setMessages((prev) => {
          const seenKeys = new Set(prev.map((msg) => msg.id));
          const newMessages = parsedMessages.filter((msg) => !seenKeys.has(msg.id));
          return reset ? parsedMessages : [...newMessages, ...prev]; // Prepend new messages
        });

        setLastLoadedKey(Object.keys(data)[0]);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  }, [chatRef, lastLoadedKey, validateMessage]);

  const handleLoadMore = async () => {
    if (!loading && lastLoadedKey) {
      await loadMessages(false);
    }
  };


  const loadPinnedMessages = useCallback(async () => {
    try {
      const snapshot = await pinnedMessagesRef.once('value');
      const data = snapshot.val() || {};
      const parsedPinnedMessages = Object.entries(data).map(([key, value]) => ({
        id: `pinned-${key}`,
        ...value,
      }));
      setPinnedMessages(parsedPinnedMessages);
    } catch (error) {
      console.error('Error loading pinned messages:', error);
    }
  }, [pinnedMessagesRef]);

  const handlePinMessage = async (message) => {
    try {
      const pinnedMessage = { ...message, pinnedAt: Date.now() };
      const newRef = await pinnedMessagesRef.push(pinnedMessage);
      setPinnedMessages((prev) => [...prev, { id: `pinned-${newRef.key}`, ...pinnedMessage }]);
    } catch (error) {
      console.error('Error pinning message:', error);
      Alert.alert('Error', 'Could not pin the message. Please try again.');
    }
  };

  const unpinSingleMessage = async (messageId) => {
    try {
      const id = messageId.replace('pinned-', '');
      await pinnedMessagesRef.child(id).remove();
      setPinnedMessages((prev) => prev.filter((msg) => msg.id !== messageId));
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
    loadMessages(true);
    loadPinnedMessages();
    setChatFocused(false)

    const listener = chatRef.limitToLast(1).on('child_added', (snapshot) => {
      const newMessage = validateMessage({ id: `chat-${snapshot.key}`, ...snapshot.val() });
      setMessages((prevMessages) =>
        prevMessages.some((msg) => msg.id === newMessage.id) ? prevMessages : [newMessage, ...prevMessages]
      );
    });

    return () => chatRef.off('child_added', listener);
  }, [loadMessages, loadPinnedMessages, validateMessage]);
  
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMessages(true);
    setRefreshing(false);
  };


  const handleSendMessage = async () => {
    const MAX_WORDS = 100; // Maximum allowed words
    const MESSAGE_COOLDOWN = 5000; // 5 seconds cooldown in milliseconds
    const now = Date.now();
  
    if (!user.id) {
      Alert.alert('Error', 'You must be logged in to send messages.');
      return;
    }
  
    const trimmedInput = input.trim();
  
    if (!trimmedInput) {
      Alert.alert('Error', 'Message cannot be empty.');
      return;
    }
  
    const wordCount = trimmedInput.split(/\s+/).length;
    if (wordCount > MAX_WORDS) {
      Alert.alert('Error', `Message cannot exceed ${MAX_WORDS} words. Your message contains ${wordCount} words.`);
      return;
    }
  
    if (now - lastMessageTimestamp < MESSAGE_COOLDOWN) {
      const remainingTime = Math.ceil((MESSAGE_COOLDOWN - (now - lastMessageTimestamp)) / 1000);
      Alert.alert('Error', `You are sending messages too quickly. Please wait ${remainingTime} seconds.`);
      return;
    }
  
    try {
      const newMessage = {
        text: trimmedInput,
        timestamp: now,
        sender: user.displayName || 'Anonymous', // Use updated or fallback display name
        senderId: user.id,
        avatar: user.avatar || 'https://bloxfruitscalc.com/wp-content/uploads/2025/display-pic.png', // Use updated avatar or default
        replyTo: replyTo ? { id: replyTo.id, text: replyTo.text } : null, // Attach reply context
        isAdmin: user.isAdmin || user.isOwner,
      };
  
      // Push the message to the chat database
      await chatRef.push(newMessage);
  
      // Update the last message timestamp
      lastMessageTimestamp = now;
  
      // Clear input and reply context
      setInput('');
      setReplyTo(null);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Could not send your message. Please try again.');
    }
  };
  
 
  
  // Function to ban a user
 
  
  // Function to remove admin privileges
 
  
  // Function to unban a user
  
  
  
  return (
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
        />
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
          onReply={(message) => setReplyTo(message)} // Pass selected message to MessageInput
          banUser={banUser}
          makeadmin={makeAdmin}
          removeAdmin={removeAdmin}
          unbanUser = {unbanUser}
          isOwner={isOwner}
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
            onPress={() => setIsSigninDrawerVisible(true)}
          >
            <Text style={styles.loginText}>Login to Start Chat</Text>
          </TouchableOpacity>
        )}
        <SignInDrawer
          visible={isSigninDrawerVisible}
          onClose={() => setIsSigninDrawerVisible(false)}
          selectedTheme={selectedTheme}
          message='To activite chat, you need to sign in'

        />
      </View>
      <View style={{ alignSelf: 'center' }}>
        <BannerAd
          unitId={bannerAdUnitId}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        />
      </View>
    </GestureHandlerRootView>
  );
};

export default ChatComponent;
