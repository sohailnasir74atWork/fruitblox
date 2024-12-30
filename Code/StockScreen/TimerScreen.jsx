import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Switch, TouchableOpacity, Alert, Linking, useColorScheme } from 'react-native';
import { useGlobalState } from '../GlobelStats';
import Icon from 'react-native-vector-icons/Ionicons';
import FruitSelectionDrawer from './FruitSelectionDrawer';
import SigninDrawer from '../Firebase/SigninDrawer';
import { GestureHandlerRootView, ScrollView } from 'react-native-gesture-handler';
import { AdEventType, BannerAd, BannerAdSize, InterstitialAd } from 'react-native-google-mobile-ads';
import getAdUnitId from '../Ads/ads';
import notifee from '@notifee/react-native';
import config from '../Helper/Environment';

const bannerAdUnitId = getAdUnitId('banner');
const interstitialAdUnitId = getAdUnitId('interstitial');
const interstitial = InterstitialAd.createForAdRequest(interstitialAdUnitId, {
  requestNonPersonalizedAdsOnly: true,
});

const TimerScreen = ({ selectedTheme }) => {
  const [normalTimer, setNormalTimer] = useState('');
  const [mirageTimer, setMirageTimer] = useState('');
  const { normalStock, mirageStock, selectedFruits, setSelectedFruits, isReminderEnabled, setIsReminderEnabled, isSelectedReminderEnabled, setIsSelectedReminderEnabled, user } = useGlobalState();
  const [hasAdBeenShown, setHasAdBeenShown] = useState(false);
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const [isShowingAd, setIsShowingAd] = useState(false);

  const [fruitRecords, setFruitRecords] = useState([]);

  const { data } = useGlobalState();
  const [isDrawerVisible, setDrawerVisible] = useState(false);
  const [isSigninDrawerVisible, setisSigninDrawerVisible] = useState(false);

  const colorScheme = useColorScheme(); // Returns 'light' or 'dark'
  const isDarkMode = colorScheme === 'dark';
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
  const toggleSwitch = async () => {
    try {
      // First, request notification permissions
      const { authorizationStatus } = await notifee.requestPermission();

      if (authorizationStatus === 0) {
        // Permission denied, show popup with redirection to app settings
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
        return; // Exit early if permission is denied
      }

      // If permission is granted, check if the user is logged in
      if (user?.uid == null) {
        // Show the sign-in drawer if the user is not logged in
        setisSigninDrawerVisible(true);
      } else {
        // Toggle the reminder state
        setIsReminderEnabled((prev) => !prev);
      }
    } catch (error) {
      console.error('Error handling notification permission or sign-in:', error);
      Alert.alert('Error', 'Something went wrong while processing your request.');
    }
  };

  const toggleSwitch2 = async () => {
    try {
      // Request notification permissions first
      const { authorizationStatus } = await notifee.requestPermission();

      if (authorizationStatus === 0) {
        // Permission denied, show popup with redirection to app settings
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
        return; // Exit early if permission is denied
      }

      // Check user authentication after permissions are granted
      if (user?.uid == null) {
        // Show the sign-in drawer if the user is not logged in
        setisSigninDrawerVisible(true);
      } else {
        // Toggle the selected reminder state
        setIsSelectedReminderEnabled((prev) => !prev);
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
  // const formatTimeComponents = (totalSeconds) => {
  //   const hrs = Math.floor(totalSeconds / 3600);
  //   const mins = Math.floor((totalSeconds % 3600) / 60);
  //   const secs = totalSeconds % 60;
  //   return `${hrs}h ${mins}m ${secs}s`;
  // };
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
      const normalSecondsLeft = calculateTimeLeft(2);
      const mirageSecondsLeft = calculateTimeLeft(4);

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
<View style={!config.isNoman && styles.reminderContainer}>
            <View style={styles.row}>
              <Text style={styles.title}>Stock Updates</Text>
              <View style={styles.rightSide}>
                <Switch value={isReminderEnabled} onValueChange={toggleSwitch} />
                <Icon
                  name={isReminderEnabled ? "notifications" : "notifications-outline"}
                  size={24}
                  color={isReminderEnabled ? config.colors.hasBlockGreen : 'white'}
                  style={styles.iconNew}
                />
              </View>
            </View>

            <View style={styles.row}>
              <Text style={[styles.title]}>Selected Fruit Updates</Text>
              <View style={styles.rightSide}>
                <Switch value={isSelectedReminderEnabled} onValueChange={toggleSwitch2} />
                <TouchableOpacity
                  onPress={openDrawer}
                  style={styles.selectedContainericon}
                  disabled={!isSelectedReminderEnabled}
                >
                  <Icon name="add" size={24} color="white" style={styles.iconNew} />
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
                  <Text style={styles.fruitText}>{item.Name}</Text>
                  <TouchableOpacity onPress={() => handleRemoveFruit(item)}>
                    <Icon name="close-circle" size={24} color={config.colors.wantBlockRed} style={styles.closeIcon} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <View>
              {listData?.map((item) => (
                <View key={item.id}>
                  {renderItem({ item })}
                </View>
              ))}
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
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
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
    headerContainer: { flexDirection: !config.isNoman ? 'coulmn' : 'row', justifyContent: 'space-between', marginVertical: 10, },
    title: { fontSize: 20, fontFamily: 'Lato-Bold' },
    timer: { fontSize: 16 },
    time: { fontSize: 20, fontWeight: 'bold' },
    itemContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: config.colors.primary,

      borderRadius: 5,
      paddingHorizontal: 10,
      paddingVertical: 8,

      marginBottom: !config.isNoman ? 10 : 1,
      ...(!config.isNoman && {
        borderWidth: 5,
        borderColor: config.colors.hasBlockGreen,
      }),
    },

    icon: { width: 50, height: 50, borderRadius: 5, marginRight: 10 },
    name: { fontSize: 16, flex: 1, color: 'white', fontFamily: 'Lato-Bold' },
    price: { fontSize: 14, backgroundColor: config.colors.hasBlockGreen, padding: 5, borderRadius: 5, color: 'white' },
    robux: { fontSize: 14, backgroundColor: config.colors.hasBlockGreen, padding: 5, borderRadius: 5, color: 'white', marginLeft: 10 },
    row: {
      flexDirection: !config.isNoman ? 'column' : 'row',
      width: !config.isNoman ? '49%' : '100%',
      justifyContent: !config.isNoman ? 'center' : 'space-between',
      alignItems: 'center',
      marginBottom: 1,
      backgroundColor: config.colors.primary,
      borderRadius: 5,
      padding: 10,
      paddingVertical: 20,
      ...(!config.isNoman && {
        borderWidth: 5,
        borderColor: config.colors.hasBlockGreen,
      }),
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: 'white'
    },
    rightSide: {
      flexDirection: 'row',
      alignItems: 'center', 
      marginTop: !config.isNoman ? 20 : 0   },
    iconNew: {
      marginLeft: 10,
    },
    peopleIcon: {
      marginRight: 15,
    },
    selectedContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: config.colors.primary,
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
    reminderContainer:{
      flexDirection:'row',
       justifyContent:'space-between'
    }
  });

export default TimerScreen;
