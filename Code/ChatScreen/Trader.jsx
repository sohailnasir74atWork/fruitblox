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
import { getDatabase, ref, onDisconnect, set, onValue, off } from 'firebase/database';
import { removeSpecificChatMessage } from './utils';

const bannerAdUnitId = getAdUnitId('banner');

const ChatComponent = ({ selectedTheme }) => {
  const { user, theme, onlineMembersCount, setOnlineMembersCount } = useGlobalState();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [replyTo, setReplyTo] = useState(null); // To track the message being replied to
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // For pull-to-refresh
  const [isSigninDrawerVisible, setIsSigninDrawerVisible] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState([]); // Array of pinned messages


  const chatRef = useMemo(() => database().ref('chat'), []);
  const pinnedMessageRef = useMemo(() => database().ref('pinnedMessage'), []);
  const pinnedMessagesRef = useMemo(() => database().ref('pinnedMessages'), []);

  const isAdmin = useMemo(
    () => ['DfQ6JB6YwKcMDipNpfcennqKOtR2', 'RwW7duccerSdxC7luu3ZMI0PAqa2', '3Jyre8jMc5aa90BuIsxAGOJWbkE3'].includes(user?.uid),
    [user]
  );
  const styles = useMemo(() => getStyles(theme === 'dark'), [theme]);
  const validateMessage = (message) => {
    const defaultSender = "Unknown User"; // Default value for sender
    const defaultText = "[No content]"; // Default message text if empty
  
    return {
      ...message,
      sender: message.sender?.trim() || defaultSender,
      text: message.text?.trim() || defaultText,
      timestamp: message.timestamp || Date.now(), // Ensure timestamp exists
    };
  };
  
 
  
 
  
  
  
  
  
  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
  
      // Load normal messages
      const chatSnapshot = await chatRef.orderByKey().limitToLast(50).once('value');
      const chatData = chatSnapshot.val() || {};
      const parsedMessages = Object.keys(chatData)
        .map((key) => validateMessage({ id: `chat-${key}`, ...chatData[key] }))
        .sort((a, b) => b.timestamp - a.timestamp);
  
      setMessages(parsedMessages);
  
      // Load pinned messages
      const pinnedSnapshot = await pinnedMessagesRef.once('value');
      const pinnedData = pinnedSnapshot.val() || {};
      const parsedPinnedMessages = Object.keys(pinnedData).map((key) => ({
        ...pinnedData[key],
        id: `pinned-${key}`, // Prefix ID for pinned messages
      }));
  
      setPinnedMessages(parsedPinnedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  }, [chatRef, pinnedMessagesRef]);
  
  
  
  const handlePinMessage = async (message) => {
    try {
      const pinnedMessage = {
        ...message,
        id: `pinned-${message.id}`, // Prefix the ID for pinned messages
        pinnedAt: Date.now(),
      };
  
      // Push the pinned message to Firebase
      const result = await pinnedMessagesRef.push(pinnedMessage);
  
      // Update local state
      setPinnedMessages((prev) => [...prev, { id: result.key, ...pinnedMessage }]);
    } catch (error) {
      console.error("Error pinning message:", error);
      Alert.alert("Error", "Could not pin the message. Please try again.");
    }
  };
  
  

  const unpinSingleMessage = async (messageId) => {
    try {
      await pinnedMessagesRef.child(messageId).remove();
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
    loadMessages();
  
    const listener = chatRef.limitToLast(1).on('child_added', (snapshot) => {
      const newMessage = validateMessage({ id: snapshot.key, ...snapshot.val() });
      setMessages((prevMessages) =>
        prevMessages.some((msg) => msg.id === newMessage.id) ? prevMessages : [newMessage, ...prevMessages]
      );
    });
  
    return () => {
      chatRef.off('child_added', listener);
      pinnedMessagesRef.off(); // Clean up pinned messages listener if added
    };
  }, [chatRef, pinnedMessagesRef, loadMessages]);
  

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMessages();
    setRefreshing(false);
  };

  const handleSendMessage = useCallback(async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to send messages.');
      return;
    }
    if (!input.trim()) {
      Alert.alert('Error', 'Message cannot be empty.');
      return;
    }
  
    try {
      // Prepare and validate the message before sending
      const newMessage = validateMessage({
        text: input.trim(),
        timestamp: Date.now(),
        sender: user.displayName,
        senderId: user.uid,
        replyTo: replyTo ? { id: replyTo.id, text: replyTo.text } : null,
        isReply: !!replyTo,
      });
  
      await chatRef.push(newMessage); // Push validated message to the database
      setInput(''); // Clear the input
      setReplyTo(null); // Reset reply state
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Could not send your message. Please try again.');
    }
  }, [input, user, chatRef, replyTo]);
  
  
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
          />

        {loading ? (
          <ActivityIndicator size="large" color="#1E88E5" style={{ flex: 1 }} />
        ) : (
          <MessagesList
              messages={messages}
              user={user}
              isDarkMode={theme === 'dark'}
              onPinMessage={handlePinMessage}
              onDeleteMessage={(messageId) => chatRef.child(messageId).remove()}
              isAdmin={isAdmin}
              refreshing={refreshing}
              onRefresh={handleRefresh}
              onReply={(message) => setReplyTo(message)}
            />
        )}
        {user ? (
          <MessageInput
            input={input}
            setInput={setInput}
            handleSendMessage={handleSendMessage}
            selectedTheme={selectedTheme}
            replyTo={replyTo} // Pass reply context
            onCancelReply={() => setReplyTo(null)} // Allow canceling reply
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
        />
      </View>
      
    </GestureHandlerRootView>
    <View style={{ alignSelf: 'center' }}>
    <BannerAd
      unitId={bannerAdUnitId}
      size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      requestOptions={{
        requestNonPersonalizedAdsOnly: true,
      }}
    />
  </View></>
  );
};

export default ChatComponent;
