import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Appearance } from 'react-native'; // For system theme detection
import { MMKV } from 'react-native-mmkv';
import Purchases from 'react-native-purchases'; // Ensure react-native-purchases is installed
import config from './Helper/Environment';

const storage = new MMKV();
const LocalStateContext = createContext();

export const useLocalState = () => useContext(LocalStateContext);

export const LocalStateProvider = ({ children }) => {
  // Initial local state
  const [localState, setLocalState] = useState(() => {
    const systemTheme = Appearance.getColorScheme(); // 'light' or 'dark'
    const storedTheme = storage.getString('theme');
    const initialTheme = storedTheme === 'system' || !storedTheme ? systemTheme : storedTheme;

    return {
      localKey: storage.getString('localKey') || 'defaultValue',
      reviewCount: parseInt(storage.getString('reviewCount'), 10) || 0, // Ensure reviewCount is a number
      lastVersion: storage.getString('lastVersion') || 'UNKNOWN',
      updateCount: parseInt(storage.getString('updateCount'), 0),
      isHaptic: storage.getBoolean('isHaptic') ?? true,
      theme: initialTheme, // Default to system theme if not set
      userId: storage.getString('userId') || null, // Store User ID
      consentStatus: storage.getString('consentStatus') || 'UNKNOWN',
      isPro: storage.getBoolean('isPro') ?? false, // Ensure isPro state is stored
    };
  });

  // RevenueCat states
  const [customerId, setCustomerId] = useState(null);
  const [isPro, setIsPro] = useState(localState.isPro); // Sync with MMKV storage
  const [packages, setPackages] = useState([]);
  const [mySubscriptions, setMySubscriptions] = useState([]);

  // Listen for system theme changes
  useEffect(() => {
    if (localState.theme === 'system') {
      const listener = Appearance.addChangeListener(({ colorScheme }) => {
        updateLocalState('theme', colorScheme);
      });
      return () => listener.remove();
    }
  }, [localState.theme]);

  // Update local state and MMKV storage
  const updateLocalState = (key, value) => {
    setLocalState((prevState) => ({
      ...prevState,
      [key]: value,
    }));

    // Save to MMKV storage
    if (typeof value === 'string') {
      storage.set(key, value);
    } else if (typeof value === 'number') {
      storage.set(key, value.toString()); // Convert numbers to strings for storage
    } else if (typeof value === 'boolean') {
      storage.set(key, value);
    } else {
      console.error('🚨 MMKV supports only string, number, or boolean values');
    }
  };
// console.log(isPro)
  // Initialize RevenueCat
  useEffect(() => {
    const initRevenueCat = async () => {
      try {
        await Purchases.configure({ apiKey: config.apiKey });

        // Fetch customer ID
        const userID = await Purchases.getAppUserID();
        setCustomerId(userID);

        // Load offerings & check entitlements
        await fetchOfferings();
        await checkEntitlements();
      } catch (error) {
        console.error('❌ Error initializing RevenueCat:', error.message);
      }
    };

    initRevenueCat();
  }, [mySubscriptions]);
// console.log(isPro)
  // Fetch available subscriptions
  const fetchOfferings = async () => {
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current?.availablePackages.length > 0) {
        // console.log('✅ Offerings loaded:', offerings.current.availablePackages);
        setPackages(offerings.current.availablePackages);
      } else {
        console.warn('⚠️ No offerings found. Check RevenueCat settings.');
      }
    } catch (error) {
      console.error('❌ Error fetching offerings:', error.message);
    }
  };



  const restorePurchases = async () => {
    try {
      const customerInfo = await Purchases.restorePurchases();
  
      if (customerInfo.entitlements.active['Pro']) {
        // console.log('✅ Purchases restored! Pro features unlocked.');
        setIsPro(true);
        updateLocalState('isPro', true);
  
        const activePlansWithExpiry = customerInfo.activeSubscriptions.map((subscription) => ({
          plan: subscription,
          expiry: customerInfo.allExpirationDates[subscription],
        }));
        setMySubscriptions(activePlansWithExpiry);
      } else {
        console.warn('⚠️ No active subscriptions found.');
      }
    } catch (error) {
      console.error('❌ Error restoring purchases:', error);
    }
  };
  
  // Check if the user has an active subscription
  const checkEntitlements = async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const proStatus = !!customerInfo.entitlements.active['Pro'];

      setIsPro(proStatus);
      updateLocalState('isPro', proStatus); // Persist Pro status in MMKV

      if (proStatus) {
        const activePlansWithExpiry = customerInfo.activeSubscriptions.map((subscription) => ({
          plan: subscription,
          expiry: customerInfo.allExpirationDates[subscription],
        }));
        setMySubscriptions(activePlansWithExpiry);
      }
    } catch (error) {
      console.error('❌ Error checking entitlements:', error);
    }
  };
  // Handle in-app purchase
  const purchaseProduct = async (packageToPurchase) => {
    try {
      if (!packageToPurchase || !packageToPurchase.product) {
        console.error('🚨 Invalid package passed to purchaseProduct:', packageToPurchase);
        return;
      }

      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);

      if (customerInfo.entitlements.active['Pro']) {
        // console.log('✅ Purchase successful! Pro features unlocked.');
        setIsPro(true);
        updateLocalState('isPro', true);
      } else {
        console.warn('⚠️ Purchase completed, but Pro entitlement not active.');
      }
    } catch (error) {
      if (error.userCancelled) {
        // console.log('🚫 User cancelled the purchase.');
      } else {
        console.error('❌ Error during purchase:', error);
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

  // Clear all local state and MMKV storage
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
      restorePurchases
    }),
    [localState, customerId, isPro, packages, mySubscriptions]
  );

  return (
    <LocalStateContext.Provider value={contextValue}>
      {children}
    </LocalStateContext.Provider>
  );
};
