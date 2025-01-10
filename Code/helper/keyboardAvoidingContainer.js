import React from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  StyleSheet,
  View,
} from 'react-native';

const KeyboardAvoidingWrapper = ({ children, customStyles }) => {
  return (
    <KeyboardAvoidingView
      style={[styles.container, customStyles]} // Merge custom styles if provided
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.inner}>{children}</View>
        </TouchableWithoutFeedback>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  inner: {
    flex: 1,
    justifyContent: 'center', // Center content vertically
    // Uncomment the line below for additional padding if needed
    // paddingHorizontal: 20,
  },
});

export default KeyboardAvoidingWrapper;
