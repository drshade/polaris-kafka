import { SESSION as type } from './types';
import { login as loginService } from '../services/login.service';
import { getProfile } from '../services/token.service';

export const LOGIN = 'LOGIN';

export const login = (token) => {
  loginService(token);

  let profile = getProfile();
  
  return {
    type,
    action: LOGIN,
    token,
    profile
  };
};
