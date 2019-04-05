import { TEST } from '../actions/types';

import { PING } from '../actions/test.ping.action';
import { PONG } from '../actions/test.pong.action';

const initialState = {
  pinged: 0,
  ponged: 0
};

export const ping = (state = initialState, event) => {
  if (event.type !== TEST) return state;

  switch (event.action) {
    case PING:
      return { ...state, pinged: state.pinged + 1 };
    case PONG:
      return { ...state, ponged: state.ponged + 1 };

    default:
      return state;
  }
};
