// AdConfig.js

import { Platform } from 'react-native';
import {  TestIds } from 'react-native-google-mobile-ads';

const developmentMode = false


const adUnits = {
  test: {
    banner: TestIds.BANNER,
    interstitial: TestIds.INTERSTITIAL,
  },
  android: {
    banner: 'ca-app-pub-3701208411582706/4133745803',       
    interstitial: 'ca-app-pub-3701208411582706/2820664136', 
  },
  ios: {
    banner: 'ca-app-pub-5740215782746766/4522455164',      
    interstitial: 'ca-app-pub-5740215782746766/3209373499', 
  }
};

const getAdUnitId = (type) => {
  const os = Platform.OS;
  if (developmentMode) 
    return adUnits.test[type];
  return adUnits[os][type]; 
};

export default getAdUnitId;