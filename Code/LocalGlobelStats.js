import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Appearance } from 'react-native'; // For system theme detection
import { MMKV } from 'react-native-mmkv';
import Purchases from 'react-native-purchases'; // Ensure you have react-native-purchases installed
import config from './Helper/Environment';

const storage = new MMKV();
const LocalStateContext = createContext();

export const useLocalState = () => useContext(LocalStateContext);

export const LocalStateProvider = ({ children }) => {
  // Initial local state
  const [localState, setLocalState] = useState(() => {
    // Determine initial theme: system theme or stored override
    const systemTheme = Appearance.getColorScheme(); // 'light' or 'dark'
    const storedTheme = storage.getString('theme');
    const initialTheme = storedTheme === 'system' || !storedTheme ? systemTheme : storedTheme;

    return {
      localKey: storage.getString('localKey') || 'defaultValue',
      reviewCount: parseInt(storage.getString('reviewCount'), 10) || 0, // Ensure reviewCount is a number
      isHaptic: storage.getBoolean('isHaptic') ?? true,
      theme: initialTheme, // Default to 'light' if no theme is found
      userId: storage.getString('userId') || null, // User ID for statistics
      consentStatus: storage.getString('consentStatus') || 'UNKNOWN',
      isPro: storage.getBoolean('isPro') ?? false, // Fix missing isPro state
    };
  });

  // State for RevenueCat
  const [customerId, setCustomerId] = useState(null);
  const [isPro, setIsPro] = useState(false);
  const [packages, setPackages] = useState([]);
  const [mySubscriptions, setMySubscriptions] = useState([]);

  // Listen to system theme changes when theme is set to 'system'
  useEffect(() => {
    if (localState.theme === 'system') {
      const listener = Appearance.addChangeListener(({ colorScheme }) => {
        updateLocalState('theme', colorScheme); // Update to current system theme
      });
      return () => listener.remove();
    }
  }, [localState.theme]);

  // Update local state and MMKV
  const updateLocalState = (key, value) => {
    setLocalState((prevState) => ({
      ...prevState,
      [key]: value,
    }));

    // Save to MMKV
    if (typeof value === 'string') {
      storage.set(key, value);
    } else if (typeof value === 'number') {
      storage.set(key, value.toString()); // Store numbers as strings
    } else if (typeof value === 'boolean') {
      storage.set(key, value);
    } else {
      console.error('MMKV supports only string, number, or boolean values');
    }
  };

  useEffect(() => {
    const initRevenueCat = async () => {
      try {
        Purchases.configure({ apiKey: config.apiKey });

        const userID = await Purchases.getAppUserID();
        setCustomerId(userID);

        await loadOfferings();
        await checkEntitlement();
      } catch (error) {
        console.error('Error initializing RevenueCat:', error);
      }
    };

    initRevenueCat();
  }, []);

  const loadOfferings = async () => {
    try {
      const offerings = await Purchases.getOfferings();
      const currentOfferings = offerings.current;

      if (currentOfferings) {
        setPackages(currentOfferings.availablePackages);
      } else {
        console.log('No offerings found.');
      }
    } catch (error) {
      console.error('Error fetching offerings:', error);
    }
  };

  const checkEntitlement = async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      if (customerInfo.entitlements.active['Pro']) {
        setIsPro(true); // Grant access to Pro features

        const activePlansWithExpiry = customerInfo.activeSubscriptions.map((subscription) => ({
          plan: subscription,
          expiry: customerInfo.allExpirationDates[subscription],
        }));

        setMySubscriptions(activePlansWithExpiry);
      } else {
        setIsPro(false);
      }
    } catch (error) {
      console.error('Error checking entitlements:', error);
    }
  };

  const purchaseProduct = async (packageToPurchase) => {
    try {
      if (!packageToPurchase || !packageToPurchase.product) {
        console.error('Invalid package passed to purchaseProduct:', packageToPurchase);
        return;
      }
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      if (customerInfo.entitlements.active['Pro']) {
        setIsPro(true);
        updateLocalState('isPro', true);
      } else {
        console.warn('Purchase completed, but Pro entitlement not active.');
      }
    } catch (error) {
      if (error.userCancelled) {
        console.log('User cancelled the purchase');
      } else {
        console.error('Error during purchase:', error);
      }
    }
  };

  // Clear a specific key
  const clearKey = (key) => {
    setLocalState((prevState) => {
      const newState = { ...prevState };
      delete newState[key];
      return newState;
    });

    storage.delete(key);
  };

  // Clear all local states
  const clearAll = () => {
    setLocalState({});
    storage.clearAll();
  };

  const contextValue = useMemo(
    () => ({
      localState,
      updateLocalState,
      clearKey,
      clearAll,
      customerId,
      isPro,
      packages,
      mySubscriptions,
      purchaseProduct,
    }),
    [localState, customerId, isPro, packages, mySubscriptions]
  );

  return (
    <LocalStateContext.Provider value={contextValue}>
      {children}
    </LocalStateContext.Provider>
  );
};
