import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Image,
} from 'react-native';
import { useGlobalState } from '../../GlobelStats';
import config from '../../Helper/Environment';
import Icon from 'react-native-vector-icons/Ionicons';
import { banUserInChat, unbanUserInChat } from './../utils';
import { getStyles } from '../../SettingScreen/settingstyle';
import { useLocalState } from '../../LocalGlobelStats';


const ProfileBottomDrawer = ({ isVisible, toggleModal, startChat, selectedUser, isOnline, bannedUsers }) => {
  const { theme, user } = useGlobalState();
  // console.log(isVisible)
  const {isPro} = useLocalState()
  const userName = selectedUser?.sender || null;
  const avatar = selectedUser?.avatar || null;

  const isDarkMode = theme === 'dark';
  const styles = getStyles(isDarkMode);

  // Determine if the user is currently banned
  const isBlock = bannedUsers?.includes(selectedUser?.senderId);

  // Handle Ban/Unban Toggle
  const handleToggleBlock = async () => {
    if (isBlock) {
      // Unban the user
      try {
        await unbanUserInChat(user.id, selectedUser);
      } catch (error) {
        console.error('Error unbanning user:', error);
        Alert.alert('Error', 'Failed to unban the user. Please try again.');
      }
    } else {
      // Ban the user
      try {
        const isBanned = await banUserInChat(user.id, selectedUser); // Check if user is successfully banned
        if (isBanned) {
          await toggleModal(); // Close the drawer if the user is successfully banned
        } else {
          // console.log('User canceled the block operation.');
        }
      } catch (error) {
        console.error('Error banning user:', error);
        Alert.alert('Error', 'Failed to ban the user. Please try again.');
      }
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
                <Text style={styles.drawerSubtitleUser}>{userName} {isPro &&  <Icon
            name="checkmark-done-circle"
            size={16}
            color={config.colors.hasBlockGreen}
          />}</Text>
                <Text
                  style={[
                    styles.drawerSubtitleUser,
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
            <TouchableOpacity onPress={handleToggleBlock}>
              <Icon
                name={isBlock ? "shield-checkmark-outline" : "ban-outline"}
                size={30}
                color={
                  isBlock
                    ? config.colors.hasBlockGreen // Banned color
                    : config.colors.wantBlockRed // Not banned color
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