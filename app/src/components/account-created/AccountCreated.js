import React, { Component } from 'react';

import { Button } from "@material-ui/core";

import './AccountCreated.css';
import { push } from 'connected-react-router';
import store from '../../store';
import { connect } from 'react-redux';

import RegisterStepper from '../register-stepper/RegisterStepper';
import UserQrCode from '../user-qr-code/UserQrCode';

const currentStep = 2;

class AccountCreated extends Component {
  state = { };

  done() {
    store.dispatch(push('/profile'));
  }

  render() {
    if (!this.props.profile) return <div />;
    let { profile } = this.props;

    return (
      <div className="created">
        <RegisterStepper step={currentStep}/>
        <h2>Account Created!</h2>
        <UserQrCode email={profile.email} fullname={profile.fullname} />
        <Button variant="contained" color="primary" onClick={() => this.done()}>Go to Profile</Button>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    profile: state.user.profile
  };
}

export default connect(mapStateToProps)(AccountCreated);
