import { Alert } from "react-native";
import firestore from '@react-native-firebase/firestore';
const tradesCollection = firestore().collection('trades');

// Debug Mode (Enable verbose logging if true)
const debugMode = false;

export const submitTrade = async (user, hasItems, wantsItems, hasTotal, wantsTotal, message, description, resetState) => {
  if (debugMode) console.log("🔥 submitTrade() called");

  // 🔍 Filter out null/undefined values from items
  const filteredHasItems = hasItems.filter(item => item && item.Name);
  const filteredWantsItems = wantsItems.filter(item => item && item.Name);

  if (debugMode) {
    console.log("✅ Cleaned hasItems:", JSON.stringify(filteredHasItems, null, 2));
    console.log("✅ Cleaned wantsItems:", JSON.stringify(filteredWantsItems, null, 2));
  }

  // 🔴 Ensure both item lists contain valid items
  if (filteredHasItems.length === 0 || filteredWantsItems.length === 0) {
    console.error("🚨 Error: No valid items added for trade");
    Alert.alert("Error", "Please add at least one valid item to both 'You' and 'Them' sections.");
    return;
  }

// const hasNames = filteredHasItems.map(item => item.name.toLowerCase()).sort();
// const wantsNames = filteredWantsItems.map(item => item.name.toLowerCase()).sort();

console.log(filteredHasItems)


// if (JSON.stringify(hasNames) === JSON.stringify(wantsNames)) {
//   Alert.alert("Invalid Trade", "You cannot trade identical items.");
//   return;
// }
  // ✅ Prepare trade object for Firestore
  const newTrade = {
    userId: user?.id || "Unknown",
    traderName: user?.displayname || user?.displayName || "Unknown",
    avatar: user?.avatar || null,
    hasItems: filteredHasItems.map((item) => ({ name: item.Name, type: item.Type })), 
    wantsItems: filteredWantsItems.map((item) => ({ name: item.Name, type: item.Type })),
    hasTotal: { price: hasTotal?.price || 0, value: hasTotal?.value || 0 },
    wantsTotal: { price: wantsTotal?.price || 0, value: wantsTotal?.value || 0 },
    message: message?.trim() || "",
    description: description || "",
    timestamp: firestore.FieldValue.serverTimestamp(),
  };

  if (debugMode) console.log("📌 Trade Data Prepared:", JSON.stringify(newTrade, null, 2));

  // 🔍 Step 1: Test Firestore Write Access
  try {
    await firestore().collection("trades").doc("test_doc").set({ test: "Hello, Firestore!" });
    if (debugMode) console.log("✅ Firestore write test succeeded!");
  } catch (error) {
    console.error("🔥 Firestore write test failed:", error);
    Alert.alert("Error", `Firestore write test failed: ${error.message}`);
    return;
  }

  // 🔍 Step 2: Attempt to Add Trade to Firestore
  try {
    await tradesCollection.add(newTrade);
    // console.log(`✅ Trade successfully added! ID: ${docRef.id}`);
    // Alert.alert("Success", `Trade Created Successfully! Trade ID: ${docRef.id}`);
    resetState();
  } catch (error) {
    console.error("🔥 Firestore Write Error:", error);
    if (error.code === 'permission-denied') {
      Alert.alert("Permission Denied", "You do not have permission to write to Firestore.");
    } else {
      Alert.alert("Error", `Failed to create trade: ${error.message}`);
    }
  }

  if (debugMode) console.log("🔚 submitTrade() completed.");
};
