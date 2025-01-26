import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, FlatList, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator, TextInput, Alert } from 'react-native';
import { getDatabase, ref, onValue, remove, set, get } from 'firebase/database';
import Icon from 'react-native-vector-icons/Ionicons';
import moment from 'moment'; // Install moment.js for formatting timestamps
import { useGlobalState } from '../GlobelStats';
import config from '../Helper/Environment';
import { useNavigation } from '@react-navigation/native';
import { isUserOnline } from '../ChatScreen/utils';
import { AdEventType, BannerAd, BannerAdSize, InterstitialAd } from 'react-native-google-mobile-ads';
import getAdUnitId from '../Ads/ads';
import { query, orderByKey, limitToLast, endAt } from 'firebase/database';
import { FilterMenu } from './tradeHelpers';
import ReportTradePopup from './ReportTradePopUp';
import SignInDrawer from '../Firebase/SigninDrawer';


const bannerAdUnitId = getAdUnitId('banner');
const interstitialAdUnitId = getAdUnitId('interstitial');
const interstitial = InterstitialAd.createForAdRequest(interstitialAdUnitId);
const TradeList = ({route}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdVisible, setIsAdVisible] = useState(true);
  const {selectedTheme} = route.params
  const {user} = useGlobalState()
  const [trades, setTrades] = useState([]);
  const [filteredTrades, setFilteredTrades] = useState([]);
const [loading, setLoading] = useState(false);
const [refreshing, setRefreshing] = useState(false);
const [lastKey, setLastKey] = useState(null);
const [hasMore, setHasMore] = useState(true);
const [filterType, setFilterType] = useState('');
const [isAdLoaded, setIsAdLoaded] = useState(false);
const [isShowingAd, setIsShowingAd] = useState(false);
const [isReportPopupVisible, setReportPopupVisible] = useState(false);
const PAGE_SIZE = 20; // Number of items to load per page
const [isSigninDrawerVisible, setIsSigninDrawerVisible] = useState(false);

