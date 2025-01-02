import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Switch, TouchableOpacity, Alert, Linking, useColorScheme, Platform, ActivityIndicator } from 'react-native';
import { useGlobalState } from '../GlobelStats';
import Icon from 'react-native-vector-icons/Ionicons';
import FruitSelectionDrawer from './FruitSelectionDrawer';
import SigninDrawer from '../Firebase/SigninDrawer';
import { GestureHandlerRootView, ScrollView } from 'react-native-gesture-handler';
import { AdEventType, BannerAd, BannerAdSize, InterstitialAd } from 'react-native-google-mobile-ads';
import getAdUnitId from '../Ads/ads';
import config from '../Helper/Environment';
import notifee, { AuthorizationStatus } from '@notifee/react-native';
const bannerAdUnitId = getAdUnitId('banner');
const interstitialAdUnitId = getAdUnitId('interstitial');
const interstitial = InterstitialAd.createForAdRequest(interstitialAdUnitId);

const TimerScreen = ({ selectedTheme }) => {
  const [normalTimer, setNormalTimer] = useState('');
  const [mirageTimer, setMirageTimer] = useState('');
  const { normalStock, mirageStock, selectedFruits, setSelectedFruits, isReminderEnabled, setIsReminderEnabled, isSelectedReminderEnabled, setIsSelectedReminderEnabled, user, dataloading } = useGlobalState();
  const [hasAdBeenShown, setHasAdBeenShown] = useState(false);
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const [isShowingAd, setIsShowingAd] = useState(false);
  const [fruitRecords, setFruitRecords] = useState([]);
  const { data, theme } = useGlobalState();
  const [isDrawerVisible, setDrawerVisible] = useState(false);
  const [isSigninDrawerVisible, setisSigninDrawerVisible] = useState(false);
  const isDarkMode = theme === 'dark';
  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      setFruitRecords(Object.values(data));
    } else {
      setFruitRecords([]);
    }
  }, [data]);

  const openDrawer = () => {
    if (!hasAdBeenShown) {
      showInterstitialAd(() => {
        setHasAdBeenShown(true); // Mark the ad as shown
        setDrawerVisible(true);
      });
    }
    else {
      setDrawerVisible(true);

    }

  }
  const closeDrawer = () => setDrawerVisible(false);
  const closeDrawerSignin = () => setisSigninDrawerVisible(false);

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

  // const toggleSwitch = () => setIsReminderEnabled((prev) => !prev);


  const requestPermission = async () => {
    try {
      const settings = await notifee.requestPermission();
      if (
        settings.authorizationStatus == 0
      ) {
        Alert.alert(
          'Permission Required',
          'Notification permissions are disabled. Please enable them in the app settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Go to Settings',
              onPress: () => Linking.openSettings(), // Redirect to app settings
            },
          ]
        );
        return false; // Permission not granted
      }

      if (
        settings.authorizationStatus === 1
      ) {
        // console.log('Notification permissions granted:', settings);
        return true; // Permission granted
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      Alert.alert('Error', 'An error occurred while requesting notification permissions.');
      return false;
    }
  };

  const toggleSwitch = async () => {
    try {
      // Request notification permissions
      const permissionGranted = await requestPermission();
      if (!permissionGranted) return;

      // Check user authentication
      if (user?.uid == null) {
        setisSigninDrawerVisible(true); // Show sign-in drawer
      } else {
        // Toggle the reminder state
        setIsReminderEnabled((prev) => !prev);

        // If iOS, optionally schedule a local notification as a test
        // if (Platform.OS === 'ios') {
        //   await notifee.displayNotification({
        //     title: 'Reminder Toggled',
        //     body: `Reminder has been ${!isReminderEnabled ? 'enabled' : 'disabled'}.`,
        //   });
        // }
      }
    } catch (error) {
      console.error('Error handling notification permission or sign-in:', error);
      Alert.alert('Error', 'Something went wrong while processing your request.');
    }
  };

  const toggleSwitch2 = async () => {
    try {
      // Request notification permissions
      const permissionGranted = await requestPermission();
      if (!permissionGranted) return;

      // Check user authentication
      if (user?.uid == null) {
        setisSigninDrawerVisible(true); // Show sign-in drawer
      } else {
        // Toggle the selected reminder state
        setIsSelectedReminderEnabled((prev) => !prev);

        // If iOS, optionally schedule a local notification as a test
        // if (Platform.OS === 'ios') {
        //   await notifee.displayNotification({
        //     title: 'Selected Reminder Toggled',
        //     body: `Selected Reminder has been ${!isSelectedReminderEnabled ? 'enabled' : 'disabled'}.`,
        //   });
        // }
      }
    } catch (error) {
      console.error('Error handling notification permission or sign-in:', error);
      Alert.alert('Error', 'Something went wrong while processing your request.');
    }
  };



  // Format time utility
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate time left for stock resets
  const calculateTimeLeft = (intervalHours) => {
    // console.log(intervalHours)
    const now = new Date();
    let nextReset = new Date();
    nextReset.setHours(1, 0, 0, 0); // Base reset at 1 AM

    while (nextReset <= now) {
      nextReset.setHours(nextReset.getHours() + intervalHours);
    }
    const secondsLeft = Math.floor((nextReset - now) / 1000);
    return secondsLeft;
  };


  useEffect(() => {
    const updateTimers = () => {
      const normalSecondsLeft = calculateTimeLeft(4);
      const mirageSecondsLeft = calculateTimeLeft(2);

      setNormalTimer(formatTime(normalSecondsLeft));
      setMirageTimer(formatTime(mirageSecondsLeft));
    };

    updateTimers();

    const timerId = setInterval(updateTimers, 1000);
    return () => clearInterval(timerId);
  }, [isReminderEnabled, isSelectedReminderEnabled, selectedFruits, normalStock, mirageStock]);


  // Memoized List Data
  const listData = useMemo(() => {
    return [
      { id: 'header-normal', header: 'Normal', timer: normalTimer },
      ...normalStock?.map((item, index) => ({ ...item, id: `normal-${index}` })),
      { id: 'header-mirage', header: 'Mirage', timer: mirageTimer },
      ...mirageStock?.map((item, index) => ({ ...item, id: `mirage-${index}` })),
    ];
  }, [normalStock, mirageStock, normalTimer, mirageTimer]);

  // Render FlatList Item
  const renderItem = ({ item, index, isLastItem }) => {
    return (
      <View
        style={[
          styles.itemContainer,
          isLastItem && { borderBottomWidth: 0 }, // Remove bottom border for the last item
        ]}
      >
        <Image
          source={{
            uri: `https://bloxfruitscalc.com/wp-content/uploads/2024/09/${item.Normal.replace(/^\+/, '').replace(/\s+/g, '-')}_Icon.webp`,
          }}
          style={styles.icon}
        />
        <Text style={[styles.name, { color: selectedTheme.colors.text }]}>{item.Normal}</Text>
        <Text style={styles.price}>{item.price}</Text>
        <Text style={styles.robux}>{item.value}</Text>
      </View>
    );
  };





  ///////////////




  useEffect(() => {
    interstitial.load();

    const onAdLoaded = () => setIsAdLoaded(true);
    const onAdClosed = () => {
      setIsAdLoaded(false);
      setIsShowingAd(false);
      interstitial.load(); // Reload ad for the next use
    };
    const onAdError = (error) => {
      setIsAdLoaded(false);
      setIsShowingAd(false);
      console.error('Ad Error:', error);
    };

    const loadedListener = interstitial.addAdEventListener(AdEventType.LOADED, onAdLoaded);
    const closedListener = interstitial.addAdEventListener(AdEventType.CLOSED, onAdClosed);
    const errorListener = interstitial.addAdEventListener(AdEventType.ERROR, onAdError);

    return () => {
      loadedListener();
      closedListener();
      errorListener();
    };
  }, []);

  const showInterstitialAd = (callback) => {
    if (isAdLoaded && !isShowingAd) {
      setIsShowingAd(true);
      try {
        interstitial.show();
        interstitial.addAdEventListener(AdEventType.CLOSED, callback);
      } catch (error) {
        console.error('Error showing interstitial ad:', error);
        setIsShowingAd(false);
        callback(); // Proceed with fallback in case of error
      }
    } else {
      callback(); // If ad is not loaded, proceed immediately
    }
  };
  const styles = getStyles(isDarkMode);

  return (
    <>
      <GestureHandlerRootView>
        <View style={styles.container}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={[styles.description, { color: selectedTheme.colors.text }]}>
              Stay updated on the latest fruits stock
            </Text>
            <View style={styles.reminderContainer}>
              <View style={styles.row}>
                <Text style={styles.title}>Stock Updates</Text>
                <View style={styles.rightSide}>
                  <Switch value={isReminderEnabled} onValueChange={toggleSwitch} />
                  <Icon
                    name={isReminderEnabled ? "notifications" : "notifications-outline"}
                    size={24}
                    color={isReminderEnabled ? config.colors.hasBlockGreen : config.colors.primary}
                    style={styles.iconNew}
                  />
                </View>
              </View>

              <View style={styles.row2}>
                <Text style={[styles.title]}>Selected Fruit Updates</Text>
                <View style={styles.rightSide}>
                  <Switch value={isSelectedReminderEnabled} onValueChange={toggleSwitch2} />
                  <TouchableOpacity
                    onPress={openDrawer}
                    style={styles.selectedContainericon}
                    disabled={!isSelectedReminderEnabled}
                  >
                    <Icon name="add" size={24} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <View style={styles.listContentSelected}>
              {selectedFruits?.map((item) => (
                <View key={item.Name} style={styles.selectedContainer}>
                  <Image
                    source={{
                      uri: `https://bloxfruitscalc.com/wp-content/uploads/2024/09/${item.Name
                        .replace(/^\+/, '')
                        .replace(/\s+/g, '-')}_Icon.webp`,
                    }}
                    style={styles.iconselected}
                  />
                  <Text style={[styles.fruitText, { color: selectedTheme.colors.text }]}>{item.Name}</Text>
                  <TouchableOpacity onPress={() => handleRemoveFruit(item)}>
                    <Icon name="close-circle" size={24} color={config.colors.wantBlockRed} style={styles.closeIcon} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* <View> */}
            {/* Normal Stock Section */}
            <View>
              <View style={styles.headerContainer}>
                <Text style={[styles.title, { color: selectedTheme.colors.text }]}>Normal Stock</Text>
                <Text style={[styles.timer, { color: selectedTheme.colors.text }]}>
                  Reset in: <Text style={styles.time}>{normalTimer}</Text>
                </Text>
              </View>
              {dataloading && <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
  <ActivityIndicator size="large" color="#1E88E5" />
</View>
}
              {!dataloading && <View style={styles.stockContainer}>
                {normalStock?.map((item, index) => {
                  const isLastItem = index === normalStock.length - 1;
                  return (
                    <View key={item.id || index}>
                      {renderItem({ item, index, isLastItem })}
                    </View>
                  );
                })}
              </View>}

              {/* Mirage Stock Section */}
              <View style={styles.headerContainer}>
                <Text style={[styles.title, { color: selectedTheme.colors.text }]}>Mirage Stock</Text>
                <Text style={[styles.timer, { color: selectedTheme.colors.text }]}>
                  Reset in: <Text style={styles.time}>{mirageTimer}</Text>
                </Text>
              </View>
              {dataloading && <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
  <ActivityIndicator size="large" color="#1E88E5" />
</View>
}
              {!dataloading && <View style={styles.stockContainer}>
                {mirageStock?.map((item, index) => {
                  const isLastItem = index === mirageStock.length - 1;
                  return (
                    <View key={item.id || index}>
                      {renderItem({ item, index, isLastItem })}
                    </View>
                  );
                })}
              </View>}
            </View>
            <FruitSelectionDrawer
              visible={isDrawerVisible}
              onClose={closeDrawer}
              onSelect={handleFruitSelect}
              data={fruitRecords}
              selectedTheme={selectedTheme}
            />

            <SigninDrawer
              visible={isSigninDrawerVisible}
              onClose={closeDrawerSignin}
              selectedTheme={selectedTheme}
            />
          </ScrollView>
        </View>

      </GestureHandlerRootView>
      <View style={{ alignSelf: 'center' }}>
        <BannerAd
          unitId={bannerAdUnitId}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        />
      </View>
    </>



  );
};
const getStyles = (isDarkMode) =>
  StyleSheet.create({
    container: {
      flex: 1, paddingHorizontal: 10, backgroundColor: isDarkMode ? '#121212' : '#f2f2f7',
    },
    description: { fontSize: 14, marginVertical: 10, fontFamily: 'Lato-Regular' },
    headerContainer: { flexDirection:  'row', justifyContent: 'space-between', marginVertical: 10, paddingHorizontal: 10 },

    timer: { fontSize: 16, fontFamily: 'Lato-Bold' },
    time: { fontSize: 16, fontFamily: 'Lato-Bold' },
    itemContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderColor: isDarkMode ? '#333333' : '#cccccc',
      borderBottomWidth: 1,
      marginBottom: !config.isNoman ? 10 : 0,

      ...(!config.isNoman && {
        borderWidth: 5,
        borderColor: config.colors.hasBlockGreen,
      }),
    },

    icon: { width: 50, height: 50, borderRadius: 5, marginRight: 10 },
    name: { fontSize: 16, flex: 1, fontFamily: 'Lato-Bold' },
    price: { fontSize: 14, backgroundColor: config.colors.hasBlockGreen, padding: 5, borderRadius: 5, color: 'white' },
    robux: { fontSize: 14, backgroundColor: config.colors.hasBlockGreen, padding: 5, borderRadius: 5, color: 'white', marginLeft: 10 },
    stockContainer: {
      backgroundColor: config.colors.primary,
      padding: 10,
      borderRadius: 10,
      backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',


    },
    row: {
      flexDirection: !config.isNoman ? 'column' : 'row',
      width: !config.isNoman ? '100%' : '100%',
      justifyContent: !config.isNoman ? 'center' : 'space-between',
      alignItems: 'center',
      padding: 10,
      paddingVertical: 10,
      borderColor: isDarkMode ? '#333333' : '#cccccc',
      borderBottomWidth: 1
    },
    row2: {
      flexDirection: !config.isNoman ? 'column' : 'row',
      width: !config.isNoman ? '100%' : '100%',
      justifyContent: !config.isNoman ? 'center' : 'space-between',
      alignItems: 'center',
      padding: 10,
      paddingVertical: 10,
    },
    title: { fontSize: 16, fontFamily: 'Lato-Bold', color: isDarkMode ? 'white' : 'black' },
    rightSide: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: !config.isNoman ? 20 : 0
    },
    iconNew: {
      marginLeft: 10,
    },
    peopleIcon: {
      marginRight: 15,
    },
    selectedContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
      borderRadius: 20,
      paddingVertical: 1,
      paddingHorizontal: 5,
      marginVertical: 2,
      marginRight: 5, // Add spacing between items
    },
    selectedContainericon: {
      // flexDirection: 'column',
      alignItems: 'center',
      backgroundColor: config.colors.primary,
      borderRadius: 20,
      marginLeft: 10
    },
    listContentSelected: {
      flexDirection: 'row',
      flexWrap: "wrap",
      marginVertical: 10,

    }
    , fruitText: {
      fontSize: 10,
      color: 'white',
      textAlign: 'center',
      paddingHorizontal: 5,
      alignItems: 'center'
    },
    iconselected: {
      width: 30,
      height: 30
    },
    reminderContainer: {
      flexDirection: 'column',
      backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
      padding: 10
    }
  });

export default TimerScreen;
