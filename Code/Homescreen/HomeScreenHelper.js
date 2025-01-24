import React, { useState } from 'react';
import { Modal, View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { getDatabase, ref, push } from 'firebase/database';
export const submitTrade = (user, hasItems, wantsItems, hasTotal, wantsTotal, message, description, resetState) => {
    if (!user.id) {
      Alert.alert('Error', 'You must be logged in to create a trade.');
      return;
    }
  
    if (hasItems.filter(Boolean).length === 0 || wantsItems.filter(Boolean).length === 0) {
      Alert.alert('Error', 'Please add at least one item to both "You" and "Them" sections.');
      return;
    }
  
    const db = getDatabase();
    const tradeRef = ref(db, 'trades/');
    const newTrade = {
      userId: user.id,
      traderName: user.displayname,
      avatar: user.avatar,
      hasItems: hasItems.filter(Boolean).map((item) => ({
        name: item.Name,
      })),
      wantsItems: wantsItems.filter(Boolean).map((item) => ({
        name: item.Name,
      })),
      hasTotal: {
        price: hasTotal.price,
        value: hasTotal.value,
      },
      wantsTotal: {
        price: wantsTotal.price,
        value: wantsTotal.value,
      },
      message: message.trim(),
      description: description, // Include the optional description
      timestamp: Date.now(),
    };
  
    push(tradeRef, newTrade)
      .then(() => {
        resetState();
        Alert.alert('Success', 'Trade Created Successfully!');
      })
      .catch((error) => {
        console.error('Error creating trade:', error.message);
        Alert.alert('Error', 'Failed to create trade. Please try again.');
      });
  };
  
