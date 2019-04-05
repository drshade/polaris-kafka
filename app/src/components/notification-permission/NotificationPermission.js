import React, { Component } from 'react';

import { Snackbar, Button } from '@material-ui/core';

import './NotificationPermission.css';
import store from '../../store';
import { connect } from 'react-redux';
import { checkPermissions } from '../../actions/notification.check-permissions.action';
import { askForPermission } from '../../actions/notification.ask-for-permission.action';
import { subscribeToPushNotifications } from '../../registerServiceWorker';

class NotificationPermission extends Component {
  state = { askForPermission: false };

  componentDidMount() {}

  componentDidUpdate() {
    if (this.props.notificationPermitted) {
      subscribeToPushNotifications();
    }

    if (this.props.hasProfile) {
      store.dispatch(checkPermissions());
    }
  }

  handleClose() {
    console.log('Ignored notification permission.');
    store.dispatch(askForPermission(false));
  }

  askForPermission() {
    console.log('Asked for notification permission.');

    Notification.requestPermission((status) => {
      console.log('Notification permission status:', status);
      subscribeToPushNotifications();

      this.handleClose();
    });
  }

  render() {
    let { askForPermission } = this.props || this.state;

    return (
      <Snackbar
        className="snackbar"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        open={askForPermission}
        onClose={(e) => this.handleClose()}
        ContentProps={{
          'aria-describedby': 'message-id'
        }}
        message={
          <div className="message">
            <div>
              We'd like to let you know when you receive a payment, but we need your permission
              first.
            </div>
            <Button size="small" onClick={(e) => this.askForPermission()}>
              Ok, sounds good!
            </Button>

            <Button size="small" onClick={(e) => this.handleClose()}>
              No thanks
            </Button>
          </div>
        }
      />
    );
  }
}

function mapStateToProps(state) {
  return {
    ...state.notification,
    hasProfile: !!state.user.profile
  };
}

export default connect(mapStateToProps)(NotificationPermission);
