import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StatusBar,
  Platform,
  Animated,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  AppState,
} from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import HomeScreen from './Code/Homescreen/HomeScreen';
import ValueScreen from './Code/ValuesScreen/ValueScreen';
import TimerScreen from './Code/StockScreen/TimerScreen';
import SettingsScreen from './Code/SettingScreen/Setting';
import NotificationHandler from './Code/Firebase/FrontendNotificationHandling';
import config from './Code/Helper/Environment';
import { GlobalStateProvider, useGlobalState } from './Code/GlobelStats';
import { AdsConsent, AdsConsentDebugGeography, AdsConsentStatus } from 'react-native-google-mobile-ads';
import mobileAds from 'react-native-google-mobile-ads';
import { AppOpenAd, TestIds, AdEventType } from 'react-native-google-mobile-ads';
import getAdUnitId from './Code/Ads/ads';
import { ChatStack } from './Code/ChatScreen/ChatNavigator';
import { MenuProvider } from 'react-native-popup-menu';
import { LocalStateProvider, useLocalState } from './Code/LocalGlobelStats';
import InAppReview from 'react-native-in-app-review';


const adUnitId =  getAdUnitId('openapp');
const Tab = createBottomTabNavigator();



const MyLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#f2f2f7',
    text: 'black',
    primary: '#3E8BFC',
  },
};
const MyDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#121212',
    text: 'white',
    primary: '#BB86FC',
  },
};

