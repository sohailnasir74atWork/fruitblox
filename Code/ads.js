// AdConfig.js

import { Platform } from 'react-native';
import {  TestIds } from 'react-native-google-mobile-ads';
import config from './Helper/Environment';

const developmentMode = false


const adUnits = {
  test: {
    banner: TestIds.BANNER,
    interstitial: TestIds.INTERSTITIAL,
  },
  android: {
    banner: config.andriodBanner,       
    interstitial: config.andriodIntestial, 
  },
  ios: {
    banner: config.IOsBanner,      
    interstitial: config.IOsIntestial, 
  }
};

const getAdUnitId = (type) => {
  const os = Platform.OS;
  if (developmentMode) 
    return adUnits.test[type];
  return adUnits[os][type]; 
};

export default getAdUnitId;