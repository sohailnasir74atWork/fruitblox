import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Image } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import getAdUnitId from './ads';
import { useGlobalState } from './GlobelStats';

const bannerAdUnitId = getAdUnitId('banner');

const TimerScreen = () => {
  const [normalTimer, setNormalTimer] = useState('');
  const [mirageTimer, setMirageTimer] = useState('');
  const { normalStock, mirageStock } = useGlobalState();

  // Utility function to format time
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate time left for resets
  const calculateTimeLeft = (intervalHours) => {
    const now = new Date();
    let nextReset = new Date();
    nextReset.setHours(1, 0, 0, 0); // Start at 1 AM

    while (nextReset <= now) {
      nextReset.setHours(nextReset.getHours() + intervalHours);
    }

    return Math.floor((nextReset - now) / 1000); // Return seconds until next reset
  };

  // Start timers and update them
  useEffect(() => {
    const updateTimers = () => {
      setNormalTimer(formatTime(calculateTimeLeft(2))); // 2-hour interval for Normal
      setMirageTimer(formatTime(calculateTimeLeft(4))); // 4-hour interval for Mirage
    };

    updateTimers(); // Initial set
    const timerId = setInterval(updateTimers, 1000); // Update every second

    return () => clearInterval(timerId); // Cleanup on unmount
  }, []);

  // Format name utility
  const formatName = (name) => name.replace(/^\+/, '').replace(/\s+/g, '-');

  // Prepare data for FlatList
  const listData = useMemo(() => [
    { header: 'Normal', timer: normalTimer },
    ...normalStock,
    { header: 'Mirage', timer: mirageTimer },
    ...mirageStock,
  ], [normalStock, mirageStock, normalTimer, mirageTimer]);

  // Render stock items
  const renderItem = ({ item }) => {
    if (item.header) {
      return (
        <View style={styles.headerContainer}>
          <Text style={styles.title}>{item.header}</Text>
          <Text style={styles.timer}>
            Reset in: <Text style={styles.time}>{item.timer}</Text>
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.itemContainer}>
        <Image
          source={{
            uri: `https://bloxfruitscalc.com/wp-content/uploads/2024/09/${formatName(item.Normal)}_Icon.webp`,
          }}
          style={styles.icon}
        />
        <Text style={styles.name}>{item.Normal}</Text>
        <Text style={styles.price}>{item.price}</Text>
        <Text style={styles.robux}>{item.value}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.description}>
        Live Blox Fruits stock from Normal and Mirage dealers. Normal Stock updates every 4 hours, Mirage Stock every 2 hours, providing accurate, real-time data.
      </Text>

      <View style={styles.containerBannerAd}>
        <BannerAd
          unitId={bannerAdUnitId}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        />
      </View>

      <FlatList
        data={listData}
        keyExtractor={(item, index) => item.header || item.Normal || `item-${index}`}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<Text style={styles.header}>Blox Fruits Stock</Text>}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#F5F5F5' },
  header: { fontSize: 24, fontFamily: 'Lato-Bold', marginBottom: 10 },
  title: { fontSize: 20, fontFamily: 'Lato-Bold' },
  timer: { fontSize: 16 },
  time: { fontSize: 20, fontWeight: 'bold' },
  description: {
    fontSize: 14,
    fontFamily: 'Lato-Regular',
    lineHeight: 18,
    color: '#333',
    marginVertical: 10,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    elevation: 1,
  },
  icon: { width: 50, height: 50, borderRadius: 5, marginRight: 10 },
  name: { fontSize: 16, fontFamily: 'Lato-Bold', flex: 1 },
  price: {
    fontSize: 14,
    fontFamily: 'Lato-Regular',
    marginLeft: 10,
    backgroundColor: 'green',
    paddingVertical: 3,
    paddingHorizontal: 5,
    borderRadius: 5,
    color: 'white',
  },
  robux: {
    fontSize: 14,
    fontFamily: 'Lato-Regular',
    marginLeft: 10,
    backgroundColor: 'green',
    paddingVertical: 3,
    paddingHorizontal: 5,
    borderRadius: 5,
    color: 'white',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 20,
  },
  containerBannerAd: { justifyContent: 'center', alignItems: 'center', paddingVertical: 5 },
  listContent: { paddingBottom: 20 },
});

export default TimerScreen;
