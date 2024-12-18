import React, { useState, useRef, useEffect } from 'react';
import { View, StatusBar, Platform, Animated, SafeAreaView, Appearance } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import HomeScreen from './Code/HomeScreen';
import ValueScreen from './Code/ValueScreen';
import TimerScreen from './Code/TimerScreen';
import SettingsScreen from './Code/Setting';
import SplashScreen from './Code/SplashScreen';
import UpcomingFeaturesScreen from './Code/Trader';
import { GlobalStateProvider } from './Code/GlobelStats'; 

const Tab = createBottomTabNavigator();

const MyLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'white',
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
  const [showSplash, setShowSplash] = useState(true);
  const [theme, setTheme] = useState(Appearance.getColorScheme());
  const opacity = useRef(new Animated.Value(0)).current;

  const handleSplashAnimationEnd = () => {
    setShowSplash(false);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setTheme(colorScheme);
    });
    return () => subscription.remove();
  }, []);

  const selectedTheme = theme === 'dark' ? MyDarkTheme : MyLightTheme;

  if (showSplash) {
    return <SplashScreen onAnimationEnd={handleSplashAnimationEnd} />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: selectedTheme.colors.background }}>
      <Animated.View style={{ flex: 1, opacity }}>
        <NavigationContainer theme={selectedTheme}>
          <StatusBar
            barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
            {...(Platform.OS === 'android' && { backgroundColor: selectedTheme.colors.background })}
          />
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarIcon: ({ focused, color, size }) => {
                let iconName;
                switch (route.name) {
                  case 'Calculator':
                    iconName = focused ? 'calculator' : 'calculator-outline';
                    break;
                  case 'Values':
                    iconName = focused ? 'cash' : 'cash-outline';
                    break;
                  case 'Stock':
                    iconName = focused ? 'cart' : 'cart-outline';
                    break;
                  case 'Market':
                    iconName = focused ? 'storefront' : 'storefront-outline';
                    break;
                  case 'Setting':
                    iconName = focused ? 'settings' : 'settings-outline';
                    break;
                  default:
                    iconName = 'alert-circle-outline';
                }
                return <Icon name={iconName} size={size} color={color} />;
              },
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
  {/* <Tab.Screen name="Market">
    {() => <UpcomingFeaturesScreen selectedTheme={selectedTheme} />}
  </Tab.Screen> */}
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
    <App />
  </GlobalStateProvider>
);

export default AppWrapper;
