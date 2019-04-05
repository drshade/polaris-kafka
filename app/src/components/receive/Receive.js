import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Divider } from '@material-ui/core';

import './Receive.css';
import UserQrCode from '../user-qr-code/UserQrCode';

class Receive extends Component {
  state = {};

  render() {
    if (!this.props.profile) return <div />;

    return (
      <div>
        <h2>Receive</h2>
        <UserQrCode email={this.props.profile.email} fullname={this.props.profile.fullname} />
        <Divider />       
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    profile: state.user.profile
  };
}

export default connect(mapStateToProps)(Receive);
