import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router';
import store, { history } from './store';
import App from './components/app/App';
import {register} from './registerServiceWorker';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core';

import './index.css';

const target = document.querySelector('#root');
const theme = createMuiTheme({
  typography: {
    useNextVariants: true,
  },
  palette: {
    primary: { main: '#6330d3' },
    secondary: { main: '#fece4a' }
  }
})


render(
  <Provider store={store}>
    <ConnectedRouter history={history}>
      <MuiThemeProvider theme={theme}>
        <App />
      </MuiThemeProvider>
    </ConnectedRouter>
  </Provider>,
  target
);

register();
