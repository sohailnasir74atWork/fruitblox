import React, { useCallback, useState } from 'react';
import {
  FlatList,
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  Vibration,
  Image,
  Linking,
  Alert,
  Keyboard,
} from 'react-native';
import { getStyles } from './../Style';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import ReportPopup from './../ReportPopUp';
import Icon from 'react-native-vector-icons/Ionicons'; // Import Icon
import config from '../../Helper/Environment';
import { parseMessageText } from '../ChatHelper';
import { useGlobalState } from '../../GlobelStats';


const MessagesList = ({
  messages,
  handleLoadMore,
  user,
  isDarkMode,
  onPinMessage,
  onDeleteMessage,
  onReply,
  isAdmin,
  refreshing,
  onRefresh,
  banUser,
  makeadmin,
  removeAdmin,
  unbanUser,
  isOwner,
  toggleDrawer,
  setMessages
}) => {
  const styles = getStyles(isDarkMode);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showReportPopup, setShowReportPopup] = useState(false);
  const {updateLocalStateAndDatabase} = useGlobalState()
  const handleLongPress = (item) => {
    if (!user?.id) return;
    Vibration.vibrate(20); // Vibrate for feedback
    setSelectedMessage(item);
  };

  const handleReport = (message) => {
    setSelectedMessage(message);
    setShowReportPopup(true);
  };

  const handleReportSuccess = (reportedMessageId) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.id === reportedMessageId ? { ...msg, isReportedByUser: true } : msg
      )
    );
  };

  const handleProfileClick = (item) => {
    if (user.id) { toggleDrawer(item) }
    else return

  };


  const renderMessage = useCallback(({ item, index }) => {
    const previousMessage = messages[index + 1];
    const currentDate = new Date(item.timestamp).toDateString();
    const previousDate = previousMessage
      ? new Date(previousMessage.timestamp).toDateString()
      : null;
    const shouldShowDateHeader = currentDate !== previousDate;

    return (
      <View>
        {/* Display the date header if it's a new day */}
        {shouldShowDateHeader && (
          <View>
            <Text style={styles.dateSeparator}>{currentDate}</Text>
          </View>
        )}

        {/* Render the message */}
        <View
          style={[
            item.senderId === user?.id ? styles.mymessageBubble : styles.othermessageBubble,
            item.senderId === user?.id ? styles.myMessage : styles.otherMessage, item.isReportedByUser && styles.reportedMessage,
          ]}
        >
          <View
            style={[
              styles.senderName,
            ]}
          >

            <TouchableOpacity onPress={() => handleProfileClick(item)} style={styles.profileImagecontainer}>
              <Image
                source={{
                  uri: item.avatar
                    ? item.avatar
                    : 'https://bloxfruitscalc.com/wp-content/uploads/2025/display-pic.png',
                }}
                style={styles.profileImage}
              />
            </TouchableOpacity>

          </View>

          <View style={styles.messageTextBox}>
            {/* Render reply context if present */}
            {item.replyTo && (
              <View style={styles.replyContainer}>
                <Text style={styles.replyText}>
                  Replying to: {'\n'}{item.replyTo.text || '[Deleted message]'}
                </Text>
              </View>
            )}

            {/* Render main message */}

            <Menu style={styles.menu}>
              <MenuTrigger
                onLongPress={() => handleLongPress(item)} // Set the message for context menu
                delayLongPress={300}
                customStyles={{
                  TriggerTouchableComponent: TouchableOpacity,
                }}
              >
                <Text
                  style={
                    item.senderId === user?.id
                      ? styles.myMessageText
                      : styles.otherMessageText
                  }
                >
                  <Text style={styles.userName}>{item.sender}</Text>
                  {item.isAdmin && <Text style={styles.dot}> • </Text>}
                  {item.isAdmin && <Text style={styles.admin}>Admin</Text>}
                  {'\n'}
                 {parseMessageText(item?.text)}



                </Text>
              </MenuTrigger>
              <MenuOptions customStyles={{
                optionsContainer: styles.menuoptions,
              }}>
               {user.id && <MenuOption
                  onSelect={() => onReply(item)}
                  text="Reply"
                  customStyles={{
                    optionWrapper: styles.menuOption,
                    optionText: styles.menuOptionText,
                  }}
                />}
                <MenuOption
                  onSelect={() => handleReport(item)}
                  text="Report"
                  customStyles={{
                    optionWrapper: styles.menuOption,
                    optionText: styles.menuOptionText,
                  }}
                />
              </MenuOptions>
            </Menu>

            {item.reportCount > 0 && <Icon name="alert-circle-outline" size={14} style={styles.reportIcon} color={config.colors.wantBlockRed} />}

          </View>


          {/* Admin Actions or Timestamp */}

          
            <View style={{ flex: 1, justifyContent: 'flex-end' }}>
              <Text style={styles.timestamp}>
                {new Date(item.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          
        </View>
        {(isOwner || isAdmin) && (
            <View style={styles.adminActions}>
              <TouchableOpacity
                onPress={() => onPinMessage(item)}
                style={styles.pinButton}
              >
                <Text style={styles.adminTextAction}>Pin</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onDeleteMessage(item.id)}
                style={styles.deleteButton}
              >
                <Text style={styles.adminTextAction}>delete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => banUser(item.senderId)}
                style={styles.deleteButton}
              >
                <Text style={styles.adminTextAction}>block</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => unbanUser(item.senderId)}
                style={styles.deleteButton}
              >
                <Text style={styles.adminTextAction}>unBlock</Text>
              </TouchableOpacity>
              {isOwner && <TouchableOpacity
                onPress={() => makeadmin(item.senderId)}
                style={styles.deleteButton}
              >
                <Text style={styles.adminTextAction}>admin</Text>
              </TouchableOpacity>}
              {isOwner && <TouchableOpacity
                onPress={() => removeAdmin(item.senderId)}
                style={styles.deleteButton}
              >
                <Text style={styles.adminTextAction}>r/admin</Text>
              </TouchableOpacity>}
            </View>)}
      </View>
    );
  }, [messages]);

  return (
    <>
      <FlatList
        data={messages}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={({ item, index }) => renderMessage({ item, index })}
        contentContainerStyle={styles.chatList}
        inverted
        onEndReachedThreshold={0.1}
        onEndReached={handleLoadMore}
        initialNumToRender={20} // Render the first 20 messages upfront
        maxToRenderPerBatch={10} // Render 10 items per batch for smoother performance
        windowSize={5} // Adjust the window size for rendering nearby items
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDarkMode ? '#FFF' : '#000'}
          />
        }
        onScroll={() => Keyboard.dismiss()}
        onTouchStart={() => Keyboard.dismiss()}
        keyboardShouldPersistTaps="handled" // Ensures taps o
      />
     <ReportPopup
        visible={showReportPopup}
        message={selectedMessage}
        onClose={(success) => {
          if (success) {
            handleReportSuccess(selectedMessage.id);
          }
          setSelectedMessage(null);
          setShowReportPopup(false);
        }}
      />
    </>
  );
};

export default MessagesList;
