import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { getStyles } from './Style';

const MessageInput = ({ input, setInput, handleSendMessage, selectedTheme }) => {
  const styles = getStyles(selectedTheme.colors.text === 'white');
  const [isSending, setIsSending] = useState(false); // To prevent multiple sends

  const handleSend = async () => {
    if (!input.trim() || isSending) return; // Prevent sending empty messages or multiple sends
    setIsSending(true);

    try {
      await handleSendMessage(); // Assuming `handleSendMessage` handles the message sending
      setInput(''); // Clear input after sending
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false); // Reset sending state
    }
  };

  return (
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
          { backgroundColor: input.trim() && !isSending ? '#1E88E5' : '#ccc' },
        ]}
        onPress={handleSend}
        disabled={!input.trim() || isSending}
      >
        <Text style={styles.sendButtonText}>{isSending ? 'Sending...' : 'Send'}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default MessageInput;
