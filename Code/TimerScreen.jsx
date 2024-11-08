import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import getAdUnitId from './ads';


const bannerAdUnitId = getAdUnitId('banner');

const TimerScreen = ({ route }) => {
  const [normalTimer, setNormalTimer] = useState('');
  const [mirageTimer, setMirageTimer] = useState('');
  const { normalStock = [], mirageStock = [] } = route.params;

  const formatName = (name) => {
    let formattedName = name.replace(/^\+/, '');
    formattedName = formattedName.replace(/\s+/g, '-');
    return formattedName;
  };

  useEffect(() => {
    const calculateTimeLeft = (intervalHours) => {
      const now = new Date();
      let nextReset = new Date();
      nextReset.setHours(1, 0, 0, 0); // Start at 1 AM

      // Keep incrementing by the interval until we find the next reset time in the future
      while (nextReset <= now) {
        nextReset.setHours(nextReset.getHours() + intervalHours);
      }

      return Math.floor((nextReset - now) / 1000); // Return seconds until next reset
    };

    const startTimers = () => {
      const updateTimers = () => {
        setNormalTimer(formatTime(calculateTimeLeft(2))); // 2 hours for Normal
        setMirageTimer(formatTime(calculateTimeLeft(4))); // 4 hours for Mirage
      };

      updateTimers(); // Initial set
      const intervalId = setInterval(updateTimers, 1000); // Update every second

      return () => clearInterval(intervalId); // Cleanup on unmount
    };

    startTimers();
  }, []);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Image source={{ uri: `https://bloxfruitscalc.com/wp-content/uploads/2024/09/${formatName(item.Normal)}_Icon.webp` }} style={styles.icon} />
      <Text style={styles.name}>{item.Normal}</Text>
      <Text style={styles.price}>{item.price}</Text>
      <Text style={styles.robux}>{item.value}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.description}>
  Live Blox Fruits stock from Normal and Mirage dealers. Normal Stock updates every 4 hours, Mirage Stock every 2 hours, providing accurate, real-time data.
</Text>
<View style={styles.containerBannerAd}>
      <BannerAd
        unitId={bannerAdUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
      />
    </View>
      <FlatList
      showsVerticalScrollIndicator={false}
        data={[
          { header: 'Normal', timer: mirageTimer },
          ...normalStock, // First 3 items as Normal stock
          { header: 'Mirage', timer: normalTimer },
          ...mirageStock, // Remaining items as Mirage stock
        ]}
        keyExtractor={(item, index) => item.name || `header-${index}`}
        renderItem={({ item }) =>
          item.header ? (
            <View style={styles.flex}>
              <Text style={styles.title}>{item.header}</Text>
              <Text style={styles.timer}>Reset in: <Text style={styles.time}>{item.timer}</Text></Text>
            </View>
          ) : (
            renderItem({ item })
          )
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 , backgroundColor: '#F5F5F5' },
  header: { fontSize: 24, fontFamily:'Lato-Bold', marginBottom: 10 },
  title: { fontSize: 20, fontFamily:'Lato-Bold', },
  timer: { fontSize: 16 },
  time: { fontSize: 20, fontWeight:'bold' },
  itemContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 10, padding: 10, marginBottom: 10, elevation: 3 },
  icon: { width: 50, height: 50, borderRadius: 5, marginRight: 10 },
  name: { fontSize: 16, fontFamily:'Lato-Bold', flex: 1 },
  price: { fontSize: 14, fontFamily:'Lato-ragular', marginLeft: 10, backgroundColor:'green', paddingVertical:3, paddingHorizontal:5, borderRadius:5, color:'white' },
  robux: { fontSize: 14, fontFamily:'Lato-ragular', marginLeft: 10, backgroundColor:'green', paddingVertical:3, paddingHorizontal:5, borderRadius:5, color:'white'  },
  flex:{flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginVertical:20},
  description: {
    fontSize: 14, fontFamily:'Lato-ragular',
    lineHeight: 18,
    color: '#333',
    marginVertical: 10,
    fontFamily: 'Lato-Regular',

  },
  containerBannerAd: {
    justifyContent:'center',
    alignItems:'center',
    paddingVertical:5
  },
});

export default TimerScreen;
