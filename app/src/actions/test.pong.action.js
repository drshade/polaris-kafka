import { TEST as type } from './types';
export const PONG = 'PONG';

export const pong = () => {
  return {
    type,
    action: PONG
  };
};
