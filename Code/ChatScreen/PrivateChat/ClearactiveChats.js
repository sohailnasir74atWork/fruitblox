import { useEffect } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { BackHandler } from 'react-native';
import { getDatabase, ref, remove } from 'firebase/database';

const clearActiveChat = async (userId) => {
  const database = getDatabase();
  const activeChatRef = ref(database, `/activeChats/${userId}`);
  try {
    await remove(activeChatRef);
    // console.log(`Active chat cleared for user ${userId}`);
  } catch (error) {
    console.error(`Failed to clear active chat for user ${userId}:`, error);
  }
};

export const useActiveChatHandler = (userId, chatId) => {
  const navigation = useNavigation();

  useFocusEffect(() => {
    const database = getDatabase();
    const activeChatRef = ref(database, `/activeChats/${userId}`);

    // Set the active chat when the screen is focused
    const setActiveChat = async () => {
      try {
        await activeChatRef.set(chatId);
        // console.log(`Active chat set for user ${userId}: ${chatId}`);
      } catch (error) {
        console.error(`Failed to set active chat for user ${userId}:`, error);
      }
    };

    setActiveChat();

    // Handle back press to clear active chat
    const onBackPress = () => {
      clearActiveChat(userId);
      navigation.goBack(); // Navigate back to the previous screen
      return true; // Prevent default back press behavior
    };

    // Add event listener for back press
    BackHandler.addEventListener('hardwareBackPress', onBackPress);

    // Cleanup when navigating away or unmounting the component
    return () => {
      clearActiveChat(userId);
      BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    };
  });
};
