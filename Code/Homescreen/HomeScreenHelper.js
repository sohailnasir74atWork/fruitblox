import { getDatabase, ref, push } from 'firebase/database';
import { Alert } from 'react-native';

let lastTradeTimestamp = 0; // Global variable to track the last trade creation time

export const submitTrade = async (user, hasItems, wantsItems, hasTotal, wantsTotal, message, description, resetState) => {
  const MIN_DELAY = 30000; // 30 seconds

  if (hasItems.filter(Boolean).length === 0 || wantsItems.filter(Boolean).length === 0) {
    Alert.alert('Error', 'Please add at least one item to both "You" and "Them" sections.');
    return;
  }

  const currentTime = Date.now();

  // Check if the delay condition is met
  if (currentTime - lastTradeTimestamp < MIN_DELAY) {
    const remainingTime = Math.ceil((MIN_DELAY - (currentTime - lastTradeTimestamp)) / 1000);
    Alert.alert('Wait', `Please wait ${remainingTime} seconds before creating another trade.`);
    return;
  }

  const db = getDatabase();
  const tradeRef = ref(db, 'trades/');

  const newTrade = {
    userId: user.id,
    traderName: user.displayname || user.displayName,
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
    timestamp: currentTime,
  };

  push(tradeRef, newTrade)
    .then(() => {
      lastTradeTimestamp = currentTime; // Update the last trade creation time
      resetState();
      Alert.alert('Success', 'Trade Created Successfully!');
    })
    .catch((error) => {
      console.error('Error creating trade:', error.message);
      Alert.alert('Error', 'Failed to create trade. Please try again.');
    });
};
