import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Appearance } from 'react-native'; // For system theme detection
import { MMKV } from 'react-native-mmkv';

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
      reviewCount: storage.getString('reviewCount') || 0,
      isHaptic: storage.getBoolean('isHaptic') ?? true,
      theme: initialTheme || 'light', // Default to 'light' if no theme is found
    };
  });

  useEffect(() => {
    if (!localState.installationDate) {
      const now = new Date().toISOString();
      updateLocalState('installationDate', now);
    }
  }, [localState.installationDate]);

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
      storage.set(key, value);
    } else if (typeof value === 'boolean') {
      storage.set(key, value);
    } else {
      throw new Error('MMKV supports only string, number, or boolean values');
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
    }),
    [localState]
  );

  return (
    <LocalStateContext.Provider value={contextValue}>
      {children}
    </LocalStateContext.Provider>
  );
};
