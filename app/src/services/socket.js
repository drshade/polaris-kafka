import store from '../store';
import { getToken } from './token.service';

// const endpoint = 'wss://wakanda.p1.s7s.cloud/wakanda/ws/updates';
// const endpoint = 'ws://localhost:8080/wakanda/ws/updates';

const endpoint = 'ws://localhost:8090/ws';

let init = () => {
  let socket = new WebSocket(endpoint);

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    const polaris2redux = (event) => {
      return {
        "type": event.resource,
        "action": event.action,
        "data": event.data
      }
    };

    // Refactor.
    if (data instanceof Array) {
      data.forEach((update) => {
        store.dispatch(polaris2redux(update));
      });
    } else {
      store.dispatch(polaris2redux(data));
    }
  };

  socket.onclose = (event) => {
    console.log('Websocket has disconnected, trying to reconnect.');
    setTimeout(() => {
      s = init();
    }, 1000);
  };

  socket.onopen = (event) => {
    console.log('Socket opened');
  };

  socket.onerror = (error) => {
    console.error(error);
  };

  return socket;
};

let s = init();

const send = (resource, action, data) => {
  // console.log(`Trying to send, (type: ${type}, action: ${action})`);
  if (s.readyState !== 1) {
    setTimeout(() => send(resource, action, data), 10);
    return;
  }

  const token = "tom@synthesis.co.za"; // getToken();
  s.send(JSON.stringify({ resource, action, token, data }));
};

export { send };
