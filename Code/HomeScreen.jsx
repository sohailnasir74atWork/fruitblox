import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, FlatList, TextInput, Image, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { InterstitialAd, AdEventType, TestIds, BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import getAdUnitId from './ads';
import ViewShot, { captureRef } from 'react-native-view-shot';
import RNFS from 'react-native-fs';  
import Share from 'react-native-share'; 
import { useGlobalState } from './GlobelStats';

const bannerAdUnitId = getAdUnitId('banner');
const interstitialAdUnitId = getAdUnitId('interstitial');
const interstitial = InterstitialAd.createForAdRequest(interstitialAdUnitId, {
  requestNonPersonalizedAdsOnly: true,
});

export default function HomeScreen() {
  const { data } = useGlobalState();
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
  const [hasAdBeenShown, setHasAdBeenShown] = useState(false);
    const [loading, setLoading] = useState(true); 
  const viewRef = useRef();
  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      setFruitRecords(Object.values(data));
      setLoading(false)
    } else {
      setFruitRecords([]);
    }
  }, [data]);

  // Interstitial ad logic
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
  
  const openDrawer = (section) => {
    // Show ad only if it's the "wants" section and the ad hasn't been shown yet
    if (section === 'wants' && !hasAdBeenShown) {
      showInterstitialAd(() => {
        setHasAdBeenShown(true); // Mark the ad as shown
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

  const filteredData = fruitRecords.filter((item) =>
    item.Name.toLowerCase().includes(searchText.toLowerCase())
  );

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
      console.log('Error capturing screenshot:', error);
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


  return (
    <View style={styles.container}>
      {loading ? (
      <View style={styles.loaderContainer}>
        <Text style={styles.loaderText}>Loading...</Text>
      </View>
    ) : (
        <ScrollView style={{ marginBottom: 50 }} showsVerticalScrollIndicator={false}>
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
            <Text style={[styles.profitLossValue, { color: isProfit ? 'green' : 'red' }]}>
              ${Math.abs(profitLoss).toLocaleString()}
            </Text>
            {!neutral && <Icon
              name={isProfit ? 'arrow-up-outline' : 'arrow-down-outline'}
              size={20}
              color={isProfit ? 'green' : 'red'}
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
      <TouchableOpacity onPress={shareScreenshot} style={styles.float}> 
        <Icon name="download" size={28} color='#4E5465'/>
      </TouchableOpacity>
      <View style={styles.containerBannerAd}>
        <BannerAd
          unitId={bannerAdUnitId}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
        />
      </View>
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
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9f9f9',
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
    backgroundColor: '#FF3B30',
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
    backgroundColor: '#4E5465',
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
    color: '#CCC',
    textAlign: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#FF3B30',
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
    backgroundColor: 'white',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    padding: 20,
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
  profitLossText: { fontSize: 18, fontFamily: 'Lato-Bold' },
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
    backgroundColor: 'red',
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
     backgroundColor:'white',
     paddingVertical:20
  },
  float:{
    position:'absolute',
    bottom:50,
    right:0,
    top:-43,
    width:40,
    zIndex:1
    
  },
  titleText:{
    fontFamily:'Lato-Regular',
    fontSize:12
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
    backgroundColor: '#f9f9f9',
  },
  noDataText: {
    fontSize: 18,
    color: 'gray',
    fontFamily: 'Lato-Bold',
  },
  
});