import React, { useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';

const NotificationHandler = () => {
  useEffect(() => {
    // Function to create the notification channel
    const createNotificationChannel = async () => {
      try {
        if (Platform.OS === 'android') {
          await notifee.createChannel({
            id: 'default',
            name: 'Default Channel',
            importance: AndroidImportance.HIGH, // Ensure high importance for visibility
            smallIcon: 'ic_notification',
            color: '#36454F',
            pressAction: {
              id: 'default',
            },
          });
        }
      } catch (error) {
        console.error('Error creating notification channel:', error);
      }
    };

    createNotificationChannel();

    let isProcessingNotification = false;

    // Function to process notifications
    const processNotification = async (remoteMessage) => {
      if (isProcessingNotification) {
        console.warn('Already processing a notification. Skipping...');
        return;
      }

      isProcessingNotification = true;

      try {
        const { notification, data } = remoteMessage || {};
        const title = notification?.title || data?.title || 'Notification';
        const body = notification?.body || data?.body || 'No details available';
        const type = data?.type;

        if (!title || !body) {
          console.warn('Notification payload is incomplete:', remoteMessage);
          return;
        }
        const capitalizeFruits = (fruits) => {
          if (!fruits) return '';
          return fruits
            .split(',')
            .map((fruit) => fruit.trim().charAt(0).toUpperCase() + fruit.trim().slice(1))
            .join(', ');
        };

        // Handle notification types
        if (type === 'selectedFruits') {
          const capitalizedFruits = capitalizeFruits(data.fruits);
          await notifee.displayNotification({
            title: 'Selected Fruits Stock Update',
            body: `Wow! Your selected fruits are in stock: ${capitalizedFruits}`,
            android: {
              channelId: 'default',
              smallIcon: 'ic_notification',
              color: '#36454F',
              pressAction: {
                id: 'default',
              },
            },
          });
        } else if (type === 'stockUpdate') {
          await notifee.displayNotification({
            title: 'Stock Update',
            body: 'Stocks have been updated!',
            android: {
              channelId: 'default',
              smallIcon: 'ic_notification',
              color: '#36454F',
              pressAction: {
                id: 'default',
              },
            },
          });
        } else {
          console.warn('Unknown notification type:', type);
        }
      } catch (error) {
        console.error('Error processing notification:', error);
      } finally {
        isProcessingNotification = false;
      }
    };

    // Foreground notification listener
    const unsubscribeForeground = messaging().onMessage(processNotification);

    // Background notification handler
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      // console.log('Background notification received:', remoteMessage);
      await processNotification(remoteMessage);
    });

    // Handle notification events (e.g., clicks)
    const unsubscribeNotifee = notifee.onForegroundEvent(async ({ type, detail }) => {
      if (type === EventType.PRESS) {
        // console.log('Notification clicked:', detail.notification);
        // Handle navigation or other actions here
        // Alert.alert('Notification Clicked', 'You interacted with the notification!');
      }
    });

    return () => {
      unsubscribeForeground();
      unsubscribeNotifee();
    };
  }, []);

  return null;
};

export default NotificationHandler;
