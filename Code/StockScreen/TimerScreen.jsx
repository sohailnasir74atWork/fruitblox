import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Image, Switch, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useGlobalState } from '../GlobelStats';
import Icon from 'react-native-vector-icons/Ionicons';
import FruitSelectionDrawer from './FruitSelectionDrawer';
import SigninDrawer from '../Firebase/SigninDrawer';
import { GestureHandlerRootView, ScrollView } from 'react-native-gesture-handler';
import { AdEventType, BannerAd, BannerAdSize, InterstitialAd } from 'react-native-google-mobile-ads';
import getAdUnitId from '../Ads/ads';
import config from '../Helper/Environment';
import { useHaptic } from '../Helper/HepticFeedBack';
import { useLocalState } from '../LocalGlobelStats';
import { requestPermission } from '../Helper/PermissionCheck';
import { useIsFocused } from '@react-navigation/native';
const bannerAdUnitId = getAdUnitId('banner');
const interstitialAdUnitId = getAdUnitId('interstitial');
const interstitial = InterstitialAd.createForAdRequest(interstitialAdUnitId);

const TimerScreen = ({ selectedTheme }) => {
  const { state, user, updateLocalStateAndDatabase, theme, fetchStockData } = useGlobalState();
  const [hasAdBeenShown, setHasAdBeenShown] = useState(false);
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const [isShowingAd, setIsShowingAd] = useState(false);
  const [fruitRecords, setFruitRecords] = useState([]);
  const [isDrawerVisible, setDrawerVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false); // State for pull-to-refresh
  const [isSigninDrawerVisible, setisSigninDrawerVisible] = useState(false);
  const [isAdVisible, setIsAdVisible] = useState(true);
  const isFocused = useIsFocused();
  const [currentTime, setCurrentTime] = useState(Date.now()); 
  const { triggerHapticFeedback } = useHaptic();
  const { isPro } = useLocalState()
  const intervalRef = useRef(null); // Store interval reference
  

  const isDarkMode = theme === 'dark';
  useEffect(() => {
    if (state.data && Object.keys(state.data).length > 0) {
      setFruitRecords(Object.values(state.data));
    } else {
      setFruitRecords([]);
    }
  }, [state.data]);

  const openDrawer = () => {
    triggerHapticFeedback('impactLight');
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
    triggerHapticFeedback('impactLight');
    const userPoints = user.points || 0; // Ensure `points` exists and default to 0 if undefined
    const selectedFruits = user.selectedFruits || []; // Ensure `selectedFruits` is always an array
    const isAlreadySelected = selectedFruits.some((item) => item.Name === fruit.Name);

    if (isAlreadySelected) {
      Alert.alert('Notice', `${fruit.Name} is already selected.`);
      return; // Exit if the fruit is already selected
    }
    if (isPro) {
      // First selection is free
      const updatedFruits = [...selectedFruits, fruit];
      updateLocalStateAndDatabase('selectedFruits', updatedFruits); // Update selected fruits locally and remotely
      Alert.alert('Success', `${fruit.Name} selected successfully!`);
    }
    else if (selectedFruits.length === 0) {
      // First selection is free
      const updatedFruits = [...selectedFruits, fruit];
      updateLocalStateAndDatabase('selectedFruits', updatedFruits); // Update selected fruits locally and remotely
      Alert.alert('Success', `${fruit.Name} selected successfully for free!`);
    } else if (userPoints >= 50) {
      // Deduct 50 points for additional selections
      const updatedPoints = userPoints - 50;
      updateLocalStateAndDatabase('points', updatedPoints); // Update points locally and remotely

      const updatedFruits = [...selectedFruits, fruit];
      updateLocalStateAndDatabase('selectedFruits', updatedFruits); // Update selected fruits locally and remotely
      Alert.alert('Success', `${fruit.Name} selected successfully for 50 points!`);
    } else {
      Alert.alert(
        'Insufficient Points',
        'You need at least 50 points to select more fruits. To earn points, go to\nSettings >> Get Points >> Earn Reward\nWatch ads or participate in activities to accumulate points.',
        [
          { text: 'OK', onPress: () => { } },
        ]
      );

    }

    closeDrawer(); // Close the drawer after selection
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchStockData(); // Re-fetch stock data
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRemoveFruit = (fruit) => {
    triggerHapticFeedback('impactLight');
    const selectedFruits = user.selectedFruits || []; // Ensure `selectedFruits` is always an array

    // Remove the selected fruit and update state/database
    const updatedFruits = selectedFruits.filter((item) => item.Name !== fruit.Name);
    updateLocalStateAndDatabase('selectedFruits', updatedFruits);
  };






  const toggleSwitch = async () => {
    try {
      const permissionGranted = await requestPermission();
      if (!permissionGranted) return;

      if (user.id == null) {
        setisSigninDrawerVisible(true);
      } else {
        const currentValue = user.isReminderEnabled;

        // Optimistically update the UI
        updateLocalStateAndDatabase('isReminderEnabled', !currentValue);
      }
    } catch (error) {
      console.error('Error handling notification permission or sign-in:', error);
      Alert.alert('Error', 'Something went wrong while processing your request.');
    }
  };

  const toggleSwitch2 = async () => {
    try {
      const permissionGranted = await requestPermission();
      if (!permissionGranted) return;

      if (user?.id == null) {
        setisSigninDrawerVisible(true);
      } else {
        const currentValue = user.isSelectedReminderEnabled;

        // Optimistically update the UI
        updateLocalStateAndDatabase('isSelectedReminderEnabled', !currentValue);
      }
    } catch (error) {
      console.error('Error handling notification permission or sign-in:', error);
      Alert.alert('Error', 'Something went wrong while processing your request.');
    }
  };

  // console.log(state.mirageStock)


  // Format time utility
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate time left for stock resets
  const calculateTimeLeft = (intervalHours) => {
    const now = currentTime;
    let nextReset = new Date();
    nextReset.setHours(1, 0, 0, 0); // Base reset at 1 AM

    while (nextReset <= now) {
      nextReset.setHours(nextReset.getHours() + intervalHours);
    }
    return Math.floor((nextReset - now) / 1000);
  };

  const normalInterval = 4; // Normal stock resets every 4 hours
const mirageInterval = 2; // Mirage stock resets every 2 hours

const normalTimer = useMemo(() => formatTime(calculateTimeLeft(normalInterval)), []);
const mirageTimer = useMemo(() => formatTime(calculateTimeLeft(mirageInterval)), []);



  useEffect(() => {
    if (!isFocused) return; // Only run when the screen is focused
  
    intervalRef.current = setInterval(() => {
      setCurrentTime(Date.now()); // Update time without forcing full re-render
    }, 1000);
  
    return () => clearInterval(intervalRef.current); // Cleanup interval on unmount
  }, [isFocused]); // Depend only on focus

//   return { normalTimer, mirageTimer };
// };

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

// console.log(state.mirageStock)


useEffect(() => {
  interstitial.load();

  const onAdLoaded = () => setIsAdLoaded(true);
  const onAdClosed = () => {
    setIsAdLoaded(false);
    setIsShowingAd(false);
    interstitial.load(); 
  };
  const onAdError = (error) => {
    setIsAdLoaded(false);
    setIsShowingAd(false);
    console.error('Ad Error:', error);
  };

  interstitial.addAdEventListener(AdEventType.LOADED, onAdLoaded);
  interstitial.addAdEventListener(AdEventType.CLOSED, onAdClosed);
  interstitial.addAdEventListener(AdEventType.ERROR, onAdError);

  return () => {
    interstitial.removeAllListeners(); // Prevent memory leaks
  };
}, []);

const showInterstitialAd = useCallback((callback) => {
  if (isAdLoaded && !isShowingAd && !isPro) {
    setIsShowingAd(true);
    try {
      interstitial.show();
      callback(); // Call the function after the ad
    } catch (error) {
      console.error('Error showing interstitial ad:', error);
      setIsShowingAd(false);
      callback();
    }
  } else {
    callback();
  }
}, [isAdLoaded, isShowingAd, isPro]);

  const styles = getStyles(isDarkMode, user);
// console.log(state.premirageStock)
  return (
    <>
      <GestureHandlerRootView>
        <View style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
          >
            <Text style={[styles.description, { color: selectedTheme.colors.text }]}>
              Stay updated on the latest fruits stock
            </Text>
            <View style={styles.reminderContainer}>
              <View style={styles.row}>
                <Text style={styles.title}>Stock Updates</Text>
                <View style={styles.rightSide}>
                  <Switch value={user.isReminderEnabled} onValueChange={toggleSwitch} />
                  <Icon
                    name={user.isReminderEnabled ? "notifications" : "notifications-outline"}
                    size={24}
                    color={user.isReminderEnabled ? config.colors.hasBlockGreen : config.colors.primary}
                    style={styles.iconNew}
                  />
                </View>
              </View>

              <View style={styles.row2}>
                <Text style={[styles.title]}>Selected Fruit Notification {'\n'}
                  <Text style={styles.footer}>
                  You will be notified when selected fruit is available in stock
                  </Text>
                </Text>
                <View style={styles.rightSide}>
                  <Switch value={user.isSelectedReminderEnabled} onValueChange={toggleSwitch2} />
                  <TouchableOpacity
                    onPress={openDrawer}
                    style={styles.selectedContainericon}
                    disabled={!user.isSelectedReminderEnabled}
                  >
                    <Icon name="add" size={24} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <View style={styles.listContentSelected}>
              {user.selectedFruits?.map((item) => (
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

              <View style={styles.stockContainer}>
                {state?.normalStock.length > 0 && state.normalStock?.map((item, index) => {
                  const isLastItem = index === state?.normalStock.length - 1;
                  return (
                    <View key={item.id || index}>
                      {renderItem({ item, index, isLastItem })}
                    </View>
                  );
                })}
              </View>

              {/* Mirage Stock Section */}
              <View style={styles.headerContainer}>
                <Text style={[styles.title, { color: selectedTheme.colors.text }]}>Mirage Stock</Text>
                <Text style={[styles.timer, { color: selectedTheme.colors.text }]}>
                  Reset in: <Text style={styles.time}>{mirageTimer}</Text>
                </Text>
              </View>
              <View style={styles.stockContainer}>
                {state?.mirageStock.length > 0 && state.mirageStock?.map((item, index) => {
                  const isLastItem = index === state?.mirageStock.length - 1;
                  return (
                    <View key={item.id || index}>
                      {renderItem({ item, index, isLastItem })}
                    </View>
                  );
                })}
              </View>
            </View>
            <View style={styles.preCont}>
              <Text style={styles.pre}>PREVIOUS STOCK</Text>
            </View>


            {/* <View> */}
            {/* Normal Stock Section */}
            <View>
              <View style={styles.headerContainerpre}>
                <Text style={[styles.title, { color: selectedTheme.colors.text }]}>Normal Stock</Text>
                <Text style={[styles.timer, { color: selectedTheme.colors.text }]}>
                  <Text style={styles.time}>00:00</Text>
                </Text>
              </View>

              <View style={styles.stockContainerpre}>
                {state?.prenormalStock.length > 0 && state.prenormalStock.map((item, index) => {
                  const isLastItem = index === state.prenormalStock.length - 1;
                  return (
                    <View key={item.id || index}>
                      {renderItem({ item, index, isLastItem })}
                    </View>
                  );
                })}
              </View>

              {/* Mirage Stock Section */}
              <View style={styles.headerContainerpre}>
                <Text style={[styles.title, { color: selectedTheme.colors.text }]}>Mirage Stock</Text>
                <Text style={[styles.timer, { color: selectedTheme.colors.text }]}>
                  <Text style={styles.time}>00:00</Text>
                </Text>
              </View>
              <View style={styles.stockContainerpre}>
                {state?.premirageStock.length > 0 && state.premirageStock.map((item, index) => {
                  const isLastItem = index === state.premirageStock.length - 1;
                  return (
                    <View key={item.id || index}>
                      {renderItem({ item, index, isLastItem })}
                    </View>
                  );
                })}
              </View>
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
              message='To activate notifications, you need to sign in'
            />
          </ScrollView>
        </View>

      </GestureHandlerRootView>

      {!isPro && <View style={{ alignSelf: 'center' }}>
        {isAdVisible && (
          <BannerAd
            unitId={bannerAdUnitId}
            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
            onAdLoaded={() => setIsAdVisible(true)}
            onAdFailedToLoad={() => setIsAdVisible(false)}
          />
        )}
      </View>}
    </>



  );
};
const getStyles = (isDarkMode, user) =>
  StyleSheet.create({
    container: {
      flex: 1, paddingHorizontal: 10, backgroundColor: isDarkMode ? '#121212' : '#f2f2f7',
    },
    description: { fontSize: 14, marginVertical: 10, fontFamily: 'Lato-Regular' },
    headerContainer: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10, paddingHorizontal: 10 },
    headerContainerpre: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10, paddingHorizontal: 10, opacity: .3 },

    timer: { fontSize: 16, fontFamily: 'Lato-Bold' },
    time: { fontSize: 16, fontFamily: 'Lato-Bold' },
    itemContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderColor: isDarkMode ? '#333333' : '#cccccc',
      borderBottomWidth: 1,
      marginBottom: !config.isNoman ? 10 : 0,

      ...(!config.isNoman && {
        borderWidth: 1,
        borderColor: config.colors.hasBlockGreen,
        padding: 5
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
    stockContainerpre: {
      backgroundColor: config.colors.primary,
      padding: 10,
      borderRadius: 10,
      backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
      opacity: .3


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
      backgroundColor: user.isSelectedReminderEnabled ? config.colors.hasBlockGreen : config.colors.primary,
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
    },
    preCont: {
      justifyContent: 'center',
      flex: 1,
      padding: 20,
      backgroundColor: config.colors.secondary,
      borderRadius: 10,
      margin: 10,
      opacity: .3
    },
    pre: {
      color: 'white',
      alignSelf: 'center',
      fontFamily: 'Lato-Bold'
    },
    footer:{
      fontFamily:'Lato-Regular',
      fontSize:8,
      lineHeight:12
    }
  });

export default TimerScreen;