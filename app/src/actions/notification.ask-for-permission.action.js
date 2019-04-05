import { NOTIFICATION as type } from './types';

export const ASK_FOR_PERMISSION = 'ASK_FOR_PERMISSION';

export const askForPermission = (decline) => {
  return {
    type,
    action: ASK_FOR_PERMISSION,
    data: {
      askForPermission: decline === undefined
    }
  };
};
