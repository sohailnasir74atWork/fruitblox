import React from 'react';
import {
  FlatList,
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  Vibration,
} from 'react-native';
import { getStyles } from './Style';
import { formatDate, generateShortDisplayName, getColorForName } from './utils';

const MessagesList = ({
  messages,
  handleLoadMore,
  user,
  userColors,
  isDarkMode,
  onPinMessage,
  onDeleteMessage,
  onReply,
  isAdmin,
  refreshing,
  onRefresh,
}) => {
  const styles = getStyles(isDarkMode);

  const handleReply = (item) => {
    Vibration.vibrate(50); // Vibrate for feedback
    onReply(item); // Trigger reply with selected message
  };

  const renderMessage = ({ item, index }) => {
    const previousMessage = messages[index + 1];
    const currentDate = new Date(item.timestamp).toDateString();
    const previousDate = previousMessage
      ? new Date(previousMessage.timestamp).toDateString()
      : null;

    const shouldShowDateHeader = currentDate !== previousDate;

    return (
      <View>
        {/* Display the date header if it's a new day */}
        {shouldShowDateHeader && (
          <View>
            <Text style={styles.dateSeparator}>{currentDate}</Text>
          </View>
        )}

        {/* Render the message */}
        <View
          style={[
            item.senderId === user?.uid ? styles.mymessageBubble : styles.othermessageBubble,
            item.senderId === user?.uid ? styles.myMessage : styles.otherMessage,
          ]}
        >
          <View
            style={[
              styles.senderName,
              { backgroundColor: getColorForName(item.sender, userColors) },
            ]}
          >
            <Text style={styles.senderNameText}>
              {generateShortDisplayName(item.sender)}
            </Text>
          </View>

          <View style={styles.messageTextBox}>
            {/* Render reply context if present */}
            {item.replyTo && (
              <View style={styles.replyContainer}>
                <Text style={styles.replyText}>
                  Replying to: {'\n'}{item.replyTo.text || '[Deleted message]'}
                </Text>
              </View>
            )}

            {/* Render main message */}
            <TouchableOpacity
              onLongPress={() => handleReply(item)} // Use handleReply
              delayLongPress={300}
            >
              <Text
                style={
                  item.senderId === user?.uid
                    ? styles.myMessageText
                    : styles.otherMessageText
                }
              >
                {item.text}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Admin Actions or Timestamp */}
          {isAdmin ? (
            <View style={styles.adminActions}>
              <TouchableOpacity
                onPress={() => onPinMessage(item)}
                style={styles.pinButton}
              >
                <Text style={styles.pinButtonText}>Pin</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onDeleteMessage(item.id)}
                style={styles.deleteButton}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={styles.timestamp}>
                {new Date(item.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <FlatList
      data={messages}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => renderMessage({ item, index })}
      contentContainerStyle={styles.chatList}
      inverted
      onEndReachedThreshold={0.3}
      onEndReached={handleLoadMore}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={isDarkMode ? '#FFF' : '#000'}
        />
      }
    />
  );
};

export default MessagesList;
