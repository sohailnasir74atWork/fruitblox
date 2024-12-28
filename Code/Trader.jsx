import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  useColorScheme,
  StyleSheet,
} from 'react-native';
import database from '@react-native-firebase/database';
import { useGlobalState } from './GlobelStats';
import SignInDrawer from './Firebase/SigninDrawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import getAdUnitId from './ads';

const bannerAdUnitId = getAdUnitId('banner');

// Utility functions
const generateShortDisplayName = (name) => {
  if (!name || typeof name !== 'string' || !name.trim()) return 'AN';
  const parts = name.trim().split(/\s+/);
  return parts.length === 1
    ? parts[0].slice(0, 2).toUpperCase()
    : (parts[0][0] + parts[1][0]).toUpperCase();
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
};

const getColorForName = (name, userColors) => {
  if (!userColors[name]) {
    const hash = [...name].reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
      '#FF5733', '#33A1FD', '#8E44AD', '#27AE60', '#F1C40F', '#9B59B6', '#1ABC9C', '#E67E22',
      '#C0392B', '#2980B9', '#34495E', '#E74C3C', '#16A085', '#F39C12', '#BDC3C7', '#D4AC0D',
    ];
    userColors[name] = colors[hash % colors.length];
  }
  return userColors[name];
};


const ChatComponent = ({ selectedTheme }) => {
  const { user } = useGlobalState();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSigninDrawerVisible, setisSigninDrawerVisible] = useState(false);

  const chatRef = useMemo(() => database().ref('chat'), []);
  const userColors = useMemo(() => ({}), []);

  const closeDrawerSignin = useCallback(() => setisSigninDrawerVisible(false), []);
  const openDrawerSignin = useCallback(() => setisSigninDrawerVisible(true), []);
  const colorScheme = useColorScheme(); // Returns 'light' or 'dark'
  const isDarkMode = colorScheme === 'dark';
  const styles = getStyles(isDarkMode)
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const snapshot = await chatRef.orderByKey().limitToLast(500).once('value');
        const data = snapshot.val() || {};
        const parsedMessages = Object.keys(data)
          .map((key) => ({ id: key, ...data[key] }))
          .sort((a, b) => b.timestamp - a.timestamp);
        setMessages(parsedMessages);
        setLoading(false);

        chatRef.limitToLast(1).on('child_added', (snapshot) => {
          const newMessage = { id: snapshot.key, ...snapshot.val() };
          setMessages((prevMessages) => {
            if (prevMessages.find((msg) => msg.id === newMessage.id)) return prevMessages;
            return [newMessage, ...prevMessages.slice(0, 19)];
          });
        });
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };

    loadMessages();

    return () => {
      chatRef.off();
    };
  }, [chatRef]);
  // const deleteAllChats = async () => {
  //   try {
  //     // Confirm the action before deleting
  //     Alert.alert(
  //       'Delete All Chats',
  //       'Are you sure you want to delete all chats? This action cannot be undone.',
  //       [
  //         { text: 'Cancel', style: 'cancel' },
  //         {
  //           text: 'Delete',
  //           style: 'destructive',
  //           onPress: async () => {
  //             await chatRef.remove();
  //             Alert.alert('Success', 'All chats have been deleted.');
  //           },
  //         },
  //       ]
  //     );
  //   } catch (error) {
  //     console.error('Error deleting all chats:', error);
  //     Alert.alert('Error', 'An error occurred while deleting chats. Please try again.');
  //   }
  // };
