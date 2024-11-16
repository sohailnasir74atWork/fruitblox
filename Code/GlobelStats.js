import React, { createContext, useContext, useState, useEffect } from 'react';
import { getDatabase, ref, get } from 'firebase/database';
import { initializeApp } from 'firebase/app';

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

// Create a context for global state
const GlobalStateContext = createContext();

// Custom hook to use global state
export const useGlobalState = () => useContext(GlobalStateContext);

export const GlobalStateProvider = ({ children }) => {
  const [data, setData] = useState(null);
  const [normalStock, setNormalStock] = useState([]);
  const [mirageStock, setMirageStock] = useState([]);
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dataRef = ref(database, 'xlsData');
        const snapshot = await get(dataRef);
        setData(snapshot.val());

        const dataRef2 = ref(database, 'calcData/test');
        const snapshot2 = await get(dataRef2);
        setNormalStock(snapshot2.val() || []);

        const dataRef3 = ref(database, 'calcData/mirage');
        const snapshot3 = await get(dataRef3);
        setMirageStock(snapshot3.val() || []);

        setIsAppReady(true);
      } catch (error) {
        console.error('Error fetching data from Firebase:', error);
        setIsAppReady(true);
      }
    };

    fetchData();
  }, []);

  return (
    <GlobalStateContext.Provider value={{ data, normalStock, mirageStock, isAppReady }}>
      {children}
    </GlobalStateContext.Provider>
  );
};
