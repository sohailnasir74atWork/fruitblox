import { getDatabase, ref, update, get, query, orderByChild, remove, set, orderByKey } from 'firebase/database';
import { Alert, Linking, Text } from 'react-native';

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
    const database = getDatabase(); // Ensure database instance is created
    const userToUpdateRef = ref(database, `users/${userId}`); // Reference to the specific user in the "users" node
    await update(userToUpdateRef, { isBlock: true }); // Update the user's `isBlock` property
    Alert.alert('Success', 'User has been banned.');
  } catch (error) {
    console.error('Error banning user:', error);
    Alert.alert('Error', 'Failed to ban the user.');
  }
};

// Unban User
export const unbanUser = async (userId) => {
  try {
    const database = getDatabase(); // Ensure the database instance is initialized
    const userToUpdateRef = ref(database, `users/${userId}`); // Reference to the specific user in the "users" node

    // Update the user's `isBlock` property to `false`
    await update(userToUpdateRef, { isBlock: false });

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




export const banUserInChat = async (currentUserId, selectedUser) => {

  Alert.alert(
    'Block User',
    `Are you sure you want to block ${selectedUser.sender || 'this user'}? You will no longer receive messages from them.`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block',
        style: 'destructive',
        onPress: async () => {
          try {
            const database = getDatabase();
            const bannedRef = ref(database, `bannedUsers/${currentUserId}/${selectedUser.senderId}`);

            // Save the banned user's details in the database
            await set(bannedRef, {
              displayName: selectedUser.sender || 'Anonymous',
              avatar: selectedUser.avatar || 'https://bloxfruitscalc.com/wp-content/uploads/2025/display-pic.png',
            });

            Alert.alert('Success', `You have successfully blocked ${selectedUser.sender || 'this user'}.`);
          } catch (error) {
            console.error('Error blocking user:', error);
            Alert.alert('Error', 'Could not block the user. Please try again.');
          }
        },
      },
    ]
  );
};
export const unbanUserInChat = async (currentUserId, selectedUserId) => {
  Alert.alert(
    'Unblock User',
    'Are you sure you want to unblock this user? You will start receiving messages from them again.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unblock',
        style: 'destructive',
        onPress: async () => {
          try {
            const database = getDatabase();
            const bannedRef = ref(database, `bannedUsers/${currentUserId}/${selectedUserId}`);

            // Remove the banned user's data from the database
            await remove(bannedRef);

            Alert.alert('Success', 'You have successfully unblocked this user.');
          } catch (error) {
            console.error('Error unblocking user:', error);
            Alert.alert('Error', 'Could not unblock the user. Please try again.');
          }
        },
      },
    ]
  );
};


// const deleteLast100Messages = async () => {
//   try {
//     const database = getDatabase(); // Initialize Firebase Realtime Database
//     const chatsRef = ref(database, 'chat'); // Reference to the 'chat' node
//     const last100MessagesQuery = query(chatsRef, orderByKey(), limitToLast(10));

//     // Fetch the last 100 messages
//     const snapshot = await get(last100MessagesQuery);
//     const messages = snapshot.val();

//     if (!messages) {
//       console.log('No messages to delete.');
//       return;
//     }

//     // Delete each message
//     const deletePromises = Object.keys(messages).map((messageKey) =>
//       remove(ref(database, `chat/${messageKey}`))
//     );

//     await Promise.all(deletePromises);

//     console.log('Last 100 messages deleted successfully.');
//   } catch (error) {
//     console.error('Error deleting messages:', error);
//   }
// };
// useEffect(()=>{deleteLast100Messages()}, [])


export const deleteOldest500Messages = async () => {
  try {
    const database = getDatabase(); // Initialize Firebase Realtime Database
    const chatsRef = ref(database, 'chat'); // Reference to the 'chat' node

    // Fetch all messages
    const snapshot = await get(query(chatsRef, orderByKey()));
    const messages = snapshot.val();

    if (!messages) {
      console.log('No messages to delete.');
      return;
    }

    // Convert the messages to an array and sort by keys (oldest to newest)
    const messageKeys = Object.keys(messages);
    const oldestMessageKeys = messageKeys.slice(0, 500); // Get the first 500 keys

    if (oldestMessageKeys.length === 0) {
      console.log('No messages to delete.');
      return;
    }

    // Delete the oldest 500 messages
    const deletePromises = oldestMessageKeys.map((messageKey) =>
      remove(ref(database, `chat/${messageKey}`))
    );

    await Promise.all(deletePromises);

    console.log('Oldest 500 messages deleted successfully.');
  } catch (error) {
    console.error('Error deleting messages:', error);
  }
};




export const renderClickableText = (text) => {
  // Regular expression for detecting links
  const linkRegex = /(https?:\/\/[^\s]+)/g;

  // Split the text into parts based on the link regex
  const parts = text.split(linkRegex);

  // Render the text with clickable links
  return parts.map((part, index) => {
    if (linkRegex.test(part)) {
      // Render clickable link
      return (
        <Text
          key={index}
          style={{ color: 'blue', textDecorationLine: 'underline' }}
          onPress={() => Linking.openURL(part)}
        >
          {part}
        </Text>
      );
    } else {
      // Render plain text
      return (
        <Text key={index} style={{ color: 'black' }}>
          {part}
        </Text>
      );
    }
  });
};
