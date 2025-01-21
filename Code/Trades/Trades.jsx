import React, { useEffect, useMemo, useState } from 'react';
import { View, FlatList, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { getDatabase, ref, onValue } from 'firebase/database';
import Icon from 'react-native-vector-icons/Ionicons';
import moment from 'moment'; // Install moment.js for formatting timestamps
import { useGlobalState } from '../GlobelStats';
import config from '../Helper/Environment';

const TradeList = ({ navigation }) => {
  const [trades, setTrades] = useState([]);
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
    });
  }, []);

  const styles = useMemo(() => getStyles(isDarkMode), [isDarkMode]);


  const renderTrade = ({ item }) => {
    const formattedTime = moment(item.timestamp).fromNow();

    return (
      <View
        style={styles.tradeItem}
        onPress={() => navigation.navigate('TradeChat', { tradeId: item.id })}
      >
        {/* Trader Info */}
        <View style={styles.tradeHeader}>
          <Text style={styles.traderName}>{item.traderName}</Text>
          <Text style={styles.tradeTime}>{formattedTime}</Text>
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
  source={require('../../assets/transfer.png')} // Correct usage of require() for local images
  style={styles.transferImage}
/></View>

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

        {/* Trade Totals */}
        <View style={styles.tradeTotals}>
          <Text style={styles.priceText}>{formatValue(item.hasTotal.price)}</Text>
          <View style={styles.transfer}></View>
          <Text style={styles.priceText}>{formatValue(item.wantsTotal.price)}</Text>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity>
        <View style={styles.tradeActions}>
          <Icon name="chatbox-outline" size={20} color="#007BFF" />
          <Text style={styles.actionText}>Send Message</Text>
        </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <FlatList
      data={trades}
      renderItem={renderTrade}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
    />
  );
};
const getStyles = (isDarkMode) =>
StyleSheet.create({
  container: {
    padding: 8,
    backgroundColor: isDarkMode ? '#121212' : '#f2f2f7',
  },
  tradeItem: {
    padding: 15,
    marginBottom: 10,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  tradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom:10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  traderName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  tradeTime: {
    fontSize: 12,
    color: '#666',
  },
  tradeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  itemList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent:'space-evenly',
    width:"40%",
    marginVertical:10
  },
  itemImage: {
    width: 30,
    height: 30,
    // marginRight: 5,
    borderRadius: 5,
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
    // marginBottom: 10,
    width:'100%'

  },
  priceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007BFF',
    width: '40%',
    textAlign: 'center', // Centers text within its own width
    alignSelf: 'center', // Centers within the parent container
  },
  
  tradeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop:10,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  actionText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#007BFF',
  },
  transfer:{
    width:'20%',
    justifyContent:'center',
    alignItems:'center'
  }
});

export default TradeList;
