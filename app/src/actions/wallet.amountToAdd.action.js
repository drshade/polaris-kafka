import { WALLET as type } from "./types";

export const AMOUNT_TO_ADD = 'AMOUNT_TO_ADD';

export const amountToAdd = (amountToAdd) => {
    return {
      type,
      action: AMOUNT_TO_ADD,
      amountToAdd
    };
  };