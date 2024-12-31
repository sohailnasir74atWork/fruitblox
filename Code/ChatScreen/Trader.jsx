import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Alert, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
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

const bannerAdUnitId = getAdUnitId('banner');

const ChatComponent = ({ selectedTheme }) => {
  const { user, theme } = useGlobalState();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSigninDrawerVisible, setIsSigninDrawerVisible] = useState(false);
  const [pinnedMessage, setPinnedMessage] = useState(null);
  const [onlineMembersCount, setOnlineMembersCount] = useState(0);

  const chatRef = useMemo(() => database().ref('chat'), []);
  const pinnedMessageRef = useMemo(() => database().ref('pinnedMessage'), []);
  const isAdmin = useMemo(() => ['DfQ6JB6YwKcMDipNpfcennqKOtR2', 'RwW7duccerSdxC7luu3ZMI0PAqa2'].includes(user?.uid), [user]);
  const styles = useMemo(() => getStyles(theme === 'dark'), [theme]);

  // Set online status
  useEffect(() => {
    if (user) {
      const onlineRef = ref(getDatabase(), `onlineUser/${user.uid}`);
      set(onlineRef, { id: user.uid, status: true }).catch((error) =>
        console.error('Error setting online status:', error)
      );
      onDisconnect(onlineRef).remove();
    }
  }, [user]);

  // Fetch online members count
  useEffect(() => {
    const onlineRef = ref(getDatabase(), 'onlineUser');
    const handleOnlineUsers = (snapshot) => {
      const onlineUsers = snapshot.val() || {};
      setOnlineMembersCount(Object.keys(onlineUsers).length);
    };
    const unsubscribe = onValue(onlineRef, handleOnlineUsers);
    return () => {
      off(onlineRef, 'value', handleOnlineUsers); // Correct way to remove the listener
    };
  }, []);

  // Load messages and pinned message
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const snapshot = await chatRef.orderByKey().limitToLast(500).once('value');
        const data = snapshot.val() || {};
        const parsedMessages = Object.keys(data)
          .map((key) => ({ id: key, ...data[key] }))
          .sort((a, b) => b.timestamp - a.timestamp);
        setMessages(parsedMessages);

        const pinnedSnapshot = await pinnedMessageRef.once('value');
        setPinnedMessage(pinnedSnapshot.val());

        chatRef.limitToLast(1).on('child_added', (snapshot) => {
          const newMessage = { id: snapshot.key, ...snapshot.val() };
          setMessages((prevMessages) =>
            prevMessages.some((msg) => msg.id === newMessage.id) ? prevMessages : [newMessage, ...prevMessages]
          );
        });
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
    return () => {
      chatRef.off();
      pinnedMessageRef.off();
    };
  }, [chatRef, pinnedMessageRef]);

  const handleSendMessage = useCallback(async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to send messages.');
      return;
    }
    if (!input.trim()) return;

    try {
      const newMessage = {
        text: input.trim(),
        timestamp: Date.now(),
        sender: user.displayName,
        senderId: user.uid,
      };
      await chatRef.push(newMessage);
      setInput('');
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Could not send your message. Please try again.');
    }
  }, [input, user, chatRef]);

  const handlePinMessage = useCallback(
    async (message) => {
      if (isAdmin) {
        try {
          await pinnedMessageRef.set(message);
          setPinnedMessage(message);
        } catch (error) {
          console.error('Error pinning message:', error);
          Alert.alert('Error', 'Could not pin the message.');
        }
      }
    },
    [isAdmin, pinnedMessageRef]
  );

  const handleDeleteMessage = useCallback(
    async (messageId) => {
      if (isAdmin) {
        try {
          await chatRef.child(messageId).remove();
          setMessages((prevMessages) => prevMessages.filter((msg) => msg.id !== messageId));
        } catch (error) {
          console.error('Error deleting message:', error);
          Alert.alert('Error', 'Could not delete the message.');
        }
      }
    },
    [isAdmin, chatRef]
  );

  return (
    <GestureHandlerRootView>
      <View style={styles.container}>
        <AdminHeader
          pinnedMessage={pinnedMessage}
          onClearPin={async () => {
            try {
              await pinnedMessageRef.remove();
              setPinnedMessage(null);
            } catch (error) {
              console.error('Error clearing pinned message:', error);
              Alert.alert('Error', 'Could not clear the pinned message.');
            }
          }}
          selectedTheme={selectedTheme}
          onlineMembersCount={onlineMembersCount}
        />
        {loading ? (
          <ActivityIndicator size="large" color="#1E88E5" style={{ flex: 1 }} />
        ) : (
          <MessagesList
            messages={messages}
            user={user}
            userColors={{}} // Empty object for now; replace with actual colors logic if needed
            isDarkMode={theme === 'dark'}
            onPinMessage={handlePinMessage}
            onDeleteMessage={handleDeleteMessage}
            isAdmin={isAdmin}
          />
        )}
        {user ? (
          <MessageInput
            input={input}
            setInput={setInput}
            handleSendMessage={handleSendMessage}
            selectedTheme={selectedTheme}
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
      <View style={{ alignSelf: 'center' }}>
        <BannerAd
          unitId={bannerAdUnitId}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
        />
      </View>
    </GestureHandlerRootView>
  );
};

export default ChatComponent;
