import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, FlatList, TextInput, Image, Alert, useColorScheme, Keyboard, Pressable, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { InterstitialAd, AdEventType, TestIds, BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import getAdUnitId, { developmentMode } from '../Ads/ads';
import ViewShot, { captureRef } from 'react-native-view-shot';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import { useGlobalState } from '../GlobelStats';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import config from '../Helper/Environment';
import ConditionalKeyboardWrapper from '../Helper/keyboardAvoidingContainer';
import { useHaptic } from '../Helper/HepticFeedBack';
import { getDatabase, ref, push, get, set } from '@react-native-firebase/database';
import { useLocalState } from '../LocalGlobelStats';
import { submitTrade } from './HomeScreenHelper';
import SignInDrawer from '../Firebase/SigninDrawer';
import { useNavigation } from '@react-navigation/native';
import AppUpdateChecker from '../AppHelper/UpdateChecker';
const bannerAdUnitId = getAdUnitId('banner');
const interstitialAdUnitId = getAdUnitId('interstitial');
const interstitial = InterstitialAd.createForAdRequest(interstitialAdUnitId);

const HomeScreen = ({ selectedTheme }) => {
  const { state, theme, user, updateLocalStateAndDatabase, firestoreDB } = useGlobalState();
  const initialItems = [null, null];
  const [hasItems, setHasItems] = useState(initialItems);
  const [fruitRecords, setFruitRecords] = useState([]);
  const [wantsItems, setWantsItems] = useState(initialItems);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [hasTotal, setHasTotal] = useState({ price: 0, value: 0 });
  const [wantsTotal, setWantsTotal] = useState({ price: 0, value: 0 });
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const [isShowingAd, setIsShowingAd] = useState(false);
  const [isAdVisible, setIsAdVisible] = useState(true);
  const [message, setMessage] = useState('')
  const { triggerHapticFeedback } = useHaptic();
  const { isPro } = useLocalState()
  const [modalVisible, setModalVisible] = useState(false);
  const [description, setDescription] = useState('');
  const [isSigninDrawerVisible, setIsSigninDrawerVisible] = useState(false);


  const isDarkMode = theme === 'dark'
  const viewRef = useRef();

  const resetState = () => {
    triggerHapticFeedback('impactLight');
    setSelectedSection(null);
    setHasTotal({ price: 0, value: 0 });
    setWantsTotal({ price: 0, value: 0 });
    setIsAdLoaded(false);
    setIsShowingAd(false);
    setHasItems([...initialItems]); // Use a new array to avoid mutating the original reference
    setWantsItems([...initialItems]); // Use a new array to avoid mutating the original reference
  };
  const navigation = useNavigation()

  const handleCreateTradePress = async () => {


    if (!user.id) {
      setIsSigninDrawerVisible(true)
      return;
    }

    if (hasItems.filter(Boolean).length === 0 || wantsItems.filter(Boolean).length === 0) {
      Alert.alert('Error', 'Please add at least one item to both "You" and "Them" sections.');
      return;
    }
    setModalVisible(true)
  };




  const handleCreateTrade = async () => {
    const userPoints = !developmentMode ? user?.points || 0 : 600// Fetch user points
    const userId = user?.id; // User ID
    const database = getDatabase();
    const freeTradeRef = ref(database, `freeTradeUsed/${userId}`);

    try {
      // Check if the user has already used their free trade
      const snapshot = await get(freeTradeRef);
      const hasUsedFreeTrade = snapshot.exists() && snapshot.val();

      // Define a function to reset trade state
      const resetTradeState = () => {
        setHasItems(initialItems);
        setWantsItems(initialItems);
        setHasTotal({ price: 0, value: 0 });
        setWantsTotal({ price: 0, value: 0 });
      };

      if (isPro) {

        setModalVisible(false); // Close modal
        submitTrade(user, hasItems, wantsItems, hasTotal, wantsTotal, message, description, resetState, firestoreDB);
        resetTradeState(); // Clear trade state
      }

      else
        if (!hasUsedFreeTrade) {
          // User can create a free trade
          await set(freeTradeRef, true); // Mark free trade as used
          showInterstitialAd(() => {

            setModalVisible(false); // Close modal
            submitTrade(user, hasItems, wantsItems, hasTotal, wantsTotal, message, description, resetState, firestoreDB);
            resetTradeState(); // Clear trade state
          });
          Alert.alert('Success', 'Your free trade has been posted!');
        } else if (userPoints >= 200) {
          // User has enough points for trade
          const updatedPoints = userPoints - 200;
          await updateLocalStateAndDatabase('points', updatedPoints); // Deduct points
          showInterstitialAd(() => {

            setModalVisible(false); // Close modal
            submitTrade(user, hasItems, wantsItems, hasTotal, wantsTotal, message, description, resetState, firestoreDB);
            resetTradeState(); // Clear trade state
          });
          Alert.alert(
            'Success',
            `Trade posted successfully! 200 points deducted. Your remaining points: ${updatedPoints}.`
          );
        } else {
          // User has insufficient points
          Alert.alert(
            'Insufficient Points',
            `You need 200 points to create a trade, but you only have ${userPoints}. Earn or purchase more points to continue.`,
            [
              {
                text: 'Get Points',
                onPress: () => {
                  resetTradeState(); // Clear trade state
                  setModalVisible(false); // Close modal
                  navigation.navigate('Setting'); // Navigate to settings screen
                },
              },
              { text: 'Cancel', style: 'cancel' }, // Optional cancel button
            ]
          );
        }
    } catch (error) {
      console.error('Error creating trade:', error);
      Alert.alert('Error', 'Unable to create trade. Please try again later.');
    }
  };


  const adjustedData = (fruitRecords) => {
    let transformedData = [];
    fruitRecords.forEach((fruit) => {
      if (!fruit.Name) return; // Skip invalid entries
      if (fruit.Permanent && fruit.Value) {
        transformedData.push({ Name: `${fruit.Name}`, Value: fruit.Permanent, Type: 'p' });
        transformedData.push({ Name: `${fruit.Name}`, Value: fruit.Value, Type: 'n' });
      } else if (fruit.Permanent || fruit.Value) {
        // If only one exists, keep it as is
        transformedData.push({ Name: fruit.Name, Value: fruit.Value || fruit.Permanent });
      }
    });

    return transformedData;
  };




  useEffect(() => {
    if (state.data && Object.keys(state.data).length > 0) {
      const formattedData = adjustedData(Object.values(state.data));
      setFruitRecords(formattedData);
    } else {
      setFruitRecords([]);
    }
  }, [state.data]);
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
    if (isAdLoaded && !isShowingAd && !isPro) {
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

  const openDrawer = (section) => {
    const wantsItemCount = wantsItems.filter((item) => item !== null).length;
    triggerHapticFeedback('impactLight');
    if (section === 'wants' && wantsItemCount === 1 && !isShowingAd) {
      showInterstitialAd(() => {
        setSelectedSection(section);
        setIsDrawerVisible(true);
      });
    } else {
      // Open drawer without showing the ad
      setSelectedSection(section);
      setIsDrawerVisible(true);

    }
  };


  const closeDrawer = () => {
    setIsDrawerVisible(false);
  };

  const updateTotal = (item, section, add = true, isNew = false) => {
    const priceChange = add
      ? (item.usePermanent ? item.Permanent : item.Value)
      : -(item.usePermanent ? item.Permanent : item.Value);

    const valueChange = isNew ? (add ? (isNaN(item.Biliprice) ? 0 : item.Biliprice) : -(isNaN(item.Biliprice) ? 0 : item.Biliprice)) : 0;

    if (section === 'has') {
      setHasTotal((prev) => ({
        price: prev.price + priceChange,
        value: prev.value + valueChange,
      }));
    } else {
      setWantsTotal((prev) => ({
        price: prev.price + priceChange,
        value: prev.value + valueChange,
      }));
    }
  };


  const formatName = (name) => {
    let formattedName = name.replace(/^\+/, '');
    formattedName = formattedName.replace(/\s+/g, '-');
    return formattedName;
  }
  const selectItem = (item) => {
    triggerHapticFeedback('impactLight');
    const newItem = { ...item, usePermanent: false };
    const updateItems = selectedSection === 'has' ? [...hasItems] : [...wantsItems];
    const nextEmptyIndex = updateItems.indexOf(null);
    if (nextEmptyIndex !== -1) {
      updateItems[nextEmptyIndex] = newItem;
    } else {
      updateItems.push(newItem);
    }
    if (selectedSection === 'has') {
      setHasItems(updateItems);
      updateTotal(newItem, 'has', true, true);
    } else {
      setWantsItems(updateItems);
      updateTotal(newItem, 'wants', true, true);
    }
    closeDrawer();

  };

  const removeItem = (index, isHas) => {
    triggerHapticFeedback('impactLight');
    const section = isHas ? 'has' : 'wants';
    const items = isHas ? hasItems : wantsItems;
    const updatedItems = [...items];
    const item = updatedItems[index];

    if (item) {
      updatedItems[index] = null;
      const filteredItems = updatedItems.filter((item, i) => item !== null || i < 2);
      if (isHas) setHasItems(filteredItems);
      else setWantsItems(filteredItems);
      updateTotal(item, section, false, true);
    }
  };

  const filteredData = fruitRecords.filter((item) =>
    item.Name.toLowerCase().includes(searchText.toLowerCase())
  );


  // console.log(filteredData)
  const profitLoss = wantsTotal.price - hasTotal.price;
  const isProfit = profitLoss >= 0;
  const neutral = profitLoss === 0;


  const captureAndSave = async () => {
    if (!viewRef.current) {
      console.error('View reference is undefined.');
      return;
    }

    try {
      // Capture the view as an image
      const uri = await captureRef(viewRef.current, {
        format: 'png',
        quality: 0.8,
      });

      // Generate a unique file name
      const timestamp = new Date().getTime(); // Use the current timestamp
      const uniqueFileName = `screenshot_${timestamp}.png`;

      // Determine the path to save the screenshot
      const downloadDest = Platform.OS === 'android'
        ? `${RNFS.ExternalDirectoryPath}/${uniqueFileName}`
        : `${RNFS.DocumentDirectoryPath}/${uniqueFileName}`;

      // Save the captured image to the determined path
      await RNFS.copyFile(uri, downloadDest);

      // console.log(`Screenshot saved to: ${downloadDest}`);

      return downloadDest;
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      Alert.alert('Error', 'Failed to capture and save the screenshot. Please try again.');
    }
  };



  const proceedWithScreenshotShare = async () => {
    triggerHapticFeedback('impactLight');
    if (hasItems.filter(Boolean).length === 0 || wantsItems.filter(Boolean).length === 0) {
      Alert.alert('Error', 'Please add at least one item to both "You" and "Them" sections.');
      return;
    }
    try {
      const filePath = await captureAndSave();

      if (filePath) {
        const shareOptions = {
          title: 'Share Screenshot',
          url: `file://${filePath}`,
          type: 'image/png',
        };

        Share.open(shareOptions)
          .then((res) => console.log('Share Response:', res))
          .catch((err) => console.log('Share Error:', err));
      }
    } catch (error) {
      // console.log('Error sharing screenshot:', error);
    }
  };

  const styles = useMemo(() => getStyles(isDarkMode), [isDarkMode]);


  return (
    <>
      <GestureHandlerRootView>
        <View style={styles.container}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <ViewShot ref={viewRef} style={styles.screenshotView}>
              <View style={styles.summaryContainer}>
                <View style={[styles.summaryBox, styles.hasBox]}>
                  <Text style={[styles.summaryText]}>You</Text>
                  <View style={{ width: '90%', backgroundColor: '#e0e0e0', height: 1, alignSelf: 'center' }} />
                  <Text style={styles.priceValue}>Price: ${hasTotal.price.toLocaleString()}</Text>
                  <Text style={styles.priceValue}>Value: {hasTotal.value.toLocaleString()}</Text>
                </View>
                <View style={[styles.summaryBox, styles.wantsBox]}>
                  <Text style={styles.summaryText}>Them</Text>
                  <View style={{ width: '90%', backgroundColor: '#e0e0e0', height: 1, alignSelf: 'center' }} />
                  <Text style={styles.priceValue}>Price: ${wantsTotal.price.toLocaleString()}</Text>
                  <Text style={styles.priceValue}>Value: {wantsTotal.value.toLocaleString()}</Text>
                </View>
              </View>
              <View style={styles.profitLossBox}>
                <Text style={[styles.profitLossText, { color: selectedTheme.colors.text }]}>
                  {isProfit ? 'Profit' : 'Loss'}:
                </Text>
                <Text style={[styles.profitLossValue, { color: isProfit ? config.colors.hasBlockGreen : config.colors.wantBlockRed }]}>
                  ${Math.abs(profitLoss).toLocaleString()}
                </Text>
                {!neutral && <Icon
                  name={isProfit ? 'arrow-up-outline' : 'arrow-down-outline'}
                  size={20}
                  color={isProfit ? config.colors.hasBlockGreen : config.colors.wantBlockRed}
                  style={styles.icon}
                />}
              </View>

              <Text style={[styles.sectionTitle, { color: selectedTheme.colors.text }]}>You</Text>
              <View style={styles.itemRow}>
                <TouchableOpacity onPress={() => { openDrawer('has') }} style={styles.addItemBlock}>
                  <Icon name="add-circle" size={40} color="white" />
                  <Text style={styles.itemText}>Add Item</Text>
                </TouchableOpacity>
                {hasItems?.map((item, index) => (
                  <View key={index} style={[styles.itemBlock, { backgroundColor: item?.Type === 'p' ? '#FFCC00' : config.colors.primary }]}>
                    {item ? (
                      <>
                        <Image
                          source={{ uri: `https://bloxfruitscalc.com/wp-content/uploads/2024/09/${formatName(item.Name)}_Icon.webp` }}
                          style={[styles.itemImageOverlay,
                          { backgroundColor: item.Type === 'p' ? '#FFCC00' : '' }
                          ]}
                        />
                        <Text style={[styles.itemText, { color: item.Type === 'p' ? config.colors.primary : 'white' }]}>${item.usePermanent ? item.Permanent.toLocaleString() : item.Value.toLocaleString()}</Text>
                        <Text style={[styles.itemText, { color: item.Type === 'p' ? config.colors.primary : 'white' }]}>{item.Name}</Text>
                        {item.Type === 'p' && <Text style={styles.perm}>P</Text>}
                        <TouchableOpacity onPress={() => removeItem(index, true)} style={styles.removeButton}>
                          <Icon name="close-outline" size={24} color="white" />
                        </TouchableOpacity>
                      </>
                    ) : (
                      <Text style={styles.itemPlaceholder}>Empty</Text>
                    )}
                  </View>
                ))}
              </View>

              <View style={styles.divider}>
                <Image
                  source={require('../../assets/reset.png')} // Replace with your image path
                  style={{ width: 24, height: 24, tintColor: 'white' }} // Customize size and color
                  onTouchEnd={resetState} // Add event handler
                />
              </View>

              <Text style={[styles.sectionTitle, { color: selectedTheme.colors.text }]}>Them</Text>
              <View style={styles.itemRow}>
                <TouchableOpacity onPress={() => { openDrawer('wants'); }} style={styles.addItemBlock}>
                  <Icon name="add-circle" size={40} color="white" />
                  <Text style={styles.itemText}>Add Item</Text>
                </TouchableOpacity>
                {wantsItems?.map((item, index) => (
                  <View key={index} style={[styles.itemBlock, { backgroundColor: item?.Type === 'p' ? '#FFCC00' : config.colors.primary }]}>
                    {item ? (
                      <>
                        <Image
                          source={{ uri: `https://bloxfruitscalc.com/wp-content/uploads/2024/09/${formatName(item.Name)}_Icon.webp` }}
                          style={[styles.itemImageOverlay, { backgroundColor: item?.Type === 'p' ? '#FFCC00' : config.colors.primary }]}
                        />
                        <Text style={[styles.itemText, { color: item.Type === 'p' ? config.colors.primary : 'white' }]}>${item.usePermanent ? item.Permanent.toLocaleString() : item.Value.toLocaleString()}</Text>
                        <Text style={[styles.itemText, { color: item.Type === 'p' ? config.colors.primary : 'white' }]}>{item.Name}</Text>
                        {item.Type === 'p' && <Text style={styles.perm}>P</Text>}
                        <TouchableOpacity onPress={() => removeItem(index, false)} style={styles.removeButton}>
                          <Icon name="close-outline" size={24} color="white" />
                        </TouchableOpacity>
                      </>

                    ) : (
                      <Text style={styles.itemPlaceholder}>Empty</Text>
                    )}
                  </View>
                ))}
              </View>
            </ViewShot>
            <View style={styles.createtrade} >
              <TouchableOpacity style={styles.createtradeButton} onPress={handleCreateTradePress}><Text style={{ color: 'white' }}>Create Trade</Text></TouchableOpacity>
              <TouchableOpacity style={styles.shareTradeButton} onPress={proceedWithScreenshotShare}><Text style={{ color: 'white' }}>Share Trade</Text></TouchableOpacity></View>
          </ScrollView>
          <Modal
            visible={isDrawerVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={closeDrawer}
          >


            <Pressable style={styles.modalOverlay} onPress={closeDrawer} />
            <ConditionalKeyboardWrapper>
              <View>

                <View style={[styles.drawerContainer, { backgroundColor: isDarkMode ? '#3B404C' : 'white' }]}>
                  <Text style={[styles.titleText, { color: selectedTheme.colors.text }]}>You can search fruite and select it</Text>
                  <View style={{
                    flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10,
                  }}

                  >

                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search..."
                      value={searchText}
                      onChangeText={setSearchText}
                      placeholderTextColor={selectedTheme.colors.text}

                    />
                    <TouchableOpacity onPress={closeDrawer} style={styles.closeButton}>
                      <Text style={styles.closeButtonText}>CLOSE</Text>
                    </TouchableOpacity></View>
                  <FlatList
                    onScroll={() => Keyboard.dismiss()}
                    onTouchStart={() => Keyboard.dismiss()}
                    keyboardShouldPersistTaps="handled" // Ensures taps o

                    data={filteredData}
                    keyExtractor={(item) => item.Name}
                    renderItem={({ item }) => (
                      <TouchableOpacity style={[styles.itemBlock, { backgroundColor: item?.Type === 'p' ? '#FFCC00' : config.colors.primary }]} onPress={() => selectItem(item)}>
                        <>
                          <Image
                            source={{ uri: `https://bloxfruitscalc.com/wp-content/uploads/2024/09/${formatName(item.Name)}_Icon.webp` }}
                            style={[styles.itemImageOverlay, { backgroundColor: item.Type === 'p' ? '#FFCC00' : '' }]}
                          />
                          <Text style={[[styles.itemText, { color: item.Type === 'p' ? config.colors.primary : 'white' }]]}>${item.Value.toLocaleString()}</Text>
                          <Text style={[[styles.itemText, { color: item.Type === 'p' ? config.colors.primary : 'white' }]]}>{item.Name}</Text>
                          {item.Type === 'p' && <Text style={styles.perm}>P</Text>}
                        </>
                      </TouchableOpacity>
                    )}
                    numColumns={3}
                    contentContainerStyle={styles.flatListContainer}
                    columnWrapperStyle={styles.columnWrapper}

                  />
                </View>
              </View>
            </ConditionalKeyboardWrapper>
          </Modal>
          <Modal
            visible={modalVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setModalVisible(false)} // Close modal on request
          >
            <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)} />
            <ConditionalKeyboardWrapper>
              <View>
                <View style={[styles.drawerContainer, { backgroundColor: isDarkMode ? '#3B404C' : 'white' }]}>
                  <Text style={styles.modalMessage}>
                    Do you want to add a description (optional)?
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter description (optional, max 40 characters)"
                    maxLength={40}
                    value={description}
                    onChangeText={setDescription}
                  />
                  <View style={styles.buttonContainer}>
                    <TouchableOpacity
                      style={[styles.button, styles.cancelButton]}
                      onPress={() => setModalVisible(false)}
                    >
                      <Text style={styles.buttonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.button, styles.confirmButton]}
                      onPress={handleCreateTrade}
                    >
                      <Text style={styles.buttonText}>Confirm</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </ConditionalKeyboardWrapper>
          </Modal>

          <SignInDrawer
            visible={isSigninDrawerVisible}
            onClose={() => setIsSigninDrawerVisible(false)}
            selectedTheme={selectedTheme}
            message='To create trade, you need to sign in'

          />
        </View>
        <AppUpdateChecker />
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
}
const getStyles = (isDarkMode) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#f2f2f7',
    },

    summaryContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    summaryBox: {
      width: '48%',
      padding: 10,
      borderRadius: 10,
    },
    hasBox: {
      backgroundColor: config.colors.hasBlockGreen,
    },
    wantsBox: {
      backgroundColor: config.colors.wantBlockRed,
    },
    summaryText: {
      fontSize: 18,
      color: 'white',
      textAlign: 'center',
      fontFamily: 'Lato-Bold',

    },
    priceValue: {
      color: 'white',
      textAlign: 'center',
      marginTop: 5,
      fontFamily: 'Lato-Bold',

    },
    sectionTitle: {
      fontSize: 16,
      marginBottom: 10,
      fontFamily: 'Lato-Bold',

    },
    itemRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 10,

    },
    addItemBlock: {
      width: '32%',
      height: 110,
      backgroundColor: config.colors.secondary,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 10,
      marginBottom: 10,
    },
    itemBlock: {
      width: '32%',
      height: 110,
      backgroundColor: config.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 10,
      marginBottom: 10,
      position: 'relative',
      ...(!config.isNoman && {
        borderWidth: 5,
        borderColor: config.colors.hasBlockGreen,
      }),
    },

    itemText: {
      color: 'white',
      textAlign: 'center',
      fontFamily: 'Lato-Bold',
    },
    itemPlaceholder: {
      color: '#CCC',
      textAlign: 'center',
    },
    removeButton: {
      position: 'absolute',
      top: 5,
      right: 5,
      backgroundColor: config.colors.wantBlockRed,
      borderRadius: 50,
    },
    divider: {
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: config.colors.primary,
      margin: 'auto',
      borderRadius: 24,
      padding: 5,
    },
    drawerContainer: {
      borderTopLeftRadius: 10,
      borderTopRightRadius: 10,
      paddingHorizontal: 10,
      paddingTop: 20,
      maxHeight: 400,
      overflow: 'hidden',
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
    },

    drawerTitle: {
      fontSize: 18,
      textAlign: 'center',
      fontFamily: 'Lato-Bold'
    },
    profitLossBox: { flexDirection: 'row', justifyContent: 'center', marginVertical: 10, alignItems: 'center' },
    profitLossText: { fontSize: 16, fontFamily: 'Lato-Bold' },
    profitLossValue: { fontSize: 16, marginLeft: 5, fontFamily: 'Lato-Bold' },
    modalOverlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      flex: 1,
    },
    searchInput: {
      width: '78%',
      borderColor: 'grey',
      borderWidth: 1,
      borderRadius: 5,
      height: 48,
      borderColor: '#333',
      borderWidth: 1,
      borderRadius: 5,
      paddingHorizontal: 10,
      backgroundColor: '#fff',
      color: '#000',
    },
    closeButton: {
      backgroundColor: config.colors.wantBlockRed,
      padding: 10,
      borderRadius: 5,
      width: '22%',
      alignItems: 'center',
      justifyContent: 'center'
    },
    closeButtonText: {
      color: 'white',
      textAlign: 'center',
      fontFamily: 'Lato-Regular'
    },
    flatListContainer: {
      justifyContent: 'space-between',
    },
    columnWrapper: {
      flex: 1,
      justifyContent: 'space-around',
    },
    itemImageOverlay: {
      width: 60,
      height: 60,
      borderRadius: 5,
    },
    switchValue: {
      backgroundColor: 'lightgreen',
      flexDirection: 'row',
      paddingVertical: 0,
      paddingHorizontal: 10,
      borderRadius: 20,
      margin: 5,
      alignItems: 'center'
    },
    switchValueText: {
      fontSize: 10,
      padding: 3,
      fontFamily: 'Lato-Regular',
      color: 'black'

    },
    captureButton: { backgroundColor: '#3E8BFC', padding: 10, borderRadius: 8, alignItems: 'center', marginTop: 20, alignSelf: 'center' },
    captureButtonText: { color: 'white', fontFamily: 'Lato-Bold', fontSize: 14 },
    captureView: { backgroundColor: '#fff', padding: 10, borderRadius: 10 },

    screenshotView: {
      padding: 10,
      flex: 1,
      paddingVertical: 10
    },
    float: {
      position: 'absolute',
      right: 5,
      bottom: 5,
      // width:40,
      zIndex: 1,
      // height:40,
      // backgroundColor:'red'

    },
    titleText: {
      fontFamily: 'Lato-Regular',
      fontSize: 10
    },
    loaderContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loaderText: {
      fontSize: 16,
      fontFamily: 'Lato-Bold',
    },
    noDataContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f9f9f9',
    },
    noDataText: {
      fontSize: 16,
      color: 'gray',
      fontFamily: 'Lato-Bold',
    },
    createtrade: {
      alignSelf: 'center',
      justifyContent: 'center',
      flexDirection: 'row'
    },
    createtradeButton: {
      backgroundColor: config.colors.hasBlockGreen,
      alignSelf: 'center',
      padding: 10,
      justifyContent: 'center',
      flexDirection: 'row',
      minWidth: 120,
      borderTopStartRadius: 20,
      borderBottomStartRadius: 20,
      marginRight: 1
    },
    shareTradeButton: {
      backgroundColor: config.colors.wantBlockRed,
      alignSelf: 'center',
      padding: 10,
      flexDirection: 'row',
      justifyContent: 'center',
      minWidth: 120,
      borderTopEndRadius: 20,
      borderBottomEndRadius: 20,
      marginLeft: 1
    },

    modalMessage: {
      fontSize: 12,
      marginBottom: 10,
      color: isDarkMode ? 'white' : 'black',
      fontFamily: 'Lato-Regular'
    },
    input: {
      width: '100%',
      height: 40,
      borderColor: 'gray',
      borderWidth: 1,
      borderRadius: 5,
      paddingHorizontal: 10,
      marginBottom: 20,
      color: isDarkMode ? 'white' : 'black',
      fontFamily: 'Lato-Ragular'
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      marginBottom: 10,
      paddingHorizontal: 20

    },
    button: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 5,
    },
    cancelButton: {
      backgroundColor: config.colors.wantBlockRed,
    },
    confirmButton: {
      backgroundColor: config.colors.hasBlockGreen,
    },
    buttonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: 'bold',
    },

    perm: {
      position: 'absolute',
      top: 2,
      left: 10,
      color: 'lightgrey',
      fontFamily: 'Lato-Bold',
      color: config.colors.primary,
    }

  });

export default HomeScreen