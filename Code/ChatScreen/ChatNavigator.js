import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ChatScreen from './GroupChat/Trader';
import PrivateChatScreen from './PrivateChat/PrivateChat';
import InboxScreen from './GroupChat/InboxScreen';
import config from '../Helper/Environment';
import { getDatabase, onValue, ref } from 'firebase/database';
import { useGlobalState } from '../GlobelStats';
import PrivateChatHeader from './PrivateChat/PrivateChatHeader';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';


const Stack = createNativeStackNavigator();

const HeaderRight = ({ selectedTheme, navigateToInbox, setModalVisibleChatinfo, navigation, unreadMessagesCount }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <View style={styles.iconContainer}>
      <Icon
        name="chatbox-outline"
        size={24}
        color={selectedTheme.colors.text}
        style={styles.icon2}
        onPress={() => navigateToInbox(navigation)}
      />
      {unreadMessagesCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}</Text>
        </View>
      )}
    </View>

    <Menu>
        <MenuTrigger>
          <Icon
            name="ellipsis-vertical-outline"
            size={24}
            color={config.colors.primary}
          />
        </MenuTrigger>
        <MenuOptions>
          <MenuOption>
            <Text style={{ color: 'red', fontSize: 16, padding: 10 }}>Delete</Text>
          </MenuOption>
        </MenuOptions>
      </Menu>
    {/* <Icon
      name="information-circle-outline"
      size={24}
      color={selectedTheme.colors.text}
      style={styles.icon}
      onPress={() => setModalVisibleChatinfo(true)}
    /> */}
  </View>
);

export const ChatStack = ({ selectedTheme, setChatFocused, modalVisibleChatinfo, setModalVisibleChatinfo }) => {
  const { user, unreadMessagesCount } = useGlobalState();
  const [bannedUsers, setBannedUsers] = useState([]);
  useEffect(() => {
    if (!user?.id) return;

    const database = getDatabase();
    const bannedRef = ref(database, `bannedUsers/${user.id}`);
    const unsubscribe = onValue(
      bannedRef,
      (snapshot) => {
        const data = snapshot.val() || {};
        const bannedUsersList = Object.entries(data).map(([id, details]) => ({
          id,
          displayName: details.displayName,
          avatar: details.avatar,
        }));
        setBannedUsers(bannedUsersList);
      },
      (error) => console.error('Error in banned users listener:', error)
    );

    return () => unsubscribe(); // Cleanup the listener on unmount
  }, [user?.id]);

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
      <Stack.Screen
        name="GroupChat"
        options={({ navigation }) => ({
          headerTitleAlign: 'left',
          headerTitle: 'Community Chat',
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
            setBannedUsers={setBannedUsers}
          />
        )}
      </Stack.Screen>

      <Stack.Screen
        name="Inbox"
        component={InboxScreen}
        options={{ title: 'Inbox' }}
        initialParams={{ bannedUsers }}
      />

      <Stack.Screen
        name="PrivateChat"
        component={PrivateChatScreen}
        initialParams={{ bannedUsers }}
        options={({ route }) => {
          const { selectedUser, isOnline } = route.params;
          return {
            headerTitle: () => (
              <PrivateChatHeader
                selectedUser={selectedUser}
                isOnline={isOnline}
                selectedTheme={selectedTheme}
                bannedUsers={bannedUsers}
                setBannedUsers={setBannedUsers}
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
    marginTop: 3,
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
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
