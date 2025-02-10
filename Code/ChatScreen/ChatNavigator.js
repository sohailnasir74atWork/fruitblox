import React, { useEffect, useMemo, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ChatScreen from './GroupChat/Trader';
import PrivateChatScreen from './PrivateChat/PrivateChat';
import InboxScreen from './GroupChat/InboxScreen';
import { getDatabase, onValue, ref } from '@react-native-firebase/database';
import { useGlobalState } from '../GlobelStats';
import PrivateChatHeader from './PrivateChat/PrivateChatHeader';
import BlockedUsersScreen from './PrivateChat/BlockUserList';
import { useHaptic } from '../Helper/HepticFeedBack';

const Stack = createNativeStackNavigator();

export const ChatStack = ({ selectedTheme, setChatFocused, modalVisibleChatinfo, setModalVisibleChatinfo }) => {
  const { user, unreadMessagesCount } = useGlobalState();
  const [bannedUsers, setBannedUsers] = useState([]);
  const { triggerHapticFeedback } = useHaptic();

  useEffect(() => {
    if (!user?.id) return;

    const bannedRef = ref(getDatabase(), `bannedUsers/${user.id}`);
    const unsubscribe = onValue(
      bannedRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setBannedUsers([]);
          return;
        }
        
        setBannedUsers(Object.entries(snapshot.val()).map(([id, details]) => ({
          id,
          displayName: details.displayName || 'Unknown',
          avatar: details.avatar || '',
        })));
      },
      (error) => console.error('Error in banned users listener:', error)
    );

    return () => {
      // console.log('Cleaning up banned users listener');
      unsubscribe();
    };
  }, [user?.id]);

  const headerOptions = useMemo(() => ({
    headerStyle: { backgroundColor: selectedTheme.colors.background },
    headerTintColor: selectedTheme.colors.text,
    headerTitleStyle: { fontFamily: 'Lato-Bold', fontSize: 24 },
  }), [selectedTheme]);

  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen name="GroupChat" options={{ headerTitleAlign: 'left', headerTitle: 'Community Chat', headerShown: false }}>
        {() => (
          <ChatScreen
            {...{ selectedTheme, setChatFocused, modalVisibleChatinfo, setModalVisibleChatinfo, bannedUsers, setBannedUsers, triggerHapticFeedback, unreadMessagesCount }}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="Inbox" component={InboxScreen} options={{ title: 'Inbox' }} initialParams={{ bannedUsers }} />
      <Stack.Screen name="BlockedUsers" component={BlockedUsersScreen} initialParams={{ bannedUsers }} options={{ title: 'Blocked Users' }} />
      <Stack.Screen name="PrivateChat" component={PrivateChatScreen} initialParams={{ bannedUsers }} options={({ route }) => ({
        headerTitle: () => (
          <PrivateChatHeader
            {...route.params}
            selectedTheme={selectedTheme}
            bannedUsers={bannedUsers}
            setBannedUsers={setBannedUsers}
            triggerHapticFeedback={triggerHapticFeedback}
          />
        ),
      })} />
    </Stack.Navigator>
  );
};
