import { getDatabase, ref, update, get, query, orderByChild, remove, set } from 'firebase/database';
import { Alert } from 'react-native';

// Initialize the database reference
const database = getDatabase();
const usersRef = ref(database, 'users'); // Base reference to the "users" node

// Format Date Utility
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return isNaN(date)
    ? 'Invalid Date' // Handle invalid date cases gracefully
    : date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
};

// Ban User
export const banUser = async (userId) => {
  try {
    const userToUpdateRef = ref(usersRef, userId); // Reference to the specific user
    await update(userToUpdateRef, { isBanned: true });
    Alert.alert('Success', 'User has been banned.');
  } catch (error) {
    console.error('Error banning user:', error);
    Alert.alert('Error', 'Failed to ban the user.');
  }
};

// Unban User
export const unbanUser = async (userId) => {
  try {
    const userToUpdateRef = ref(usersRef, userId); // Reference to the specific user
    await update(userToUpdateRef, { isBanned: false });
    Alert.alert('Success', 'User has been unbanned.');
  } catch (error) {
    console.error('Error unbanning user:', error);
    Alert.alert('Error', 'Failed to unban the user.');
  }
};

// Remove Admin
export const removeAdmin = async (userId) => {
  try {
    const userToUpdateRef = ref(usersRef, userId); // Reference to the specific user
    await update(userToUpdateRef, { isAdmin: false });
    Alert.alert('Success', 'Admin privileges removed from the user.');
  } catch (error) {
    console.error('Error removing admin:', error);
    Alert.alert('Error', 'Failed to remove admin privileges.');
  }
};

// Make Admin
export const makeAdmin = async (userId) => {
  try {
    const userToUpdateRef = ref(usersRef, userId); // Reference to the specific user
    await update(userToUpdateRef, { isAdmin: true });
    Alert.alert('Success', 'User has been made an admin.');
  } catch (error) {
    console.error('Error making admin:', error);
    Alert.alert('Error', 'Failed to make the user an admin.');
  }
};

// Make Owner
export const makeOwner = async (userId) => {
  try {
    const userToUpdateRef = ref(usersRef, userId); // Reference to the specific user
    await update(userToUpdateRef, { isOwner: true });
    Alert.alert('Success', 'User has been made an owner.');
  } catch (error) {
    console.error('Error making owner:', error);
    Alert.alert('Error', 'Failed to make the user an owner.');
  }
};
export const rules = [
  "Chat data older than 1 week will be automatically deleted.",
  "Be respectful and courteous to others in the chat.",
  "Do not share personal or sensitive information.",
  "Avoid spamming or sending irrelevant messages. Spammers will be banned.",
  "Follow community guidelines.",
];


export const banUserInChat = async (currentUserId, selectedUserId) => {
  const confirmBan = () => {
    try {
      const database = getDatabase();
      const bannedRef = ref(database, `bannedUsers/${currentUserId}/${selectedUserId}`);

      // Update ban status
      set(bannedRef, {
        banned: true,
        timestamp: Date.now(),
      });

      Alert.alert('Success', 'You have banned this user.');
    } catch (error) {
      console.error('Error banning user:', error);
     Alert.alert('Error', 'Could not ban the user. Please try again.');
    }
  };

  Alert.alert(
    'Ban User',
    'Are you sure you want to ban this user? You will no longer receive messages from them.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Proceed', onPress: confirmBan },
    ]
  )
};

export const unbanUserInChat = async (currentUserId, selectedUserId) => {
  const confirmUnban = () => {
    try {
      const database = getDatabase();
      const bannedRef = ref(database, `bannedUsers/${currentUserId}/${selectedUserId}`);

      // Remove ban status
      remove(bannedRef);

      Alert.alert('Success', 'You have unbanned this user.');
    } catch (error) {
      console.error('Error unbanning user:', error);
      Alert.alert('Error', 'Could not unban the user. Please try again.');
    }
  };

  Alert.alert(
    'Unban User',
    'Are you sure you want to unban this user? You will start receiving messages from them again.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Proceed', onPress: confirmUnban },
    ]
  );
};