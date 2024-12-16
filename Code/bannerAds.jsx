import React, { useState } from 'react';
import { View } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import getAdUnitId from './ads';
import { useGlobalState } from './GlobelStats';

const BannerAdWrapper = () => {
  const {isPro}  = useGlobalState()
  const [adVisible, setAdVisible] = useState(true); // Track ad visibility

  if (isPro) {
    // console.log('Pro user detected. Banner ads will not be shown.');
    return null; // Completely omit the banner ad and its container for Pro users
  }

  return (
    adVisible && (
      <View style={{ alignItems: 'center' }}>
        <BannerAd
          unitId={getAdUnitId('banner')} // Replace with your actual ad unit ID in production
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true, // Optional: Add ad request options
          }}
          onAdFailedToLoad={(error) => {
            console.error('Banner Ad Error:', error);
            setAdVisible(false); // Hide ad if loading fails
          }}
          onAdLoaded={() => {
            // console.log('Banner Ad Loaded');
            setAdVisible(true); // Ensure ad is visible when loaded
          }}
        />
      </View>
    )
  );
};

export default BannerAdWrapper;
