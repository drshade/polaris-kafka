import { WALLET as type } from './types';
import { send } from '../services/socket';

export const DEPOSIT = 'DEPOSIT';

export const deposit = (reference, amount) => {
  let data = {
    reference,
    amount
  };

  let event = {
    type,
    action: DEPOSIT,
    data
  };

  send(type, DEPOSIT, data);

  return event;
};
