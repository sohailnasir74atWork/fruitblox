import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { getDatabase, ref, get } from 'firebase/database';
import { initializeApp } from 'firebase/app';
import Purchases from 'react-native-purchases';
import debounce from 'lodash.debounce';

// Firebase configuration
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

// RevenueCat API Key
const REVENUECAT_API_KEY = "YOUR_REVENUECAT_API_KEY";

// Create a context for global state
const GlobalStateContext = createContext();

// Custom hook to use global state
export const useGlobalState = () => useContext(GlobalStateContext);

export const GlobalStateProvider = ({ children }) => {
  // Firebase data states
  const [data, setData] = useState(null);
  const [normalStock, setNormalStock] = useState([]);
  const [mirageStock, setMirageStock] = useState([]);

  // RevenueCat states
  const [isPro, setIsPro] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState(null);
  const [packages, setPackages] = useState([]);
  const [mySubscription, setMySubscription] = useState([]);
  const [customerInfo, setCustomerInfo] = useState(null);

  // Utility function to update state only when data changes
  const setStateIfChanged = (setter, newValue) => {
    setter((prevValue) => (JSON.stringify(prevValue) === JSON.stringify(newValue) ? prevValue : newValue));
  };

  // Fetch data from Firebase
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dataSnapshot, stockSnapshot, mirageSnapshot] = await Promise.all([
          get(ref(database, 'xlsData')),
          get(ref(database, 'calcData/test')),
          get(ref(database, 'calcData/mirage')),
        ]);

        setStateIfChanged(setData, dataSnapshot.val());
        setStateIfChanged(setNormalStock, stockSnapshot.val() || []);
        setStateIfChanged(setMirageStock, mirageSnapshot.val() || []);

      } catch (error) {
        console.error('Error fetching data from Firebase:', error);
      }
    };

    fetchData();
  }, []);

  // Initialize RevenueCat
  useEffect(() => {
    const initializeRevenueCat = async () => {
      try {
        Purchases.configure({ apiKey: 'goog_hNbzYuzixIbRtuJzgHltVeZzYos' });
        await Promise.all([checkEntitlement(), loadOfferings()]);
      } catch (error) {
        console.error('Error initializing RevenueCat:', error);
      }
    };

    initializeRevenueCat();
  }, []);

  const loadOfferings = async () => {
    try {
      const offerings = await Purchases.getOfferings();
      const currentOfferings = offerings.current;

      if (currentOfferings) {
        setPackages(currentOfferings.availablePackages);
      }
    } catch (error) {
      console.error('Error fetching offerings:', error);
    }
  };

  const checkEntitlement = async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();

      if (customerInfo.entitlements.active['Pro']) {
        setIsPro(true);
        const { activeSubscriptions, allExpirationDates } = customerInfo;
        // console.log(activeSubscriptions)



        const activePlansWithExpiry = activeSubscriptions.map((subscription) => ({
          plan: subscription,
          expiry: allExpirationDates[subscription],
        }));

        setCustomerInfo(activePlansWithExpiry);
      } else {
        setIsPro(false);
      }
    } catch (error) {
      console.error('Error checking entitlements:', error);
    }
  };
  // Purchase a subscription package
  const purchasePackage = async (packageToPurchase) => {
    try {
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);

      if (customerInfo.entitlements.active["Pro"]) {
        setIsPro(true);
        setSubscriptionPlan("Pro");
      }
    } catch (error) {
      if (error.userCancelled) {
        console.log("User cancelled the purchase.");
      } else {
        console.error("Error during purchase:", error);
      }
    }
  };
  // Restore purchases
  const restorePurchases = async () => {
    try {
      const customerInfo = await Purchases.restorePurchases();
      setCustomerInfo(customerInfo);

      if (customerInfo.entitlements.active["Pro"]) {
        setIsPro(true);
        setSubscriptionPlan("Pro");
      }
    } catch (error) {
      console.error("Error restoring purchases:", error);
    }
  };

  // Global value for context
  const value = useMemo(() => ({
    // Firebase states
    data,
    normalStock,
    mirageStock,

    // RevenueCat states
    isPro,
    subscriptionPlan,
    packages,
    customerInfo,

    // RevenueCat methods
    purchasePackage,
    checkEntitlement,
    restorePurchases,
  }), [
    data,
    normalStock,
    mirageStock,
    isPro,
    subscriptionPlan,
    packages,
    customerInfo,
  ]);

  return (
    <GlobalStateContext.Provider value={value}>
      {children}
    </GlobalStateContext.Provider>
  );
};
