// themes.js
import { DefaultTheme, DarkTheme } from '@react-navigation/native';
import { AppOpenAd, AdEventType } from 'react-native-google-mobile-ads';
import InAppReview from 'react-native-in-app-review';
import { AdsConsent, AdsConsentStatus } from 'react-native-google-mobile-ads';


export const MyLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#f2f2f7',
    text: 'black',
    primary: '#3E8BFC',
  },
};

export const MyDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#121212',
    text: 'white',
    primary: '#BB86FC',
  },
};


// adHelper.js

export const initializeAds = async () => {
  await mobileAds().initialize();
};

export const loadAppOpenAd = async (adUnitId, lastAdShownTime, adCooldown, setLastAdShownTime, setIsAdLoaded) => {
  const now = Date.now();
  if (now - lastAdShownTime < adCooldown) return;

  try {
    const appOpenAd = AppOpenAd.createForAdRequest(adUnitId);

    appOpenAd.addAdEventListener(AdEventType.LOADED, () => {
      appOpenAd.show();
      setLastAdShownTime(Date.now());
      setIsAdLoaded(false);
    });

    appOpenAd.addAdEventListener(AdEventType.ERROR, () => setIsAdLoaded(false));

    setIsAdLoaded(true);
    await appOpenAd.load();
  } catch (error) {
    console.error('Error loading App Open Ad:', error);
    setIsAdLoaded(false);
  }
};


// reviewHelper.js

export const requestReview = () => {
  if (InAppReview.isAvailable()) {
    InAppReview.RequestInAppReview()
      .then(() => console.log('In-App review flow completed'))
      .catch((error) => console.error('In-App review error:', error));
  }
};


// consentHelper.js

export const handleUserConsent = async (setConsentStatus, setLoading) => {
  try {
    const consentInfo = await AdsConsent.requestInfoUpdate();
    if (consentInfo.isConsentFormAvailable) {
      if (consentInfo.status === AdsConsentStatus.REQUIRED) {
        const formResult = await AdsConsent.showForm();
        setConsentStatus(formResult.status);
      } else {
        setConsentStatus(consentInfo.status);
      }
    }
  } catch (error) {
    console.error('Error handling consent:', error);
  } finally {
    setLoading(false);
  }
};
