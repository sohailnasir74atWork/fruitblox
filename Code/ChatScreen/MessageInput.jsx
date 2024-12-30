import React from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { getStyles } from './Style';

const MessageInput = ({ input, setInput, handleSendMessage, selectedTheme }) => {
  const styles = getStyles(selectedTheme.colors.text === 'white');

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
          { backgroundColor: input.trim() ? '#1E88E5' : '#ccc' },
        ]}
        onPress={handleSendMessage}
        disabled={!input.trim()}
      >
        <Text style={styles.sendButtonText}>Send</Text>
      </TouchableOpacity>
    </View>
  );
};

export default MessageInput;
