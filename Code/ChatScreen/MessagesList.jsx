import React from 'react';
import { FlatList, View, Text, TouchableOpacity } from 'react-native';
import { getStyles } from './Style';
import { formatDate, generateShortDisplayName, getColorForName } from './utils';

const MessagesList = ({ messages, user, userColors, isDarkMode, onPinMessage, onDeleteMessage, isAdmin }) => {
  const styles = getStyles(isDarkMode);

  const renderMessage = ({ item, index }) => {
    const previousMessage = messages[index + 1]; // Get the next message (list is inverted)
    const currentDate = new Date(item.timestamp).toDateString();
    const previousDate = previousMessage
      ? new Date(previousMessage.timestamp).toDateString()
      : null;

    // Check if the date header should be displayed
    const shouldShowDateHeader = currentDate !== previousDate;

    return (
      <View>
        {/* Display the date header if it's the first message of the day */}
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
            <Text
              style={
                item.senderId === user?.uid
                  ? styles.myMessageText
                  : styles.otherMessageText
              }
            >
              {item.text}
            </Text>
          </View>

          {/* Conditionally render admin actions or timestamp */}
          {isAdmin ? (
            <View style={styles.adminActions}>
              <TouchableOpacity onPress={() => onPinMessage(item)} style={styles.pinButton}>
                <Text style={styles.pinButtonText}>Pin</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onDeleteMessage(item.id)} style={styles.deleteButton}>
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
    />
  );
};

export default MessagesList;
