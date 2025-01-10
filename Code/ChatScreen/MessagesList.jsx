import React, { useState } from 'react';
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
} from 'react-native';
import { getStyles } from './Style';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import ReportPopup from './ReportPopUp';


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
}) => {
  const styles = getStyles(isDarkMode);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showReportPopup, setShowReportPopup] = useState(false);

  const handleLongPress = (item) => {
    if(!user.id) 
    return
    Vibration.vibrate(50); // Vibrate for feedback
    setSelectedMessage(item);
  };

  const handleReport = (message) => {
    setSelectedMessage(message);
    setShowReportPopup(true);
  };

  const submitReport = (message, reason) => {
    console.log("Reported:", { message, reason });
    Alert.alert(
      "Report Submitted",
      `Thank you for reporting this message.\nReason: ${reason}`
    );
  };

  const handleProfileClick = (item) => {
    if(user.id) 
      {toggleDrawer(item)} 
    else return
    
  };


  const renderMessage = ({ item, index }) => {
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
            item.senderId === user?.id ? styles.myMessage : styles.otherMessage,
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
                  {item.text.split(/(\s+)/).map((part, index) => {
                    const isLink = /^https?:\/\/\S+$/.test(part);
                    if (isLink) {
                      return (
                        <Text
                          key={index}
                          style={styles.linkText}
                          onPress={() => Linking.openURL(part)}
                        >
                          {part}
                        </Text>
                      );
                    }
                    return part;
                  })}
                </Text>
              </MenuTrigger>
              <MenuOptions  customStyles={{
                    optionsContainer: styles.menuoptions,
                  }}>
                <MenuOption
                  onSelect={() => onReply(item)}
                  text="Reply"
                  customStyles={{
                    optionWrapper: styles.menuOption,
                    optionText: styles.menuOptionText,
                  }}
                />
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


          </View>

          {/* Admin Actions or Timestamp */}
          {(isOwner || isAdmin) ? (
            <View style={styles.adminActions}>
              <TouchableOpacity
                onPress={() => onPinMessage(item)}
                style={styles.pinButton}
              >
                <Text style={styles.pinButtonText}>Pin</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onDeleteMessage(item.id)}
                style={styles.deleteButton}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => banUser(item.senderId)}
                style={styles.deleteButton}
              >
                <Text style={styles.deleteButtonText}>Block User</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => unbanUser(item.senderId)}
                style={styles.deleteButton}
              >
                <Text style={styles.deleteButtonText}>Unban User</Text>
              </TouchableOpacity>
              {isOwner && <TouchableOpacity
                onPress={() => makeadmin(item.senderId)}
                style={styles.deleteButton}
              >
                <Text style={styles.deleteButtonText}>Make admin</Text>
              </TouchableOpacity>}
              {isOwner && <TouchableOpacity
                onPress={() => removeAdmin(item.senderId)}
                style={styles.deleteButton}
              >
                <Text style={styles.deleteButtonText}>Remove admin</Text>
              </TouchableOpacity>}
            </View>
          ) : (
            <View>
              <Text style={styles.timestamp}>
                {new Date(item.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          )}
        </View>

      </View>
    );
  };

  return (
    <>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => renderMessage({ item, index })}
        contentContainerStyle={styles.chatList}
        inverted
        onEndReachedThreshold={0.1}
        onEndReached={handleLoadMore}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDarkMode ? '#FFF' : '#000'}
          />
        }
      />
      <ReportPopup
        visible={showReportPopup}
        message={selectedMessage}
        onClose={() => setShowReportPopup(false)}
        onSubmit={submitReport}
      />
    </>
  );
};

export default MessagesList;
