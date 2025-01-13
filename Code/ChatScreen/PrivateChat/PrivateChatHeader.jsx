import React, { useMemo } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import config from '../../Helper/Environment';
import { banUserInChat, unbanUserInChat } from '../utils';
import { useGlobalState } from '../../GlobelStats';

const PrivateChatHeader = ({ selectedUser, isOnline, selectedTheme, bannedUsers }) => {
  const { user } = useGlobalState();
  const avatarUri = selectedUser?.avatar || 'https://bloxfruitscalc.com/wp-content/uploads/2025/display-pic.png';
  console.log(selectedUser)
  const userName = selectedUser?.sender || 'User';

  // Check if the user is currently banned
  const isBanned = useMemo(
    () => bannedUsers?.some((banned) => banned.id === selectedUser?.senderId),
    [bannedUsers, selectedUser?.senderId]
  );

  const onlineStatusColor = isBanned
    ? config.colors.wantBlockRed // Banned user color
    : isOnline
    ? config.colors.hasBlockGreen // Online user color
    : config.colors.wantBlockRed; // Offline user color

  const handleBanToggle = async () => {
    try {
      if (isBanned) {
        await unbanUserInChat(user.id, selectedUser.senderId); // Unban user
      } else {
        await banUserInChat(user.id, selectedUser); // Ban user
      }
    } catch (error) {
      console.error('Error toggling ban status:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: avatarUri }} style={styles.avatar} />
      <View style={styles.infoContainer}>
        <Text style={[styles.userName, { color: selectedTheme.colors.text }]}>{userName}</Text>
        <Text style={[styles.userStatus, { color: onlineStatusColor }]}>
          {isBanned ? 'Blocked' : isOnline ? 'Online' : 'Offline'}
        </Text>
      </View>
      <TouchableOpacity onPress={handleBanToggle}>
        <Icon
          name={isBanned ? 'shield-checkmark-outline' : 'ban-outline'}
          size={24}
          color={isBanned ? config.colors.hasBlockGreen : config.colors.wantBlockRed}
          style={styles.banIcon}
        />
      </TouchableOpacity>
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
