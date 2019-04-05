import { NOTIFICATION as type } from './types';
import { askForPermission } from './notification.ask-for-permission.action';

export const CHECK_PERMISSIONS = 'CHECK_PERMISSIONS';

export const checkPermissions = () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications.');
    return {
      type,
      action: CHECK_PERMISSIONS,
      data: {
        notificationPermitted: false
      }
    };
  }

  if (Notification.permission !== 'granted') {
    return askForPermission();
  }

  return {
    type,
    action: CHECK_PERMISSIONS,
    data: {
      notificationPermitted: true
    }
  };
};
