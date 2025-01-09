import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons'; // Import Icon
import { getStyles } from './Style';
import config from '../Helper/Environment';
import { useGlobalState } from '../GlobelStats';

const PrivateMessageInput = ({ onSend, replyTo, onCancelReply, isBanned }) => {
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { theme } = useGlobalState();
  const isDark = theme === 'dark';
  console.log(isBanned)

  const styles = getStyles(isDark);

  const handleSend = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isSending) return; // Prevent empty messages or multiple sends
    setIsSending(true);

    try {
      await onSend(trimmedInput, replyTo); // Pass the input and reply context to onSend
      setInput(''); // Clear input
      onCancelReply?.(); // Clear reply context if available
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false); // Reset sending state
    }
  };

  return (
    <View style={styles.inputWrapper}>
      {/* Reply Context */}
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
          style={[styles.input, { color: isDark ? '#FFF' : '#000' }]}
          placeholder="Type a message..."
          placeholderTextColor="#888"
          value={input}
          onChangeText={setInput}
          multiline
          editable={!isBanned}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            {
              backgroundColor: input.trim() && !isSending
                ? '#1E88E5'
                : config.colors.primary,
            },
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

export default PrivateMessageInput;
