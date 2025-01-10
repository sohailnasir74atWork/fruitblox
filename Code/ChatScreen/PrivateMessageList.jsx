import React, { memo, useState } from 'react';
import { FlatList, View, Text, RefreshControl, Image, TouchableOpacity, ActivityIndicator, Vibration } from 'react-native';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import { useGlobalState } from '../GlobelStats';
import { getStyles } from './Style';
import ReportPopup from './ReportPopUp';

const PrivateMessageList = ({
  messages,
  userId,
  handleLoadMore,
  refreshing,
  onRefresh,
  bannedUsers,
  onReply,
  onReportSubmit, // Callback for submitting report
  loading,
}) => {
  const { theme } = useGlobalState();
  const isDarkMode = theme === 'dark';
  const styles = getStyles(isDarkMode);

  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showReportPopup, setShowReportPopup] = useState(false);

  const filteredMessages = messages.filter(
    (message) => !bannedUsers.includes(message.senderId)
  );

  // Open the report popup
  const handleReport = (message) => {
    setSelectedMessage(message);
    setShowReportPopup(true);
  };

  // Submit the report
  const handleSubmitReport = (message, reason) => {
    onReportSubmit(message, reason);
    setShowReportPopup(false);
  };

  // Render a single message
  const renderMessage = ({ item }) => {
    const isMyMessage = item.senderId === userId;

    return (
      <View
        style={
          isMyMessage
            ? [styles.mymessageBubble, styles.myMessage]
            : [styles.othermessageBubble, styles.otherMessage]
        }
      >
        {/* Avatar */}
        <Image
          source={{
            uri: isMyMessage
              ? item.senderAvatar || 'https://bloxfruitscalc.com/wp-content/uploads/2025/display-pic.png'
              : item.receiverAvatar || 'https://bloxfruitscalc.com/wp-content/uploads/2025/display-pic.png',
          }}
          style={styles.profileImagePvtChat}
        />

        {/* Message Content */}
        <Menu>
          <MenuTrigger
            onLongPress={() => Vibration.vibrate(50)} // Haptic feedback on long press
            customStyles={{
              TriggerTouchableComponent: TouchableOpacity,
            }}
          >
            <Text
              style={
                isMyMessage ? styles.myMessageText : styles.otherMessageText
              }
            >
              {item.text}
            </Text>
          </MenuTrigger>

          <MenuOptions style={styles.menuoptions}>
            <MenuOption
              onSelect={() => onReply(item)}
              text="Reply"
              customStyles={{
                optionWrapper: styles.menuOption,
                optionText: styles.menuOptionText,
              }}
            />
            <MenuOption
              onSelect={() => handleReport(item)}
              text="Report"
              customStyles={{
                optionWrapper: styles.menuOption,
                optionText: styles.menuOptionText,
              }}
            />
          </MenuOptions>
        </Menu>

        {/* Timestamp */}
        <Text style={styles.timestamp}>
          {new Date(item.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading && messages.length === 0 ? (
        <ActivityIndicator size="large" color="#1E88E5" style={styles.loader} />
      ) : (
        <FlatList
          data={filteredMessages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage} // Pass the render function directly
          inverted // Ensure list starts from the bottom
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
      <ReportPopup
        visible={showReportPopup}
        message={selectedMessage}
        onClose={() => setShowReportPopup(false)}
        onSubmit={handleSubmitReport}
      />
    </View>
  );
};

export default memo(PrivateMessageList);
