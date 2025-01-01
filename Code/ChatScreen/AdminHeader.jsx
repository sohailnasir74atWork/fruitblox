import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import config from '../Helper/Environment';
import { useGlobalState } from '../GlobelStats';

const AdminHeader = ({
  pinnedMessages = [], // Array of pinned messages
  onClearPin,         // Function to clear all pinned messages
  onUnpinMessage,     // Function to unpin a single message
  isAdmin,
  selectedTheme,
  onlineMembersCount,
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
      toValue: contentHeight + 60, // Base height + content height
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
    >
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
                📌 {message.text}
              </Text>
              {isAdmin && (
                <TouchableOpacity
                  onPress={() => onUnpinMessage(message.id)}
                  style={styles.clearIcon}
                >
                  <Icon
                    name="close-circle"
                    size={24}
                    color={config.colors.hasBlockGreen}
                  />
                </TouchableOpacity>
              )}
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
    </Animated.View>
  );
};

const styles = StyleSheet.create({
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
});

export default AdminHeader;
