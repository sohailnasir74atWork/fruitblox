import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import database from '@react-native-firebase/database';
import { useGlobalState } from '../../GlobelStats';
import Icon from 'react-native-vector-icons/Ionicons';
import config from '../../Helper/Environment';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import { isUserOnline } from '../utils';

const InboxScreen = () => {
  const navigation = useNavigation();
  const { user, theme } = useGlobalState();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const isDarkMode = theme === 'dark';
  const styles = getStyles(isDarkMode);

  const handleDelete = (chatKey) => {
    Alert.alert(
      'Delete Chat',
      'Are you sure you want to delete this chat?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Remove chat from Firebase
              const chatRef = database().ref(`privateChat/${chatKey}`);
              await chatRef.remove();

              // Update the local state to remove the chat
              setChats((prevChats) => prevChats.filter((chat) => chat.chatKey !== chatKey));
            } catch (error) {
              console.error('Error deleting chat:', error);
              Alert.alert('Error', 'Failed to delete the chat. Please try again.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  
  const fetchChats = useCallback(async () => {
    if (!user?.id) return;
  
    setLoading(true);
  
    try {
      const privateChatsRef = database().ref('privateChat');
      const bannedRef = database().ref(`bannedUsers/${user.id}`);
      const lastReadRef = database().ref(`lastseen/${user.id}`);
      const onlineStatusRef = database().ref('onlineUsers'); // Assuming an online status node exists
  
      // Step 1: Fetch banned users and last read timestamps concurrently
      const [bannedSnapshot, lastReadSnapshot] = await Promise.all([
        bannedRef.once('value'),
        lastReadRef.once('value'),
      ]);
  
      const bannedData = bannedSnapshot.val() || {};
      const lastReadData = lastReadSnapshot.val() || {};
      const bannedUserIds = Object.keys(bannedData);
  
      // Step 2: Fetch only chat keys
      const chatKeysSnapshot = await privateChatsRef.once('value');
      const allKeys = chatKeysSnapshot.exists() ? Object.keys(chatKeysSnapshot.val()) : [];
  
      // Step 3: Filter keys relevant to the current user
      const relevantKeys = allKeys.filter((key) => {
        const [user1, user2] = key.split('_');
        return user1 === user.id || user2 === user.id;
      });
  
      // Step 4: Fetch and process chat data for relevant keys
      const userChats = await Promise.all(
        relevantKeys.map(async (chatKey) => {
          const chatDataSnapshot = await privateChatsRef.child(chatKey).once('value');
          const chatData = chatDataSnapshot.val();
  
          // Skip if chatData is undefined or invalid
          if (!chatData || !chatData.participants) return null;
  
          // Identify the other user in the chat
          const otherUserId = Object.keys(chatData.participants).find((id) => id !== user.id);
          const otherUserInfo = chatData.participants[otherUserId] || {};
  
          // Skip if the other user is banned
          if (bannedUserIds.includes(otherUserId)) return null;
  
          // Fetch the latest message
          const latestMessage = Object.values(chatData.messages || {}).pop();
  
          // Calculate unread messages
          const lastReadTimestamp = lastReadData[chatKey] || 0;
          const unreadCount = Object.values(chatData.messages || {}).filter(
            (msg) => msg.receiverId === user.id && msg.timestamp > lastReadTimestamp
          ).length;
  
          return {
            chatKey,
            userName: otherUserInfo.name || 'Unknown User',
            avatar: otherUserInfo.avatar || config.defaultAvatar,
            lastMessage: latestMessage?.text || '',
            unreadCount,
            otherUserId,
          };
        })
      );
  
      // Step 5: Remove null entries and sort chats
      const filteredChats = userChats.filter(Boolean);
  
      // Step 6: Fetch online status for participants
      const onlineSnapshot = await onlineStatusRef.once('value');
      const onlineUsers = onlineSnapshot.val() || {};
  
      const finalChats = filteredChats.map((chat) => ({
        ...chat,
        isOnline: !!onlineUsers[chat.otherUserId], // Check if the other user is online
      }));
      console.log(finalChats)

      setChats(finalChats);
    } catch (error) {
      console.error('Error fetching chats:', error);
      Alert.alert('Error', 'Unable to fetch chats. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [user]);
  
  
  
  
  
  useEffect(() => {
    fetchChats();
  }, [fetchChats]);
  

  // Render Chat Item
  const renderChatItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() =>
          navigation.navigate('PrivateChat', {
            selectedUser: {
              senderId: item.otherUserId,
              sender: item.userName,
              avatar: item.avatar,
            },
            isOnline: item.isOnline,
            isBanned: item.isBanned,
          })
        }
      >
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        <View style={styles.textContainer}>
          <Text style={styles.userName}>
            {item.userName}
            {item.isOnline && !item.isBanned && <Text style={{ color: config.colors.hasBlockGreen }}> - Online</Text>}
            {item.isBanned && <Text style={{ color: config.colors.wantBlockRed }}> - Banned</Text>}
          </Text>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage}
          </Text>
        </View>
        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>
              {item.unreadCount > 99 ? '99+' : item.unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
      <Menu>
        <MenuTrigger>
          <Icon
            name="ellipsis-vertical-outline"
            size={20}
            color={config.colors.primary}
            style={{paddingLeft:10}}
          />
        </MenuTrigger>
        <MenuOptions>
          <MenuOption onSelect={() => handleDelete(item.chatKey)}>
            <Text style={{ color: 'red', fontSize: 16, padding: 10 }}>Delete</Text>
          </MenuOption>
        </MenuOptions>
      </Menu>
    </View>
  );

  return (
    <View style={styles.container}>
    {loading ? (
      <ActivityIndicator size="large" color="#1E88E5" style={{ flex: 1 }} />
    ) : chats.length === 0 ? (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Currently, there are no chats available. To start a chat, select a user's profile picture and initiate a conversation.</Text>
      </View>
    ) : (
      <FlatList
        data={chats}
        keyExtractor={(item) => item.chatKey}
        renderItem={renderChatItem}
      />
    )}
  </View>
  );
};

// Styles
const getStyles = (isDarkMode) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 10,
      backgroundColor: isDarkMode ? '#121212' : '#f2f2f7',

    },
    itemContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottomWidth: 1,
      borderBottomColor: '#ccc',
    },
    chatItem: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 15,
      justifyContent: 'space-between'
    },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: 10,
      backgroundColor:'white'
    },
    textContainer: {
      flex: 1,
    },
    userName: {
      fontSize: 14,
      fontFamily: 'Lato-Bold',
      color: isDarkMode ? '#fff' : '#333',
    },
    lastMessage: {
      fontSize: 14,
      color: '#555',
    },
    unreadBadge: {
      backgroundColor: config.colors.hasBlockGreen,
      borderRadius: 12,
      minWidth: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    unreadBadgeText: {
      color: '#fff',
      fontSize: 12,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyText:{
      color: isDarkMode ? 'white' : 'black',
      textAlign:'center'
    }
  });

export default InboxScreen;
