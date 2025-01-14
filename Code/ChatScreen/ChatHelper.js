import Clipboard from '@react-native-clipboard/clipboard';
import { Linking, Alert, Text } from 'react-native';

// Helper function to parse text for links and mentions
export const parseMessageText = (text) => {
  return text.split(/(\s+)/).map((part, index) => {
    // Check if part is a link
    if (/^https?:\/\/\S+$/.test(part)) {
      return (
        <Text
          key={`link-${index}`}
          style={{ color: '#1E90FF', textDecorationLine: 'underline' }}
          onPress={() =>
            Linking.openURL(part).catch(() =>
              Alert.alert('Error', 'Unable to open the link.')
            )
          }
        >
          {part}
        </Text>
      );
    }
    // Check if part is a mention (e.g., @username)
    if (/^@\w+/.test(part)) {
      return (
        <Text
          key={`mention-${index}`}
          style={{ color: '#007BFF', fontWeight: 'bold' }}
          onPress={() => {
            Clipboard.setString(part);
            Alert.alert('Copied', `${part} has been copied to clipboard.`);
          }}
        >
          {part}
        </Text>
      );
    }
    // Return normal text
    return part;
  });
};
