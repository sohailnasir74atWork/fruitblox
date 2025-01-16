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
  
      // Fetch necessary data concurrently
      const [userChatsSnapshot, bannedSnapshot, lastReadSnapshot] = await Promise.all([
        privateChatsRef.orderByChild(`participants/${user.id}`).once('value'),
        bannedRef.once('value'),
        lastReadRef.once('value'),
      ]);
  
      const userChats = userChatsSnapshot.val() || {};
      const bannedData = bannedSnapshot.val() || {};
      const lastReadData = lastReadSnapshot.val() || {};
  
      // Extract banned user IDs
      const bannedUserIds = Object.keys(bannedData);
      // console.log('Banned User IDs:', bannedUserIds);
  
      // Filter and map chats
      const filteredChats = await Promise.all(
        Object.entries(userChats)
          .filter(([chatKey, chatData]) => {
            const otherUserId = Object.keys(chatData.participants).find((id) => id !== user.id);
  
            // Exclude chats with banned users
            return otherUserId && !bannedUserIds.includes(otherUserId);
          })
          .map(async ([chatKey, chatData]) => {
            const messages = Object.entries(chatData.messages || {}).map(([key, msg]) => ({
              id: key,
              ...msg,
            }));
  
            // Sort messages by timestamp to get the latest message
            const sortedMessages = messages.sort((a, b) => a.timestamp - b.timestamp);
            const lastMessage = sortedMessages[sortedMessages.length - 1] || {};
  
            const otherUserId = Object.keys(chatData.participants).find((id) => id !== user.id);
            const otherUserInfo = {
              userName:
                lastMessage.senderId === user.id
                  ? lastMessage.receiverName
                  : lastMessage.senderName || 'Unknown User',
              avatar:
                lastMessage.senderId === user.id
                  ? lastMessage.receiverAvatar
                  : lastMessage.senderAvatar || config.defaultAvatar,
            };
  
            // Calculate unread messages
            const lastReadTimestamp = lastReadData[chatKey] || 0;
            const unreadCount = messages.filter(
              (msg) => msg.receiverId === user.id && msg.timestamp > lastReadTimestamp
            ).length;
  
            // Check if the other user is online
            const isOnline = await isUserOnline(otherUserId);
  
            return {
              chatKey,
              userName: otherUserInfo.userName,
              avatar: otherUserInfo.avatar,
              lastMessage: lastMessage.text || '',
              unreadCount,
              otherUserId,
              isOnline,
            };
          })
      );
  
      setChats(filteredChats);
    } catch (error) {
      console.error('Error fetching chats:', error);
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
        <Text style={styles.emptyText}>Currently there is no chats available</Text>
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
      fontWeight: '600',
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
    }
  });

export default InboxScreen;
