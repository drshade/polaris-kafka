import { createStore, applyMiddleware, compose } from 'redux';
import { connectRouter, routerMiddleware } from 'connected-react-router';
import thunk from 'redux-thunk';
import { createBrowserHistory } from 'history';
import rootReducer from './reducers';
import { registrationMiddleware } from './middleware/registration.middleware';

import { persistStore } from 'redux-persist';

export const history = createBrowserHistory();

const initialState = {};
const enhancers = [];
const middleware = [thunk, routerMiddleware(history), registrationMiddleware];

if (process.env.NODE_ENV === 'development') {
  const devToolsExtension = window.__REDUX_DEVTOOLS_EXTENSION__;

  if (typeof devToolsExtension === 'function') {
    enhancers.push(devToolsExtension());
  }
}

const composedEnhancers = compose(
  applyMiddleware(...middleware),
  ...enhancers
);

//export default createStore(connectRouter(history)(rootReducer(history)), initialState, composedEnhancers);

// https://blog.reactnativecoach.com/the-definitive-guide-to-redux-persist-84738167975
const store = createStore(connectRouter(history)(rootReducer(history)), initialState, composedEnhancers);
export const persistor = persistStore(store);

export default store;
