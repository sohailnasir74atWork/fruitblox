import React, { useEffect, useMemo, useState } from 'react';
import { View, FlatList, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator, TextInput } from 'react-native';
import { getDatabase, ref, onValue } from 'firebase/database';
import Icon from 'react-native-vector-icons/Ionicons';
import moment from 'moment'; // Install moment.js for formatting timestamps
import { useGlobalState } from '../GlobelStats';
import config from '../Helper/Environment';

const TradeList = ({ navigation }) => {
  const [trades, setTrades] = useState([]);
  const [filteredTrades, setFilteredTrades] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const {theme} = useGlobalState()
  const isDarkMode = theme === 'dark'
  const formatName = (name) => {
    let formattedName = name.replace(/^\+/, '');
    formattedName = formattedName.replace(/\s+/g, '-');
    return formattedName;
  };

  const formatValue = (value) => {
    return value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : value.toLocaleString();
  };
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredTrades(trades);
    } else {
      const lowerCaseQuery = searchQuery.toLowerCase();
      const filtered = trades.filter((trade) =>
        trade.wantsItems?.some((item) => item.name.toLowerCase().includes(lowerCaseQuery))
      );
      setFilteredTrades(filtered);
    }
  }, [searchQuery, trades]);


  useEffect(() => {
    const db = getDatabase();
    const tradeRef = ref(db, 'trades/');
    onValue(tradeRef, (snapshot) => {
      const data = snapshot.val();
      const tradeList = data
        ? Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }))
        : [];
      setTrades(tradeList);
      setFilteredTrades(tradeList);
      setLoading(false);
    });
  }, []);

  const styles = useMemo(() => getStyles(isDarkMode), [isDarkMode]);

  const renderTrade = ({ item }) => {
    const formattedTime = moment(item.timestamp).fromNow();
  
    // Determine if the trade is fair or not
    const isFairTrade = (hasTotal, wantsTotal) => {
      const lowerBound = hasTotal * 0.9;
      const upperBound = hasTotal * 1.1;
      return wantsTotal >= lowerBound && wantsTotal <= upperBound;
    };
  // console.log(item)
    const getTradeStatus = (hasTotal, wantsTotal) => {
      const lowerBound = hasTotal * 0.9;
      const upperBound = hasTotal * 1.1;
    
      if (wantsTotal >= lowerBound && wantsTotal <= upperBound) {
        return 'Fair';
      } else if (wantsTotal < upperBound) {
        return 'Good';
      } else {
        return 'Bad';
      }
    };

    
    // In renderTrade
    const tradeStatus = getTradeStatus(item.hasTotal.price, item.wantsTotal.price);  
    return (
      <View
        style={styles.tradeItem}
        onPress={() => navigation.navigate('TradeChat', { tradeId: item.id })}
      >
        {/* Trader Info */}
        <View style={styles.tradeHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image
              source={{
                uri: item.avatar
              }}
              style={styles.itemImageUser}
            />
            <Text style={styles.traderName}>{item.traderName}</Text>
          </View>
          <Text style={styles.tradeTime}>{formattedTime}</Text>
        </View>

        {/* Trade Totals */}
        <View style={styles.tradeTotals}>
          <Text style={[styles.priceText, styles.hasBackground]}>Has: {formatValue(item.hasTotal.price)}</Text>
          <View style={styles.transfer}>
           
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
        <TouchableOpacity>
          <View style={styles.tradeActions}>
            <Icon name="chatbox-outline" size={14} color={config.colors.hasBlockGreen} />
            <Text style={[styles.actionText]}>Send Message</Text>
          </View>
        </TouchableOpacity>
        <Text style={{
            color:
              tradeStatus === 'Fair'
                ? config.colors.white
                : tradeStatus === 'Good'
                ? config.colors.hasBlockGreen
                : config.colors.wantBlockRed
          }}>{tradeStatus}</Text>
        </View>
      </View>
    );
  };
  if (loading) {
    return <ActivityIndicator style={styles.loader} size="large" color="#007BFF" />;
  }

  
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search trades by wanted items..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholderTextColor={isDarkMode ? '#666' : '#aaa'}
      />
    
    <FlatList
      data={trades}
      renderItem={renderTrade}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{paddingBottom:60}}
    />
    </View>
  );
};
const getStyles = (isDarkMode) =>
StyleSheet.create({
  container: {
    padding: 8,
    backgroundColor: isDarkMode ? '#121212' : 'lightgrey',
  },
  tradeItem: {
    padding: 10,
    marginBottom: 10,
    backgroundColor: isDarkMode ? config.colors.primary: 'white' ,
    borderRadius: 10,
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
  },
  tradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems:'center',
    marginBottom: 10,
    paddingBottom:10,
    borderBottomWidth: 1,
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
    width: 50,
    height: 50,
    // marginRight: 5,
    borderRadius: 25,
    marginVertical:5

  },
  itemImageUser: {
    width: 20,
    height: 20,
    // marginRight: 5,
    borderRadius: 10,
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
    paddingHorizontal:10,
    paddingVertical:5,
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
    color: '#007BFF',
    color: config.colors.hasBlockGreen

  },
  transfer:{
    width:'20%',
    justifyContent:'center',
    alignItems:'center'
  },
  actionButtons:{
    flexDirection: 'row', alignItems: 'flex-end', justifyContent:'space-between',  borderTopWidth: 1,
    borderColor: 'lightgrey', marginTop:10, paddingTop:10
  },
  description:{
    color: isDarkMode ? 'lightgrey' : "grey",
    fontFamily:'Lato-Regular',
    fontSize:10
  }
});

export default TradeList;
