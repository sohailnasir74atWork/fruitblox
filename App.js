import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StatusBar, useColorScheme, ActivityIndicator, Animated, Platform, Alert, Dimensions } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import { getDatabase, ref, onValue, get } from 'firebase/database';
import { initializeApp } from 'firebase/app';
import mobileAds from 'react-native-google-mobile-ads';
import HomeScreen from './Code/HomeScreen';
import ValueScreen from './Code/ValueScreen';
import TimerScreen from './Code/TimerScreen';
import SettingsScreen from './Code/Setting';
import SplashScreen from './Code/SplashScreen';
import { SafeAreaView } from 'react-native-safe-area-context';


const firebaseConfig = {
  apiKey: "API_KEY",
  authDomain: "fruiteblocks.firebaseapp.com",
  databaseURL: "https://fruiteblocks-default-rtdb.firebaseio.com",
  projectId: "fruiteblocks",
  storageBucket: "fruiteblocks.appspot.com",
  messagingSenderId: "409137828081",
  appId: "APP_ID",
  measurementId: "G-C3T24PS3SF"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const Tab = createBottomTabNavigator();

const MyLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'white',
    text: 'black',
  },
};

const MyDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: 'black',
    text: 'white',
    card: 'darkgray',
    border: 'gray',
  },
};

export default function App() {
  const [data, setData] = useState(null);
  const [normalStock, setNormalStock] = useState([]);
  const [mirageStock, setMirageStock] = useState([]);
  const [showSplash, setShowSplash] = useState(true);
  const [isAppReady, setIsAppReady] = useState(false);
  const translateX = useRef(new Animated.Value(400)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const scheme = useColorScheme();

  useEffect(() => {
    // Initialize Mobile Ads
    mobileAds()
      .initialize()
      .then(adapterStatuses => {
        console.log('Google Mobile Ads initialized successfully');
      })
      .catch(error => {
        console.error('Google Mobile Ads initialization error:', error);
      });

    // Fetch Firebase data with error handling
    const fetchData = async () => {
      try {
        const dataRef = ref(database, 'xlsData');
        const snapshot = await get(dataRef);
        setData(snapshot.val());
    
        // For other data as well
        const dataRef2 = ref(database, 'calcData/test');
        const snapshot2 = await get(dataRef2);
        setNormalStock(snapshot2.val() || []);
    
        const dataRef3 = ref(database, 'calcData/mirage');
        const snapshot3 = await get(dataRef3);
        setMirageStock(snapshot3.val() || []);
        setIsAppReady(true);

      } catch (error) {
        console.error('Error fetching data from Firebase:', error);
        Alert.alert('Data Error', 'Failed to load data. Please check your internet connection.');
        setIsAppReady(true);
      }
    };
    

    fetchData();

    return () => {
      // Cleanup if needed
    };
  }, []);

  const handleSplashAnimationEnd = () => {
    setShowSplash(false);
    if (isAppReady) {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  if (showSplash) {
    return <SplashScreen onAnimationEnd={handleSplashAnimationEnd} />;
  }

  return (
    <SafeAreaView style={{ flex: 1, width:'100%' }}>
    <Animated.View style={{ flex: 1, opacity, transform: [{ translateX }] }}>
      <NavigationContainer theme={scheme === 'dark' ? MyDarkTheme : MyLightTheme}>
        <StatusBar
          barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'}
          {...(Platform.OS === 'android' && {
            backgroundColor: scheme === 'dark' ? 'black' : 'white',
          })}
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
                case 'Setting':
                  iconName = focused ? 'settings' : 'settings-outline';
                  break;
                default:
                  iconName = 'alert-circle-outline';
              }
              return <Icon name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: scheme === 'dark' ? 'tomato' : '#3E8BFC',
            tabBarInactiveTintColor: 'gray',
            headerTitleStyle: { fontFamily: 'Lato-Bold', fontSize: 24 },
            headerStyle: {
              backgroundColor: scheme === 'dark' ? 'black' : 'white',
            },
            headerTintColor: scheme === 'dark' ? 'white' : 'black',
          })}
        >
          <Tab.Screen name="Calculator" component={HomeScreen} initialParams={{ data: data || {} }} />
          <Tab.Screen name="Values" component={ValueScreen} initialParams={{ data: data || {} }} />
          <Tab.Screen name="Stock" component={TimerScreen} initialParams={{ normalStock, mirageStock }} />
          <Tab.Screen name="Setting" component={SettingsScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </Animated.View>
    </SafeAreaView>
  );
}
