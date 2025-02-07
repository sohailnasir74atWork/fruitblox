import React, { useMemo, useCallback } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import config from '../../Helper/Environment';
import { banUserInChat, unbanUserInChat } from '../utils';
import { useGlobalState } from '../../GlobelStats';
import { useLocalState } from '../../LocalGlobelStats';

const PrivateChatHeader = React.memo(({ selectedUser, isOnline, selectedTheme, bannedUsers }) => {
  const { user } = useGlobalState();
  const {isPro} = useLocalState()

  const avatarUri = selectedUser?.avatar || 'https://bloxfruitscalc.com/wp-content/uploads/2025/display-pic.png';
  const userName = selectedUser?.sender || 'User';

  const isBanned = useMemo(() => {
    const bannedSet = new Set(bannedUsers.map((user) => user.id));
    return bannedSet.has(selectedUser?.senderId);
  }, [bannedUsers, selectedUser?.senderId]);

  const onlineStatusColor = useMemo(
    () => (isBanned ? config.colors.wantBlockRed : isOnline ? config.colors.hasBlockGreen : config.colors.wantBlockRed),
    [isBanned, isOnline]
  );

  const handleBanToggle = async () => {
    try {
      if (isBanned) {
        await unbanUserInChat(user.id, selectedUser.senderId);
      } else {
        await banUserInChat(user.id, selectedUser);
      }
    } catch (error) {
      console.error('Error toggling ban status:', error);
    }
  }

  return (
    <View style={styles.container}>
      <Image source={{ uri: avatarUri }} style={styles.avatar} />
      <View style={styles.infoContainer}>
        <Text style={[styles.userName, { color: selectedTheme.colors.text }]}>{userName} {isPro &&  <Icon
            name="checkmark-done-circle"
            size={16}
            color={config.colors.hasBlockGreen}
          />}</Text>
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
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: 'white',
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
