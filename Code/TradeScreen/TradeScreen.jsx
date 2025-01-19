import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TradeScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Trade Screen</Text>
      <Text style={styles.text}>This is a placeholder for the Trade Screen.</Text>
      <Text style={styles.text}>You can display asset details, input fields for trading, and action buttons here.</Text>
      <Text style={styles.text}>Customize this screen as needed.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default TradeScreen;
