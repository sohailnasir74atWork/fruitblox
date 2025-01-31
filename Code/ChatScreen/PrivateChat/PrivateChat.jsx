import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  ActivityIndicator,
  Alert,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
} from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import database from '@react-native-firebase/database';
import { getStyles } from '../Style';
import PrivateMessageInput from './PrivateMessageInput';
import PrivateMessageList from './PrivateMessageList';
import { useGlobalState } from '../../GlobelStats';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import KeyboardAvoidingWrapper from '../../Helper/keyboardAvoidingContainer';
import getAdUnitId from '../../Ads/ads';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import ConditionalKeyboardWrapper from '../../Helper/keyboardAvoidingContainer';
import { clearActiveChat, setActiveChat } from '../utils';
import { useNavigation } from '@react-navigation/native';
import { useLocalState } from '../../LocalGlobelStats';

const PAGE_SIZE = 30;
const bannerAdUnitId = getAdUnitId('banner');

const PrivateChatScreen = () => {
  const route = useRoute();
  const { selectedUser, selectedTheme, bannedUsers , } = route.params || {};
  const { user, theme } = useGlobalState();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastLoadedKey, setLastLoadedKey] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [input, setInput] = useState('');
  const [isAdVisible, setIsAdVisible] = useState(true);
  const {isPro} = useLocalState()
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


  // const navigation = useNavigation();
  useFocusEffect(
    useCallback(() => {
      // Screen is focused
      // console.log('Screen is focused');
  
      return () => {
        // Screen is unfocused
        if (user?.id) {
          clearActiveChat(user.id);
          // console.log('Triggered clearActiveChat for user:', user.id);
        }
      };
    }, [user?.id])
  );

  const messagesRef = useMemo(() => database().ref(`private_chat/${chatKey}/messages`), [chatKey]);
// console.log(selecte÷dUser)
  
  // Load messages with pagination
  const loadMessages = useCallback(
    async (reset = false) => {
      setLoading(reset);

      try {
        const query = reset
          ? messagesRef.orderByKey().limitToLast(PAGE_SIZE)
          : messagesRef.orderByKey().endAt(lastLoadedKey).limitToLast(PAGE_SIZE);

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
    [messagesRef, lastLoadedKey]
  );
// console.log(selectedUser.sender)


  // Send message
  const sendMessage = useCallback(
    async (text) => {
      const trimmedText = text.trim();
      if (!trimmedText) {
        Alert.alert('Error', 'Message cannot be empty.');
        return;
      }
  
      const timestamp = Date.now();
  
      const newMessage = {
        text: trimmedText,
        senderId: myUserId,
        timestamp,
      };
  
      try {
        // Generate deterministic chatId based on participants
        const chatId = [myUserId, selectedUserId].sort().join('_');
        const chatRef = database().ref(`private_chat/${chatId}`);
  
        // Push the new message to the `messages` node
        await chatRef.child(`messages/${timestamp}`).set(newMessage);
  
        // Update the `participants` node using `true` for IDs
        const participantsUpdate = {
          [`participants/${myUserId}`]: true,
          [`participants/${selectedUserId}`]: true,
        };
        // console.log()
        await chatRef.update(participantsUpdate);
        const chatMetadata = {
          receiverName: selectedUser?.sender || 'Unknown Sender',
          receiverAvatar: selectedUser?.avatar || 'https://bloxfruitscalc.com/wp-content/uploads/2025/display-pic.png',
          receiverId: selectedUserId,
          senderName: user?.displayname || user?.displayName || 'Unknown Receiver',
          senderAvatar: user?.avatar || 'https://bloxfruitscalc.com/wp-content/uploads/2025/display-pic.png',
          senderId: user.id,
        };
        await chatRef.child('metadata').update(chatMetadata);
  
        // Update the `lastMessage` metadata
        await chatRef.child('lastMessage').set({
          text: trimmedText,
          timestamp,
          senderId: myUserId,
          senderName: user.displayname || 'Unknown',
        });
  
        // Clear input and reply context
        setInput('');
        setReplyTo(null);
      } catch (error) {
        console.error('Error sending message:', error);
        Alert.alert('Error', 'Could not send your message. Please try again.');
      }
    },
    [myUserId, selectedUserId, user]
  );
  

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMessages(true);
    setRefreshing(false);
  }, [loadMessages]);



//  const updateLastRead = useCallback(() => {
//   const lastReadRef = database().ref(`lastseen/${myUserId}/${chatKey}`);
//   lastReadRef
//     .set(Date.now())
//     .then(() => {
//       // console.log('Last read updated successfully for:', chatKey);
//     })
//     .catch((error) => {
//       // console.error('Error updating last read:', error);
//     });
// }, [chatKey, myUserId]);

useEffect(() => {
  setActiveChat(user.id, chatKey)
}, [user.id,chatKey]);

useEffect(() => {
  const listener = messagesRef.on('child_added', (snapshot) => {
    const newMessage = { id: snapshot.key, ...snapshot.val() };
    setMessages((prevMessages) =>
      prevMessages.some((msg) => msg.id === newMessage.id)
        ? prevMessages
        : [newMessage, ...prevMessages]
    );
    // updateLastRead(); // Update the last seen timestamp for new messages
  });

  return () => messagesRef.off('child_added', listener); // Cleanup on unmount
}, [messagesRef]);

  
 
  return (
    <>

    <GestureHandlerRootView>
      
            
    <View style={styles.container}>
    <ConditionalKeyboardWrapper style={{flex:1}} chatscreen={true}>
      {!loading && messages.length === 0 ? (
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
          selectedUser={selectedUser}
          user={user}
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
        </ConditionalKeyboardWrapper>
    </View>
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

export default PrivateChatScreen;
