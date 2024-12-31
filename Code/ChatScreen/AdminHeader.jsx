import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  PanResponder,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import config from '../Helper/Environment';

const AdminHeader = ({
  pinnedMessage,
  onClearPin,
  isAdmin,
  selectedTheme,
  onlineMembersCount,
}) => {
  const [expanded, setExpanded] = useState(false);
  const animatedHeight = new Animated.Value(80);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 10 || gestureState.dy < -10,
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
      toValue: 250,
      duration: 300,
      useNativeDriver: false,
    }).start(() => setExpanded(true));
  };

  const collapse = () => {
    Animated.timing(animatedHeight, {
      toValue: 80,
      duration: 300,
      useNativeDriver: false,
    }).start(() => setExpanded(false));
  };

  return (
    <Animated.View
      style={[
        styles.headerContainer,
        { backgroundColor: selectedTheme.colors.background, height: animatedHeight },
      ]}
      {...panResponder.panHandlers}
    >
      <View style={styles.topRow}>
        <Text style={[styles.onlineText, { color: config.colors.hasBlockGreen }]}>
          Online {onlineMembersCount}
        </Text>
      </View>

      {pinnedMessage ? (
        <View style={styles.pinnedContainer}>
          <ScrollView
            style={styles.scrollableText}
            showsVerticalScrollIndicator={true}
          >
            <Text style={[styles.pinnedText, { color: selectedTheme.colors.text }]}>
              📌 {pinnedMessage.text}
            </Text>
          </ScrollView>
          {isAdmin && (
            <TouchableOpacity onPress={onClearPin} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.noPinnedContainer}>
          <Text style={[styles.noPinnedText, { color: selectedTheme.colors.text }]}>
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
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
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
    borderBottomColor: '#ddd',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  onlineText: {
    fontSize: 14,
    fontFamily: 'Lato-Regular',
  },
  pinnedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom:20
  },
  scrollableText: {
    flex: 1,
    maxHeight: 80,
    marginRight: 10,
    padding: 5,
  },
  pinnedText: {
    fontSize: 14,
    fontFamily: 'Lato-Bold',
  },
  noPinnedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  noPinnedText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  clearButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#e74c3c',
    borderRadius: 5,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  arrowButton: {
    alignSelf: 'center',
    marginTop: 10,
    position:'absolute',
    bottom:1
  },
});

export default AdminHeader;
