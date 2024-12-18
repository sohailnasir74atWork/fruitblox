import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Switch, TouchableOpacity } from 'react-native';
import notifee, { TriggerType } from '@notifee/react-native';
import { useGlobalState } from './GlobelStats';
import Icon from 'react-native-vector-icons/Ionicons';
import FruitSelectionDrawer from './FruitSelectionDrawer';

const TimerScreen = ({ selectedTheme }) => {
  const [normalTimer, setNormalTimer] = useState('');
  const [mirageTimer, setMirageTimer] = useState('');
  const { normalStock, mirageStock, selectedFruits, setSelectedFruits, isReminderEnabled, setIsReminderEnabled, isSelectedReminderEnabled, setIsSelectedReminderEnabled } = useGlobalState();
 

  const [fruitRecords, setFruitRecords] = useState([]);

  const { data } = useGlobalState();
  const [isDrawerVisible, setDrawerVisible] = useState(false);
  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      setFruitRecords(Object.values(data));
    } else {
      setFruitRecords([]);
    }
  }, [data]);

  const openDrawer = () => setDrawerVisible(true);
  const closeDrawer = () => setDrawerVisible(false);
  const handleFruitSelect = (fruit) => {
    setSelectedFruits((prev) => {
      const isAlreadySelected = prev.some((item) => item.Name === fruit.Name);
      if (isAlreadySelected) return prev; // Return the previous state if the fruit already exists
      return [...prev, fruit]; // Add the fruit only if it's not already in the list
    });
    closeDrawer();
  };
  const handleRemoveFruit = (fruit) => {
    setSelectedFruits((prev) => prev.filter((item) => item.Name !== fruit.Name));
  };

  const toggleSwitch = () => setIsReminderEnabled((prev) => !prev);
  const toggleSwitch2 = () => setIsSelectedReminderEnabled((prev) => !prev);


  // Format time utility
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  const formatTimeComponents = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  };
  // Calculate time left for stock resets
  const calculateTimeLeft = (intervalHours) => {
    console.log(intervalHours)
    const now = new Date();
    let nextReset = new Date();
    nextReset.setHours(1, 0, 0, 0); // Base reset at 1 AM

    while (nextReset <= now) {
      nextReset.setHours(nextReset.getHours() + intervalHours);
    }
    const secondsLeft = Math.floor((nextReset - now) / 1000);
    console.log(`Time left for ${intervalHours}-hour reset: ${formatTimeComponents(secondsLeft)}`);
    return secondsLeft;
  };

  // Schedule notifications dynamically
  // Inside your TimerScreen component...

// Schedule notifications for stock resets and selected fruits
const scheduleStockAndFruitNotifications = async () => {
  try {
    await notifee.requestPermission();
    await notifee.createChannel({
      id: 'stock-updates',
      name: 'Stock Updates',
    });

    const normalResetSeconds = calculateTimeLeft(2); // 2-hour reset
    const mirageResetSeconds = calculateTimeLeft(4); // 4-hour reset

    // Notify for stock resets
    if (isReminderEnabled) {
      // Normal Stock Notification
      await notifee.createTriggerNotification(
        {
          title: 'Normal Stock Updated',
          body: 'The Normal stock has been refreshed!',
          android: { channelId: 'stock-updates' },
        },
        {
          type: TriggerType.TIMESTAMP,
          timestamp: Date.now() + normalResetSeconds * 1000,
        }
      );

      // Mirage Stock Notification
      await notifee.createTriggerNotification(
        {
          title: 'Mirage Stock Updated',
          body: 'Both Normal and Mirage stocks have been refreshed!',
          android: { channelId: 'stock-updates',
            smallIcon: 'ic_launcher',
            color:'#cc9966',
            pressAction: { id: 'default' }
           },
        },
        {
          type: TriggerType.TIMESTAMP,
          timestamp: Date.now() + mirageResetSeconds * 1000,
        }
      );
    }

    // Notify for selected fruits
    if (isSelectedReminderEnabled) {
      const handleSelectedFruitsCheck = async () => {
        const currentStock = [...normalStock, ...mirageStock];
        selectedFruits.forEach((fruit) => {
          const isFruitInStock = currentStock.some((stockItem) => stockItem.Name === fruit.Name);
          if (isFruitInStock) {
            notifee.displayNotification({
              title: 'Greate Your Fruit is Available in Stock!',
              body: `${fruit.Name} is now in stock!`,
              android: { channelId: 'stock-updates',
                smallIcon: 'ic_launcher',
                color:'#cc9966',
                pressAction: { id: 'default' },
               },
            });
          }
        });
      };

      // Trigger selected fruit check at stock reset intervals
      setTimeout(handleSelectedFruitsCheck, normalResetSeconds * 1000);
      setTimeout(handleSelectedFruitsCheck, mirageResetSeconds * 1000);
    }

    console.log('Notifications scheduled successfully');
  } catch (error) {
    console.error('Failed to schedule notifications:', error);
  }
};

