import { NOTIFICATION } from '../actions/types';
import { CHECK_PERMISSIONS } from '../actions/notification.check-permissions.action';
import { ASK_FOR_PERMISSION } from '../actions/notification.ask-for-permission.action';

const initialState = {
  notificationPermitted: false,
  askForPermission: false
};

export const notification = (state = initialState, event) => {
  if (event.type !== NOTIFICATION) return state;

  switch (event.action) {
    case CHECK_PERMISSIONS:
      return { ...state, notificationPermitted: event.data.notificationPermitted };
    case ASK_FOR_PERMISSION:
      return { ...state, askForPermission: event.data.askForPermission };

    default:
      return state;
  }
};
