import { AppRegistry } from 'react-native';
import AppWrapper from './App';
import { name as appName } from './app.json';

// Register App
AppRegistry.registerComponent(appName, () => AppWrapper);
