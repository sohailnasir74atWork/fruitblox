import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  StatusBar,
  Platform,
  Animated,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  AppState,
  TouchableOpacity,
} from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme, useNavigation } from '@react-navigation/native';
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
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import InAppReview from 'react-native-in-app-review';
import TradeScreen from './Code/TradeScreen/TradeScreen';


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
  const [chatFocused, setChatFocused] = useState(true);
  const [modalVisibleChatinfo, setModalVisibleChatinfo] = useState(false);
  const {updateLocalState, localState} = useLocalState()
  const [adState, setAdState] = useState({
    lastAdShownTime: 0,
    isAdLoaded: false,
    loading: false,
  });

  // const Stack = createNativeStackNavigator();
  const CalculatorStack = ({ selectedTheme }) => {
    const Stack = createNativeStackNavigator();
  
    return (
      <Stack.Navigator
        screenOptions={{
          headerTintColor: selectedTheme?.colors.text,
          headerTitleStyle: { fontFamily: 'Lato-Bold', fontSize: 24 },
          headerStyle: {
            backgroundColor: selectedTheme?.colors.background,
          },
        }}
      >
        <Stack.Screen
          name="Calculator"
          options={({ navigation }) => ({
            title: 'Calculator',
            headerRight: () => (
              <TouchableOpacity
                style={{ marginRight: 15 }}
                onPress={() => navigation.navigate('Settingss')} // Navigate to "Settingss"
              >
                <Icon name="settings-outline" size={24} color={selectedTheme?.colors.text} />
              </TouchableOpacity>
            ),
          })}
        >
          {() => <HomeScreen selectedTheme={selectedTheme} />}
        </Stack.Screen>
        <Stack.Screen
  name="Settingss"
  options={{ title: 'Settings' }}
>
  {() => <SettingsScreen selectedTheme={selectedTheme} />}
</Stack.Screen>
      </Stack.Navigator>
    );
  };
  const requestReview = () => {
    if (InAppReview.isAvailable()) {
      InAppReview.RequestInAppReview()
        .then((hasFlowFinishedSuccessfully) => {
          console.log(
            hasFlowFinishedSuccessfully
              ? 'In-App review flow completed successfully'
              : 'In-App review flow not completed'
          );
        })
        .catch((error) => {
          console.error('In-App review error:', error);
        });
    }
  };

  useEffect(() => {
    const { reviewCount } = localState;
    if (reviewCount % 20 === 0 && reviewCount > 0) {
      requestReview();
    }
        updateLocalState('reviewCount', Number(reviewCount) + 1);
  }, []);

  useEffect(() => {
    mobileAds()
      .initialize()
      .then(() => console.log('AdMob initialized'));
  }, []);

const handleUserConsent = async () => {
  try {
    await AdsConsent.requestInfoUpdate();

    const consentInfo = await AdsConsent.requestInfoUpdate();
    if (consentInfo.isConsentFormAvailable) {
      if (consentInfo.status === AdsConsentStatus.REQUIRED) {
        const formResult = await AdsConsent.showForm();
        setConsentStatus(formResult.status);
        if (formResult.status === AdsConsentStatus.OBTAINED) {
        } else {
          // Alert.alert('Notice', 'You have chosen limited ad tracking.');
        }
      } else {
        setConsentStatus(consentInfo.status);
        // console.log('Consent already up to date:', consentInfo.status);
      }
    } else {
      // console.log('Consent form is not available.', consentInfo);
    }
  } catch (error) {
    console.error('Error handling consent:', error);
  } finally {
    setLoading(false);
  }
};



const adCooldown = 120000;

const loadAppOpenAd = useCallback(async () => {
  const now = Date.now();

  if (now - adState.lastAdShownTime < adCooldown || adState.isAdLoaded) {
    console.log('Ad skipped due to cooldown or loading state.');
    return;
  }

  const appOpenAd = AppOpenAd.createForAdRequest(adUnitId);

  setAdState((prev) => ({ ...prev, isAdLoaded: true })); // Set loading to true

  appOpenAd.addAdEventListener(AdEventType.LOADED, () => {
    console.log('Ad Loaded');
    appOpenAd.show();
    setAdState((prev) => ({
      ...prev,
      lastAdShownTime: Date.now(),
      isAdLoaded: false,
    }));
  });

  appOpenAd.addAdEventListener(AdEventType.ERROR, (error) => {
    console.error('Ad Load Error:', error);
    setAdState((prev) => ({ ...prev, isAdLoaded: false }));
  });

  try {
    await appOpenAd.load();
  } catch (error) {
    console.error('Error loading Ad:', error);
    setAdState((prev) => ({ ...prev, isAdLoaded: false }));
  }
}, [adState.lastAdShownTime, adState.isAdLoaded, adCooldown, adUnitId]);


// Ad loading logic on app state change
const handleAppStateChange = useCallback(
  (state) => {
    if (state === 'active') {
      loadAppOpenAd();
    }
  },
  [loadAppOpenAd]
);

useEffect(() => {
  const subscription = AppState.addEventListener('change', handleAppStateChange);
  return () => subscription.remove();
}, [handleAppStateChange]);

  
  useEffect(() => {
    handleUserConsent();
  }, []);

  if (adState.loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1E88E5" />
      </View>
    );
  }

  const renderTabBarIcon = useMemo(
    () => 
      ({ routeName, focused, color, size }) => {
        const scaleValue = new Animated.Value(focused ? 1.2 : 1);
  
        Animated.spring(scaleValue, {
          toValue: focused ? 1.2 : 1, // Scale up when focused, back to normal otherwise
          friction: 3,
          useNativeDriver: true,
        }).start();
  
        let iconName;
        switch (routeName) {
          case 'Home':
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
          case 'Trade':
            iconName = focused
              ? config.isNoman
                ? 'storefront'
                : 'cog'
              : config.isNoman
              ? 'storefront-outline'
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
    [theme]
  );
  
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
              tabBarIcon: ({ focused, color, size }) =>
                renderTabBarIcon({ routeName: route.name, focused, color, size }),
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
              headerShown: route.name !== 'Home',
            })}
          >
            <Tab.Screen name="Home">
              {({ navigation }) => <CalculatorStack selectedTheme={selectedTheme} navigation={navigation} />}
            </Tab.Screen>
            <Tab.Screen name="Stock">
              {() => <TimerScreen selectedTheme={selectedTheme} />}
            </Tab.Screen>
            <Tab.Screen name="Trade">
              {() => <TradeScreen selectedTheme={selectedTheme} />}
            </Tab.Screen>
            <Tab.Screen name="Chat" options={{ headerShown: false }}>
              {() => (
                <ChatStack
                  selectedTheme={selectedTheme}
                  setChatFocused={setChatFocused}
                  modalVisibleChatinfo={modalVisibleChatinfo}
                  setModalVisibleChatinfo={setModalVisibleChatinfo}
                />
              )}
            </Tab.Screen>
            <Tab.Screen name="Values">
              {() => <ValueScreen selectedTheme={selectedTheme} />}
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