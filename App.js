import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, StatusBar, Platform, Animated, SafeAreaView, Appearance } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import HomeScreen from './Code/HomeScreen';
import ValueScreen from './Code/ValueScreen';
import TimerScreen from './Code/TimerScreen';
import SettingsScreen from './Code/Setting';
import UpcomingFeaturesScreen from './Code/Trader';
import { GlobalStateProvider } from './Code/GlobelStats';
import NotificationHandler from './Code/Firebase/FrontendNotificationHandling';
import requestPermission from './Code/Helper/PermissionCheck';
import config from './Code/Helper/Environment';

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
  const [theme, setTheme] = useState(Appearance.getColorScheme());




  useEffect(() => {
    requestPermission();
  }, []);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setTheme(colorScheme);
    });
    return () => subscription.remove();
  }, []);

  const selectedTheme = theme === 'dark' ? MyDarkTheme : MyLightTheme;



  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: selectedTheme.colors.background }}>
      <Animated.View style={{ flex: 1 }}>
        <NavigationContainer theme={selectedTheme}>
          <StatusBar
            barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
            {...(Platform.OS === 'android' && { backgroundColor: selectedTheme.colors.background })}
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
                    iconName = focused ? (config.isNoman ? 'home': 'calculator') : (config.isNoman ? 'home-outline': 'calculator-outline');
                    break;
                  case 'Values':
                    iconName = focused ? (config.isNoman ? 'trending-up': 'pricetags') : (config.isNoman ? 'trending-up-outline': 'pricetags-outline');
                    break;
                  case 'Stock':
                    iconName = focused ? (config.isNoman ? 'newspaper': 'notifications') : (config.isNoman ? 'newspaper-outline': 'notifications-outline');
                    break;
                  case 'Chat':
                    iconName = focused ? (config.isNoman ? 'chatbubble-ellipses': 'chatbubbles') : (config.isNoman ? 'chatbubble-ellipses-outline': 'chatbubbles-outline');
                    break;
                  case 'Setting':
                    iconName = focused ? (config.isNoman ? 'settings': 'cog') : (config.isNoman ? 'settings-outline': 'cog-outline');
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
