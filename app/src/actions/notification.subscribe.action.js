import { NOTIFICATION as type } from './types';
import { send } from '../services/socket';

export const SUBSCRIBE = 'SUBSCRIBE';

export const subscribe = (endpoint) => {
  let event = {
    type,
    action: SUBSCRIBE,
    data: {
      endpoint
    }
  };

  send(type, SUBSCRIBE, event.data);

  return event;
};