const [selectedTrade, setSelectedTrade] = useState(null);
  const navigation = useNavigation()
  const {theme} = useGlobalState()
  const isDarkMode = theme === 'dark'
  const formatName = (name) => {
    let formattedName = name.replace(/^\+/, '');
    formattedName = formattedName.replace(/\s+/g, '-');
    return formattedName;
  };
  const handleReportTrade = (trade) => {
    setSelectedTrade(trade);
    setReportPopupVisible(true);
  };
  
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


  const handleDelete = useCallback(async (item) => {
    try {
      const db = getDatabase();
      const tradeRef = ref(db, `trades/${item.id}`);
      await set(tradeRef, null);
      setTrades((prev) => prev.filter((trade) => trade.id !== item.id));
      setFilteredTrades((prev) => prev.filter((trade) => trade.id !== item.id));
      Alert.alert('Success', 'Trade deleted successfully!');
    } catch (error) {
      console.error('Error deleting trade:', error);
      Alert.alert('Error', 'Failed to delete the trade. Please try again.');
    }
  }, []);
  
  
  const formatValue = (value) => {
    return value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : value.toLocaleString();
  };
  useEffect(() => {
    const lowerCaseQuery = searchQuery.trim().toLowerCase();
  
    if (filterType === 'hasItems') {
      setFilteredTrades(
        trades.filter((trade) =>
          trade.hasItems?.some((item) => item.name.toLowerCase().includes(lowerCaseQuery))
        )
      );
    } else if (filterType === 'wantsItems') {
      setFilteredTrades(
        trades.filter((trade) =>
          trade.wantsItems?.some((item) => item.name.toLowerCase().includes(lowerCaseQuery))
        )
      );
    } else if (filterType === 'myTrades') {
      setFilteredTrades(trades.filter((trade) => trade.userId === user.id));
    } else {
      setFilteredTrades(trades);
    }
  }, [searchQuery, trades, filterType]);
  
  const fetchTrades = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      const db = getDatabase();
      const tradeRef = ref(db, 'trades/');
      const queryRef = reset || !lastKey
        ? query(tradeRef, orderByKey(), limitToLast(PAGE_SIZE))
        : query(tradeRef, orderByKey(), endAt(lastKey), limitToLast(PAGE_SIZE + 1));
  
      const snapshot = await get(queryRef);
      const data = snapshot.val();
      if (data) {
        const tradeList = Object.keys(data)
          .map((key) => ({ id: key, ...data[key] }))
          .sort((a, b) => b.timestamp - a.timestamp); // Sort by timestamp (newest first)
  
        if (reset) {
          setTrades(tradeList); // Replace trades during reset
        } else {
          setTrades((prev) => {
            const existingIds = new Set(prev.map((trade) => trade.id));
            const uniqueTrades = tradeList.filter((trade) => !existingIds.has(trade.id));
            return [...prev, ...uniqueTrades];
          });
        }
  
        setFilteredTrades((prev) => {
          if (reset) {
            return tradeList; // Replace filteredTrades during reset
          } else {
            const existingIds = new Set(prev.map((trade) => trade.id));
            const uniqueTrades = tradeList.filter((trade) => !existingIds.has(trade.id));
            return [...prev, ...uniqueTrades];
          }
        });
  
        if (tradeList.length > 0) {
          setLastKey(tradeList[tradeList.length - 1].id);
          setHasMore(tradeList.length >= PAGE_SIZE);
        }
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching trades:', error);
      Alert.alert('Error', 'Unable to fetch trades.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [lastKey]);
  
  
  
  
  const handleRefresh = () => {
    setRefreshing(true);
    fetchTrades(true); // Fetch the latest data and reset the list
  };
  
  const handleLoadMore = () => {
    if (loading || !hasMore) return; // Prevent duplicate loads
    fetchTrades(); // Fetch additional trades without resetting
  };
  
  useEffect(() => {
    fetchTrades(true); // Fetch the latest data and reset the list on component mount
  }, []);
  
      
  
  const styles = useMemo(() => getStyles(isDarkMode), [isDarkMode]);
  const searchText = useMemo(() => {
    switch (filterType) {
      case 'wantsItems':
        return 'Search by Wants Item';
      case 'hasItems':
        return 'Search by Has Item';
      case 'myTrades':
        return 'My Trades';
      default:
        return 'Search by Wants Item';
    }
  }, [filterType]);
  const renderTrade = ({ item }) => {
    const formattedTime = moment(item.timestamp).fromNow();
  
    // Determine if the trade is fair or not
   
  // console.log(item)
  const getTradeStatus = (hasTotal, wantsTotal) => {
    const lowerBound = hasTotal * 0.85; // 90% of hasTotal
    const upperBound = hasTotal * 1.15; // 110% of hasTotal
    const bestBound = hasTotal * 0.70;  // 80% of hasTotal for "Best"
    const worstBound = hasTotal * 1.3; // 120% of hasTotal for "Worst"
  
    if (wantsTotal >= lowerBound && wantsTotal <= upperBound) {
      return 'Fair';
    } else if (wantsTotal < bestBound) {
      return 'Best'; // Wants total is much lower than has total
    } else if (wantsTotal < lowerBound) {
      return 'Good'; // Wants total is slightly lower than has total
    } else if (wantsTotal > worstBound) {
      return 'Worst'; // Wants total is far higher than has total
    } else {
      return 'Poor'; // Wants total is slightly higher than has total
    }
  };
  
    // console.log(item)
    // In renderTrade
    const tradeStatus = getTradeStatus(item.hasTotal.price, item.wantsTotal.price);
    
    const handleChatNavigation = async () => {
      try {
        const isOnline = await isUserOnline(item.userId); // Resolve the promise

        showInterstitialAd(() => {


          if (!user.id) {
            setIsSigninDrawerVisible(true)
             return;
           }


          navigation.navigate('PrivateChatTrade', {
            selectedUser: {
              senderId: item.userId,
              sender: item.traderName,
              avatar: item.avatar,
            },
            isOnline,
        });
        });

      } catch (error) {
        console.error('Error navigating to PrivateChat:', error);
        Alert.alert('Error', 'Unable to navigate to the chat. Please try again later.');
      }
    };





    
    return (
      <View
        style={styles.tradeItem}>
        {/* Trader Info */}
        <View style={styles.tradeHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image
              source={{
                uri: item.avatar
              }}
              style={styles.itemImageUser}
            />
            <View style={{  justifyContent: 'center'}}>
            <Text style={styles.traderName}>{item.traderName}</Text>
            <Text style={styles.tradeTime}>{formattedTime}</Text>
            </View>
          </View>
          <Icon
  name="flag-outline"
  size={18}
  color={'grey'}
  onPress={() => handleReportTrade(item)}
/>
        </View>

        {/* Trade Totals */}
        <View style={styles.tradeTotals}>
          <Text style={[styles.priceText, styles.hasBackground]}>Has: {formatValue(item.hasTotal.price)}</Text>
          <View style={styles.transfer}>
          {item.userId === user.id && <Icon
  name="trash-outline"
  size={18}
  color={config.colors.wantBlockRed}
  onPress={() => handleDelete(item)} // Call handleDelete
/>}
          </View>
          <Text style={[styles.priceText, styles.wantBackground]}>Want: {formatValue(item.wantsTotal.price)}</Text>
        </View>
  
        {/* Trade Items */}
        <View style={styles.tradeDetails}>
          <View style={styles.itemList}>
            {item.hasItems?.map((hasItem, index) => (
              <Image
                key={index}
                source={{
                  uri: `https://bloxfruitscalc.com/wp-content/uploads/2024/09/${formatName(
                    hasItem.name
                  )}_Icon.webp`,
                }}
                style={styles.itemImage}
              />
            ))}
          </View>
          <View style={styles.transfer}>
            <Image
              source={require('../../assets/transfer.png')}
              style={styles.transferImage}
            />
          </View>
          <View style={styles.itemList}>
            {item.wantsItems?.map((wantsItem, index) => (
              <Image
                key={index}
                source={{
                  uri: `https://bloxfruitscalc.com/wp-content/uploads/2024/09/${formatName(
                    wantsItem.name
                  )}_Icon.webp`,
                }}
                style={styles.itemImage}
              />
            ))}
          </View>
        </View>
  
        {item.description  && <Text style={styles.description}>Note: {item.description}</Text>}
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
        <TouchableOpacity  onPress={handleChatNavigation}>
          <View style={styles.tradeActions}>
            <Icon name="chatbox-outline" size={14} color={config.colors.hasBlockGreen}  style={{ textShadowColor: isDarkMode ? '#000000AA' : '#FFFFFFAA', // Dark Mode: Black shadow, Light Mode: White shadow
  textShadowOffset: { width: 1, height: 1 }, // Offset the shadow slightly
  textShadowRadius: 3}}/>
            <Text style={[styles.actionText]}>Send Message</Text>
          </View>
        </TouchableOpacity>
        <Text
 style={{
  fontFamily: 'Lato-Regular',
  fontSize: 12,
  lineHeight:14,
  color:
    tradeStatus === 'Fair'
      ? isDarkMode
        ? '#F5F5F5'
        : '#121212' // Light: Dark Gray, Dark: Light Gray
      : tradeStatus === 'Good'
      ? config.colors.hasBlockGreen // Fixed green for "Good"
      : tradeStatus === 'Poor'
      ? config.colors.wantBlockRed // Fixed red for "Poor"
      : tradeStatus === 'Best'
      ? isDarkMode
        ? '#FFD700'
        : '#DAA520' // Light: Goldenrod, Dark: Gold
      : isDarkMode
      ? 'lightpink'
      : '#8B0000', // Light: Firebrick, Dark: DarkRed for "Worst",
  
}}

>
  {tradeStatus} Deal
</Text>

        </View>
      </View>
    );
  };
  if (loading) {
    return <ActivityIndicator style={styles.loader} size="large" color="#007BFF" />;
  }

 
  return (
    <View style={styles.container}>
      <View style={{ flexDirection:'row', alignItems:'center'}}>
      <TextInput
        style={styles.searchInput}
        placeholder={searchText}
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholderTextColor={isDarkMode ? 'white' : '#aaa'}
      />
      <FilterMenu setFilterType={setFilterType} currentFilter={filterType} />
    </View>
    <FlatList
  data={filteredTrades}
  renderItem={renderTrade}
  keyExtractor={(item) => item.id}
  showsVerticalScrollIndicator={false}
  contentContainerStyle={{ paddingBottom: 20 }}
  onEndReached={handleLoadMore}
  onEndReachedThreshold={0.5}
  onRefresh={handleRefresh}
  refreshing={refreshing}
  ListFooterComponent={
    hasMore && !loading ? (
      <TouchableOpacity style={styles.loadMoreButton} onPress={handleLoadMore}>
        <Text style={styles.loadMoreText}>Load More</Text>
      </TouchableOpacity>
    ) : loading && hasMore ? (
      <ActivityIndicator size="small" color="#007BFF" />
    ) : null
  }
/>


<ReportTradePopup
  visible={isReportPopupVisible}
  trade={selectedTrade}
  onClose={() => setReportPopupVisible(false)}
/>

<SignInDrawer
            visible={isSigninDrawerVisible}
            onClose={() => setIsSigninDrawerVisible(false)}
            selectedTheme={selectedTheme}
            message='To create trade, you need to sign in'

          />

      <View style={{ alignSelf: 'center' }}>
  {isAdVisible && (
    <BannerAd
      unitId={bannerAdUnitId}
      size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      onAdLoaded={() => setIsAdVisible(true)} 
      onAdFailedToLoad={() => setIsAdVisible(false)} 
    />
  )}
</View>
    </View>
  );
};
const getStyles = (isDarkMode) =>
StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    backgroundColor: isDarkMode ? '#121212' : '#f2f2f7',
    flex:1
  },
  tradeItem: {
    padding: 10,
    marginBottom: 10,
    backgroundColor: isDarkMode ? config.colors.primary : 'white',
    borderRadius: 10, // Ensure smooth corners
    shadowColor: '#000', // Shadow color for iOS
    shadowOffset: { width: 0, height: 0 }, // Positioning of the shadow
    shadowOpacity: 0.2, // Opacity for iOS shadow
    shadowRadius: 2, // Spread of the shadow
    elevation: 2, // Elevation for Android (4-sided shadow)
  },
  
  searchInput: {
    height: 48,
    borderColor: isDarkMode ? config.colors.primary: 'white' ,
    backgroundColor: isDarkMode ? config.colors.primary: 'white' ,
    borderWidth: 1,
    borderRadius: 5,
    marginVertical: 8,
    paddingHorizontal: 10,
    color: isDarkMode ? 'white' : 'black',
    flex:1,
    borderRadius: 10, // Ensure smooth corners
    shadowColor: '#000', // Shadow color for iOS
    shadowOffset: { width: 0, height: 0 }, // Positioning of the shadow
    shadowOpacity: 0.2, // Opacity for iOS shadow
    shadowRadius: 2, // Spread of the shadow
    elevation: 2, // Elevation for Android (4-sided shadow)
  },
  tradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems:'center',
    marginBottom: 10,
    paddingBottom:10,
    // borderBottomWidth: 1,
    borderColor: 'lightgrey',
    color: isDarkMode ? 'white' : "black",
  },
  traderName: {
    fontFamily: 'Lato-Bold',
    fontSize: 12,
    color: isDarkMode ? 'white' : "black",

  },
  tradeTime: {
    fontSize: 10,
    color: '#666',
    color:'lightgrey'

  },
  tradeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    color: isDarkMode ? 'white' : "black",


  },
  itemList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent:'space-evenly',
    width:"40%",
    paddingVertical:15,
  },
  itemImage: {
    width: 45,
    height: 45,
    // marginRight: 5,
    // borderRadius: 25,
    marginVertical:5

  },
  itemImageUser: {
    width: 30,
    height: 30,
    // marginRight: 5,
    borderRadius: 15,
    marginRight:5,
    backgroundColor:'white'
  },
  transferImage: {
    width: 20,
    height: 20,
    // marginRight: 5,
    borderRadius: 5,
  },
  tradeTotals: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    width:'100%'

  },
  priceText: {
    fontSize: 14,
    fontFamily: 'Lato-Bold',
    color: '#007BFF',
    // width: '40%',
    textAlign: 'center', // Centers text within its own width
    alignSelf: 'center', // Centers within the parent container
    color: isDarkMode ? 'white' : "white",
    marginHorizontal:'auto',
    paddingHorizontal:7,
    paddingVertical:3,
    borderRadius:3
  },
  hasBackground:{
    backgroundColor:config.colors.hasBlockGreen,
  },
  wantBackground:{
    backgroundColor:config.colors.wantBlockRed,
  },
  tradeActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    marginLeft: 5,
    fontSize: 14,
    color: config.colors.hasBlockGreen,
    textShadowColor: isDarkMode ? '#000000AA' : '#FFFFFFAA', // Dark Mode: Black shadow, Light Mode: White shadow
  textShadowOffset: { width: 1, height: 1 }, // Offset the shadow slightly
  textShadowRadius: 3, // Blur effect for the shadow

  },
  transfer:{
    width:'20%',
    justifyContent:'center',
    alignItems:'center'
  },
  actionButtons:{
    flexDirection: 'row', alignItems: 'flex-end', justifyContent:'space-between', 
    borderColor: 'lightgrey', marginTop:10, paddingTop:10
  },
  description:{
    color: isDarkMode ? 'lightgrey' : "grey",
    fontFamily:'Lato-Regular',
    fontSize:10
  },
  loader:{
    flex:1
  }
});

export default TradeList;
