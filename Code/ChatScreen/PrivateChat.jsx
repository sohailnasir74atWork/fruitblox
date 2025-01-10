import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  ActivityIndicator,
  Alert,
  Text,
  StyleSheet,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import database from '@react-native-firebase/database';
import { getStyles } from './Style';
import PrivateMessageInput from './PrivateMessageInput';
import PrivateMessageList from './PrivateMessageList';
import { useGlobalState } from '../GlobelStats';

const PAGE_SIZE = 50;

const PrivateChatScreen = () => {
  const route = useRoute();
  const { selectedUser, selectedTheme } = route.params || {};
  const { user, theme } = useGlobalState();
  const [isBanned, setIsBanned] = useState(false);
  const {bannedUsers}= useGlobalState()
  useEffect(() => {
    setIsBanned(bannedUsers.includes(selectedUserId));
  }, [bannedUsers, selectedUserId]);

  const myUserId = user?.id;
  const isDarkMode = theme === 'dark';
  const styles = useMemo(() => getStyles(isDarkMode), [isDarkMode]);
  const selectedUserId = selectedUser?.senderId;

  // Generate a unique chat key
  const chatKey = useMemo(
    () =>
      myUserId < selectedUserId
        ? `${myUserId}_${selectedUserId}`
        : `${selectedUserId}_${myUserId}`,
    [myUserId, selectedUserId]
  );

  const chatRef = useMemo(() => database().ref(`privateChats/${chatKey}`), [chatKey]);

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastLoadedKey, setLastLoadedKey] = useState(null);

  // Load messages
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

  // Check ban status
  const checkBanStatus = useCallback(async () => {
    const bannedByReceiverRef = database().ref(`bannedUsers/${user?.id}`);
    const bannedBySenderRef = database().ref(`bannedUsers/${selectedUser?.senderId}`);

    const [bannedByReceiverSnapshot, bannedBySenderSnapshot] = await Promise.all([
      bannedByReceiverRef.once('value'),
      bannedBySenderRef.once('value'),
    ]);

    const isBannedByReceiver = bannedByReceiverSnapshot.exists();
    const isBannedBySender = bannedBySenderSnapshot.exists();

    return { isBannedByReceiver, isBannedBySender };
  }, [user?.id, selectedUser?.senderId]);

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
          senderName: user?.displayName || 'Anonymous',
          senderAvatar: user?.avatar || 'https://bloxfruitscalc.com/wp-content/uploads/2025/display-pic.png',
          receiverId: selectedUserId,
          receiverName: selectedUser?.sender,
          receiverAvatar: selectedUser?.avatar || 'https://bloxfruitscalc.com/wp-content/uploads/2025/display-pic.png',
          timestamp: Date.now(),
        };

        // Push the message to the database
        await chatRef.push(newMessage);
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

  // Attach listener for new messages
  useEffect(() => {
    loadMessages(true);

    const listener = chatRef.limitToLast(1).on('child_added', (snapshot) => {
      const newMessage = { id: snapshot.key, ...snapshot.val() };
      setMessages((prevMessages) =>
        prevMessages.some((msg) => msg.id === newMessage.id)
          ? prevMessages
          : [newMessage, ...prevMessages]
      );
    });

    return () => chatRef.off('child_added', listener); // Cleanup listener
  }, [chatRef, loadMessages]);

  return (
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
        />
      )}

      <PrivateMessageInput onSend={sendMessage} isBanned={isBanned} />
    </View>
  );
};

export default PrivateChatScreen;
