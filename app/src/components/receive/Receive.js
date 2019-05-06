import React, { Component } from 'react';
import { connect } from 'react-redux';

import './Receive.css';
import UserQrCode from '../user-qr-code/UserQrCode';

class Receive extends Component {
  state = {};

  render() {
    if (!this.props.profile) return <div />;

    return (
      <div>
        <br />
        <br />
        <h2>{this.props.profile.fullname}</h2>
        <UserQrCode email={this.props.profile.email} fullname={this.props.profile.fullname} />
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
