import { WALLET as type } from './types';
import { send } from '../services/socket';

export const PAY = 'PAY';

export const pay = (reference, to, amount, description) => {
  let data = {
    reference,
    to,
    amount,
    description
  };

  let event = {
    type,
    action: PAY,
    data
  };

  send(type, PAY, data);

  return event;
};
