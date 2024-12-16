import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { getDatabase, ref, get } from 'firebase/database';
import { initializeApp, getApps } from 'firebase/app';

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

// Initialize Firebase (ensuring it's not initialized multiple times)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const database = getDatabase(app);

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchFromFirebase = async (path) => {
          const dataRef = ref(database, path);
          const snapshot = await get(dataRef);
          return snapshot.val() || [];
        };

        const [xlsData, normalStock, mirageStock] = await Promise.all([
          fetchFromFirebase('xlsData'),
          fetchFromFirebase('calcData/test'),
          fetchFromFirebase('calcData/mirage'),
        ]);

        setState({
          data: xlsData,
          normalStock,
          mirageStock,
          isAppReady: true,
        });
      } catch (error) {
        console.error('Error fetching data from Firebase:', error);
        setState((prevState) => ({ ...prevState, isAppReady: true })); // Ensure the app is marked ready even on error
      }
    };

    fetchData();
  }, []);

  const contextValue = useMemo(() => state, [state]);

  return (
    <GlobalStateContext.Provider value={contextValue}>
      {children}
    </GlobalStateContext.Provider>
  );
};
