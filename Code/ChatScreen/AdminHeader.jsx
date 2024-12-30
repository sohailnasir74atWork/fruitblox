import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const AdminHeader = ({ pinnedMessage, onClearPin }) => {
  console.log(pinnedMessage)
  return (
    <View style={styles.headerContainer}>
      {pinnedMessage ? (
        <View style={styles.pinnedContainer}>
          <Text style={styles.pinnedText}>📌 {pinnedMessage.text}</Text>
          <TouchableOpacity onPress={onClearPin} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.noPinnedText}>No pinned messages</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  pinnedContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pinnedText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  noPinnedText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#888',
  },
  clearButton: {
    padding: 5,
    backgroundColor: '#e74c3c',
    borderRadius: 5,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
  },
});

export default AdminHeader;
