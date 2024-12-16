import React, { useState, useRef } from 'react';
import { View, StatusBar, Platform, Animated, SafeAreaView } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import HomeScreen from './Code/HomeScreen';
import ValueScreen from './Code/ValueScreen';
import TimerScreen from './Code/TimerScreen';
import SettingsScreen from './Code/Setting';
import UpcomingFeaturesScreen from './Code/Trader';
import { GlobalStateProvider } from './Code/GlobelStats'; 

const Tab = createBottomTabNavigator();

const MyLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#4E5465',
    text: 'white',
  },
};

function App() {

 

  return (
    <SafeAreaView style={{ flex: 1, width: '100%' }}>
      <Animated.View style={{ flex: 1 }}>
        <NavigationContainer theme={MyLightTheme}>
          <StatusBar
            barStyle={'light-content'}
            {...(Platform.OS === 'android' && { backgroundColor: '#4E5465' })}
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
              tabBarActiveTintColor: '#17202a',
              tabBarInactiveTintColor: '#17202a',        
              headerTitleStyle: { fontFamily: 'Lato-Bold', fontSize: 24 },
              headerStyle: {
                backgroundColor: '#4E5465',
              },
              headerTintColor: 'white',
            })}
          >
            <Tab.Screen name="Calculator" component={HomeScreen} />
            <Tab.Screen name="Values" component={ValueScreen} />
            <Tab.Screen name="Stock" component={TimerScreen} />
            {/* <Tab.Screen name="Market" component={UpcomingFeaturesScreen} /> */}
            <Tab.Screen name="Setting" component={SettingsScreen} />
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
