import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Image,
  Alert,
} from 'react-native';
import { getStyles } from '../SettingScreen/settingstyle';
import { useGlobalState } from '../GlobelStats';
import config from '../Helper/Environment';
import Icon from 'react-native-vector-icons/Ionicons';
import { banUserInChat } from './utils';

const ProfileBottomDrawer = ({ isVisible, toggleModal, startChat, selectedUser, isOnline }) => {
  const { theme, user } = useGlobalState();
  const userName = selectedUser?.sender || null;
  const avatar = selectedUser?.avatar || null;

  const isDarkMode = theme === 'dark';
  const styles = getStyles(isDarkMode);

  // Handle Ban Action
  const handleBanUser = () => {
    Alert.alert(
      'Warning',
      'If you ban this user, you may not see any messages from them again. Do you wish to proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Proceed',
          onPress: () => {
          banUserInChat(user.id, selectedUser.senderId)
          toggleModal()
            // Add your ban logic here
          },
        },
      ],
      { cancelable: true }
    );
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
      <Pressable style={styles.overlay} onPress={() => toggleModal()} />

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
            {/* Ban Icon */}
            <TouchableOpacity onPress={handleBanUser}>
              <Icon name="ban-outline" size={30} color={config.colors.wantBlockRed} />
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
