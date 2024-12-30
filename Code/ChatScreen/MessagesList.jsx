import React from 'react';
import { FlatList, View, Text, TouchableOpacity } from 'react-native';
import { getStyles } from './Style';
import { formatDate, generateShortDisplayName, getColorForName } from './utils';

const MessagesList = ({ messages, user, userColors, isDarkMode, onPinMessage, onDeleteMessage, isAdmin }) => {
  const styles = getStyles(isDarkMode);

  const renderMessage = ({ item }) => (
    <View>
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
          <Text style={item.senderId === user?.uid ? styles.myMessageText : styles.otherMessageText}>
            {item.text}
          </Text>
        </View>
        {isAdmin && (
          <View style={styles.adminActions}>
            <TouchableOpacity onPress={() => onPinMessage(item)} style={styles.pinButton}>
              <Text style={styles.pinButtonText}>Pin</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDeleteMessage(item.id)} style={styles.deleteButton}>
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <FlatList
      data={messages}
      keyExtractor={(item) => item.id}
      renderItem={renderMessage}
      contentContainerStyle={styles.chatList}
      inverted
    />
  );
};

export default MessagesList;
