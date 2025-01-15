import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder, Modal,
  Linking
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useGlobalState } from '../../GlobelStats';
import { ScrollView } from 'react-native-gesture-handler';
import config from '../../Helper/Environment';
import {  rules } from '../utils';
import { parseMessageText } from '../ChatHelper';

const AdminHeader = ({
  pinnedMessages = [], // Array of pinned messages
  onClearPin,         // Function to clear all pinned messages
  onUnpinMessage,     // Function to unpin a single message
  isAdmin,
  isOwner,
  selectedTheme,
  onlineMembersCount,
  modalVisibleChatinfo, 
  setModalVisibleChatinfo

}) => {
  const [expanded, setExpanded] = useState(false);
  const [randomBase, setRandomBase] = useState(0); // Random base for online count
  const animatedHeight = useRef(new Animated.Value(60)).current;
  const [contentHeight, setContentHeight] = useState(0);
  const { theme } = useGlobalState();
  const isDarkMode = theme === 'dark';


  useEffect(() => {
    const base = Math.floor(Math.random() * 6) + 5; // Random value between 5 and 10
    setRandomBase(base);
  }, []);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) =>
      Math.abs(gestureState.dy) > 10,
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > 50) {
        expand();
      } else if (gestureState.dy < -50) {
        collapse();
      }
    },
  });

  const expand = () => {
    Animated.timing(animatedHeight, {
      toValue: contentHeight + 100, // Base height + content height
      duration: 200,
      useNativeDriver: false,
    }).start(() => setExpanded(true));
  };

  const collapse = () => {
    Animated.timing(animatedHeight, {
      toValue: 60, // Collapsed base height
      duration: 200,
      useNativeDriver: false,
    }).start(() => setExpanded(false));
  };

  const onContentLayout = useCallback(
    (event) => {
      const { height } = event.nativeEvent.layout;
      setContentHeight(height);
    },
    [setContentHeight]
  );
  const styles = getStyles(isDarkMode)
  return (
    <Animated.View
      style={[
        styles.headerContainer,
        {
          backgroundColor: selectedTheme.colors.background,
          height: animatedHeight,
          borderColor: isDarkMode ? '#333333' : '#cccccc',
        },
      ]}
      {...panResponder.panHandlers}
    ><TouchableOpacity
    style={styles.button}
    onPress={() => setModalVisibleChatinfo(true)}
  >
</TouchableOpacity>
      <View style={styles.topRow}>
        <Text style={[styles.onlineText, { color: config.colors.hasBlockGreen }]}>Online {onlineMembersCount + randomBase}</Text>
      </View>

      {pinnedMessages.length > 0 ? (
        <View style={styles.pinnedContainer} onLayout={onContentLayout}>
          {pinnedMessages.map((message, index) => (
            <View key={message.id} style={styles.singlePinnedMessage}>
              <Text
                style={[
                  styles.pinnedText,
                  { color: selectedTheme.colors.text },
                ]}
                numberOfLines={!expanded && index === 0 ? 1 : 0} // Truncate only the first message when collapsed
                ellipsizeMode="tail"
              >
                📌 {parseMessageText(message.text)}
              </Text>
              {isAdmin || isOwner && (
                <TouchableOpacity
                  onPress={() => onUnpinMessage(message.firebaseKey)}
                  style={styles.clearIcon}
                >
                  <Icon
                    name="close-circle"
                    size={24}
                    color={config.colors.hasBlockGreen}
                  />
                </TouchableOpacity>
              )}
              <View style={{height:10}}></View>
            </View>
          ))}
          {isAdmin && (
            <TouchableOpacity onPress={onClearPin} style={styles.clearAllButton}>
              <Text style={styles.clearAllText}>Clear All Pinned</Text>
            </TouchableOpacity>
          )}
          
        </View>
      ) : (
        <View style={styles.noPinnedContainer}>
          <Text
            style={[
              styles.noPinnedText,
              { color: selectedTheme.colors.text },
            ]}
          >
            {isAdmin
              ? 'No pinned messages. Pin an important message to highlight.'
              : 'No pinned messages.'}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.arrowButton}
        onPress={expanded ? collapse : expand}
      >
        <Icon
          name={expanded ? 'chevron-up' : 'reorder-two-outline'}
          size={24}
          color={config.colors.hasBlockGreen}
        />
      </TouchableOpacity>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisibleChatinfo}
        onRequestClose={() => setModalVisibleChatinfo(false)}
      >
        <ScrollView>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chat Rules</Text>

            
            {
  rules.map((rule, index) => {
    if (rule.includes("Terms of Service and Privacy Policy")) {
      const beforeText = rule.split("Terms of Service and Privacy Policy")[0];
      return (
        <Text key={index} style={styles.ruleText}>
          {index + 1}. {beforeText}
          <Text
            style={{ color: config.colors.hasBlockGreen, textDecorationLine: 'underline' }}
            onPress={() => Linking.openURL("https://bloxfruitscalc.com/privacy-policy/")}
          >
            Terms of Service and Privacy Policy
          </Text>
        </Text>
      );
    }

    return (
      <Text key={index} style={styles.ruleText}>
        {index + 1}. {rule} {'\n'}
      </Text>
    );
  })
}

           

            {/* Close button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisibleChatinfo(false)}
            >
              <Text style={styles.closeButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
        </ScrollView>
      </Modal>
    </Animated.View>
  );
};

export  const getStyles = (isDarkMode) =>
StyleSheet.create({
  headerContainer: {
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderTopWidth: 1,
    marginBottom: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  onlineText: {
    fontSize: 10,
    fontFamily: 'Lato-Regular',
  },
  pinnedContainer: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  singlePinnedMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
    lineHeight:24
  },
  pinnedText: {
    fontSize: 14,
    paddingRight: 20,
    lineHeight:24,
    fontFamily: 'Lato-Regular',
    flex: 1,
    marginBottom: 10,

  },
  noPinnedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  noPinnedText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  clearIcon: {
    marginLeft: 10,
  },
  clearAllButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: config.colors.hasBlockGreen,
  },
  arrowButton: {
    alignSelf: 'center',
    position: 'absolute',
    bottom: -5,
  },
  icon:{
    alignSelf: 'left',
    position: 'absolute',
    marginLeft:5
    // bottom: -5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    margin:0,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '95%',
    backgroundColor: isDarkMode ? '#121212' : '#f2f2f7',
    borderRadius: 10,
    margin:10,
    padding: 20,
    // alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily:'Lato-Bold',
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: config.colors.hasBlockGreen,
    padding: 10,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
    marginTop:20
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily:'Lato-Bold',
  },
  ruleText:{
    fontFamily:'Lato-Regular',
    color: isDarkMode ? 'white' : 'black',
    lineHeight:24,
  }
  
});

export default AdminHeader;
