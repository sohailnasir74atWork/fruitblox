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

  const handleDelete = (chatId) => {
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
              const chatRef = database().ref(`private_chat/${chatId}`);
              await chatRef.remove();

              // Update the local state to remove the chat
              setChats((prevChats) => prevChats.filter((chat) => chat.chatId !== chatId));
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
      const privateChatsRef = database().ref('private_chat');
      const bannedRef = database().ref(`bannedUsers/${user.id}`);
  
      // Step 1: Fetch banned users
      const bannedSnapshot = await bannedRef.once('value');
      const bannedUsers = bannedSnapshot.val() || {};
      const bannedUserIds = Object.keys(bannedUsers);
  
      // Step 2: Query chats where the current user is a participant
      const queryRef = privateChatsRef.orderByChild(`participants/${user.id}`).equalTo(true);
      const snapshot = await queryRef.once('value');
  
      if (!snapshot.exists()) {
        setChats([]);
        return;
      }
  
      // Step 3: Process only `lastMessage`, `metadata`, and `unread`
      const userChats = Object.entries(snapshot.val())
        .filter(([chatId, chatData]) => {
          const otherUserId = Object.keys(chatData.participants).find((id) => id !== user.id);
          return otherUserId && !bannedUserIds.includes(otherUserId); // Exclude banned users
        })
        .map(([chatId, chatData]) => {
          const otherUserId = Object.keys(chatData.participants).find((id) => id !== user.id);
          const lastMessage = chatData.lastMessage || null;
          const metadata = chatData.metadata || {};
          const unreadCount = chatData.unread?.[user.id] || 0;
  
          return {
            chatId,
            otherUserId,
            isOnline: false, // Optional: defer `isOnline` for batch checking
            lastMessage: lastMessage?.text || 'No messages yet',
            lastMessageTimestamp: lastMessage?.timestamp || null,
            unreadCount,
            otherUserAvatar:
              otherUserId === metadata.senderId
                ? metadata.senderAvatar
                : metadata.receiverAvatar,
            otherUserName:
              otherUserId === metadata.senderId
                ? metadata.senderName
                : metadata.receiverName,
          };
        });
  
      // Step 4: Batch check for online status
      const onlineStatuses = await Promise.all(
        userChats.map((chat) => isUserOnline(chat.otherUserId))
      );
  
      const updatedChats = userChats.map((chat, index) => ({
        ...chat,
        isOnline: onlineStatuses[index],
      }));
  
      // Step 5: Sort chats by the timestamp of the last message (most recent first)
      const sortedChats = updatedChats.sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp);
  
      // Update state with the fetched chats
      setChats(sortedChats);
    } catch (error) {
      console.error('Error fetching chats:', error);
      Alert.alert('Error', 'Unable to fetch chats. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [user]);
  
  
  // console.log(chats)




  useEffect(() => {
    fetchChats();
  }, [fetchChats]);


  const renderChatItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() =>
          navigation.navigate('PrivateChat', {
            selectedUser: {
              senderId: item.otherUserId,
              sender: item.otherUserName,
              avatar: item.otherUserAvatar,
            },
            isOnline: item.isOnline,
            isBanned: item.isBanned,
          })
        }
      >
        <Image source={{ uri: item.otherUserId !== user.id ? item.otherUserAvatar : user.avatar }} style={styles.avatar} />
        <View style={styles.textContainer}>
          <Text style={styles.userName}>
            {item.otherUserName}
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
          <MenuOption onSelect={() => handleDelete(item.chatId)}>
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
        keyExtractor={(item) => item.chatId}
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
