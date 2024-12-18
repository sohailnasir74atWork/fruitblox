/**
 * @format
 */

import { AppRegistry } from 'react-native';
import AppWrapper from './App';
import { name as appName } from './app.json';
import notifee, { EventType } from '@notifee/react-native';
// Register Notifee Background Event Handler
notifee.onBackgroundEvent(async ({ type, detail }) => {
    console.log('Background event triggered:', type, detail);
  
    if (type === EventType.TRIGGER_NOTIFICATION_CREATED) {
      // Example: Log or handle trigger notification events
      console.log('Trigger Notification Created:', detail.notification);
    }
  });
// Register the main app component
AppRegistry.registerComponent(appName, () => AppWrapper);


