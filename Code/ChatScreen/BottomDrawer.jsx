import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Image,
} from 'react-native';
import { getStyles } from '../SettingScreen/settingstyle';
import { useGlobalState } from '../GlobelStats';
import config from '../Helper/Environment';
import Icon from 'react-native-vector-icons/Ionicons';
import { banUserInChat, unbanUserInChat } from './utils';

const ProfileBottomDrawer = ({ isVisible, toggleModal, startChat, selectedUser, isOnline, bannedUsers }) => {
  const { theme, user } = useGlobalState();
  const userName = selectedUser?.sender || null;
  const avatar = selectedUser?.avatar || null;

  const isDarkMode = theme === 'dark';
  const styles = getStyles(isDarkMode);

  // Determine if the user is currently banned
  const isBanned = bannedUsers?.includes(selectedUser?.senderId);

  // Handle Ban/Unban Toggle
  const handleToggleBan = async () => {
    if (isBanned) {
      await unbanUserInChat(user.id, selectedUser.senderId);
    } else {
      await banUserInChat(user.id, selectedUser.senderId);
    }
  };

  // Handle Start Chat
  const handleStartChat = () => {
    if (startChat) {
      startChat(); // Call the function passed as a prop
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={toggleModal}
    >
      {/* Overlay */}
      <Pressable style={styles.overlay} onPress={toggleModal} />

      {/* Drawer Content */}
      <View style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View style={styles.drawer}>
          {/* User Info */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View style={{ flexDirection: 'row' }}>
              <Image
                source={{
                  uri: avatar
                    ? avatar
                    : 'https://bloxfruitscalc.com/wp-content/uploads/2025/display-pic.png',
                }}
                style={styles.profileImage2}
              />
              <View style={{ justifyContent: 'center' }}>
                <Text style={styles.drawerSubtitle}>{userName}</Text>
                <Text
                  style={[
                    styles.drawerSubtitle,
                    {
                      color: isOnline
                        ? config.colors.hasBlockGreen
                        : config.colors.wantBlockRed,
                      fontSize: 10,
                      marginTop: 2,
                    },
                  ]}
                >
                  {isOnline ? 'Online' : 'Offline'}
                </Text>
              </View>
            </View>

            {/* Ban/Unban Icon */}
            <TouchableOpacity onPress={handleToggleBan}>
              <Icon
                name="ban-outline"
                size={30}
                color={
                  isBanned
                    ? config.colors.wantBlockRed // Banned color
                    : config.colors.hasBlockGreen // Not banned color
                }
              />
            </TouchableOpacity>
          </View>

          {/* Start Chat Button */}
          <TouchableOpacity style={styles.saveButton} onPress={handleStartChat}>
            <Text style={styles.saveButtonText}>Start Chat</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default ProfileBottomDrawer;