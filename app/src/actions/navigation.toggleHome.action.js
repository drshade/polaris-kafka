import { NAVIGATION as type } from './types';

export const TOGGLE_HOME = 'TOGGLE_HOME';

export const toggleHome = (product) => {
    return {
      type,
      action: TOGGLE_HOME
    };
};