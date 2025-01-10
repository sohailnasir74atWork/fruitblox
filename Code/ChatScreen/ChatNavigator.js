import React, { useEffect, useMemo, useState } from 'react';
import { Image, Text, View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ChatScreen from './Trader';
import PrivateChatScreen from './PrivateChat';
import InboxScreen from './InboxScreen';
import config from '../Helper/Environment';
import { banUserInChat, unbanUserInChat } from './utils';
import { useGlobalState } from '../GlobelStats';
import { getDatabase, onValue, ref } from 'firebase/database';

const Stack = createNativeStackNavigator();

const HeaderRight = ({ selectedTheme, navigateToInbox, setModalVisibleChatinfo, navigation }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <Icon
      name="chatbox-ellipses-outline"
      size={24}
      color={selectedTheme.colors.text}
      style={styles.icon2}
      onPress={() => navigateToInbox(navigation)}
    />
    <Icon
      name="information-circle-outline"
      size={24}
      color={selectedTheme.colors.text}
      style={styles.icon}
      onPress={() => setModalVisibleChatinfo(true)}
    />
  </View>
);
const PrivateChatHeader = ({ selectedUser, isOnline, selectedTheme, bannedUsers }) => {
    const avatarUri = selectedUser?.avatar || 'https://bloxfruitscalc.com/wp-content/uploads/2025/display-pic.png';
    const userName = selectedUser?.sender || 'User';
    const onlineStatusColor = isOnline ? config.colors.hasBlockGreen : config.colors.wantBlockRed;
    const { user } = useGlobalState();
  
    // Determine if the user is currently banned
    const isBanned = bannedUsers.includes(selectedUser.senderId);
  
    const handleBanToggle = async () => {
      if (isBanned) {
        await unbanUserInChat(user.id, selectedUser.senderId);
      } else {
        await banUserInChat(user.id, selectedUser.senderId);
      }
    };
  
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Image source={{ uri: avatarUri }} style={styles.avatar} />
        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={[styles.userName, { color: selectedTheme.colors.text }]}>{userName}</Text>
            <Text style={[styles.userStatus, { color: onlineStatusColor }]}>
              {isBanned ? 'Banned' : isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
          <Icon
            name="ban-outline"
            size={24}
            color={isBanned ? config.colors.wantBlockRed : config.colors.hasBlockGreen}
            style={styles.icon2}
            onPress={handleBanToggle}
          />
        </View>
      </View>
    );
  };
  

  export const ChatStack = ({ selectedTheme, setChatFocused, modalVisibleChatinfo, setModalVisibleChatinfo }) => {
    const { user } = useGlobalState();
    const [bannedUsers, setBannedUsers] = useState([]);
  
    useEffect(() => {
      if (!user?.id) return;
  
      const database = getDatabase();
      const bannedRef = ref(database, `bannedUsers/${user.id}`);
  
      const unsubscribe = onValue(bannedRef, (snapshot) => {
        const data = snapshot.val() || {};
        setBannedUsers(Object.keys(data));
      });
  
      return () => unsubscribe();
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
            headerTitle: 'Chat',
            headerRight: () => (
              <HeaderRight
                selectedTheme={selectedTheme}
                navigateToInbox={(nav) => nav.navigate('Inbox')}
                setModalVisibleChatinfo={setModalVisibleChatinfo}
                navigation={navigation}
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
  
        <Stack.Screen
          name="Inbox"
          component={InboxScreen}
          options={{ title: 'Inbox' }}
          initialParams={{ bannedUsers }}
        />
  
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
                  bannedUsers={bannedUsers} // Pass bannedUsers dynamically
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
});
