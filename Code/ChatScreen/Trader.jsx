import React, { useState, useEffect, useMemo } from 'react';
import { View, Alert, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import database from '@react-native-firebase/database';
import { useGlobalState } from '../GlobelStats';
import SignInDrawer from '../Firebase/SigninDrawer';
import AdminHeader from './AdminHeader';
import MessagesList from './MessagesList';
import MessageInput from './MessageInput';
import { getStyles } from './Style';

const ChatComponent = ({ selectedTheme }) => {
  const { user } = useGlobalState();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSigninDrawerVisible, setisSigninDrawerVisible] = useState(false);
  const [pinnedMessage, setPinnedMessage] = useState(null);

  const chatRef = useMemo(() => database().ref('chat'), []);
  const pinnedMessageRef = useMemo(() => database().ref('pinnedMessage'), []); // Reference for pinned message
  const adminIds = ['DfQ6JB6YwKcMDipNpfcennqKOtR2', 'RwW7duccerSdxC7luu3ZMI0PAqa2'];
  const isAdmin = adminIds.includes(user?.uid);

  const userColors = useMemo(() => ({}), []);
  const isDarkMode = selectedTheme.colors.text === 'white';
  const styles = getStyles(isDarkMode);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        // Load all messages
        const snapshot = await chatRef.orderByKey().limitToLast(500).once('value');
        const data = snapshot.val() || {};
        const parsedMessages = Object.keys(data)
          .map((key) => ({ id: key, ...data[key] }))
          .sort((a, b) => b.timestamp - a.timestamp);

        setMessages(parsedMessages);
        setLoading(false);

        // Listener for new messages
        chatRef.limitToLast(1).on('child_added', (snapshot) => {
          const newMessage = { id: snapshot.key, ...snapshot.val() };
          setMessages((prevMessages) => {
            if (prevMessages.some((msg) => msg.id === newMessage.id)) {
              return prevMessages;
            }
            return [newMessage, ...prevMessages];
          });
        });

        // Load pinned message
        const pinnedSnapshot = await pinnedMessageRef.once('value');
        setPinnedMessage(pinnedSnapshot.val());
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadMessages();

    return () => {
      chatRef.off();
      pinnedMessageRef.off();
    };
  }, [chatRef, pinnedMessageRef]);

  const handleSendMessage = async () => {
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
  };

  const handlePinMessage = async (message) => {
    if (isAdmin) {
      try {
        await pinnedMessageRef.set(message); // Save pinned message to the database
        setPinnedMessage(message); // Update local state
        // Alert.alert('Pinned', `Message pinned: "${message.text}"`);
      } catch (error) {
        console.error('Error pinning message:', error);
        Alert.alert('Error', 'Could not pin the message.');
      }
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (isAdmin) {
      try {
        await chatRef.child(messageId).remove(); // Delete message from the database
        setMessages((prevMessages) => prevMessages.filter((msg) => msg.id !== messageId));
        // Alert.alert('Deleted', 'Message deleted successfully.');
      } catch (error) {
        console.error('Error deleting message:', error);
        Alert.alert('Error', 'Could not delete the message.');
      }
    }
  };

  return (
    <GestureHandlerRootView>
      <View style={styles.container}>
       
          <AdminHeader
            pinnedMessage={pinnedMessage}
            onClearPin={async () => {
              try {
                await pinnedMessageRef.remove(); // Clear pinned message from the database
                setPinnedMessage(null);
                Alert.alert('Cleared', 'Pinned message cleared.');
              } catch (error) {
                console.error('Error clearing pinned message:', error);
                Alert.alert('Error', 'Could not clear the pinned message.');
              }
            }}
          />
        {loading ? (
          <ActivityIndicator size="large" color="#1E88E5" />
        ) : (
          <MessagesList
            messages={messages}
            user={user}
            userColors={userColors}
            isDarkMode={isDarkMode}
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
            onPress={() => setisSigninDrawerVisible(true)}
          >
            <Text style={styles.loginText}>Login to Start Chat</Text>
          </TouchableOpacity>
        )}
        <SignInDrawer
          visible={isSigninDrawerVisible}
          onClose={() => setisSigninDrawerVisible(false)}
          selectedTheme={selectedTheme}
        />
      </View>
    </GestureHandlerRootView>
  );
};

export default ChatComponent;
