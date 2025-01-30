import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  Pressable,
  Modal,
  Animated,
  Text,
  Linking,
  StyleSheet,
  Image,
} from 'react-native';
import { useGlobalState } from '../GlobelStats';
import { useLocalState } from '../LocalGlobelStats';
import Ionicons from 'react-native-vector-icons/Ionicons';
import config from '../Helper/Environment';

const SubscriptionScreen = ({ visible, onClose }) => {
  const [activePlan, setActivePlan] = useState(null);
  const slideAnim = useRef(new Animated.Value(300)).current; // Starts off-screen
  const { theme } = useGlobalState();
  const { packages, purchaseProduct } = useLocalState();
  const isDark = theme === 'dark';

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : 300,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  useEffect(() => {
    if (visible && !activePlan && packages?.length) {
      setActivePlan(packages[0]);
    }
  }, [visible, packages]);

  const handleSelectPlan = (pkg) => setActivePlan(pkg);

  const handlePurchase = () => {
    if (activePlan) {
      purchaseProduct(activePlan);
    } else {
      console.warn('No plan selected. Please select a plan before subscribing.');
    }
  };

  const openLink = (url) => {
    Linking.openURL(url).catch((err) => console.error('Error opening URL:', err));
  };

  const benefits = [
    { icon: 'checkmark-circle', label: 'Ads-Free Experience' },
    { icon: 'star', label: '5,000 Free Points' },
    { icon: 'repeat', label: 'Unlimited Trade Creation' },
  ];
  const BenefitItem = ({ icon, label }) => (
    <View style={styles.benefitItem}>
      <Ionicons name={icon} size={20} color={isDark ? '#32CD32' : '#6200EE'} />
      <Text style={styles.benefit}>{label}</Text>
    </View>
  );

  const styles = useMemo(() => getStyles(isDark), [isDark]);


  return (
    <Modal transparent visible={visible} animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable onPress={() => { }}>
          <Animated.View style={[styles.drawer, { transform: [{ translateY: slideAnim }] }]}>
            
            {/* Header Image */}
            <Image source={require('../../assets/icon.png')} style={styles.bannerImage} />
            
            {/* Title */}
            <Text style={styles.drawerTitle}>GET AHEAD IN THE GAME – GO PRO!</Text>
            <View style={styles.benefitsContainer}>
              {benefits.map((benefit, index) => (
                <BenefitItem key={index} {...benefit} />
              ))}
            </View>

            {/* Subscription Options */}
            <View style={styles.subscriptionOptions}>
              {packages?.map((pkg) => {
                const product = pkg.product || {};
                const isSelected = activePlan?.identifier === pkg.identifier;
                return (
                  <TouchableOpacity key={pkg.identifier} onPress={() => handleSelectPlan(pkg)} style={[styles.planBox, isSelected && styles.selectedPlan]}>
                    {pkg.packageType === 'ANNUAL' && <Text style={styles.discountTag}>33% OFF</Text>}
                    {pkg.packageType === 'SIX_MONTH' && <Text style={styles.discountTag}>16% OFF</Text>}
                    <Text style={styles.planTitle}>{pkg.packageType || 'Unknown'}</Text>
                    <Text style={styles.planPrice}>{product.priceString || 'Unknown Price'}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Plan Description */}
            <Text style={styles.planDescription}>
              Full access for just {activePlan?.product?.priceString || 'your selected plan'}.
            </Text>

            {/* Subscribe Button */}
            <TouchableOpacity onPress={handlePurchase} disabled={!packages?.length} style={styles.subscribeButton}>
              <Text style={styles.subscribeButtonText}>
                {packages?.length ? 'CONTINUE' : 'Loading...'}
              </Text>
            </TouchableOpacity>

            {/* Restore Purchases */}
            <TouchableOpacity onPress={openLink} style={styles.restoreText}>
              <Text>Restore</Text>
            </TouchableOpacity>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const getStyles = (isDark) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    //   alignItems: 'center',
    },
    drawer: {
      width: '100%',
      paddingVertical: 10,
      paddingHorizontal: 10,
      backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      alignItems: 'center',
    },
    bannerImage: {
      width: '100%',
      height: 150,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    },
    drawerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginTop: 10,
      textAlign: 'center',
      color: isDark ? '#fff' : '#000',
    },
    subscriptionOptions: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginVertical: 15,
    },
    planBox: {
      padding: 15,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'grey',
      alignItems: 'center',
      marginHorizontal: 10,
      width: 110,
    },
    selectedPlan: {
      borderColor: config.colors.hasBlockGreen,
      borderWidth: 2,
    },
    planTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#333',
    },
    planPrice: {
      fontSize: 14,
      color: config.colors.hasBlockGreen,
      marginVertical: 5,
    },
    discountTag: {
      backgroundColor: '#28A745',
      color: '#fff',
      fontSize: 10,
      fontWeight: 'bold',
      padding: 3,
      borderRadius: 5,
      marginBottom: 5,
    },
    planDescription: {
      fontSize: 14,
      color: '#666',
      marginBottom: 10,
      textAlign: 'center',
    },
    subscribeButton: {
      backgroundColor: config.colors.hasBlockGreen,
      paddingVertical: 12,
      paddingHorizontal: 30,
      borderRadius: 8,
      width: '100%',
      alignItems: 'center',
    },
    subscribeButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
    },
    restoreText: {
      marginTop: 10,
      color: '#666',
      fontSize: 12,
    },
    benefitItem: {
        flexDirection: 'row',
        // alignItems: 'center',
        marginBottom: 10,
        paddingHorizontal:20,
      },
      benefit: {
        marginLeft: 8,
        fontSize: 14,
        color: '#333',
        alignSelf:'flex-start'
      },
      benefitsContainer:{
        alignSelf:'flex-start',
        paddingVertical:30

      }
  });

export default SubscriptionScreen;
