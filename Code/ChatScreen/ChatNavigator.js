import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ChatScreen from './Trader';
import PrivateChatScreen from './PrivateChat';
import InboxScreen from './InboxScreen';
import config from '../Helper/Environment';
import { getDatabase, onValue, ref } from 'firebase/database';
import { useGlobalState } from '../GlobelStats';
import PrivateChatHeader from './PrivateChatHeader';

const Stack = createNativeStackNavigator();

// HeaderRight Component
const HeaderRight = ({ selectedTheme, navigateToInbox, setModalVisibleChatinfo, navigation, unreadMessagesCount }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <View style={styles.iconContainer}>
      <Icon
        name="chatbox-ellipses-outline"
        size={24}
        color={selectedTheme.colors.text}
        style={styles.icon}
        onPress={() => navigateToInbox(navigation)}
      />
      {unreadMessagesCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}</Text>
        </View>
      )}
    </View>
    <Icon
      name="information-circle-outline"
      size={24}
      color={selectedTheme.colors.text}
      style={styles.icon}
      onPress={() => setModalVisibleChatinfo(true)}
    />
  </View>
);

// ChatStack Component
export const ChatStack = ({ selectedTheme, setChatFocused, modalVisibleChatinfo, setModalVisibleChatinfo }) => {
  const { user, unreadMessagesCount } = useGlobalState();
  const [bannedUsers, setBannedUsers] = useState([]);

  console.log(unreadMessagesCount)


  // Fetch and Sync Banned Users in Real-Time
  useEffect(() => {
    if (!user?.id) return;

    const database = getDatabase();
    const bannedRef = ref(database, `bannedUsers/${user.id}`);
    const unsubscribe = onValue(bannedRef, (snapshot) => {
      const data = snapshot.val() || {};
      setBannedUsers(Object.keys(data));
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, [user?.id]);

  // Memoized Header Options
  const headerOptions = useMemo(
    () => ({
      headerStyle: { backgroundColor: selectedTheme.colors.background },
      headerTintColor: selectedTheme.colors.text,
      headerTitleStyle: { fontFamily: 'Lato-Bold', fontSize: 24 },
    }),
    [selectedTheme]
  );

  return (
    <Stack.Navigator screenOptions={headerOptions}>
      {/* Group Chat Screen */}
      <Stack.Screen
        name="GroupChat"
        options={({ navigation }) => ({
          headerTitleAlign: 'left',
          headerTitle: 'Chat',
          headerRight: () => (
            <HeaderRight
              selectedTheme={selectedTheme}
              navigateToInbox={(nav) => nav.navigate('Inbox')}
              setModalVisibleChatinfo={setModalVisibleChatinfo}
              navigation={navigation}
              unreadMessagesCount={unreadMessagesCount}
            />
          ),
        })}
      >
        {() => (
          <ChatScreen
            selectedTheme={selectedTheme}
            setChatFocused={setChatFocused}
            modalVisibleChatinfo={modalVisibleChatinfo}
            setModalVisibleChatinfo={setModalVisibleChatinfo}
            bannedUsers={bannedUsers}
          />
        )}
      </Stack.Screen>

      {/* Inbox Screen */}
      <Stack.Screen
        name="Inbox"
        component={InboxScreen}
        options={{ title: 'Inbox' }}
        initialParams={{ bannedUsers }}
      />

      {/* Private Chat Screen */}
      <Stack.Screen
        name="PrivateChat"
        component={PrivateChatScreen}
        options={({ route }) => {
          const { selectedUser, isOnline } = route.params;
          return {
            headerTitle: () => (
              <PrivateChatHeader
                selectedUser={selectedUser}
                isOnline={isOnline}
                selectedTheme={selectedTheme}
                bannedUsers={bannedUsers}
              />
            ),
          };
        }}
      />
    </Stack.Navigator>
  );
};


const styles = StyleSheet.create({
  icon: {
    marginRight: 15,
  },
  icon2: {
    marginRight: 15,
    marginTop:3
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  userStatus: {
    fontSize: 12,
    fontWeight: 'normal',
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 15,
  },
  badge: {
    position: 'absolute',
    top: -4,
    left: -10,
    backgroundColor: 'red',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
