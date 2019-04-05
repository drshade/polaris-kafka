import { WALLET as type } from "./types";

export const UPDATE_PREVIOUS_BALANCE = 'UPDATE_PREVIOUS_BALANCE';

export const updatePreviousBalance = () => {
    return {
      type,
      action: UPDATE_PREVIOUS_BALANCE
    };
  };