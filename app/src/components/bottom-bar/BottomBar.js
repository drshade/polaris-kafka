import React, { Component } from 'react';

import { AppBar, Toolbar } from '@material-ui/core';

import './BottomBar.css';
import store from '../../store';
import { push } from 'connected-react-router';

class BottomBar extends Component {
  state = {};

  scan() {
    store.dispatch(push('/scan'));
  }

  render() {
    return (
      <AppBar position="fixed" className="bottom-nav">
        <Toolbar className="toolbar">
        </Toolbar>
      </AppBar>
    );
  }
}

export default BottomBar;
