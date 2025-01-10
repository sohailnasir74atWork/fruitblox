import React, { useState, useMemo, useCallback } from 'react';
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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import database from '@react-native-firebase/database';
import { useGlobalState } from '../GlobelStats';
import Icon from 'react-native-vector-icons/Ionicons';
import config from '../Helper/Environment';

const InboxScreen = ({ route }) => {
  const navigation = useNavigation();
  const { user, activeUser } = useGlobalState();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const bannedUsers = route?.params?.bannedUsers;

  const fetchChats = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    const privateChatsRef = database().ref('privateChats');
    const lastReadRef = database().ref(`lastseen/${user.id}`);

    try {
      const [chatsSnapshot, lastReadSnapshot] = await Promise.all([
        privateChatsRef.once('value'),
        lastReadRef.once('value'),
      ]);

      const chatsData = chatsSnapshot.val() || {};
      const lastReadData = lastReadSnapshot.val() || {};

      const userChats = Object.keys(chatsData).reduce((acc, chatKey) => {
        const [userId1, userId2] = chatKey.split('_');
        const otherUserId = userId1 === user.id ? userId2 : userId1;

        if (userId1 === user.id || userId2 === user.id) {
          const messages = Object.entries(chatsData[chatKey]).sort(
            (a, b) => b[1].timestamp - a[1].timestamp
          );

          if (messages.length > 0) {
            const lastMessage = messages[0][1];
            const unreadCount = messages.filter(
              (msg) => msg[1].timestamp > (lastReadData[chatKey] || 0)
            ).length;

            const isOnline = activeUser?.some((active) => active.id === otherUserId);

            acc.push({
              chatKey,
              userName:
                lastMessage.receiverId === otherUserId
                  ? lastMessage.receiverName
                  : lastMessage.senderName,
              avatar:
                lastMessage.receiverId === otherUserId
                  ? lastMessage.receiverAvatar
                  : lastMessage.senderAvatar || 'https://bloxfruitscalc.com/wp-content/uploads/2025/display-pic.png',
              lastMessage: lastMessage.text,
              unreadCount,
              otherUserId,
              isOnline,
              isBanned: bannedUsers?.includes(otherUserId),
            });
          }
        }

        return acc;
      }, []);

      setChats(userChats);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchChats();
    }, [fetchChats])
  );

  const handleDeleteChat = async (chatKey) => {
    Alert.alert('Delete Chat', 'Are you sure you want to delete this chat?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const chatRef = database().ref(`privateChats/${chatKey}`);
            await chatRef.remove();
            setChats((prevChats) => prevChats.filter((chat) => chat.chatKey !== chatKey));
          } catch (error) {
            console.error('Error deleting chat:', error);
          }
        },
      },
    ]);
  };

  const memoizedChats = useMemo(() => chats, [chats]);

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#1E88E5" style={{ flex: 1 }} />
      ) : chats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No chats available. Start a conversation!</Text>
        </View>
      ) : (
        <FlatList
          data={memoizedChats}
          keyExtractor={(item) => item.chatKey}
          renderItem={({ item }) => (
            <View style={styles.chatItem}>
              <TouchableOpacity
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
                style={styles.chatContent}
              >
                <Image source={{ uri: item.avatar }} style={styles.avatar} />
                <View style={styles.textContainer}>
                  <Text style={styles.userName}>
                    {item.userName}
                    {item.isOnline && (
                      <Text style={{ color: config.colors.hasBlockGreen }}> - Online</Text>
                    )}
                    {item.isBanned && (
                      <Text style={{ color: config.colors.wantBlockRed }}> - Banned</Text>
                    )}
                  </Text>
                  <Text style={styles.lastMessage} numberOfLines={1}>
                    {item.lastMessage}
                  </Text>
                </View>
                {item.unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteChat(item.chatKey)}
                style={styles.delete}
              >
                <Icon name="trash-outline" size={24} color={config.colors.wantBlockRed} />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  chatContent: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
    justifyContent:'center'
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  lastMessage: {
    fontSize: 14,
    color: '#555',
  },
  onlineIndicator: {
    color: '#28a745',
  },
  bannedIndicator: {
    color: '#dc3545',
  },
  deleteButton: {
    color: 'red',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#555',
  },
  delete:{
// alignItems:'center',
// justifyContent:'center',
  },
  unreadBadge: {
    backgroundColor: config.colors.primary, // Badge color
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  
});

export default InboxScreen;
