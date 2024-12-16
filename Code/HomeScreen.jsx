import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, FlatList, TextInput, Image, Alert, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { InterstitialAd, AdEventType, TestIds, BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import getAdUnitId from './ads';
import ViewShot, { captureRef } from 'react-native-view-shot';
import RNFS from 'react-native-fs';  
import Share from 'react-native-share'; 
import { useGlobalState } from './GlobelStats';
import BannerAdWrapper from './bannerAds';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const interstitialAdUnitId = getAdUnitId('interstitial');
const interstitial = InterstitialAd.createForAdRequest(interstitialAdUnitId, {
  requestNonPersonalizedAdsOnly: true,
});

export default function HomeScreen() {
  const { data, isPro } = useGlobalState();
  const initialItems = [null, null];
  const [hasItems, setHasItems] = useState(initialItems);
  const [fruitRecords, setFruiteRecord] = useState([]);
  const [wantsItems, setWantsItems] = useState(initialItems);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [hasTotal, setHasTotal] = useState({ price: 0, value: 0 });
  const [wantsTotal, setWantsTotal] = useState({ price: 0, value: 0 });
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const [isShowingAd, setIsShowingAd] = useState(false);
  const [adShown, setAdShown] = useState(false); 
  const [loading, setLoading] = useState(true); 
  const pendingAction = useRef(null); // To track actions after the ad is closed

const [dataAvailable, setDataAvailable] = useState(false); 
  const viewRef = useRef();
  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      setDataAvailable(true);
      const fruitRecords = Object.values(data); 
      setFruiteRecord(fruitRecords); 
    } else {
      setDataAvailable(false);
      setFruiteRecord([]); 
    }
    setLoading(false);
  }, [data]);
  
  
  useEffect(() => {
    interstitial.load();

    const handleAdLoaded = () => setIsAdLoaded(true);
    const handleAdClosed = () => {
      setIsAdLoaded(false);
      setIsShowingAd(false);
      interstitial.load(); // Preload next ad

      // Execute the pending action if any
      if (pendingAction.current) {
        pendingAction.current();
        pendingAction.current = null; // Clear the pending action
      }
    };
    const handleAdError = (error) => {
      console.error('Ad Error:', error);
      setIsAdLoaded(false);
      setIsShowingAd(false);

      // If an ad error occurs, execute the pending action immediately
      if (pendingAction.current) {
        pendingAction.current();
        pendingAction.current = null;
      }
    };

    const adLoadedListener = interstitial.addAdEventListener(AdEventType.LOADED, handleAdLoaded);
    const adClosedListener = interstitial.addAdEventListener(AdEventType.CLOSED, handleAdClosed);
    const adErrorListener = interstitial.addAdEventListener(AdEventType.ERROR, handleAdError);

    return () => {
      adLoadedListener();
      adClosedListener();
      adErrorListener();
    };
  }, []);

  const showInterstitialAd = useCallback(() => {
    if (isAdLoaded) {
      try {
        setIsShowingAd(true);
        interstitial.show();
      } catch (error) {
        console.error('Error showing interstitial ad:', error);
        setIsShowingAd(false);
      }
    }
  }, [isAdLoaded, isShowingAd]);

  const openDrawer = useCallback((section) => {
    if (section === 'wants' && !adShown && !isPro) {
      showInterstitialAd();
      setAdShown(true);
    }
    setSelectedSection(section);
    setIsDrawerVisible(true);
  }, [adShown, showInterstitialAd]);
  

  const closeDrawer = () => {
    setIsDrawerVisible(false);
  };


    const toggleItemValueMode = (index, section) => {
    const items = section === 'has' ? [...hasItems] : [...wantsItems];
    const item = items[index];

    if (item) {
      updateTotal(item, section, false);
      item.usePermanent = !item.usePermanent;
      updateTotal(item, section, true);
      section === 'has' ? setHasItems(items) : setWantsItems(items);
    }
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

  const filteredData = useMemo(() => {
    return fruitRecords.filter((item) =>
      item.Name.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [fruitRecords, searchText]);
  

  const profitLoss = wantsTotal.price - hasTotal.price;
  const isProfit = profitLoss >= 0;
  const neutral = profitLoss === 0;


  const captureAndSave = async () => {
    try {
      const uri = await captureRef(viewRef, {
        format: 'png',
        quality: 0.8,
      });


      const downloadDest = Platform.OS === 'android'
        ? `${RNFS.ExternalDirectoryPath}/screenshot.png`
        : `${RNFS.DocumentDirectoryPath}/screenshot.png`; 

      await RNFS.copyFile(uri, downloadDest);


      return downloadDest; 
    } catch (error) {
      // console.log('Error capturing screenshot:', error);
    }
  };

  const shareScreenshot = async () => {

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
  };
  const handleShare = useCallback(() => {
    if (isAdLoaded) {
      // Set the shareScreenshot function as the pending action
      pendingAction.current = shareScreenshot;
      showInterstitialAd();
    } else {
      // If no ad is loaded, directly execute the share function
      shareScreenshot();
    }
  }, [isAdLoaded, showInterstitialAd, shareScreenshot]);
  const handleSharewoAds = useCallback(() => {
   
      // If no ad is loaded, directly execute the share function
      shareScreenshot();
    
  }, []);

  return (
    <GestureHandlerRootView>
    <View style={styles.container}>
      {loading ? (
      <View style={styles.loaderContainer}>
        <Text style={styles.loaderText}>Loading...</Text>
      </View>
    ) : !dataAvailable ? (
      <View style={styles.noDataContainer}>
<ActivityIndicator size="large"/>
<Text style={styles.noDataText}>Loading...</Text>
      </View>
    ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
        <ViewShot ref={viewRef} style={styles.screenshotView}>
          <View style={styles.summaryContainer}>
            <View style={[styles.summaryBox, styles.hasBox]}>
              <Text style={styles.summaryText}>Has</Text>
              <View style={{ width: '90%', backgroundColor: '#e0e0e0', height: 1, alignSelf: 'center' }} />
              <Text style={styles.priceValue}>Price: ${hasTotal.price.toLocaleString()}</Text>
              <Text style={styles.priceValue}>Value: ${hasTotal.value.toLocaleString()}</Text>
            </View>
            <View style={[styles.summaryBox, styles.wantsBox]}>
              <Text style={styles.summaryText}>Wants</Text>
              <View style={{ width: '90%', backgroundColor: '#e0e0e0', height: 1, alignSelf: 'center' }} />
              <Text style={styles.priceValue}>Price: ${wantsTotal.price.toLocaleString()}</Text>
              <Text style={styles.priceValue}>Value: ${wantsTotal.value.toLocaleString()}</Text>
            </View>
          </View>
          <View style={styles.profitLossBox}>
            <Text style={[styles.profitLossText]}>
              {isProfit ? 'Profit' : 'Loss'}:
            </Text>
            <Text style={[styles.profitLossValue, { color: isProfit ? '#34C759' : '#E74C3C' }]}>
              ${Math.abs(profitLoss).toLocaleString()}
            </Text>
            {!neutral && <Icon
              name={isProfit ? 'arrow-up-outline' : 'arrow-down-outline'}
              size={20}
              color={isProfit ? '#34C759' : '#E74C3C'}
              style={styles.icon}
            />}
          </View>

          <Text style={styles.sectionTitle}>Has</Text>
          <View style={styles.itemRow}>
            <TouchableOpacity onPress={() => openDrawer('has')} style={styles.addItemBlock}>
              <Icon name="add-outline" size={40} color="white" />
              <Text style={styles.itemText}>Add Item</Text>
            </TouchableOpacity>
            {hasItems?.map((item, index) => (
              <View key={index} style={styles.itemBlock}>
                {item ? (
                  <>
                    <Image
                      source={{ uri: `https://bloxfruitscalc.com/wp-content/uploads/2024/09/${formatName(item.Name)}_Icon.webp` }}
                      style={styles.itemImageOverlay}
                    />
                    <Text style={styles.itemText}>${item.usePermanent ? item.Permanent.toLocaleString() : item.Value.toLocaleString()}</Text>
                    <Text style={styles.itemText}>{item.Name}</Text>
                    {item.Type.toUpperCase() !== 'PREMIUM' && (
                      <TouchableOpacity style={styles.switchValue} onPress={() => toggleItemValueMode(index, 'has')}>
                        <Icon name="repeat-outline" size={14} />
                        <Text style={styles.switchValueText}>Physical</Text>
                      </TouchableOpacity>
                    )}


                    <TouchableOpacity onPress={() => removeItem(index, true)} style={styles.removeButton}>
                      <Icon name="close-outline" size={14} color="white" />
                    </TouchableOpacity>
                  </>
                ) : (
                  <Text style={styles.itemPlaceholder}>Empty</Text>
                )}
              </View>
            ))}
          </View>

          <View style={styles.divider}>
            <Icon name="swap-vertical-outline" size={24} color="white" />
          </View>

          <Text style={styles.sectionTitle}>Wants</Text>
          <View style={styles.itemRow}>
            <TouchableOpacity onPress={() => openDrawer('wants')} style={styles.addItemBlock}>
              <Icon name="add-outline" size={40} color="white" />
              <Text style={styles.itemText}>Add Item</Text>
            </TouchableOpacity>
            {wantsItems?.map((item, index) => (
              <View key={index} style={styles.itemBlock}>
                {item ? (
                  <>
                    <Image
                      source={{ uri: `https://bloxfruitscalc.com/wp-content/uploads/2024/09/${formatName(item.Name)}_Icon.webp` }}
                      style={styles.itemImageOverlay}
                    />
                    <Text style={styles.itemText}>${item.Value.toLocaleString()}</Text>
                    <Text style={styles.itemText}>{item.Name}</Text>
                    {item.Type.toUpperCase() !== 'PREMIUM' && (
                      <TouchableOpacity style={styles.switchValue} onPress={() => toggleItemValueMode(index, 'want')}>
                        <Icon name="repeat-outline" size={14} />
                        <Text style={styles.switchValueText}>Physical</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => removeItem(index, false)} style={styles.removeButton}>
                      <Icon name="close-outline" size={18} color="white" />
                    </TouchableOpacity>
                  </>

                ) : (
                  <Text style={styles.itemPlaceholder}>Empty</Text>
                )}
              </View>
            ))}
          </View>
          </ViewShot>
        </ScrollView>)}
      <TouchableOpacity onPress={isPro ?  handleSharewoAds :handleShare} style={styles.float}> 
        <Icon name="arrow-redo-circle" size={40} color='#E74C3C'/>
      </TouchableOpacity>
      
     <BannerAdWrapper/>
     
      <Modal
        visible={isDrawerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeDrawer}
      >
        <TouchableOpacity style={styles.modalOverlay} onPress={closeDrawer} />
        <View style={styles.drawerContainer}>
          <Text style={styles.titleText}>You can search fruite and select it</Text>
          <View style={{
            flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10,
          }}>

            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              value={searchText}
              onChangeText={setSearchText}
            />
            <TouchableOpacity onPress={closeDrawer} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>CLOSE</Text>
            </TouchableOpacity></View>
          <FlatList
            data={filteredData}
            keyExtractor={(item) => item.Name}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.itemBlock} onPress={() => selectItem(item)}>
                <>
                  <Image
                    source={{ uri: `https://bloxfruitscalc.com/wp-content/uploads/2024/09/${formatName(item.Name)}_Icon.webp` }}
                    style={styles.itemImageOverlay}
                  />
                  <Text style={styles.itemText}>${item.Value.toLocaleString()}</Text>
                  <Text style={styles.itemText}>{item.Name}</Text></>
              </TouchableOpacity>
            )}
            numColumns={3}
            contentContainerStyle={styles.flatListContainer}
            columnWrapperStyle={styles.columnWrapper}

          />
        </View>
      </Modal>
    </View>
    </GestureHandlerRootView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4E5465',
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
    backgroundColor: '#34C759',
  },
  wantsBox: {
    backgroundColor: '#E74C3C',
  },
  summaryText: {
    fontSize: 20,
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
    fontSize: 18,
    marginVertical: 10,
    fontFamily: 'Lato-Bold',
    color:'white'

  },
  itemRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 40,

  },
  addItemBlock: {
    width: '32%',
    height: 110,
    backgroundColor: '#3E8BFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 10,
  },
  itemBlock: {
    width: '32%',
    height: 110,
    backgroundColor: '#17202a',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 10,
    position: 'relative',
  },
  itemText: {
    color: 'white',
    textAlign: 'center',
    fontFamily: 'Lato-Bold',
  },
  itemPlaceholder: {
    color: 'white',
    textAlign: 'center',
    fontFamily:'Lato-Regular'
  },
  removeButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#E74C3C',
    borderRadius: 50,
    padding: 2,
  },
  divider: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4E5465',
    margin: 'auto',
    borderRadius: '50%',
    padding: 5,
  },
  drawerContainer: {
    backgroundColor: '#4E5465',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    paddingTop: 20,
    paddingHorizontal:10,
    height: 400,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },

  drawerTitle: {
    fontSize: 20,
    textAlign: 'center',
    fontFamily: 'Lato-Bold'
  },
  profitLossBox: { flexDirection: 'row', justifyContent: 'center', marginVertical: 10, alignItems: 'center' },
  profitLossText: { fontSize: 18, fontFamily: 'Lato-Bold', color:'white' },
  profitLossValue: { fontSize: 18, marginLeft: 5, fontFamily: 'Lato-Bold' },
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
    backgroundColor: '#E74C3C',
    padding: 10,
    borderRadius: 5,
    width: '22%',
    alignItems:'center',
    justifyContent:'center'
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
    width: 40,
    height: 40,
    borderRadius: 5,

  },
  switchValue: {
    backgroundColor: 'lightgreen',
    flexDirection: 'row',
    paddingVertical: 0,
    paddingHorizontal: 10,
    borderRadius: 20,
    margin:5,
    alignItems:'center'
  },
  switchValueText: {
    fontSize: 12,
    padding: 3,
    fontFamily: 'Lato-Regular'

  },
  captureButton: { backgroundColor: '#3E8BFC', padding: 10, borderRadius: 8, alignItems: 'center', marginTop: 20, alignSelf: 'center' },
  captureButtonText: { color: 'white', fontFamily: 'Lato-Bold', fontSize: 16 },
  captureView: { backgroundColor: '#fff', padding: 10, borderRadius: 10 },
  containerBannerAd: {
    position: 'absolute',
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center'
  },
  screenshotView: {
    padding: 10,
     flex:1,
     paddingVertical:20,
     backgroundColor:'#4E5465'
  },
  float:{
    position:'absolute',
    bottom:80,
    right:5,
    // top:,
    width:40,
    zIndex:1
    
  },
  titleText:{
    fontFamily:'Lato-Regular',
    fontSize:12,
    color:'white'
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  loaderText: {
    fontSize: 18,
    fontFamily: 'Lato-Bold',
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 18,
    color: 'gray',
    fontFamily: 'Lato-Bold',
  },
  
});