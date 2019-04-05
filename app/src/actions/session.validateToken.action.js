import { SESSION as type } from './types';
import { validateToken as validateTokenService, getProfile } from '../services/token.service';
import { login } from './session.login.action';

export const VALIDATE_TOKEN = 'VALIDATE_TOKEN';
export const NEEDS_TO_LOGIN = 'NEEDS_TO_LOGIN';

export const validateToken = () => {
  let token = validateTokenService();

  if (!token)
    return {
      type,
      action: NEEDS_TO_LOGIN
    };

  let profile = getProfile();

  return login(token, profile);
};
