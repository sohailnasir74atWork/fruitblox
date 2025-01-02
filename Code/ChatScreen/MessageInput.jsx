import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { getStyles } from './Style';
import Icon from 'react-native-vector-icons/Ionicons'; // Import Icon
import config from '../Helper/Environment';

const MessageInput = ({
  input,
  setInput,
  handleSendMessage,
  selectedTheme,
  replyTo,
  onCancelReply,
}) => {
  const styles = getStyles(selectedTheme.colors.text === 'white');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isSending) return; // Prevent empty messages or multiple sends
    setIsSending(true);

    try {
      await handleSendMessage(replyTo, trimmedInput); // Send message with reply context and trimmed input
      setInput(''); // Clear input
      if (onCancelReply) onCancelReply(); // Clear reply context
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false); // Reset sending state
    }
  };

  return (
    <View style={styles.inputWrapper}>
      {/* Reply context UI */}
      {replyTo && (
  <View style={styles.replyContainer}>
    <Text style={styles.replyText}>
      Replying to: {replyTo.text}
    </Text>
    <TouchableOpacity onPress={onCancelReply} style={styles.cancelReplyButton}>
      <Icon name="close-circle" size={24} color="#e74c3c" />
    </TouchableOpacity>
  </View>
)}

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, { color: selectedTheme.colors.text }]}
          placeholder="Type a message..."
          placeholderTextColor="#888"
          value={input}
          onChangeText={setInput}
          multiline
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: input.trim() && !isSending ? '#1E88E5' : config.colors.primary },
          ]}
          onPress={handleSend}
          disabled={!input.trim() || isSending}
        >
          <Text style={styles.sendButtonText}>{isSending ? 'Sending...' : 'Send'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default MessageInput;