// Update timers and schedule notifications
useEffect(() => {
  const updateTimers = () => {
    const normalSecondsLeft = calculateTimeLeft(2);
    const mirageSecondsLeft = calculateTimeLeft(4);

    setNormalTimer(formatTime(normalSecondsLeft));
    setMirageTimer(formatTime(mirageSecondsLeft));
  };

  updateTimers(); // Initial update
  scheduleStockAndFruitNotifications(); // Schedule notifications dynamically

  const timerId = setInterval(updateTimers, 1000); // Update every second
  return () => clearInterval(timerId);
}, [isReminderEnabled, isSelectedReminderEnabled, selectedFruits, normalStock, mirageStock]);


  // Memoized List Data
  const listData = useMemo(() => {
    return [
      { id: 'header-normal', header: 'Normal', timer: normalTimer },
      ...normalStock.map((item, index) => ({ ...item, id: `normal-${index}` })),
      { id: 'header-mirage', header: 'Mirage', timer: mirageTimer },
      ...mirageStock.map((item, index) => ({ ...item, id: `mirage-${index}` })),
    ];
  }, [normalStock, mirageStock, normalTimer, mirageTimer]);

  // Render FlatList Item
  const renderItem = ({ item }) => {
    if (item.header) {
      return (
        <View style={styles.headerContainer}>
          <Text style={[styles.title, { color: selectedTheme.colors.text }]}>{item.header}</Text>
          <Text style={[styles.timer, { color: selectedTheme.colors.text }]}>
            Reset in: <Text style={styles.time}>{item.timer}</Text>
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.itemContainer}>
        <Image
          source={{
            uri: `https://bloxfruitscalc.com/wp-content/uploads/2024/09/${item.Normal.replace(/^\+/, '').replace(/\s+/g, '-')}_Icon.webp`,
          }}
          style={styles.icon}
        />
        <Text style={styles.name}>{item.Normal}</Text>
        <Text style={styles.price}>{item.price}</Text>
        <Text style={styles.robux}>{item.value}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.description, { color: selectedTheme.colors.text }]}>
        Stay updated on the latest fruits stock
      </Text>
      <View>
        {/* First Item */}
        <View style={styles.row}>
          <Text style={styles.title}>Stock Reset Reminder</Text>
          <View style={styles.rightSide}>
            <Switch
              value={isReminderEnabled}
              onValueChange={toggleSwitch}
            />
            <Icon name="notifications-outline" size={24} color={isReminderEnabled ? '#A8B9AE' : "white"} style={styles.iconNew} />
          </View>
        </View>

        <View style={styles.row}>
          <Text style={styles.title}>Select Fruit (Alert)</Text>
          <View style={styles.rightSide}>
          <Switch
              value={isSelectedReminderEnabled}
              onValueChange={toggleSwitch2}
            />
            <TouchableOpacity onPress={openDrawer} style={styles.selectedContainericon} disabled={!isSelectedReminderEnabled}>
              <Icon name="add" size={24} color="white" style={styles.iconNew} />
            </TouchableOpacity>

          </View>
        </View>
        {/* Second Item (Below) */}
        <FlatList
          data={selectedFruits}
          keyExtractor={(item) => item.Name}
          renderItem={({ item }) => (
            <View style={styles.selectedContainer}>
              <Image
                source={{
                  uri: `https://bloxfruitscalc.com/wp-content/uploads/2024/09/${item.Name.replace(/^\+/, '').replace(/\s+/g, '-')}_Icon.webp`,
                }}
                style={styles.iconselected}
              />
              <Text style={styles.fruitText}>{item.Name}</Text>
              <TouchableOpacity onPress={() => handleRemoveFruit(item)}>
                <Icon name="close-circle" size={24} color="#FF3B30" style={styles.closeIcon} />
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={styles.listContentSelected}
          horizontal={true} // Add this to render the list horizontally
          scrollToOverflowEnabled
          showsHorizontalScrollIndicator={false}

        />

      </View>

      <FlatList
        data={listData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
      <FruitSelectionDrawer
        visible={isDrawerVisible}
        onClose={closeDrawer}
        onSelect={handleFruitSelect}
        data={fruitRecords}
        selectedTheme={selectedTheme}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 10 },
  description: { fontSize: 14, marginVertical: 10, fontFamily: 'Lato-Regular' },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10, },
  title: { fontSize: 20, fontFamily: 'Lato-Bold' },
  timer: { fontSize: 16 },
  time: { fontSize: 20, fontWeight: 'bold' },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4E5465',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 2,

    marginBottom: 1,
  },

  icon: { width: 50, height: 50, borderRadius: 5, marginRight: 10 },
  name: { fontSize: 16, flex: 1, color: 'white', fontFamily: 'Lato-Bold' },
  price: { fontSize: 14, backgroundColor: '#A8B9AE', padding: 5, borderRadius: 5, color: 'white' },
  robux: { fontSize: 14, backgroundColor: '#A8B9AE', padding: 5, borderRadius: 5, color: 'white', marginLeft: 10 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
    backgroundColor: '#4E5465',
    borderRadius: 5,
    padding: 10
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white'
  },
  rightSide: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconNew: {
    marginLeft: 10,
  },
  secondRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    elevation: 2,
  },
  peopleIcon: {
    marginRight: 15,
  },
  selectedContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#4E5465',
    borderRadius: 20,
    padding: 5,


    marginRight: 5, // Add spacing between items
  },
  selectedContainericon: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#4E5465',
    borderRadius: 20,
  },
  listContentSelected: {
    flexDirection: 'row',
  }
  , fruitText: {
    fontSize: 10,
    color: 'white',
    marginTop: 5, // Spacing between image and text
    textAlign: 'center',
  },
  iconselected: {
    width: 30,
    height: 30
  }

});

export default TimerScreen;
