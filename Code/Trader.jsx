import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';  
import image from './Assets/market.jpg'; 

const UpcomingFeaturesScreen = () => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
              <Text style={styles.title}>Comming Soon</Text>

      <Image source={image} style={styles.image} />

      <Text style={styles.subtitle}>We are working on some amazing features - Stay Tuned</Text>

      <View style={styles.featuresList}>
        <View style={styles.featureItem}>
          <Ionicons name="storefront" size={24} color="#FF2D55" />
          <Text style={styles.featureText}>Community Trade Offers</Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="swap-horizontal" size={24} color="#00C7BE" />
          <Text style={styles.featureText}>Automated Trade Matching</Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="star" size={24} color="#007AFF" />
          <Text style={styles.featureText}>Loyalty Point System</Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="person" size={24} color="#5856D6" />
          <Text style={styles.featureText}>User Profile and Reputation Badge</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
    marginBottom: 20,
    borderRadius: 10,
    paddingVertical:10
  },
  title: {
    fontFamily: 'Lato-Bold',
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 10,
    paddingVertical:20
  },
  subtitle: {
    fontFamily: 'Lato-Regular',
    fontSize: 16,
    textAlign: 'left',
    marginBottom: 20,
  },
  featuresList: {
    width: '100%',
    paddingVertical:10
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical:2
  },
  featureText: {
    fontFamily: 'Lato-Regular',
    fontSize: 18,
    marginLeft: 10,
  },
});

export default UpcomingFeaturesScreen;
