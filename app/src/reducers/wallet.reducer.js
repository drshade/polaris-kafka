import { WALLET } from '../actions/types';
import { BALANCE_UPDATED } from '../actions/wallet.balanceUpdated.action';
import { AMOUNT_TO_ADD } from '../actions/wallet.amountToAdd.action';
import { PAY } from '../actions/wallet.pay';
import { PAYMENT_CONFIRMED } from '../actions/wallet.payment-confirmed';
import { UPDATE_PREVIOUS_BALANCE } from '../actions/wallet.updatePreviousBalance.action';

// Hack
let getBalance = () => {
  let balance = localStorage.getItem('balance');

  if (balance === null || balance === undefined || balance === 'undefined') {
    balance = 0;
  }

  return Number(balance);
};

let balance = getBalance();

const initialState = {
  previousBalance: balance,
  balance
};

export const wallet = (state = initialState, event) => {
  if (event.type !== WALLET) return state;

  switch (event.action) {
    case BALANCE_UPDATED: {
      return { ...state, previousBalance: state.balance, balance: event.data.balance };
    }

    case AMOUNT_TO_ADD: {
      return { ...state, amountToAdd: event.amountToAdd };
    }

    case PAY: {
      let payment = {
        ...event.data,
        inProgress: true
      };

      return { ...state, payment };
    }
    case PAYMENT_CONFIRMED: {
      let payment = {
        ...event.data,
        inProgress: false
      };

      return { ...state, payment };
    }

    case UPDATE_PREVIOUS_BALANCE: {
      return { ...state, previousBalance: state.balance };
    }
    default:
      return state;
  }
};