function App() {
  const { theme } = useGlobalState();
  const selectedTheme = theme === 'dark' ? MyDarkTheme : MyLightTheme;
  const [consentStatus, setConsentStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastAdShownTime, setLastAdShownTime] = useState(0);
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const [chatFocused, setChatFocused] = useState(true);
  const [modalVisibleChatinfo, setModalVisibleChatinfo] = useState(false);
  const {localState, updateLocalState}= useLocalState()
  
const requestReview = () => {
  if (InAppReview.isAvailable()) {
    InAppReview.RequestInAppReview()
      .then((hasFlowFinishedSuccessfully) => {
        // console.log(
        //   hasFlowFinishedSuccessfully
        //     ? 'In-App review flow completed successfully'
        //     : 'In-App review flow not completed'
        // );
      })
      .catch((error) => {
        // console.error('In-App review error:', error);
      });
  }
};

useEffect(() => {
  const { reviewCount } = localState;
  // Check if the review count is divisible by 20
  if (reviewCount % 5 === 0 && reviewCount > 0) {
    requestReview();
  }

  // Increment the review count on every app open
  updateLocalState('reviewCount', Number(reviewCount) + 1);
}, []);



  const adCooldown = 120000;
  useEffect(() => {
    mobileAds()
      .initialize()
      .then(() => console.log('AdMob initialized'));
  }, []);

const handleUserConsent = async () => {
  try {
    // Enable debug settings for testing consent
    await AdsConsent.requestInfoUpdate();

    const consentInfo = await AdsConsent.requestInfoUpdate();
    // console.log('Consent Info:', consentInfo);

    if (consentInfo.isConsentFormAvailable) {
      if (consentInfo.status === AdsConsentStatus.REQUIRED) {
        const formResult = await AdsConsent.showForm();
        // console.log('Consent Form Result:', formResult);

        // Update the consent status based on the user's action
        setConsentStatus(formResult.status);

        if (formResult.status === AdsConsentStatus.OBTAINED) {
          // Alert.alert('Thank You!', 'You have provided your consent.');
        } else {
          // Alert.alert('Notice', 'You have chosen limited ad tracking.');
        }
      } else {
        // Consent not required; update status silently
        setConsentStatus(consentInfo.status);
        // console.log('Consent already up to date:', consentInfo.status);
      }
    } else {
      // Handle cases where the consent form is not available
      // console.log('Consent form is not available.', consentInfo);
    }
  } catch (error) {
    console.error('Error handling consent:', error);
    // Alert.alert('Error', 'An error occurred while handling consent.');
  } finally {
    setLoading(false);
  }
};
const loadAppOpenAd = async () => {
  const now = Date.now();
  if (now - lastAdShownTime < adCooldown || isAdLoaded) {
    // console.log('Skipping ad due to cooldown or ad already loaded.');
    return;
  }

  try {
    const appOpenAd = AppOpenAd.createForAdRequest(adUnitId);

    appOpenAd.addAdEventListener(AdEventType.LOADED, () => {
      // console.log('App Open Ad Loaded');
      appOpenAd.show();
      setLastAdShownTime(Date.now());
      setIsAdLoaded(false); // Reset after showing
    });

    appOpenAd.addAdEventListener(AdEventType.ERROR, (error) => {
      console.error('App Open Ad Error:', error);
      setIsAdLoaded(false);
    });

    setIsAdLoaded(true);
    await appOpenAd.load();
  } catch (error) {
    console.error('Error loading App Open Ad:', error);
    setIsAdLoaded(false);
  }
};

// Handle App State Changes
useEffect(() => {
  const handleAppStateChange = (state) => {
    if (state === 'active') {
      loadAppOpenAd(); // Load ad when app comes to foreground
    }
  };

  const subscription = AppState.addEventListener('change', handleAppStateChange);
  return () => subscription.remove();
}, [lastAdShownTime, isAdLoaded]);
  
  useEffect(() => {
    handleUserConsent();
  }, []);

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
            {...(Platform.OS === 'android' && {
              backgroundColor: selectedTheme.colors.background,
            })}
          />
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarIcon: ({ focused, color, size }) => {
                const scaleValue = useRef(new Animated.Value(1)).current;

                useEffect(() => {
                  Animated.spring(scaleValue, {
                    toValue: focused ? 1.2 : 1, // Scale up when focused, back to normal otherwise
                    friction: 3,
                    useNativeDriver: true,
                  }).start();
                }, [focused]);

                let iconName;
                switch (route.name) {
                  case 'Calculator':
                    iconName = focused
                      ? config.isNoman
                        ? 'home'
                        : 'calculator'
                      : config.isNoman
                      ? 'home-outline'
                      : 'calculator-outline';
                    break;
                  case 'Values':
                    iconName = focused
                      ? config.isNoman
                        ? 'trending-up'
                        : 'pricetags'
                      : config.isNoman
                      ? 'trending-up-outline'
                      : 'pricetags-outline';
                    break;
                  case 'Stock':
                    iconName = focused
                      ? config.isNoman
                        ? 'newspaper'
                        : 'notifications'
                      : config.isNoman
                      ? 'newspaper-outline'
                      : 'notifications-outline';
                    break;
                  case 'Chat':
                    iconName = focused
                      ? config.isNoman
                        ? 'chatbubble-ellipses'
                        : 'chatbubbles'
                      : config.isNoman
                      ? 'chatbubble-ellipses-outline'
                      : 'chatbubbles-outline';
                    break;
                  case 'Setting':
                    iconName = focused
                      ? config.isNoman
                        ? 'settings'
                        : 'cog'
                      : config.isNoman
                      ? 'settings-outline'
                      : 'cog-outline';
                    break;
                  default:
                    iconName = 'alert-circle-outline';
                }

                return (
                  <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
                    <Icon name={iconName} size={size} color={color} />
                  </Animated.View>
                );
              },
              tabBarStyle: { height: 60, backgroundColor: theme === 'dark' ? '#121212' : '#f2f2f7' },
              tabBarActiveTintColor: selectedTheme.colors.primary,
              tabBarInactiveTintColor: theme === 'dark' ? '#888' : 'gray',
              headerTitleStyle: { fontFamily: 'Lato-Bold', fontSize: 24 },
              tabBarBadge: route.name === 'Chat' && chatFocused ? '' : null,
              tabBarBadgeStyle: {
                minWidth: 12, // Set a smaller minimum width
                height: 12,   // Set a smaller height
                borderRadius: 6, // Make it circular
                fontSize: 10,  // Smaller font size
                backgroundColor: 'red', // Badge background color
                color: 'white', // Badge text color
              },
              headerStyle: {
                backgroundColor: selectedTheme.colors.background,
              },
              headerTintColor: selectedTheme.colors.text,
            })}
          >
            <Tab.Screen name="Calculator">
              {() => <HomeScreen selectedTheme={selectedTheme} />}
            </Tab.Screen>
            <Tab.Screen name="Values">
              {() => <ValueScreen selectedTheme={selectedTheme} />}
            </Tab.Screen>
            <Tab.Screen name="Stock">
              {() => <TimerScreen selectedTheme={selectedTheme} />}
            </Tab.Screen>
            <Tab.Screen 
  name="Chat"
  options={{ headerShown: false }}
>
  {() => (
    <ChatStack 
      selectedTheme={selectedTheme}
      setChatFocused={setChatFocused}
      modalVisibleChatinfo={modalVisibleChatinfo}
      setModalVisibleChatinfo={setModalVisibleChatinfo}
    />
  )}
</Tab.Screen>

         

            <Tab.Screen name="Setting">
              {() => <SettingsScreen selectedTheme={selectedTheme} />}
            </Tab.Screen>
          </Tab.Navigator>
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