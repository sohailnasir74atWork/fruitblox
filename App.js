import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StatusBar,
  SafeAreaView,
  Animated,
  ActivityIndicator,
  AppState,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SettingsScreen from './Code/SettingScreen/Setting';
import NotificationHandler from './Code/Firebase/FrontendNotificationHandling';
import { GlobalStateProvider, useGlobalState } from './Code/GlobelStats';
import { LocalStateProvider, useLocalState } from './Code/LocalGlobelStats';
import { MenuProvider } from 'react-native-popup-menu';
import { AdsConsent, AdsConsentStatus } from 'react-native-google-mobile-ads';
import MainTabs from './Code/AppHelper/MainTabs';
import {
  checkForUpdate,
  initializeAds,
  loadAppOpenAd,
  MyDarkTheme,
  MyLightTheme,
  requestReview,
} from './Code/AppHelper/AppHelperFunction';
import getAdUnitId from './Code/Ads/ads';

const Stack = createNativeStackNavigator();
const adCooldown = 120000;
const adUnitId = getAdUnitId('openapp');


function App() {
  const { theme } = useGlobalState();
  const selectedTheme = useMemo(() => {
    if (!theme) {
      console.warn("⚠️ Theme not found! Falling back to Light Theme.");
    }
    return theme === 'dark' ? MyDarkTheme : MyLightTheme;
  }, [theme]);
  
  const [loading, setLoading] = useState(false);
  const [lastAdShownTime, setLastAdShownTime] = useState(0);
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const { localState, updateLocalState, isPro, updateCount, lastVersion } = useLocalState();
  const [chatFocused,setChatFocused] = useState(true);
  const [modalVisibleChatinfo, setModalVisibleChatinfo ] = useState(false)
  useEffect(() => {
    initializeAds();

    const { reviewCount } = localState;
    if (reviewCount % 6 === 0 && reviewCount > 0) {
      requestReview();
    }

    updateLocalState('reviewCount', Number(reviewCount) + 1);
  }, []);
  useEffect(() => {
    if (localState.consentStatus === 'UNKNOWN' || localState.consentStatus === AdsConsentStatus.REQUIRED) {
      handleUserConsent();
    } else {
      // console.log('Consent status already determined:', localState.consentStatus);
    }
  }, [localState.consentStatus]);
  
  


  const saveConsentStatus = (status) => {
    updateLocalState('consentStatus', status);
  };
  
  // useEffect(() => {
  //   checkForUpdate(updateLocalState, updateCount, lastVersion);
  // }, []); // Runs once on mount

  const handleUserConsent = async () => {
    try {
      const consentInfo = await AdsConsent.requestInfoUpdate();
  
      if (consentInfo.isConsentFormAvailable) {
        if (consentInfo.status === AdsConsentStatus.REQUIRED) {
          const formResult = await AdsConsent.showForm();
          saveConsentStatus(formResult.status); // Save consent status
        } else {
          saveConsentStatus(consentInfo.status); // Save existing consent status
        }
      } else {
        // console.log('Consent form is not available.');
      }
    } catch (error) {
      // console.error('Error handling consent:', error);
    }
  };
  
  
  
  // Timeout fallback to avoid infinite loader

  // Handle Consent
  useEffect(() => {
    handleUserConsent();
  }, []);

  // Handle App State Changes for Ads
  useEffect(() => {
    
    const handleAppStateChange = (state) => {
      if (state === 'active') {
        loadAppOpenAd(adUnitId, lastAdShownTime, adCooldown, setLastAdShownTime, setIsAdLoaded, isPro);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [lastAdShownTime, isAdLoaded]);

  // Loading Indicator
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1E88E5" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: selectedTheme.colors.background }}>
      <Animated.View style={{ flex: 1 }}>
        <NavigationContainer theme={selectedTheme}>
          <StatusBar
            barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
            backgroundColor={selectedTheme.colors.background}
          />
          <Stack.Navigator>
            <Stack.Screen name="Home" options={{ headerShown: false }}>
              {() => <MainTabs selectedTheme={selectedTheme} setChatFocused={setChatFocused} chatFocused={chatFocused} setModalVisibleChatinfo={setModalVisibleChatinfo} modalVisibleChatinfo={modalVisibleChatinfo} />}
            </Stack.Screen>
            <Stack.Screen
              name="Setting"
              options={{
                title: 'Settings',
                headerStyle: { backgroundColor: selectedTheme.colors.background },
                headerTintColor: selectedTheme.colors.text,
              }}
            >
              {() => <SettingsScreen selectedTheme={selectedTheme} />}
            </Stack.Screen>
          </Stack.Navigator>
        </NavigationContainer>
      </Animated.View>
    </SafeAreaView>
  );
}

const AppWrapper = () => (
  <LocalStateProvider>
    <GlobalStateProvider>
      <MenuProvider>
        <App />
      </MenuProvider>
      <NotificationHandler />
    </GlobalStateProvider>
  </LocalStateProvider>
);

export default AppWrapper;