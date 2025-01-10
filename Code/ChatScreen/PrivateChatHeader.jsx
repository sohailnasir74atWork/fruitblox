import React, { useMemo } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import config from '../Helper/Environment';
import { banUserInChat, unbanUserInChat } from './utils';
import { useGlobalState } from '../GlobelStats';

const PrivateChatHeader = ({ selectedUser, isOnline, selectedTheme, bannedUsers }) => {
  const { user } = useGlobalState();
  const avatarUri = selectedUser?.avatar || 'https://bloxfruitscalc.com/wp-content/uploads/2025/display-pic.png';
  const userName = selectedUser?.sender || 'User';
  const onlineStatusColor = bannedUsers.includes(selectedUser.senderId)
  ? config.colors.wantBlockRed // Banned users' color
  : isOnline
  ? config.colors.hasBlockGreen // Online users' color
  : config.colors.wantBlockRed; // Offline users' color


  // Determine if the user is currently banned
  const isBanned = useMemo(() => bannedUsers.includes(selectedUser.senderId), [bannedUsers, selectedUser.senderId]);

  const handleBanToggle = async () => {
    if (isBanned) {
      await unbanUserInChat(user.id, selectedUser.senderId);
    } else {
      await banUserInChat(user.id, selectedUser.senderId);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: avatarUri }} style={styles.avatar} />
      <View style={styles.infoContainer}>
        <Text style={[styles.userName, { color: selectedTheme.colors.text }]}>{userName}</Text>
        <Text style={[styles.userStatus, { color: onlineStatusColor }]}>
          {isBanned ? 'Banned' : isOnline ? 'Online' : 'Offline'}
        </Text>
      </View>
      <Icon
        name="ban-outline"
        size={24}
        color={isBanned ? config.colors.wantBlockRed : config.colors.hasBlockGreen}
        style={styles.banIcon}
        onPress={handleBanToggle}
      />
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  infoContainer: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  userStatus: {
    fontSize: 12,
  },
  banIcon: {
    marginLeft: 10,
  },
});

export default PrivateChatHeader;
