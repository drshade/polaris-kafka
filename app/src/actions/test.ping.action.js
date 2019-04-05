import { TEST as type } from './types';
import { ping as pingService } from '../services/ping.service';

export const PING = 'PING';

export const ping = () => {
  pingService();

  return {
    type,
    action: PING
  };
};