// deleteAllChats()  
  const handleSendMessage = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to send messages.');
      return;
    }
    if (!input.trim()) return;

    const userRef = database().ref(`users/${user.uid}`);
    const currentTime = Date.now();
    const oneHour = 60 * 60 * 1000;

    try {
      const userSnapshot = await userRef.once('value');
      const userData = userSnapshot.val() || {};
      let { messageCount = 0, firstMessageTimestamp = null } = userData;

      if (firstMessageTimestamp && currentTime - firstMessageTimestamp > oneHour) {
        messageCount = 0;
        firstMessageTimestamp = null;
      }

      if (messageCount >= 5) {
        const timeLeft = Math.ceil((oneHour - (currentTime - firstMessageTimestamp)) / (60 * 1000));
        Alert.alert(
          'Message Restricted',
          `You have reached the 5-message limit. Please wait ${timeLeft} minute(s).`
        );
        return;
      }

      const newMessage = {
        text: input.trim(),
        timestamp: currentTime,
        sender: generateShortDisplayName(user.displayName),
        senderId: user.uid,
      };

      await chatRef.push(newMessage);
      await userRef.update({ messageCount: messageCount + 1, firstMessageTimestamp: currentTime });
      setInput('');
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Could not send your message. Please try again.');
    }
  };

  const renderMessage = useCallback(
    ({ item, index }) => {
      const currentMessageDate = new Date(item.timestamp).toDateString();
      const previousMessageDate =
        index < messages.length - 1
          ? new Date(messages[index + 1]?.timestamp).toDateString()
          : null;

      // Show the date separator if the date changes
      const showDateSeparator = currentMessageDate !== previousMessageDate;

      return (
        <View>
          {showDateSeparator && (
            <Text style={styles.dateSeparator}>{formatDate(item.timestamp)}</Text>
          )}
          <View
            style={[
              item.senderId === user?.uid ? styles.mymessageBubble : styles.othermessageBubble,
              item.senderId === user?.uid ? styles.myMessage : styles.otherMessage,
            ]}
          >
            <View
              style={[
                styles.senderName,
                { backgroundColor: getColorForName(item.sender, userColors) },
              ]}
            >
              <Text style={styles.senderNameText}>
                {generateShortDisplayName(item.sender)}
              </Text>
            </View>
            <View style={styles.messageTextBox}>
              <Text
                style={
                  item.senderId === user?.uid
                    ? styles.myMessageText
                    : styles.otherMessageText
                }
              >
                {item.text}
                <Text style={styles.adminText}>{(item.senderId === 'DfQ6JB6YwKcMDipNpfcennqKOtR2' || item.senderId === 'Admin2') && '\nAdmin'}</Text>
              </Text>
            </View>
            <Text style={styles.timestamp}>
              {new Date(item.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>
      );
    },
    [messages, user, userColors]
  );
  
  return (
    <GestureHandlerRootView>
      <View style={styles.container}>
        {loading ? (
          <ActivityIndicator size="large" color="#1E88E5" style={styles.loader} />
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id} // Unique keys
            renderItem={renderMessage}
            contentContainerStyle={styles.chatList}
            inverted
            initialNumToRender={50} // Render only 20 items initially
            maxToRenderPerBatch={50} // Render 10 items per batch
            updateCellsBatchingPeriod={100} // Reduce time between rendering batches
            windowSize={5} // Number of screens worth of items to keep in memory
            getItemLayout={(data, index) => ({
              length: 80, // Approximate item height
              offset: 80 * index,
              index,
            })}
          />

        )}
        {user ? (
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { color: selectedTheme.colors.text }]}
              placeholder="Type a message..."
              placeholderTextColor="#888"
              value={input}
              onChangeText={setInput}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: input.trim() ? '#1E88E5' : '#ccc' }]}
              onPress={handleSendMessage}
              disabled={!input.trim()}
            >
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.login} onPress={openDrawerSignin}>
            <Text style={styles.loginText}>Login to Start Chat</Text>
          </TouchableOpacity>
        )}
        <SignInDrawer visible={isSigninDrawerVisible} onClose={closeDrawerSignin} selectedTheme={selectedTheme} />
        <BannerAd unitId={bannerAdUnitId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} requestOptions={{ requestNonPersonalizedAdsOnly: true }} />
      </View>
    </GestureHandlerRootView>
  );
};




const getStyles = (isDarkMode) =>

  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#f2f2f7',
    },
    loader: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    chatList: {
      flexGrow: 1,
      justifyContent: 'flex-end',
      // paddingHorizontal: 10,
      paddingVertical: 5,
    },
    mymessageBubble: {
      maxWidth: '85%',
      paddingHorizontal: 10,
      borderRadius: 15,
      flexDirection: "row-reverse",
      marginBottom: 10,
      alignItems: 'flex-end'
    },
    othermessageBubble: {
      maxWidth: '85%',
      paddingHorizontal: 10,
      borderRadius: 15,
      flexDirection: 'row',
      marginBottom: 10,
      alignItems: 'flex-end'

    },
    myMessage: {
      alignSelf: 'flex-end',
    },
    otherMessage: {
      alignSelf: 'flex-start',
    },
    senderName: {
      width: 34,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 5,
    },
    senderNameText: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#fff',
    },
    messageTextBox: {
      flex: 1,
    },
    myMessageText: {
      fontSize: 16,
      color: isDarkMode ? 'white' : 'black',
      backgroundColor: isDarkMode ? '#4E5465' : 'lightgreen',
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: 20,
    },
    otherMessageText: {
      fontSize: 16,
      color: isDarkMode ? 'white' : 'black',
      backgroundColor: isDarkMode ? '#4E5465' : 'white',
      paddingHorizontal: 10,
      borderRadius: 20,
      paddingVertical: 5,

    },
    timestamp: {
      fontSize: 10,
      color: '#bbb',
      textAlign: 'right',
      paddingHorizontal: 10
    },
    inputContainer: {
      flexDirection: 'row', // Maintains horizontal alignment with the send button
      alignItems: 'flex-start', // Align items at the top to allow wrapping
      padding: 10,
      borderTopWidth: 1,
      borderTopColor: '#333',
    },
    input: {
      flex: 1, // Ensures the input takes available space
      borderRadius: 20,
      padding: 10,
      marginRight: 10,
      fontSize: 16,
      minHeight: 40, // Minimum height for a single line
      maxHeight: 120, // Limit input growth to a max height
      textAlignVertical: 'top', // Ensures text starts at the top
      backgroundColor: isDarkMode ? '#333' : '#fff', // Optional background for better visibility
    },

    sendButton: {
      borderRadius: 20,
      paddingVertical: 10,
      paddingHorizontal: 20,
    },
    sendButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
    },
    loggedOutMessage: {
      flex: 1,
      fontSize: 16,
      paddingVertical: 10,
    },
    loggedOutMessageText: {
      color: '#bbb',
      textAlign: 'center',
    },
    dateSeparator: {
      fontSize: 14,
      color: '#888',
      textAlign: 'center',
      marginVertical: 10,
    },
    admin: {
      marginTop: 5,
      alignSelf: 'flex-start',
    },
    adminText: {
      fontSize: 12,
      color: 'gray', 
      paddingTop:5
    },
    login: {
      height: 60,
      justifyContent: 'center',
      backgroundColor: '#29AB87',
      alignSelf: 'center',
      width: '100%',
      //  borderRadius:10

    },
    loginText: {
      color: 'white',
      fontFamily: 'Lato-Bold',
      textAlign: 'center',
      lineHeight: 24

    }
  });

export default ChatComponent;