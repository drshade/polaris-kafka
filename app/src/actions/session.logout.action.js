import { SESSION as type } from './types';
import { setToken } from '../services/token.service';

export const LOGOUT = 'LOGOUT';

export const logout = () => {
  setToken(null);

  return {
    type,
    action: LOGOUT
  };
};
