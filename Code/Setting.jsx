import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Alert, Platform, Modal, FlatList } from 'react-native';
import Share from 'react-native-share';
import Icon from 'react-native-vector-icons/Ionicons';
import { useGlobalState } from './GlobelStats';

export default function SettingsScreen() {
  const { purchasePackage, packages, isPro, customerInfo } = useGlobalState();
  const [isDrawerVisible, setIsDrawerVisible] = useState(false); // State to control drawer visibility
  const [selectedPackage, setSelectedPackage] = useState(null); // State to track selected package
  // Set default package when packages are loaded
  useEffect(() => {
    if (packages && packages.length > 0) {
      // Automatically select the "Yearly" package if it exists, otherwise the first package
      const yearlyPackage = packages.find(pkg => pkg.product.title.includes("Yearly"));
      setSelectedPackage(yearlyPackage || packages[0]);
    }
  }, [packages]);

  // Function to get the app download link based on the environment and platform
  const getAppDownloadLink = () => {
    return Platform.OS === 'ios'
      ? 'https://apps.apple.com/us/app/app-name/id6737775801' // Replace with actual iOS app store link
      : 'https://play.google.com/store/apps/details?id=com.bloxfruitstock'; // Android package link
  };

  // Function to share the app
  const handleShareApp = async () => {
    try {
      const appLink = getAppDownloadLink(); // Get the dynamic link
      const shareOptions = {
        message: `Check out this amazing app! Download it now from ${appLink}.`,
        url: appLink,
        title: 'Share App',
      };
      await Share.open(shareOptions);
    } catch (error) {
      // console.log('Share error:', error);
    }
  };

  // Function to purchase the selected package
  const handlePurchase = async () => {
    if (!selectedPackage) {
      Alert.alert('Error', 'Please select a package to continue.');
      return;
    }

    try {
      await purchasePackage(selectedPackage);
      Alert.alert('Success', 'Purchase successful!');
      setIsDrawerVisible(false); // Close the drawer
    } catch (error) {
      if (error.userCancelled) {
        Alert.alert('Cancelled', 'Purchase cancelled by the user.');
      } else {
        console.error('Purchase error:', error);
        Alert.alert('Error', 'An error occurred while processing the purchase. Please try again.');
      }
    }
  };

  const handleRateApp = () => {
    const storeLink = Platform.OS === 'ios'
      ? `itms-apps://itunes.apple.com/app/idYOUR_APP_ID?action=write-review` // Replace YOUR_APP_ID
      : `market://details?id=com.bloxfruitstock`; // Your app's package name for Android

    Linking.openURL(storeLink).catch(() =>
      Alert.alert('Error', 'Unable to open the app store. Please try again later.')
    );
  };

  // Function to open Facebook page
  const handleOpenFacebook = () => {
    const facebookUrl = 'https://www.facebook.com/share/g/15V1JErjbY/';
    Linking.openURL(facebookUrl).catch(() =>
      Alert.alert('Error', 'Unable to open Facebook. Please try again later.')
    );
  };

  // Function to open the website
  const handleOpenWebsite = () => {
    const websiteUrl = 'https://bloxfruitscalc.com/';
    Linking.openURL(websiteUrl).catch(() =>
      Alert.alert('Error', 'Unable to open the website. Please try again later.')
    );
  };

  // Open the drawer for package selection
  const openDrawer = () => {
    if (!packages || packages.length === 0) {
      Alert.alert('Error', 'No packages available at the moment. Please try again later.');
      return;
    }
    setIsDrawerVisible(true);
  };
  const handleSubscriptionPress = () => {
    const manageSubscriptionUrl = 'https://play.google.com/store/account/subscriptions';
    if (isPro) {
      Linking.openURL(manageSubscriptionUrl).catch((err) =>
        console.error('Error opening subscription management page:', err)
      );
    } 
  };
  // Render a package item in the drawer
  const renderPackage = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.packageOption,
        selectedPackage?.identifier === item.identifier && styles.selectedPackage,
      ]}
      onPress={() => setSelectedPackage(item)}
    >
      <Text style={styles.packageName}>{item.product.title}</Text>
      <Text style={styles.packagePrice}>{item.product.priceString}</Text>
    </TouchableOpacity>
  );
  const formatPlanName = (plan) => {
    if (plan.includes("yearly")) return "Yearly";
    if (plan.includes("monthly")) return "Monthly";
    if (plan.includes("weekly")) return "Weekly";
    return "Unknown Plan"; // Fallback for unexpected identifiers
  };

  return (
    <View style={styles.container}>
      {/* Remove Ads Section */}
      <TouchableOpacity style={[styles.option, {backgroundColor:'#34C759', flexDirection:'column', alignItems:'flex-start'}]} onPress={isPro ? handleSubscriptionPress : openDrawer}>
        <View style={{flexDirection:'row'}}>
        <Icon name={isPro ? "trophy-outline" : "cart-outline"} size={24} color="white" />
        <Text style={styles.optionText}>{isPro ? 'Pro Verion' : 'Remove Ads'}</Text></View>
       { isPro && customerInfo?.map((subscription, index) => (
                <View key={index} style={{borderTopWidth:1, marginTop:5, paddingVertical:5, borderColor:'white'}}>
                  <Text style={styles.free}>
                    Plan: {formatPlanName(subscription.plan)}
                  </Text>

                  <Text style={styles.free}>
                    Expiry: {new Date(subscription.expiry).toLocaleString()}
                  </Text>
                </View>))}
      </TouchableOpacity>

      {/* Share App Section */}
      <TouchableOpacity style={styles.option} onPress={handleShareApp}>
        <Icon name="share-social-outline" size={24} color="white" />
        <Text style={styles.optionText}>Share App</Text>
      </TouchableOpacity>

      {/* Feedback Section */}
      <TouchableOpacity style={styles.option} onPress={() => Linking.openURL('mailto:mindfusionio.help@gmail.com')}>
        <Icon name="chatbox-ellipses-outline" size={24} color="white" />
        <Text style={styles.optionText}>Give Suggestions</Text>
      </TouchableOpacity>
      {/* Rate Us Section */}
      <TouchableOpacity style={styles.option} onPress={handleRateApp}>
        <Icon name="star-outline" size={24} color="white" />
        <Text style={styles.optionText}>Rate Us</Text>
      </TouchableOpacity>

      {/* Facebook Page Section */}
      <TouchableOpacity style={styles.option} onPress={handleOpenFacebook}>
        <Icon name="logo-facebook" size={24} color="white" />
        <Text style={styles.optionText}>Visit Facebook Page</Text>
      </TouchableOpacity>

      {/* Website Section */}
      <TouchableOpacity style={styles.option} onPress={handleOpenWebsite}>
        <Icon name="globe-outline" size={24} color="white" />
        <Text style={styles.optionText}>Visit Website</Text>
      </TouchableOpacity>

      {/* Bottom Drawer for Package Selection */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isDrawerVisible}
        onRequestClose={() => setIsDrawerVisible(false)}
      >
        <View style={styles.drawerContainer}>
          <View style={styles.drawerContent}>
            <Text style={styles.drawerTitle}>Choose a Package</Text>
            <Text style={styles.text}>
  Upgrade to the Pro version for an ad-free experience and enhanced features.
</Text>

            <FlatList
              data={packages}
              keyExtractor={(item) => item.identifier}
              renderItem={renderPackage}
              contentContainerStyle={styles.packageList}
            />
            <TouchableOpacity style={styles.purchaseButton} onPress={handlePurchase}>
              <Text style={styles.purchaseButtonText}>Purchase Now</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsDrawerVisible(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#4E5465',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginBottom: 20,
    backgroundColor: '#17202a',
    borderRadius: 10,
    elevation: 2,
  },
  optionText: {
    fontSize: 18,
    marginLeft: 10,
    color: 'white',
  },
  drawerContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawerContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  packageList: {
    marginBottom: 20,
  },
  packageOption: {
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginBottom: 10,
  },
  selectedPackage: {
    borderWidth: 2,
    borderColor: '#34C759',
  },
  packageName: {
    fontSize: 16,
  },
  packagePrice: {
    fontSize: 14,
    color: 'red',
  },
  purchaseButton: {
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  cancelButton: {
    marginTop: 10,
    color: '#FF3B30',
    textAlign: 'center',
    fontSize: 16,
  },
  free:{
    fontFamily:'Lato-Bold',
  },
  text:{
    fontFamily:'Lato-Regular',
    paddingBottom:10
  }
});
