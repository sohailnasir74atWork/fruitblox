import notifee from '@notifee/react-native';

const requestPermission = async () => {
  try {
    const { authorizationStatus } = await notifee.requestPermission();
    if (authorizationStatus === 0) {
    //   console.log('Permission denied. Updating state.');
      return authorizationStatus
    } else {
    }
  } catch (error) {
  }
};

export default requestPermission;
