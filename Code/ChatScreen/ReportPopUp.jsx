import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from "react-native";
import { useGlobalState } from "../GlobelStats";
import config from "../Helper/Environment";
import { getDatabase, ref, get, update } from "firebase/database";

const ReportPopup = ({ visible, message, onClose, onSubmit }) => {
  const [selectedReason, setSelectedReason] = useState("Spam");
  const [customReason, setCustomReason] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const { theme } = useGlobalState();
  const isDarkMode = theme === "dark";


  const handleSubmit = () => {
    if (!message?.id) {
      Alert.alert("Error", "Invalid message. Unable to report.");
      return;
    }
  
    const db = getDatabase(); // Initialize the database
    const messageRef = ref(db, `chat/${message.id}`); // Reference to the specific message
  
    get(messageRef)
      .then((snapshot) => {
        let updatedReportCount = 1; // Default to 1 if no reportCount exists
  
        if (snapshot.exists()) {
          const messageData = snapshot.val();
          // Increment the existing reportCount or initialize it
          updatedReportCount = (messageData?.reportCount || 0) + 1;
        }
  
        // Update or set the reportCount in Firebase
        return update(messageRef, { reportCount: updatedReportCount }).then(() => updatedReportCount);
      })
      .then((updatedReportCount) => {
        // Update the local message state with the new reportCount
        const updatedMessage = {
          ...message,
          reportCount: updatedReportCount, // Update report count locally
        };
  
        // Immediate feedback
        Alert.alert(
          "Report Submitted",
          "Thank you for reporting this message."
        );
  
        onSubmit(updatedMessage, selectedReason); // Notify parent component if needed
        onClose(); // Close the report modal
      })
      .catch((error) => {
        console.error("Error reporting message:", error);
        Alert.alert("Error", "Failed to submit the report. Please try again.");
      });
  };
  
  
  
  
  const styles = getStyles(isDarkMode);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.popup}>
          <Text style={styles.title}>Report Message</Text>
          <Text style={styles.messageText}>{`Message: "${message?.text}"`}</Text>
          <Text style={styles.messageText}>{`Sender: ${message?.sender || "Unknown"}`}</Text>

          {/* Standard Reasons */}
          <View style={styles.optionsContainer}>
            {["Spam", "Religious", "Hate Speech"].map((reason) => (
              <TouchableOpacity
                key={reason}
                style={[
                  styles.option,
                  selectedReason === reason && styles.selectedOption,
                ]}
                onPress={() => {
                  setSelectedReason(reason);
                  setShowCustomInput(false);
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedReason === reason && styles.selectedOptionText,
                  ]}
                >
                  {reason}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Custom Option */}
            <TouchableOpacity
              style={[
                styles.option,
                showCustomInput && styles.selectedOption,
              ]}
              onPress={() => setShowCustomInput(true)}
            >
              <Text
                style={[
                  styles.optionText,
                  showCustomInput && styles.selectedOptionText,
                ]}
              >
                Other
              </Text>
            </TouchableOpacity>
          </View>

          {/* Custom Input for "Other" */}
          {showCustomInput && (
            <TextInput
              style={styles.input}
              placeholder="Enter custom reason"
              placeholderTextColor="#888"
              value={customReason}
              onChangeText={setCustomReason}
            />
          )}

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, {backgroundColor:config.colors.hasBlockGreen}]} onPress={handleSubmit}>
              <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const getStyles = (isDarkMode) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    popup: {
      width: "80%",
      backgroundColor: isDarkMode ? "#121212" : "#f2f2f7",
      borderRadius: 10,
      padding: 20,
      elevation: 5,
    },
    title: {
      fontSize: 18,
      fontFamily: "Lato-Bold",
      marginBottom: 10,
      color: isDarkMode ? "white" : "black",
    },
    messageText: {
      fontSize: 14,
      color: isDarkMode ? "white" : "black",
      marginBottom: 15,
    },
    optionsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
    //   justifyContent: "space-between",
      marginBottom: 10,
    },
    option: {
      paddingHorizontal: 3,
      backgroundColor: "#ddd",
      borderRadius: 10,
      marginRight: 10,
      marginBottom:10

    },
    selectedOption: {
      borderColor: config.colors.primary,
      backgroundColor: config.colors.hasBlockGreen,
    },
    optionText: {
      fontSize: 14,
      color: isDarkMode ? "#888" : "#444",
      paddingHorizontal:5
    },

    selectedOptionText: {
      color: "white",
    },
    input: {
      borderWidth: 1,
      borderColor: "#ddd",
      borderRadius: 5,
      padding:5,
      marginTop: 10,
    },
    actions: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 15,
    },
    button: {
      paddingVertical: 5,
      paddingHorizontal: 20,
      backgroundColor: config.colors.primary,
      borderRadius: 5,
    },
    buttonText: {
      color: "white",
      fontSize: 16,
    },
  });

export default ReportPopup;
