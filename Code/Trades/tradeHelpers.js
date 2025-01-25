import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import config from '../Helper/Environment';

export const FilterMenu = ({ setFilterType, currentFilter }) => {
  return (
    <View style={styles.container}>
      <Menu>
        <MenuTrigger>
          <Icon name="ellipsis-vertical" size={24} color={styles.icon.color} />
        </MenuTrigger>
        <MenuOptions style={styles.menuOptions}>
          <MenuOption onSelect={() => setFilterType('hasItems')} style={{borderBottomWidth:1}}>
            <Text
              style={[
                styles.menuOptionText,
                currentFilter === 'hasItems' && styles.selectedText,
              ]}
            >
              Search by Has Item
            </Text>
          </MenuOption>
          <MenuOption onSelect={() => setFilterType('wantsItems')} style={{borderBottomWidth:1}}>
            <Text
              style={[
                styles.menuOptionText,
                currentFilter === 'wantsItems' && styles.selectedText,
              ]}
            >
              Search by Wants Item
            </Text>
          </MenuOption>
          <MenuOption onSelect={() => setFilterType('myTrades')}>
            <Text
              style={[
                styles.menuOptionText,
                currentFilter === 'myTrades' && styles.selectedText,
              ]}
            >
              My Trades
            </Text>
          </MenuOption>
        </MenuOptions>
      </Menu>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
    margin: 10,
  },
  icon: {
    color: 'grey',
  },
  menuOptions: {
    paddingHorizontal: 10,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 3, // For shadow on Android
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, // For shadow on iOS
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  menuOptionText: {
    fontSize: 16,
    color: 'black',
    paddingVertical: 10,
    // paddingHorizontal: 10,
    fontFamily: 'Lato-Regular',

  },
  selectedText: {
    color: config.colors.hasBlockGreen,
    fontFamily: 'Lato-Regular',
  },
});
