import { WALLET as type } from './types';
import { pay as payService } from '../services/pay.service';

export const QUERY_PAYMENT = 'QUERY_PAYMENT';

export const queryPayment = (reference) => {
  let event = {
    type,
    action: QUERY_PAYMENT,
    data: {
      reference
    }
  };

  payService(event);

  return event;
};
