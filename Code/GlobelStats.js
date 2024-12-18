import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { getDatabase, ref, get } from 'firebase/database';
import { initializeApp, getApps } from 'firebase/app';
import { MMKV } from 'react-native-mmkv';

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

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const database = getDatabase(app);

// MMKV Storage Instance
const storage = new MMKV();

// Create a context for global state
const GlobalStateContext = createContext();

// Custom hook to use global state
export const useGlobalState = () => useContext(GlobalStateContext);

export const GlobalStateProvider = ({ children }) => {
  const [state, setState] = useState({
    data: null,
    normalStock: [],
    mirageStock: [],
    isAppReady: false,
  });

  // Load selected fruits from MMKV
  const [selectedFruits, setSelectedFruits] = useState(() => {
    const storedFruits = storage.getString('selectedFruits');
    return storedFruits ? JSON.parse(storedFruits) : [];
  });

  // Load reminder states from MMKV
  const [isReminderEnabled, setIsReminderEnabled] = useState(() => {
    const storedReminder = storage.getBoolean('isReminderEnabled');
    return typeof storedReminder === 'boolean' ? storedReminder : false;
  });

  const [isSelectedReminderEnabled, setIsSelectedReminderEnabled] = useState(() => {
    const storedSelectedReminder = storage.getBoolean('isSelectedReminderEnabled');
    return typeof storedSelectedReminder === 'boolean' ? storedSelectedReminder : false;
  });

  // Sync `selectedFruits` with MMKV
  useEffect(() => {
    try {
      storage.set('selectedFruits', JSON.stringify(selectedFruits));
    } catch (error) {
      console.error('Error saving selectedFruits to MMKV:', error);
    }
  }, [selectedFruits]);

  // Sync `isReminderEnabled` with MMKV
  useEffect(() => {
    try {
      storage.set('isReminderEnabled', Boolean(isReminderEnabled));
    } catch (error) {
      console.error('Error saving isReminderEnabled to MMKV:', error);
    }
  }, [isReminderEnabled]);

  // Sync `isSelectedReminderEnabled` with MMKV
  useEffect(() => {
    try {
      storage.set('isSelectedReminderEnabled', Boolean(isSelectedReminderEnabled));
    } catch (error) {
      console.error('Error saving isSelectedReminderEnabled to MMKV:', error);
    }
  }, [isSelectedReminderEnabled]);

  // Fetch data from Firebase
  useEffect(() => {
    const fetchData = async () => {
      try {
        const rootRef = ref(database);
        const snapshot = await get(rootRef);

        if (snapshot.exists()) {
          const firebaseData = snapshot.val();
          const xlsData = firebaseData.xlsData || [];
          const normalStock = firebaseData.calcData?.test || [];
          const mirageStock = firebaseData.calcData?.mirage || [];

          setState({
            data: xlsData,
            normalStock,
            mirageStock,
            isAppReady: true,
          });
        } else {
          console.warn('No data available in Firebase');
          setState((prevState) => ({ ...prevState, isAppReady: true }));
        }
      } catch (error) {
        console.error('Error fetching data from Firebase:', error);
        setState((prevState) => ({ ...prevState, isAppReady: true }));
      }
    };

    fetchData();
  }, []);

  const contextValue = useMemo(
    () => ({
      ...state,
      selectedFruits,
      setSelectedFruits,
      isReminderEnabled,
      setIsReminderEnabled,
      isSelectedReminderEnabled,
      setIsSelectedReminderEnabled,
    }),
    [state, selectedFruits, isReminderEnabled, isSelectedReminderEnabled]
  );

  return (
    <GlobalStateContext.Provider value={contextValue}>
      {children}
    </GlobalStateContext.Provider>
  );
};
