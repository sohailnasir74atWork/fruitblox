import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { getDatabase, onValue, ref } from '@react-native-firebase/database';
import Icon from 'react-native-vector-icons/Ionicons';
import config from '../../Helper/Environment';
import { useGlobalState } from '../../GlobelStats';
import { unbanUserInChat } from '../utils';

const BlockedUsersScreen = ({ route }) => {
  const { user, theme } = useGlobalState();

  const isDarkMode = theme == 'dark'
  const styles = getStyles(isDarkMode)
  const [blockedUsers, setBlockedUsers] = useState(route.params?.bannedUsers || []);
  const [loading, setLoading] = useState(!route.params?.bannedUsers);


  const handleUnblockUser = async (userId, selectedUserId) => {
    const success = await unbanUserInChat(userId, selectedUserId);
    if (success) {
      setBlockedUsers((prevBlockedUsers) =>
        prevBlockedUsers.filter((user) => user.id !== selectedUserId)
      );
      Alert.alert('Success', 'User has been unblocked.');
    }
  };
  
  useEffect(() => {
    if (!user?.id || route.params?.bannedUsers) return; // Skip if initial params exist

    const db = getDatabase();
    const blockedRef = ref(db, `bannedUsers/${user.id}`);

    const unsubscribe = onValue(
      blockedRef,
      (snapshot) => {
        const data = snapshot.val() || {};
        const blockedUsersList = Object.entries(data).map(([id, details]) => ({
          id,
          displayName: details?.displayName || 'Unknown',
          avatar: details?.avatar || 'https://bloxfruitscalc.com/wp-content/uploads/2025/display-pic.png',
        }));
        setBlockedUsers(blockedUsersList);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching blocked users:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.id, route.params?.bannedUsers]);

  const renderBlockedUser = ({ item }) => (
    <View style={styles.userContainer}>
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={styles.textContainer}>
        <Text style={styles.userName}>{item.displayName}</Text>
        <TouchableOpacity
  style={styles.unblockButton}
  onPress={() => handleUnblockUser(user.id, item.id)}
>
  <Icon name="person-remove-outline" size={20} color={isDarkMode ? 'white' : 'black'} />
  <Text style={styles.unblockText}>Unblock</Text>
</TouchableOpacity>

      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={isDarkMode ? 'white' : 'black'} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {blockedUsers.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No users blocked.</Text>
        </View>
      ) : (
        <FlatList
          data={blockedUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderBlockedUser}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};


export const getStyles = (isDarkMode) =>
StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDarkMode ? '#121212' : '#f2f2f7',
    padding: 10,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: isDarkMode ? 'white' : 'black',
    textAlign: 'center',
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    padding: 10,
    backgroundColor: config.colors.card,
    borderRadius: 10,
    borderBottomWidth:1,
    borderColor: isDarkMode ? 'white' : 'black',

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userName: {
    fontSize: 16,
    color: isDarkMode ? 'white' : 'black',
  },
  unblockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: config.colors.danger,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  unblockText: {
    marginLeft: 5,
    color: isDarkMode ? 'white' : 'black',
    fontSize: 14,
  },
});

export default BlockedUsersScreen;
