import React from 'react';
import {
  FlatList,
  View,
  Text,
  RefreshControl,
  Image,
} from 'react-native';
import { getStyles } from './Style'; // Import styles from original message list
import { useGlobalState } from '../GlobelStats';

const PrivateMessageList = ({
  messages,
  userId,
  handleLoadMore,
  refreshing,
  onRefresh,
  isBanned
}) => {
  const { theme } = useGlobalState();
  const isDarkMode = theme === 'dark';
  const styles = getStyles(isDarkMode); // Use original styles

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
          {/* Message Text */}
          <Text style={isMyMessage ? styles.myMessageText : styles.otherMessageText}>
            {item.text}
          </Text>

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
    <FlatList
      data={messages}
      keyExtractor={(item) => item.id}
      renderItem={renderMessage}
      inverted // This ensures the list starts from the bottom
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.3}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    />
  );
};

export default PrivateMessageList;
