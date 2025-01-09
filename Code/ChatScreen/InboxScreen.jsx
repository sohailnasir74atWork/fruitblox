import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import database from '@react-native-firebase/database';
import { useGlobalState } from '../GlobelStats';

const InboxScreen = () => {
  const navigation = useNavigation();
  const { user, activeUser } = useGlobalState(); // Global state for logged-in user and active users
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bannedUsers, setBannedUsers] = useState([]);

  // Fetch banned users for the logged-in user
  useEffect(() => {
    if (!user?.id) return;

    const bannedRef = database().ref(`bannedUsers/${user.id}`);
    const unsubscribe = bannedRef.on('value', (snapshot) => {
      const bannedData = snapshot?.val() || {};
      setBannedUsers(Object.keys(bannedData));
    });

    return () => unsubscribe();
  }, [user?.id]);

  // Fetch chat list for the logged-in user
  useEffect(() => {
    if (!user?.id) return;

    const privateChatsRef = database().ref('privateChats');
    const userChats = [];

    const fetchChats = async () => {
      try {
        setLoading(true);
        const snapshot = await privateChatsRef.once('value');
        const chatsData = snapshot.val() || {};

        Object.keys(chatsData).forEach((chatKey) => {
          const [userId1, userId2] = chatKey.split('_');
          const otherUserId = userId1 === user.id ? userId2 : userId1;

          if (userId1 === user.id || userId2 === user.id) {
            const messages = Object.entries(chatsData[chatKey]).sort(
              (a, b) => b[1].timestamp - a[1].timestamp
            ); // Sort messages by timestamp descending

            if (messages.length > 0) {
              const lastMessage = messages[0][1];

              // Check if the other user is online
              const isOnline = activeUser.some((active) => active.id === otherUserId);

              userChats.push({
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
                otherUserId,
                isOnline,
                isBanned: bannedUsers.includes(otherUserId), // Check if the user is banned
              });
            }
          }
        });

        setChats(userChats);
      } catch (error) {
        console.error('Error fetching chats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, [user?.id, activeUser, bannedUsers]);

  const navigateToPrivateChat = (chatKey, otherUserId, userName, avatar, isOnline, isBanned) => {
    navigation.navigate('PrivateChat', {
      selectedUser: { senderId: otherUserId, sender: userName, avatar },
      selectedTheme: { colors: { text: '#000' } }, // Replace with actual theme
      isOnline,
      isBanned
    });
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#1E88E5" />
      ) : chats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No chats available. Start a conversation!</Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.chatKey}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.chatItem, item.isBanned && styles.bannedChatItem]}
              onPress={() =>
                navigateToPrivateChat(item.chatKey, item.otherUserId, item.userName, item.avatar, item.isOnline, item.isBanned)
              }
            >
              <Image
                source={{ uri: item.avatar }}
                style={styles.avatar}
              />
              <View style={styles.textContainer}>
              <View style={{flex:1, justifyContent:'space-between', flexDirection:'row'}}>
                <Text style={styles.userName}>
                   
                  {item.userName}{' '}
                  
                  </Text> 
                  {item.isOnline && <Text style={styles.onlineIndicator}>Online</Text>}
                  {item.isBanned && <Text style={styles.bannedIndicator}>Banned</Text>}
                </View>
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {item.lastMessage}
                </Text>
              </View>
            </TouchableOpacity>
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
  bannedChatItem: {
    // backgroundColor: '#f8d7da', // Light red for banned users
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
    color: '#dc3545', // Red color for banned users
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
});

export default InboxScreen;
