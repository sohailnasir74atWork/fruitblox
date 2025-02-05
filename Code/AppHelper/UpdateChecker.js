import { useEffect } from "react";
import { Alert, Linking, Platform } from "react-native";
import DeviceInfo from "react-native-device-info";
import database from "@react-native-firebase/database";
import { useLocalState } from "../LocalGlobelStats";

// Determine the app name based on bundle ID
const getAppName = () => {
  const bundleId = DeviceInfo.getBundleId();
  if (bundleId === "com.bloxfruitevalues") return "isNoman";
  if (bundleId === "com.bloxfruitstock") return "isWaqas";
  return "ios"; // Default to iOS if no match
};

const AppUpdateChecker = () => {
  const { localState, updateLocalState } = useLocalState();
  const { updateCount, lastVersion } = localState;

  useEffect(() => {
    checkForUpdate();
  }, []); // Runs once on app mount

  const checkForUpdate = async () => {
    const APP_NAME = getAppName(); // Get current app name
    const PLATFORM_KEY = Platform.OS; // "ios" or "android"
    const versionPath = `appVersions/${APP_NAME}/${PLATFORM_KEY}`;

    try {
      const snapshot = await database().ref(versionPath).once("value");

      if (snapshot.exists()) {
        const latestVersion = snapshot.val();
        const currentVersion = DeviceInfo.getVersion();

        if (latestVersion !== currentVersion) {
          // If the detected version is different from the last version stored, reset updateCount
          if (lastVersion !== latestVersion) {
            updateLocalState("updateCount", 0); // Reset count
            updateLocalState("lastVersion", latestVersion); // Store new version
          }

          // Show update alert only if updateCount < 2
          if (updateCount < 2) {
            showUpdateAlert();
            updateLocalState("updateCount", updateCount + 1); // Increment count
          }
        }
      } else {
        // If no version info exists, store the current version
        // await database().ref(versionPath).set(currentVersion);
        // updateLocalState("lastVersion", currentVersion); // Ensure MMKV tracks the version
      }
    } catch (error) {
      console.error("Error fetching version:", error);
    }
  };

  const showUpdateAlert = () => {
    Alert.alert(
      "🚀 Update Available!",
      "We've made some exciting improvements! Get the latest version now for the best experience. 🌟",
      [
        { text: "Remind Me Later", style: "cancel" },
        { text: "Update Now 🚀", onPress: openStore },
      ],
      { cancelable: false }
    );
  };

  const openStore = () => {
    let storeUrl =
      Platform.OS === "ios"
        ? "https://apps.apple.com/us/app/app-name/id6737775801" // Replace with iOS App ID
        : `https://play.google.com/store/apps/details?id=${DeviceInfo.getBundleId()}`; // Replace with Android Package Name

    Linking.openURL(storeUrl).catch((err) =>
      console.error("Failed to open store:", err)
    );
  };

  return null; // No UI, just background logic
};

export default AppUpdateChecker;