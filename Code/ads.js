import { TestIds } from 'react-native-google-mobile-ads';

const developmentMode = true;

const adUnits = {
  test: {
    banner: TestIds.BANNER,
    interstitial: TestIds.INTERSTITIAL,
  },
  android: {
    banner: 'ca-app-pub-5740215782746766/5225162749',
    interstitial: 'ca-app-pub-5740215782746766/1206026687',
  },
};

const getAdUnitId = (type) => {
  if (developmentMode) 
    return adUnits.test[type];
  
  return adUnits.android[type]; // Ensure 'android' is explicitly used for production
};

export default getAdUnitId;
