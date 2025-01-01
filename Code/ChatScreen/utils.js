import { getDatabase, ref, get, query, orderByChild, remove } from 'firebase/database';


export const generateShortDisplayName = (name) => {
  if (!name || typeof name !== 'string' || !name.trim()) return 'AN'; // Return 'AN' for invalid or undefined name
  const parts = name.trim().split(/\s+/); // Split by whitespace
  return parts.length === 1
    ? parts[0].slice(0, 2).toUpperCase() // Use first 2 letters if a single part
    : `${parts[0][0]}${parts[1][0]}`.toUpperCase(); // Use initials of first two parts
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return isNaN(date)
    ? 'Invalid Date' // Handle invalid date cases gracefully
    : date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
};

export const getColorForName = (name, userColors = {}) => {
  if (!name || typeof name !== 'string') return '#BDC3C7'; // Default color for invalid or undefined name
  if (!userColors[name]) {
    const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0); // Generate a hash
    const colors = [
      '#FF5733', '#33A1FD', '#8E44AD', '#27AE60', '#F1C40F', '#9B59B6', '#1ABC9C', '#E67E22',
      '#C0392B', '#2980B9', '#34495E', '#E74C3C', '#16A085', '#F39C12', '#BDC3C7', '#D4AC0D',
    ];
    userColors[name] = colors[hash % colors.length]; // Assign color based on hash
  }
  return userColors[name];
};




////////////////////////////
const deleteLastThreeMessages = async () => {
  try {
    const chatRef = database().ref('chat');
    const snapshot = await chatRef.orderByKey().limitToLast(3).once('value');
    
    const messages = snapshot.val();

    if (messages) {
      const keys = Object.keys(messages);
      for (const key of keys) {
        await chatRef.child(key).remove();
      }
      console.log('Last three messages deleted successfully');
    } else {
      console.log('No messages to delete');
    }
  } catch (error) {
    console.error('Error deleting the last three messages:', error);
  }
};

//////////

export const removeSpecificChatMessage = async (messageId) => {
  try {
    const db = getDatabase();
    const messageRef = ref(db, `chat/${messageId}`); // Reference to the specific chat message

    await remove(messageRef); // Remove the message
    console.log(`Message with ID ${messageId} removed successfully.`);
  } catch (error) {
    console.error(`Error removing message with ID ${messageId}:`, error);
  }
};