import React, { Component } from 'react';

import { login } from '../../actions/session.login.action';
import { push } from 'connected-react-router';

import store from '../../store';

export default class OktaRedirect extends Component {

  state = {};

  componentDidMount() {
    // Read the token from the Okta redirect
    var url = window.location.href;
    var token = url.substring(url.indexOf('#id_token=')+10);
    token = token.split('&')[0];
    store.dispatch(login(token));
    store.dispatch(push('/'));
  }

  render() {
    return (
    <div>
      LOGGING YOU IN... (Style Me!)
    </div>);
  }
}