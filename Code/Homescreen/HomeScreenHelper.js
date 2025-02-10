import { Alert } from "react-native";
import firestore from '@react-native-firebase/firestore';

const tradesCollection = firestore().collection('trades');

// Debug Mode (Enable verbose logging if true)
const debugMode = false;

export const submitTrade = async (user, hasItems, wantsItems, hasTotal, wantsTotal, description, resetTradeState) => {
  if (debugMode) console.log("🔥 submitTrade() called");

  // 🔍 Filter out invalid items
  const filteredHasItems = hasItems.filter(item => item && item.Name);
  const filteredWantsItems = wantsItems.filter(item => item && item.Name);

  if (filteredHasItems.length === 0 || filteredWantsItems.length === 0) {
    Alert.alert("Error", "Please add at least one valid item to both 'You' and 'Them' sections.");
    return;
  }

  // ✅ Prepare trade object for Firestore
  const newTrade = {
    userId: user?.id || "Unknown",
    traderName: user?.displayname || user?.displayName || "Unknown",
    avatar: user?.avatar || null,
    hasItems: filteredHasItems.map(item => ({ name: item.Name, type: item.Type })), 
    wantsItems: filteredWantsItems.map(item => ({ name: item.Name, type: item.Type })),
    hasTotal: { price: hasTotal?.price || 0, value: hasTotal?.value || 0 },
    wantsTotal: { price: wantsTotal?.price || 0, value: wantsTotal?.value || 0 },
    description: description || "",
    timestamp: firestore.FieldValue.serverTimestamp(),
  };

  try {
    // 🔥 Step 1: Attempt to Add Trade to Firestore
    await tradesCollection.add(newTrade);

    // ✅ Step 2: Reset trade state after successful submission
    if (typeof resetTradeState === "function") {
      resetTradeState();
    } else {
      console.warn("⚠️ resetTradeState is not a function, skipping reset.");
    }

    // ✅ Step 3: Alert success message
    // Alert.alert("Success", "Trade submitted successfully!");

  } catch (error) {
    console.error("🔥 Firestore Write Error:", error);
    Alert.alert("Error", `Failed to create trade: ${error.message}`);
  }
};
