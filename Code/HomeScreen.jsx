import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, FlatList, TextInput, Image, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { InterstitialAd, AdEventType, TestIds, BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import getAdUnitId from './ads';

const bannerAdUnitId = getAdUnitId('banner');
const interstitialAdUnitId = getAdUnitId('interstitial');


const interstitial = InterstitialAd.createForAdRequest(interstitialAdUnitId, {
  requestNonPersonalizedAdsOnly: true,
});


export default function HomeScreen({ route }) {
  const { data } = route.params;
  const fruitRecords = Object.values(data);

  const initialItems = [null, null];
  const [hasItems, setHasItems] = useState(initialItems);
  const [wantsItems, setWantsItems] = useState(initialItems);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [interactionCount, setInteractionCount] = useState(0);
  const [hasTotal, setHasTotal] = useState({ price: 0, value: 0 });
  const [wantsTotal, setWantsTotal] = useState({ price: 0, value: 0 });
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const [isShowingAd, setIsShowingAd] = useState(false);
  const [isConnected, setIsConnected] = useState(true); // Track network status
  const [adShown, setAdShown] = useState(false); // State to track if ad was shown


  useEffect(() => {
    try {
      interstitial.load();

      const onAdLoaded = () => {
        setIsAdLoaded(true);
      };

      const onAdClosed = () => {
        setIsAdLoaded(false);
        setIsShowingAd(false);
        try {
          interstitial.load(); // Reload the ad after it’s closed
        } catch (error) {
          console.error('Error loading interstitial ad:', error);
        }
      };

      const onAdError = (error) => {
        setIsAdLoaded(false);
        setIsShowingAd(false);
        console.error('Ad Error:', error);
      };

      const adLoadedListener = interstitial.addAdEventListener(AdEventType.LOADED, onAdLoaded);
      const adClosedListener = interstitial.addAdEventListener(AdEventType.CLOSED, onAdClosed);
      const adErrorListener = interstitial.addAdEventListener(AdEventType.ERROR, onAdError);

      return () => {
        adLoadedListener();
        adClosedListener();
        adErrorListener();
      };
    } catch (error) {
      console.error('Error initializing interstitial ad:', error);
    }
  }, []);

  const showInterstitialAd = () => {
    if (isAdLoaded && !isShowingAd) {
      try {
        setIsShowingAd(true);
        interstitial.show();
      } catch (error) {
        console.error('Error showing interstitial ad:', error);
        setIsShowingAd(false);
      }
    }
  };

  const openDrawer = (section) => {
  
    // Show ad only if the section is "wants" and ad hasn't been shown yet
    if (section === 'wants' && !adShown) {
      showInterstitialAd();
      setAdShown(true); // Mark the ad as shown
      return; // Exit early to prevent drawer from opening immediately
    }
  
    // Open the drawer for the specified section
    setSelectedSection(section);
    setIsDrawerVisible(true);
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
  
    // Use 0 if Biliprice is not a valid number
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


  return (
    <View style={styles.container}>
      <ScrollView style={{ marginBottom: 50 }} showsVerticalScrollIndicator={false}>
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
                    <Icon name="close-outline" size={14} color="white" />
                  </TouchableOpacity>
                </>

              ) : (
                <Text style={styles.itemPlaceholder}>Empty</Text>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
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
    height: 100,
    backgroundColor: '#3E8BFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 10,
  },
  itemBlock: {
    width: '32%',
    height: 100,
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent red
    flex: 1,
  },
  searchInput: {
    width: '80%',
    borderColor: 'grey',
    borderWidth: 1,
    borderRadius: 5,
    height: 40,
    borderColor: '#333',       // Border color for visibility
    borderWidth: 1,            // Set border width
    borderRadius: 5,           // Rounded corners
    paddingHorizontal: 10,     // Padding inside the TextInput
    backgroundColor: '#fff',   // Background color
    color: '#000',             //
  },
  closeButton: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
    width: '18%'
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
    borderRadius: 20
  },
  switchValueText: {
    fontSize: 12,
    paddingHorizontal: 3,
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
    alignSelf:'center'
  },

});