import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  ActivityIndicator,
  Alert,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import database from '@react-native-firebase/database';
import { getStyles } from '../Style';
import PrivateMessageInput from './PrivateMessageInput';
import PrivateMessageList from './PrivateMessageList';
import { useGlobalState } from '../../GlobelStats';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import KeyboardAvoidingWrapper from '../../Helper/keyboardAvoidingContainer';
import getAdUnitId from '../../Ads/ads';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

const PAGE_SIZE = 50;
const bannerAdUnitId = getAdUnitId('banner');

const PrivateChatScreen = () => {
  const route = useRoute();
  const { selectedUser, selectedTheme, bannedUsers } = route.params || {};
  const { user, theme } = useGlobalState();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastLoadedKey, setLastLoadedKey] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [input, setInput] = useState('');




  const selectedUserId = selectedUser?.senderId;
  const myUserId = user?.id;
  const isBanned = useMemo(() => {
    const bannedUserIds = bannedUsers?.map((user) => user.id) || [];
    return bannedUserIds.includes(selectedUserId);
  }, [bannedUsers, selectedUserId]);
  
    const isDarkMode = theme === 'dark';
  const styles = useMemo(() => getStyles(isDarkMode), [isDarkMode]);

  // Generate a unique chat key
  const chatKey = useMemo(
    () =>
      myUserId < selectedUserId
        ? `${myUserId}_${selectedUserId}`
        : `${selectedUserId}_${myUserId}`,
    [myUserId, selectedUserId]
  );

  const chatRef = useMemo(() => database().ref(`privateChats/${chatKey}`), [chatKey]);

  // Load messages with pagination
  const loadMessages = useCallback(
    async (reset = false) => {
      setLoading(reset);

      try {
        const query = reset
          ? chatRef.orderByKey().limitToLast(PAGE_SIZE)
          : chatRef.orderByKey().endAt(lastLoadedKey).limitToLast(PAGE_SIZE);

        const snapshot = await query.once('value');
        const data = snapshot.val() || {};
        const parsedMessages = Object.entries(data)
          .map(([key, value]) => ({ id: key, ...value }))
          .sort((a, b) => b.timestamp - a.timestamp);

        if (parsedMessages.length > 0) {
          setMessages((prev) => (reset ? parsedMessages : [...parsedMessages, ...prev]));
          setLastLoadedKey(Object.keys(data)[0]);
        } else if (reset) {
          setMessages([]); // Clear messages if reset and no data
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setLoading(false);
      }
    },
    [chatRef, lastLoadedKey]
  );
console.log(selectedUser.sender)
  // Send message
  const sendMessage = useCallback(
    async (text) => {
      const trimmedText = text.trim();
      if (!trimmedText) {
        Alert.alert('Error', 'Message cannot be empty.');
        return;
      }

      try {
        const newMessage = {
          text: trimmedText,
          senderId: myUserId,
          senderName: user.displayName,
          senderAvatar: user?.avatar || 'https://bloxfruitscalc.com/wp-content/uploads/2025/display-pic.png',
          receiverId: selectedUserId,
          receiverName: selectedUser?.sender,
          receiverAvatar: selectedUser?.avatar || 'https://bloxfruitscalc.com/wp-content/uploads/2025/display-pic.png',
          timestamp: Date.now(),
          replyTo: replyTo ? { id: replyTo.id, text: replyTo.text } : null, // Attach reply context
        };

        // Push the message to Firebase
        await chatRef.push(newMessage);
        setInput('');
        setReplyTo(null);
      } catch (error) {
        console.error('Error sending message:', error);
        Alert.alert('Error', 'Could not send your message. Please try again.');
      }
    },
    [chatRef, myUserId, selectedUser, selectedUserId, user]
  );

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMessages(true);
    setRefreshing(false);
  }, [loadMessages]);
  const updateLastRead = useCallback(() => {
    const lastReadRef = database().ref(`lastseen/${myUserId}/${chatKey}`);
    lastReadRef.set(Date.now());
  }, [chatKey, myUserId]);
  
  useEffect(() => {
    updateLastRead(); // Update last seen timestamp when the chat is opened
  }, [updateLastRead]);
  
  useEffect(() => {
    loadMessages(true);
  
    const listener = chatRef.limitToLast(1).on('child_added', (snapshot) => {
      const newMessage = { id: snapshot.key, ...snapshot.val() };
      setMessages((prevMessages) =>
        prevMessages.some((msg) => msg.id === newMessage.id)
          ? prevMessages
          : [newMessage, ...prevMessages]
      );
      updateLastRead(); // Update last seen timestamp when a new message is added
    });
  
    return () => chatRef.off('child_added', listener); // Cleanup listener
  }, [chatRef, loadMessages, updateLastRead]);
  
 
  return (
    <>

    <GestureHandlerRootView>
              <KeyboardAvoidingView
    keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : null}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    style={{flex:1}}
    >
    <View style={styles.container}>
      {loading && messages.length === 0 ? (
        <ActivityIndicator size="large" color="#1E88E5" style={{ flex: 1, justifyContent: 'center' }} />
      ) : messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No messages yet. Start the conversation!</Text>
        </View>
      ) : (
        <PrivateMessageList
          messages={messages}
          userId={myUserId}
          handleLoadMore={loadMessages}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          isBanned={isBanned}
          onReply={(message) => setReplyTo(message)}
        />
      )}

      <PrivateMessageInput 
      onSend={sendMessage} 
      isBanned={isBanned} 
      bannedUsers={bannedUsers} 
      replyTo={replyTo} 
    onCancelReply={() => setReplyTo(null)}
    input={input}
    setInput={setInput}
    selectedTheme={selectedTheme}    
    />
    </View>
    </KeyboardAvoidingView>
    </GestureHandlerRootView>
    <View style={{ alignSelf: 'center' }}>
        <BannerAd
          unitId={bannerAdUnitId}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        />
      </View>
    </>
  );
};

export default PrivateChatScreen;
