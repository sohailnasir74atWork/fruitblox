import React from 'react';
import {
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  StyleSheet,
  View,
  Pressable,
} from 'react-native';

const KeyboardAvoidingWrapper = ({ children, customStyles }) => {
  return (
    <KeyboardAvoidingView
      style={[styles.container]} // Merge custom styles if provided
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 110 : null}
    >
    
         {children}

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
    // justifyContent: 'center', // Center content vertically
    // Uncomment the line below for additional padding if needed
  },
});

export default KeyboardAvoidingWrapper;
