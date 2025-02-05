import { 
  getDatabase, 
  ref, 
  update, 
  get, 
  set, 
  remove, 
  onDisconnect 
} from '@react-native-firebase/database';
import { Alert } from 'react-native';

const database = getDatabase();
const usersRef = ref(database, 'users');

// Format Date Utility
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return isNaN(date) ? 'Invalid Date' : date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
};

// User Role Management Functions
const updateUserProperty = async (userId, property, value, successMessage, errorMessage) => {
  try {
    await update(ref(database, `users/${userId}`), { [property]: value });
    Alert.alert('Success', successMessage);
  } catch (error) {
    console.error(errorMessage, error);
    Alert.alert('Error', errorMessage);
  }
};

export const banUser = (userId) => updateUserProperty(userId, 'isBlock', true, 'User has been banned.', 'Failed to ban the user.');
export const unbanUser = (userId) => updateUserProperty(userId, 'isBlock', false, 'User has been unbanned.', 'Failed to unban the user.');
export const makeAdmin = (userId) => updateUserProperty(userId, 'isAdmin', true, 'User has been made an admin.', 'Failed to make the user an admin.');
export const removeAdmin = (userId) => updateUserProperty(userId, 'isAdmin', false, 'Admin privileges removed.', 'Failed to remove admin privileges.');
export const makeOwner = (userId) => updateUserProperty(userId, 'isOwner', true, 'User has been made an owner.', 'Failed to make the user an owner.');

// Community Rules
export const rules = [
  "Always communicate respectfully. Hate speech, discrimination, and harassment are strictly prohibited.",
  "Avoid sharing offensive, explicit, or inappropriate content, including text, images, or links.",
  "Do not share personal, sensitive, or confidential information such as phone numbers, addresses, or financial details.",
  "Spamming, repetitive messaging, or promoting products/services without permission is not allowed.",
  "If you encounter inappropriate behavior, use the report or block tools available in the app.",
  "Use appropriate language in the chat. Avoid abusive or overly aggressive tones.",
  "Discussions or activities promoting illegal or unethical behavior are prohibited.",
  "Users are responsible for the content they share and must adhere to community guidelines.",
  "Moderators reserve the right to monitor and take action on any violations, including warnings or bans.",
  "Content should be suitable for all approved age groups, adhering to app age requirements.",
  "Do not share links to harmful sites, malware, or malicious content.",
  "By using the chat feature, you agree to the app’s Terms of Service and Privacy Policy. https://bloxfruitscalc.com/privacy-policy/"
];

// Ban & Unban User in Chat
const confirmAction = (title, message, confirmText, confirmAction) => {
  return new Promise((resolve, reject) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmText, style: 'destructive', onPress: async () => {
        try {
          await confirmAction();
          resolve(true);
        } catch (error) {
          reject(error);
        }
      }},
    ]);
  });
};

export const banUserInChat = (currentUserId, selectedUser) =>
  confirmAction(
    'Block User',
    `Are you sure you want to block ${selectedUser.sender || 'this user'}? You will no longer receive messages from them.`,
    'Block',
    async () => {
      const bannedRef = ref(database, `bannedUsers/${currentUserId}/${selectedUser.senderId}`);
      await set(bannedRef, {
        displayName: selectedUser.sender || 'Anonymous',
        avatar: selectedUser.avatar || 'https://bloxfruitscalc.com/wp-content/uploads/2025/display-pic.png',
      });
      Alert.alert('Success', `You have successfully blocked ${selectedUser.sender || 'this user'}.`);
    }
  );

export const unbanUserInChat = (currentUserId, selectedUserId) =>
  confirmAction(
    'Unblock User',
    'Are you sure you want to unblock this user? You will start receiving messages from them again.',
    'Unblock',
    async () => {
      const bannedRef = ref(database, `bannedUsers/${currentUserId}/${selectedUserId}`);
      await remove(bannedRef);
      Alert.alert('Success', 'You have successfully unblocked this user.');
    }
  );

// Check if a user is online
export const isUserOnline = async (userId) => {
  if (!userId) return false;

  try {
    const snapshot = await get(ref(database, `onlineUsers/${userId}`));
    return snapshot.exists() ? snapshot.val()?.status === true : false;
  } catch (error) {
    console.error('Error checking user status:', error);
    return false;
  }
};

// Set & Clear Active Chat
export const setActiveChat = async (userId, chatId) => {
  const activeChatRef = ref(database, `/activeChats/${userId}`);
  const unreadRef = ref(database, `/private_chat/${chatId}/unread/${userId}`);

  try {
    await set(activeChatRef, chatId);
    await set(unreadRef, 0);

    onDisconnect(activeChatRef).remove().catch((error) =>
      console.error(`Failed to set onDisconnect handler for user ${userId}:`, error)
    );
  } catch (error) {
    console.error(`Failed to set active chat for user ${userId}:`, error);
  }
};

export const clearActiveChat = async (userId) => {
  try {
    await set(ref(database, `/activeChats/${userId}`), null);
  } catch (error) {
    console.error(`Failed to clear active chat for user ${userId}:`, error);
  }
};
