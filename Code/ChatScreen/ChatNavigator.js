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
import BlockedUsersScreen from './PrivateChat/BlockUserList';
import { useHaptic } from '../Helper/HepticFeedBack';


const Stack = createNativeStackNavigator();

const HeaderRight = ({ selectedTheme, navigateToInbox, setModalVisibleChatinfo, navigation, unreadMessagesCount, triggerHapticFeedback }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <View style={styles.iconContainer}>
      <Icon
        name="chatbox-outline"
        size={24}
        color={selectedTheme.colors.text}
        style={styles.icon2}
        onPress={() => {navigateToInbox(navigation);  triggerHapticFeedback('impactLight');}}
      />
      {unreadMessagesCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}</Text>
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
  <MenuOptions
    customStyles={{
      optionsContainer: {
        marginTop: 8, // Space between menu trigger and options
        borderRadius: 8,
        width: 200, // Adjust width as needed
        padding: 5,
        margin:120,
        backgroundColor: config.colors.background || '#fff', // Adjust for theme
      },
    }}
  >
    <MenuOption onSelect={() => {setModalVisibleChatinfo((prev) => !prev); triggerHapticFeedback('impactLight');}}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10 }}>
        <Icon
          name="information-circle-outline"
          size={20}
          color={config.colors.primary}
          style={{ marginRight: 10 }}
        />
        <Text style={{ fontSize: 16, color: config.colors.text || '#000' }}>
          Chat Rules
        </Text>
      </View>
    </MenuOption>
    <View
      style={{
        height: 1,
        backgroundColor: '#ccc',
        marginHorizontal: 10,
      }}
    />
    <MenuOption onSelect={() => navigation.navigate('BlockedUsers')}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10 }}>
        <Icon
          name="ban-outline"
          size={20}
          color={config.colors.primary}
          style={{ marginRight: 10 }}
        />
        <Text style={{ fontSize: 16, color: config.colors.text || '#000' }}>
          Blocked Users
        </Text>
      </View>
    </MenuOption>
  </MenuOptions>
</Menu>

  </View>
);

export const ChatStack = ({ selectedTheme, setChatFocused, modalVisibleChatinfo, setModalVisibleChatinfo }) => {
  const { user, unreadMessagesCount } = useGlobalState();
  const [bannedUsers, setBannedUsers] = useState([]);
  const { triggerHapticFeedback } = useHaptic();

  // console.log(bannedUsers)
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
          headerShown:false,
          headerRight: () => (
           user.id ? <HeaderRight
              selectedTheme={selectedTheme}
              navigateToInbox={(nav) => nav.navigate('Inbox')}
              setModalVisibleChatinfo={setModalVisibleChatinfo}
              navigation={navigation}
              triggerHapticFeedback={triggerHapticFeedback}
              unreadMessagesCount={unreadMessagesCount}
            /> : null
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
            navigateToInbox={(nav) => nav.navigate('Inbox')}
            triggerHapticFeedback={triggerHapticFeedback}
            unreadMessagesCount={unreadMessagesCount}
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
  name="BlockedUsers"
  component={BlockedUsersScreen}
  initialParams={{ bannedUsers }}
  options={{
    title: 'Blocked Users',
  }}
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
                triggerHapticFeedback={triggerHapticFeedback}
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
  menuOptions: {
    paddingVertical: 10,
    // backgroundColor: '#fff',
    borderRadius: 10,
    position:'absolute'
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  menuText: {
    fontFamily: 'Lato-Regular',
    fontSize: 16,
    color: config.colors.text,
    marginLeft: 10, // Space between icon and text
    color:config.colors.primary
  },
  separator: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 5,
  },
});
