import React from 'react';
import {
  FlatList,
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  Vibration,
  Image,
  Linking,
} from 'react-native';
import { getStyles } from './Style';
import { formatDate, generateShortDisplayName, getColorForName } from './utils';
import { imageOptions } from '../SettingScreen/settinghelper';
import { ref } from 'firebase/database';

const MessagesList = ({
  messages,
  handleLoadMore,
  user,
  isDarkMode,
  onPinMessage,
  onDeleteMessage,
  onReply,
  isAdmin,
  refreshing,
  onRefresh,
  banUser,
  makeadmin,
  removeAdmin,
  unbanUser,
  isOwner
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
            item.senderId === user?.id ? styles.mymessageBubble : styles.othermessageBubble,
            item.senderId === user?.id ? styles.myMessage : styles.otherMessage,
          ]}
        >
          <View
            style={[
              styles.senderName,
            ]}
          >

            <Image
              source={{
                uri: item.avatar
                  ? item.avatar
                  : 'https://bloxfruitscalc.com/wp-content/uploads/2025/display-pic.png',
              }}
              style={styles.senderName}
            />

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
      item.senderId === user?.id
        ? styles.myMessageText
        : styles.otherMessageText
    }
  >
    {/* Inline sender name and admin badge */}
    <Text style={styles.userName}>{item.sender}</Text>
    {item.isAdmin && <Text style={styles.dot}> • </Text>}
    {item.isAdmin && <Text style={styles.admin}>Admin</Text>}
    {'\n'}
    {/* Parse and render message text with clickable links */}
    {item.isAdmin
      ? item.text.split(/(\s+)/).map((part, index) => {
          // Check if the part is a URL
          const isLink = /^https?:\/\/\S+$/.test(part);
          if (isLink) {
            return (
              <Text
                key={index}
                style={styles.linkText} // Apply a distinct style for links
                onPress={() => Linking.openURL(part)} // Open link on press
              >
                {part}
              </Text>
            );
          }
          return part; // Render normal text
        })
      : item.text}
  </Text>
</TouchableOpacity>


          </View>

          {/* Admin Actions or Timestamp */}
          {(isOwner || isAdmin) ? (
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
              <TouchableOpacity
                onPress={() => banUser(item.senderId)}
                style={styles.deleteButton}
              >
                <Text style={styles.deleteButtonText}>Block User</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => unbanUser(item.senderId)}
                style={styles.deleteButton}
              >
                <Text style={styles.deleteButtonText}>Unban User</Text>
              </TouchableOpacity>
              {isOwner && <TouchableOpacity
                onPress={() => makeadmin(item.senderId)}
                style={styles.deleteButton}
              >
                <Text style={styles.deleteButtonText}>Make admin</Text>
              </TouchableOpacity>}
              {isOwner && <TouchableOpacity
                onPress={() => removeAdmin(item.senderId)}
                style={styles.deleteButton}
              >
                <Text style={styles.deleteButtonText}>Remove admin</Text>
              </TouchableOpacity>}
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
