import React, { Component } from 'react';

import { Button } from "@material-ui/core";
import { unregister } from "../../actions/onboarding.unregister.action";

import './Unregister.css';
import store from '../../store';

export default class Unregister extends Component {
  state = {};

  unregister() {
    store.dispatch(unregister());
  }

  render() {
    return (
    <div className="unregister-wrapper">
      <h2>Confirm</h2>
      <p>Are you sure you would like to deregister your account?</p>
      <Button className="unregister-btn" variant="contained" color="primary" onClick={() => this.unregister()}>Yes i'm sure</Button>
    </div>);
  }
}