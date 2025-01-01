import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StatusBar,
  Platform,
  Animated,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import HomeScreen from './Code/Homescreen/HomeScreen';
import ValueScreen from './Code/ValuesScreen/ValueScreen';
import TimerScreen from './Code/StockScreen/TimerScreen';
import SettingsScreen from './Code/SettingScreen/Setting';
import UpcomingFeaturesScreen from './Code/ChatScreen/Trader';
import NotificationHandler from './Code/Firebase/FrontendNotificationHandling';
import config from './Code/Helper/Environment';
import { GlobalStateProvider, useGlobalState } from './Code/GlobelStats';
import { AdsConsent, AdsConsentDebugGeography, AdsConsentStatus } from 'react-native-google-mobile-ads';

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


const handleUserConsent = async () => {
  try {
    // Enable debug settings for testing consent
    await AdsConsent.requestInfoUpdate({
      debugGeography: AdsConsentDebugGeography.EEA, // Simulate EEA user for testing
      testDeviceIdentifiers: ['eb5e1b29f61d703a'], // Replace with your test device ID
    });

    const consentInfo = await AdsConsent.requestInfoUpdate();
    // console.log('Consent Info:', consentInfo);

    if (consentInfo.isConsentFormAvailable) {
      if (consentInfo.status === AdsConsentStatus.REQUIRED) {
        const formResult = await AdsConsent.showForm();
        // console.log('Consent Form Result:', formResult);

        // Update the consent status based on the user's action
        setConsentStatus(formResult.status);

        if (formResult.status === AdsConsentStatus.OBTAINED) {
          Alert.alert('Thank You!', 'You have provided your consent.');
        } else {
          Alert.alert('Notice', 'You have chosen limited ad tracking.');
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
              tabBarStyle: { height: 60 },
              tabBarActiveTintColor: selectedTheme.colors.primary,
              tabBarInactiveTintColor: theme === 'dark' ? '#888' : 'gray',
              headerTitleStyle: { fontFamily: 'Lato-Bold', fontSize: 24 },
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
            <Tab.Screen name="Chat">
              {() => <UpcomingFeaturesScreen selectedTheme={selectedTheme} />}
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
  <GlobalStateProvider>
    <NotificationHandler />
    <App />
  </GlobalStateProvider>
);

export default AppWrapper;